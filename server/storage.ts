import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, desc } from "drizzle-orm";
import {
  players, games, attendance, messages,
  type Player, type InsertPlayer,
  type Game, type InsertGame,
  type Attendance, type InsertAttendance,
  type Message, type InsertMessage,
} from "@shared/schema";

// Use DB_PATH env var on Railway (persistent volume), fallback to local file
const DB_PATH = process.env.DB_PATH || "bbhc.db";
const sqlite = new Database(DB_PATH);
const db = drizzle(sqlite);

// Create tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    number INTEGER,
    position TEXT NOT NULL DEFAULT 'skater',
    email TEXT,
    phone TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    avatar_initials TEXT,
    joined_at TEXT NOT NULL DEFAULT '',
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    location TEXT NOT NULL,
    opponent TEXT,
    home_score INTEGER,
    away_score INTEGER,
    status TEXT NOT NULL DEFAULT 'upcoming',
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL REFERENCES games(id),
    player_id INTEGER NOT NULL REFERENCES players(id),
    status TEXT NOT NULL DEFAULT 'pending',
    responded_at TEXT
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER REFERENCES players(id),
    player_name TEXT NOT NULL,
    content TEXT NOT NULL,
    posted_at TEXT NOT NULL,
    game_id INTEGER REFERENCES games(id)
  );
