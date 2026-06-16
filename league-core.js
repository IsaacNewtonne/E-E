(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.LeagueCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const defaults = { singlesWinPoints: 1, doublesWinPoints: 0.5, lossPoints: 0 };
  const clone = value => JSON.parse(JSON.stringify(value));
  const uid = () => typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

  function createSeason(name = "New Season", players = []) {
    return { id: uid(), name, createdAt: new Date().toISOString(), players: clone(players), nights: [], settings: { ...defaults } };
  }

  function createAppData() {
    return { version: 2, activeSeason: createSeason(), archives: [] };
  }

  function pointsForGame(gameType, result, settings = {}) {
    const rules = { ...defaults, ...settings };
    if (result !== "win") return Number(rules.lossPoints);
    return Number(gameType === "doubles" ? rules.doublesWinPoints : rules.singlesWinPoints);
  }

  function normalizeGame(game, settings) {
    const gameType = String(game.gameType || "singles").toLowerCase();
    const result = String(game.result || "loss").toLowerCase();
    return {
      id: game.id || uid(),
      gameNumber: Number(game.gameNumber) || 1,
      gameType,
      playerId: game.playerId || "",
      result,
      points: game.points === undefined ? pointsForGame(gameType, result, settings) : Number(game.points)
    };
  }

  function nightAttendanceIds(night) {
    if (Array.isArray(night.attendanceIds)) return [...new Set(night.attendanceIds.filter(Boolean))];
    return [...new Set((night.games || []).map(game => game.playerId).filter(Boolean))];
  }

  function normalizeSeason(season) {
    const settings = { ...defaults, ...(season.settings || {}) };
    return {
      id: season.id || uid(),
      name: season.name || season.season || "Unnamed Season",
      createdAt: season.createdAt || new Date().toISOString(),
      archivedAt: season.archivedAt,
      players: Array.isArray(season.players) ? season.players.map(player => ({ ...player })) : [],
      nights: Array.isArray(season.nights) ? season.nights.map(night => {
        const games = Array.isArray(night.games) ? night.games.map(game => normalizeGame(game, settings)) : [];
        return {
        id: night.id || uid(),
        date: night.date || new Date().toISOString().slice(0, 10),
        opposition: night.opposition || "",
        notes: night.notes || "",
        attendanceIds: nightAttendanceIds({ ...night, games }),
        games
      };
      }) : [],
      settings
    };
  }

  function normalizeAppData(data) {
    if (!data || typeof data !== "object") throw new Error("Not valid EvitaativE data.");
    if (data.version === 2 && data.activeSeason) {
      return { version: 2, activeSeason: normalizeSeason(data.activeSeason), archives: (data.archives || []).map(normalizeSeason) };
    }
    if (Array.isArray(data.players) && (Array.isArray(data.matches) || Array.isArray(data.nights))) {
      return { version: 2, activeSeason: normalizeSeason({ name: data.season || "Imported Season", players: data.players, nights: data.nights || [] }), archives: [] };
    }
    throw new Error("Not valid EvitaativE data.");
  }

  function parseImport(text) {
    try { return normalizeAppData(JSON.parse(text)); }
    catch { throw new Error("Not valid EvitaativE data."); }
  }

  function allGames(season) {
    return (season.nights || []).flatMap(night => (night.games || []).map(game => ({ ...game, date: night.date, nightId: night.id })));
  }

  function calculateStandings(season) {
    const rows = (season.players || []).map(player => ({ ...player, played: 0, wins: 0, losses: 0, singles: 0, doubles: 0, points: 0 }));
    allGames(season).forEach(game => {
      const row = rows.find(player => player.id === game.playerId);
      if (!row) return;
      row.played++;
      row[game.result === "win" ? "wins" : "losses"]++;
      row[game.gameType === "doubles" ? "doubles" : "singles"]++;
      row.points += Number(game.points);
    });
    return rows.map(row => ({ ...row, points: Number(row.points.toFixed(2)), winRate: row.played ? Math.round(row.wins / row.played * 100) : 0 }))
      .sort((a, b) => b.points - a.points || b.wins - a.wins || a.name.localeCompare(b.name));
  }

  function validateNight(night) {
    if (!night.date) return "Choose a date for this game night.";
    if (!Array.isArray(night.games) || !night.games.length) return "Add at least one game row.";
    for (const game of night.games) {
      if (!game.playerId) return `Choose a player for game ${game.gameNumber || ""}.`;
      if (!["singles", "doubles"].includes(game.gameType)) return "Choose Singles or Doubles for every row.";
      if (!["win", "loss"].includes(game.result)) return "Choose Win or Loss for every row.";
    }
    const doubles = night.games.filter(game => game.gameType === "doubles");
    const groups = new Map();
    doubles.forEach(game => groups.set(game.gameNumber, [...(groups.get(game.gameNumber) || []), game]));
    for (const [number, games] of groups) {
      if (games.length !== 2) return `Doubles game ${number} must have exactly two players.`;
      if (games[0].playerId === games[1].playerId) return `Doubles game ${number} must have two different players.`;
      if (games[0].result !== games[1].result) return `Doubles game ${number} partners must have the same result.`;
    }
    const singlesNumbers = new Set();
    for (const game of night.games.filter(game => game.gameType === "singles")) {
      if (singlesNumbers.has(game.gameNumber)) return `Singles game ${game.gameNumber} can only have one player row.`;
      singlesNumbers.add(game.gameNumber);
    }
    return "";
  }

  function cascadeGameNumbers(numbers, changedIndex, changedValue) {
    const next = numbers.map(Number);
    const start = Math.max(1, Number(changedValue) || 1);
    next[changedIndex] = start;
    for (let index = changedIndex + 1; index < next.length; index++) {
      next[index] = start + index - changedIndex;
    }
    return next;
  }

  function deriveGameTypes(numbers) {
    const counts = numbers.reduce((map, number) => {
      map.set(number, (map.get(number) || 0) + 1);
      return map;
    }, new Map());
    return numbers.map(number => counts.get(number) > 1 ? "doubles" : "singles");
  }

  function getPlayerAnalytics(season, playerId) {
    const games = allGames(season).filter(game => game.playerId === playerId).sort((a, b) => a.date.localeCompare(b.date));
    let current = null;
    let count = 0;
    games.forEach(game => {
      const result = game.result === "win" ? "W" : "L";
      if (result === current) count++; else { current = result; count = 1; }
    });
    return {
      games,
      nights: [...new Set(games.map(game => game.nightId))],
      streak: current ? `${current}${count}` : "-",
      points: Number(games.reduce((sum, game) => sum + Number(game.points), 0).toFixed(2))
    };
  }

  function getReportMetrics(season) {
    const games = allGames(season);
    const uniqueGames = new Map();
    (season.nights || []).forEach(night => (night.games || []).forEach(game => {
      const key = `${night.id}:${game.gameNumber}`;
      if (!uniqueGames.has(key)) uniqueGames.set(key, game);
    }));
    const teamGames = [...uniqueGames.values()];
    const wins = teamGames.filter(game => game.result === "win").length;
    const pairings = new Map();
    (season.nights || []).forEach(night => {
      const grouped = new Map();
      night.games.filter(game => game.gameType === "doubles").forEach(game => grouped.set(game.gameNumber, [...(grouped.get(game.gameNumber) || []), game]));
      grouped.forEach(group => {
        if (group.length !== 2) return;
        const ids = group.map(game => game.playerId).sort();
        const key = ids.join(":");
        const entry = pairings.get(key) || { ids, played: 0, wins: 0, points: 0 };
        entry.played++;
        if (group[0].result === "win") entry.wins++;
        entry.points += group.reduce((sum, game) => sum + Number(game.points), 0);
        pairings.set(key, entry);
      });
    });
    return {
      totalGames: teamGames.length,
      wins,
      winRate: teamGames.length ? Math.round(wins / teamGames.length * 1000) / 10 : 0,
      points: Number(games.reduce((sum, game) => sum + Number(game.points), 0).toFixed(2)),
      averagePoints: teamGames.length ? Number((games.reduce((sum, game) => sum + Number(game.points), 0) / teamGames.length).toFixed(2)) : 0,
      averagePointsPerNight: (season.nights || []).length ? Number((games.reduce((sum, game) => sum + Number(game.points), 0) / season.nights.length).toFixed(2)) : 0,
      pairings: [...pairings.values()].map(pair => ({
        ...pair,
        points: Number(pair.points.toFixed(2)),
        label: pair.ids.map(id => season.players.find(player => player.id === id)?.name || "Unknown").join(" + "),
        winRate: pair.played ? Math.round(pair.wins / pair.played * 100) : 0
      })).sort((a, b) => b.points - a.points || b.winRate - a.winRate || b.played - a.played)
    };
  }

  function getAdvancedReportMetrics(season) {
    const nights = [...(season.nights || [])].sort((a, b) => a.date.localeCompare(b.date));
    const players = season.players || [];
    const playerName = id => players.find(player => player.id === id)?.name || "Unknown";
    const attendance = players.map(player => {
      const nightsPlayed = nights.filter(night => nightAttendanceIds(night).includes(player.id)).length;
      return {
        id: player.id,
        name: player.name,
        nightsPlayed,
        totalNights: nights.length,
        attendanceRate: nights.length ? Math.round(nightsPlayed / nights.length * 100) : 0
      };
    }).sort((a, b) => b.attendanceRate - a.attendanceRate || b.nightsPlayed - a.nightsPlayed || a.name.localeCompare(b.name));
    const playerTrends = players.map(player => {
      const nightsWithPoints = nights.map(night => {
        const games = (night.games || []).filter(game => game.playerId === player.id);
        const wins = games.filter(game => game.result === "win").length;
        return {
        nightId: night.id,
        date: night.date,
        opposition: night.opposition || "",
        played: games.length,
        wins,
        losses: games.length - wins,
        points: Number(games.reduce((sum, game) => sum + Number(game.points), 0).toFixed(2))
      };
      });
      const activeNights = nightsWithPoints.filter(night => night.played > 0);
      const recent = activeNights.slice(-3);
      const previous = activeNights.slice(Math.max(0, activeNights.length - 6), Math.max(0, activeNights.length - 3));
      const avg = rows => rows.length ? rows.reduce((sum, night) => sum + night.points, 0) / rows.length : 0;
      const gamesPlayed = nightsWithPoints.reduce((sum, night) => sum + night.played, 0);
      return {
        id: player.id,
        name: player.name,
        nights: nightsWithPoints,
        activeNights: activeNights.length,
        recentForm: recent.map(night => ({ date: night.date, wins: night.wins, losses: night.losses, points: night.points })),
        gamesPlayed,
        totalPoints: Number(nightsWithPoints.reduce((sum, night) => sum + night.points, 0).toFixed(2)),
        pointsPerGame: gamesPlayed ? Number((nightsWithPoints.reduce((sum, night) => sum + night.points, 0) / gamesPlayed).toFixed(2)) : 0,
        pointsPerAppearance: activeNights.length ? Number((nightsWithPoints.reduce((sum, night) => sum + night.points, 0) / activeNights.length).toFixed(2)) : 0,
        recentAverage: Number(avg(recent).toFixed(2)),
        previousAverage: Number(avg(previous).toFixed(2)),
        momentum: Number((avg(recent) - avg(previous)).toFixed(2))
      };
    }).sort((a, b) => b.momentum - a.momentum || b.recentAverage - a.recentAverage || b.totalPoints - a.totalPoints);
    const bestStreaks = [];
    nights.forEach(night => {
      const byPlayer = new Map();
      [...(night.games || [])].sort((a, b) => a.gameNumber - b.gameNumber).forEach(game => {
        const rows = byPlayer.get(game.playerId) || [];
        rows.push(game);
        byPlayer.set(game.playerId, rows);
      });
      byPlayer.forEach((games, playerId) => {
        let currentResult = "";
        let currentCount = 0;
        let currentStart = 0;
        let best = null;
        games.forEach(game => {
          if (game.result === currentResult) currentCount++;
          else {
            currentResult = game.result;
            currentCount = 1;
            currentStart = game.gameNumber;
          }
          if (!best || currentCount > best.count) best = { playerId, name: playerName(playerId), result: currentResult, count: currentCount, startRack: currentStart, date: night.date };
        });
        if (best && best.count > 1) bestStreaks.push(best);
      });
    });
    bestStreaks.sort((a, b) => b.count - a.count || (a.result === "win" ? -1 : 1) || a.date.localeCompare(b.date));
    const clutchByPlayer = new Map(players.map(player => [player.id, {
      id: player.id,
      name: player.name,
      openerPlayed: 0,
      openerWins: 0,
      closerPlayed: 0,
      closerWins: 0
    }]));
    nights.forEach(night => {
      const singles = (night.games || []).filter(game => game.gameType === "singles");
      const firstRack = singles.filter(game => game.gameNumber === 1);
      const lastSinglesNumber = singles.reduce((max, game) => Math.max(max, game.gameNumber), 0);
      const lastRack = singles.filter(game => game.gameNumber === lastSinglesNumber);
      firstRack.forEach(game => {
        const row = clutchByPlayer.get(game.playerId);
        if (!row) return;
        row.openerPlayed++;
        if (game.result === "win") row.openerWins++;
      });
      lastRack.forEach(game => {
        const row = clutchByPlayer.get(game.playerId);
        if (!row) return;
        row.closerPlayed++;
        if (game.result === "win") row.closerWins++;
      });
    });
    const clutch = [...clutchByPlayer.values()].map(row => ({
      ...row,
      openerRate: row.openerPlayed ? Math.round(row.openerWins / row.openerPlayed * 100) : 0,
      closerRate: row.closerPlayed ? Math.round(row.closerWins / row.closerPlayed * 100) : 0
    })).sort((a, b) => b.closerRate - a.closerRate || b.closerPlayed - a.closerPlayed || b.openerRate - a.openerRate);
    const chemistryPairings = getReportMetrics(season).pairings
      .filter(pair => pair.played >= 2)
      .sort((a, b) => b.winRate - a.winRate || b.played - a.played || b.points - a.points);
    return { attendance, playerTrends, bestStreaks, clutch, chemistryPairings };
  }

  function csvCell(value) {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function gamesToCsv(season) {
    const header = ["Date", "Opposition", "Game Number", "Game Type", "Player", "Result", "Points"];
    const rows = allGames(season).map(game => [
      game.date,
      season.nights.find(night => night.id === game.nightId)?.opposition || "",
      game.gameNumber,
      game.gameType[0].toUpperCase() + game.gameType.slice(1),
      season.players.find(player => player.id === game.playerId)?.name || "Unknown",
      game.result[0].toUpperCase() + game.result.slice(1),
      game.points
    ]);
    return [header, ...rows].map(row => row.map(csvCell).join(",")).join("\n");
  }

  function archiveSeason(app, nextName) {
    const next = normalizeAppData(clone(app));
    next.archives.unshift({ ...next.activeSeason, archivedAt: new Date().toISOString() });
    next.activeSeason = createSeason(nextName || "New Season", next.activeSeason.players);
    next.activeSeason.settings = { ...next.archives[0].settings };
    return next;
  }

  return { defaults, createSeason, createAppData, normalizeSeason, normalizeAppData, parseImport, pointsForGame, allGames, calculateStandings, validateNight, cascadeGameNumbers, deriveGameTypes, getPlayerAnalytics, getReportMetrics, getAdvancedReportMetrics, gamesToCsv, archiveSeason };
});
