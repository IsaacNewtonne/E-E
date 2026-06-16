const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("../league-core.js");

const players = [
  { id: "a", name: "Alex" },
  { id: "b", name: "Blair" },
  { id: "c", name: "Casey" }
];

test("standings aggregate nightly score sheet rows", () => {
  const season = {
    players,
    nights: [
      { id: "n1", date: "2026-01-15", games: [
        { id: "1", gameNumber: 1, gameType: "singles", playerId: "a", result: "win", points: 1 },
        { id: "2", gameNumber: 2, gameType: "doubles", playerId: "a", result: "win", points: 0.5 },
        { id: "3", gameNumber: 2, gameType: "doubles", playerId: "b", result: "win", points: 0.5 },
        { id: "4", gameNumber: 3, gameType: "singles", playerId: "b", result: "loss", points: 0 }
      ]}
    ],
    settings: {}
  };
  const standings = core.calculateStandings(season);
  assert.equal(standings[0].id, "a");
  assert.equal(standings[0].points, 1.5);
  assert.equal(standings[0].played, 2);
  assert.equal(standings[1].points, 0.5);
});

test("default points follow singles and doubles result rules", () => {
  assert.equal(core.pointsForGame("singles", "win"), 1);
  assert.equal(core.pointsForGame("doubles", "win"), 0.5);
  assert.equal(core.pointsForGame("singles", "loss"), 0);
});

test("night validation requires a date and complete game rows", () => {
  assert.match(core.validateNight({ date: "", games: [] }), /date/);
  assert.match(core.validateNight({ date: "2026-01-15", games: [{ gameNumber: 1, gameType: "singles", result: "win" }] }), /player/);
  assert.equal(core.validateNight({ date: "2026-01-15", games: [{ gameNumber: 1, gameType: "singles", playerId: "a", result: "win", points: 1 }] }), "");
});

test("night validation detects incomplete and duplicate doubles pairings", () => {
  const base = { date: "2026-01-15", games: [
    { gameNumber: 1, gameType: "doubles", playerId: "a", result: "win", points: 0.5 }
  ] };
  assert.match(core.validateNight(base), /exactly two/);
  assert.match(core.validateNight({ ...base, games: [...base.games, { ...base.games[0], id: "2" }] }), /different players/);
  assert.equal(core.validateNight({ ...base, games: [...base.games, { ...base.games[0], id: "2", playerId: "b" }] }), "");
  assert.match(core.validateNight({ date: "2026-01-15", games: [
    { gameNumber: 1, gameType: "singles", playerId: "a", result: "win", points: 1 },
    { gameNumber: 1, gameType: "singles", playerId: "b", result: "loss", points: 0 }
  ] }), /Singles game 1/);
});

test("changing a game number cascades sequential numbering below it", () => {
  assert.deepEqual(core.cascadeGameNumbers([1, 2, 3, 4, 5], 2, 2), [1, 2, 2, 3, 4]);
  assert.deepEqual(core.cascadeGameNumbers([1, 2, 2, 3, 4], 2, 3), [1, 2, 3, 4, 5]);
});

test("game types derive automatically from duplicate game numbers", () => {
  assert.deepEqual(core.deriveGameTypes([1, 2, 2, 3]), ["singles", "doubles", "doubles", "singles"]);
  assert.deepEqual(core.deriveGameTypes([1, 2, 3, 4]), ["singles", "singles", "singles", "singles"]);
});

test("player analytics include points, nightly history, and streak", () => {
  const season = {
    players,
    nights: [
      { id: "n1", date: "2026-01-01", games: [{ id: "1", gameNumber: 1, gameType: "singles", playerId: "a", result: "win", points: 1 }] },
      { id: "n2", date: "2026-01-02", games: [{ id: "2", gameNumber: 1, gameType: "doubles", playerId: "a", result: "win", points: 0.5 }] }
    ],
    settings: {}
  };
  const analytics = core.getPlayerAnalytics(season, "a");
  assert.equal(analytics.streak, "W2");
  assert.equal(analytics.points, 1.5);
  assert.equal(analytics.nights.length, 2);
});