`);

// Safe migration: add notes column to players if it doesn't exist
try {
  sqlite.exec(`ALTER TABLE players ADD COLUMN notes TEXT`);
} catch (e) {
  // Column already exists — ignore
}

// Seed with sample data if empty
const playerCount = db.select().from(players).all().length;
if (playerCount === 0) {
  const samplePlayers = [
    { name: "Igor K", number: 11, position: "skater", email: "igor@bbhc.com", isActive: true, avatarInitials: "IK", joinedAt: "2023-09-01" },
    { name: "Mike Torres", number: 7, position: "skater", email: "mike@bbhc.com", isActive: true, avatarInitials: "MT", joinedAt: "2023-09-01" },
    { name: "Dave Chen", number: 30, position: "goalie", email: "dave@bbhc.com", isActive: true, avatarInitials: "DC", joinedAt: "2023-09-15" },
    { name: "Sam Rivera", number: 14, position: "skater", email: "sam@bbhc.com", isActive: true, avatarInitials: "SR", joinedAt: "2023-10-01" },
    { name: "Chris Park", number: 22, position: "skater", email: "chris@bbhc.com", isActive: true, avatarInitials: "CP", joinedAt: "2023-11-05" },
    { name: "Alex Volkov", number: 8, position: "skater", email: "alex@bbhc.com", isActive: true, avatarInitials: "AV", joinedAt: "2024-01-10" },
    { name: "Jordan Lee", number: 5, position: "skater", email: "jordan@bbhc.com", isActive: false, avatarInitials: "JL", joinedAt: "2024-02-20" },
    { name: "Tyler Mack", number: 17, position: "goalie", email: "tyler@bbhc.com", isActive: true, avatarInitials: "TM", joinedAt: "2024-03-01" },
  ];
  for (const p of samplePlayers) {
    db.insert(players).values(p).run();
  }

  const today = new Date();
  const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7);
  const lastWeek = new Date(today); lastWeek.setDate(today.getDate() - 7);
  const twoWeeksAgo = new Date(today); twoWeeksAgo.setDate(today.getDate() - 14);

  db.insert(games).values({ date: nextWeek.toISOString().split("T")[0], time: "10:00 PM", location: "Iceland, Brooklyn", opponent: "Puck Buddies", status: "upcoming", notes: "Bring extra tape" }).run();
  db.insert(games).values({ date: lastWeek.toISOString().split("T")[0], time: "9:30 PM", location: "Iceland, Brooklyn", opponent: "Ice Dogs", homeScore: 5, awayScore: 3, status: "completed" }).run();
  db.insert(games).values({ date: twoWeeksAgo.toISOString().split("T")[0], time: "10:00 PM", location: "Sky Rink, Manhattan", opponent: "Brew Crew", homeScore: 2, awayScore: 4, status: "completed" }).run();

  // Attendance for upcoming game (id=1)
  const statuses = ["in","in","in","out","maybe","in","pending","in"];
  const allPlayers = db.select().from(players).all();
  allPlayers.forEach((p, i) => {
    db.insert(attendance).values({ gameId: 1, playerId: p.id, status: statuses[i] || "pending", respondedAt: statuses[i] !== "pending" ? new Date().toISOString() : null }).run();
  });

  // Messages
  db.insert(messages).values({ playerName: "Igor K", playerId: 1, content: "Who's bringing the beer? 🍺", postedAt: new Date(Date.now() - 3600000).toISOString() }).run();
  db.insert(messages).values({ playerName: "Mike Torres", playerId: 2, content: "I'll bring a 12-pack of Modelo. Let's go!", postedAt: new Date(Date.now() - 1800000).toISOString() }).run();
  db.insert(messages).values({ playerName: "Dave Chen", playerId: 3, content: "Anyone have spare pucks? Lost mine last game 😅", postedAt: new Date(Date.now() - 900000).toISOString() }).run();
}

export interface IStorage {
  // Players
  getPlayers(): Player[];
  getPlayer(id: number): Player | undefined;
  createPlayer(data: InsertPlayer): Player;
  updatePlayer(id: number, data: Partial<InsertPlayer>): Player | undefined;
  deletePlayer(id: number): void;

  // Games
  getGames(): Game[];
  getGame(id: number): Game | undefined;
  createGame(data: InsertGame): Game;
  updateGame(id: number, data: Partial<InsertGame>): Game | undefined;
  deleteGame(id: number): void;

  // Attendance
  getAttendanceForGame(gameId: number): (Attendance & { player: Player })[];
  upsertAttendance(gameId: number, playerId: number, status: string): Attendance;

  // Messages
  getMessages(gameId?: number): (Message & { player?: Player })[];
  createMessage(data: InsertMessage): Message;
  deleteMessage(id: number): void;
}

export const storage: IStorage = {
  // Players
  getPlayers() { return db.select().from(players).all(); },
  getPlayer(id) { return db.select().from(players).where(eq(players.id, id)).get(); },
  createPlayer(data) { return db.insert(players).values(data).returning().get(); },
  updatePlayer(id, data) {
    return db.update(players).set(data).where(eq(players.id, id)).returning().get();
  },
  deletePlayer(id) { db.delete(players).where(eq(players.id, id)).run(); },

  // Games
  getGames() { return db.select().from(games).all(); },
  getGame(id) { return db.select().from(games).where(eq(games.id, id)).get(); },
  createGame(data) { return db.insert(games).values(data).returning().get(); },
  updateGame(id, data) {
    return db.update(games).set(data).where(eq(games.id, id)).returning().get();
  },
  deleteGame(id) { db.delete(games).where(eq(games.id, id)).run(); },

  // Attendance
  getAttendanceForGame(gameId) {
    const rows = db.select().from(attendance).where(eq(attendance.gameId, gameId)).all();
    return rows.map(row => {
      const player = db.select().from(players).where(eq(players.id, row.playerId)).get()!;
      return { ...row, player };
    });
  },
  upsertAttendance(gameId, playerId, status) {
    const existing = db.select().from(attendance)
      .where(eq(attendance.gameId, gameId))
      .all()
      .find(a => a.playerId === playerId);
    if (existing) {
      return db.update(attendance)
        .set({ status, respondedAt: new Date().toISOString() })
        .where(eq(attendance.id, existing.id))
        .returning().get()!;
    }
    return db.insert(attendance)
      .values({ gameId, playerId, status, respondedAt: new Date().toISOString() })
      .returning().get();
  },

  // Messages
  getMessages(gameId) {
    const rows = gameId
      ? db.select().from(messages).where(eq(messages.gameId, gameId)).orderBy(desc(messages.id)).all()
      : db.select().from(messages).orderBy(desc(messages.id)).all();
    return rows.map(row => {
      const player = row.playerId ? db.select().from(players).where(eq(players.id, row.playerId)).get() : undefined;
      return { ...row, player };
    });
  },
  createMessage(data) { return db.insert(messages).values(data).returning().get(); },
  deleteMessage(id) { db.delete(messages).where(eq(messages.id, id)).run(); },
};
