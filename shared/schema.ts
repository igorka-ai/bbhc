import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ── Players ──────────────────────────────────────────────────────────────────
export const players = sqliteTable("players", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  number: integer("number"),
  position: text("position").notNull().default("skater"), // skater | goalie
  email: text("email"),
  phone: text("phone"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  avatarInitials: text("avatar_initials"),
  joinedAt: text("joined_at").notNull().default(""),
  notes: text("notes"),
});

export const insertPlayerSchema = createInsertSchema(players).omit({ id: true });
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;

// ── Games ─────────────────────────────────────────────────────────────────────
export const games = sqliteTable("games", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(),          // ISO date string
  time: text("time").notNull(),
  location: text("location").notNull(),
  opponent: text("opponent"),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  status: text("status").notNull().default("upcoming"), // upcoming | completed | cancelled
  notes: text("notes"),
});

export const insertGameSchema = createInsertSchema(games).omit({ id: true });
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;

// ── Attendance ────────────────────────────────────────────────────────────────
export const attendance = sqliteTable("attendance", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  gameId: integer("game_id").notNull().references(() => games.id),
  playerId: integer("player_id").notNull().references(() => players.id),
  status: text("status").notNull().default("pending"), // in | out | maybe | pending
  respondedAt: text("responded_at"),
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true });
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendance.$inferSelect;

// ── Messages ──────────────────────────────────────────────────────────────────
export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  playerId: integer("player_id").references(() => players.id),
  playerName: text("player_name").notNull(),
  content: text("content").notNull(),
  postedAt: text("posted_at").notNull(),
  gameId: integer("game_id").references(() => games.id), // optional: tied to a game
});

export const insertMessageSchema = createInsertSchema(messages).omit({ id: true });
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