test("report metrics include team totals and doubles pairings", () => {
  const season = {
    players,
    nights: [{ id: "n1", date: "2026-01-15", games: [
      { gameNumber: 1, gameType: "singles", playerId: "a", result: "win", points: 1 },
      { gameNumber: 2, gameType: "doubles", playerId: "a", result: "win", points: 0.5 },
      { gameNumber: 2, gameType: "doubles", playerId: "b", result: "win", points: 0.5 }
    ]}]
  };
  const report = core.getReportMetrics(season);
  assert.equal(report.totalGames, 2);
  assert.equal(report.points, 2);
  assert.equal(report.winRate, 100);
  assert.equal(report.averagePoints, 1);
  assert.equal(report.averagePointsPerNight, 2);
  assert.equal(report.pairings[0].label, "Alex + Blair");
  assert.equal(report.pairings[0].points, 1);
});

test("advanced report metrics surface attendance, trends, streaks, clutch racks, and chemistry", () => {
  const season = {
    players,
    nights: [
      { id: "n1", date: "2026-01-01", games: [
        { gameNumber: 1, gameType: "singles", playerId: "a", result: "win", points: 1 },
        { gameNumber: 2, gameType: "singles", playerId: "a", result: "win", points: 1 },
        { gameNumber: 3, gameType: "singles", playerId: "b", result: "loss", points: 0 },
        { gameNumber: 4, gameType: "doubles", playerId: "a", result: "win", points: 0.5 },
        { gameNumber: 4, gameType: "doubles", playerId: "b", result: "win", points: 0.5 }
      ] },
      { id: "n2", date: "2026-01-08", games: [
        { gameNumber: 1, gameType: "singles", playerId: "c", result: "loss", points: 0 },
        { gameNumber: 2, gameType: "singles", playerId: "a", result: "win", points: 1 },
        { gameNumber: 3, gameType: "singles", playerId: "a", result: "loss", points: 0 },
        { gameNumber: 4, gameType: "doubles", playerId: "a", result: "win", points: 0.5 },
        { gameNumber: 4, gameType: "doubles", playerId: "b", result: "win", points: 0.5 }
      ] }
    ]
  };
  const advanced = core.getAdvancedReportMetrics(season);
  assert.equal(advanced.attendance[0].name, "Alex");
  assert.equal(advanced.attendance[0].attendanceRate, 100);
  assert.equal(advanced.playerTrends.find(player => player.id === "a").totalPoints, 4);
  assert.equal(advanced.playerTrends.find(player => player.id === "a").gamesPlayed, 6);
  assert.equal(advanced.playerTrends.find(player => player.id === "a").pointsPerGame, 0.67);
  assert.equal(advanced.playerTrends.find(player => player.id === "c").activeNights, 1);
  assert.deepEqual(advanced.playerTrends.find(player => player.id === "c").recentForm, [{ date: "2026-01-08", wins: 0, losses: 1, points: 0 }]);
  assert.deepEqual(advanced.bestStreaks[0], { playerId: "a", name: "Alex", result: "win", count: 3, startRack: 1, date: "2026-01-01" });
  assert.equal(advanced.clutch.find(player => player.id === "a").closerRate, 0);
  assert.equal(advanced.clutch.find(player => player.id === "a").openerRate, 100);
  assert.equal(advanced.chemistryPairings[0].label, "Alex + Blair");
  assert.equal(advanced.chemistryPairings[0].winRate, 100);
});

test("attendance is tracked separately from played games", () => {
  const season = core.normalizeSeason({
    players,
    nights: [
      { id: "n1", date: "2026-01-01", attendanceIds: ["a", "b", "c"], games: [
        { gameNumber: 1, gameType: "singles", playerId: "a", result: "win", points: 1 }
      ] },
      { id: "n2", date: "2026-01-08", attendanceIds: ["b"], games: [
        { gameNumber: 1, gameType: "singles", playerId: "b", result: "loss", points: 0 }
      ] }
    ]
  });
  const advanced = core.getAdvancedReportMetrics(season);
  assert.equal(advanced.attendance.find(player => player.id === "b").nightsPlayed, 2);
  assert.equal(advanced.attendance.find(player => player.id === "b").attendanceRate, 100);
  assert.equal(advanced.playerTrends.find(player => player.id === "b").gamesPlayed, 1);
});

test("season report data keeps inactive and unplayed players", () => {
  const season = core.normalizeSeason({
    players: [
      { id: "a", name: "Alex" },
      { id: "b", name: "Blair", active: false },
      { id: "c", name: "Casey" }
    ],
    nights: [
      { id: "n1", date: "2026-01-01", attendanceIds: ["a"], games: [
        { gameNumber: 1, gameType: "singles", playerId: "a", result: "win", points: 1 }
      ] }
    ]
  });
  const standings = core.calculateStandings(season);
  const advanced = core.getAdvancedReportMetrics(season);

  assert.deepEqual(standings.map(player => player.id).sort(), ["a", "b", "c"]);
  assert.equal(standings.find(player => player.id === "b").played, 0);
  assert.equal(standings.find(player => player.id === "b").active, false);
  assert.deepEqual(advanced.attendance.map(player => player.id).sort(), ["a", "b", "c"]);
  assert.equal(advanced.attendance.find(player => player.id === "b").attendanceRate, 0);
  assert.equal(advanced.playerTrends.find(player => player.id === "c").gamesPlayed, 0);
});

test("legacy nights infer attendance from played rows", () => {
  const season = core.normalizeSeason({
    players,
    nights: [{ id: "n1", date: "2026-01-01", games: [
      { gameNumber: 1, gameType: "singles", playerId: "a", result: "win", points: 1 }
    ] }]
  });
  assert.deepEqual(season.nights[0].attendanceIds, ["a"]);
});

test("CSV export contains game-night rows", () => {
  const season = {
    players,
    nights: [{ id: "n1", date: "2026-01-15", games: [{ gameNumber: 1, gameType: "singles", playerId: "a", result: "win", points: 1 }] }]
  };
  const csv = core.gamesToCsv(season);
  assert.match(csv, /Date,Opposition,Game Number,Game Type,Player,Result,Points/);
  assert.match(csv, /2026-01-15,,1,Singles,Alex,Win,1/);
});

test("game night opposition is preserved during normalization and CSV export", () => {
  const season = core.normalizeSeason({
    players,
    nights: [{ id: "n1", date: "2026-01-15", opposition: "Corner Pocket", games: [
      { gameNumber: 1, gameType: "singles", playerId: "a", result: "win", points: 1 }
    ] }]
  });
  assert.equal(season.nights[0].opposition, "Corner Pocket");
  assert.match(core.gamesToCsv(season), /Date,Opposition,Game Number/);
  assert.match(core.gamesToCsv(season), /2026-01-15,Corner Pocket,1/);
});

test("archiving creates a historical snapshot and fresh active season", () => {
  const app = core.createAppData();
  app.activeSeason.players = players;
  app.activeSeason.nights.push({ id: "n1", date: "2026-01-01", games: [] });
  const next = core.archiveSeason(app, "Next Season");
  assert.equal(next.archives.length, 1);
  assert.equal(next.archives[0].nights.length, 1);
  assert.equal(next.activeSeason.name, "Next Season");
  assert.equal(next.activeSeason.nights.length, 0);
  assert.equal(next.activeSeason.players.length, 3);
});

test("legacy data migrates into the current application schema", () => {
  const migrated = core.normalizeAppData({ season: "Legacy", players, matches: [] });
  assert.equal(migrated.version, 2);
  assert.equal(migrated.activeSeason.name, "Legacy");
  assert.deepEqual(migrated.activeSeason.nights, []);
});

test("invalid imports are rejected", () => {
  assert.throws(() => core.parseImport('{"hello":"world"}'), /valid EvitaativE/);
  assert.equal(core.parseImport(JSON.stringify(core.createAppData())).version, 2);
});
