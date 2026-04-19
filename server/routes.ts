import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { insertPlayerSchema, insertGameSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";

export function registerRoutes(httpServer: Server, app: Express) {
  // ── Players ────────────────────────────────────────────────────────────────
  app.get("/api/players", (_req, res) => {
    res.json(storage.getPlayers());
  });

  app.get("/api/players/:id", (req, res) => {
    const player = storage.getPlayer(Number(req.params.id));
    if (!player) return res.status(404).json({ error: "Not found" });
    res.json(player);
  });

  app.post("/api/players", (req, res) => {
    const body = req.body;

    // Support the new registration form fields (firstName, lastName, skillLevel)
    if (body.firstName && body.lastName) {
      const name = `${body.firstName} ${body.lastName}`;
      const position = body.position === "goalie" ? "goalie" : "skater";
      const notes = body.skillLevel ? `Skill level: ${body.skillLevel}` : undefined;
      const initials = `${body.firstName[0]}${body.lastName[0]}`.toUpperCase();
      const mapped = {
        name,
        number: 0,
        position,
        email: body.email || null,
        phone: body.phone || null,
        isActive: true,
        avatarInitials: initials,
        joinedAt: new Date().toISOString().split("T")[0],
        notes,
      };
      const result = insertPlayerSchema.safeParse(mapped);
      if (!result.success) return res.status(400).json({ error: result.error.flatten() });
      const player = storage.createPlayer(result.data);
      return res.status(201).json({ ...player, firstName: body.firstName, skillLevel: body.skillLevel });
    }

    // Legacy form support
    const result = insertPlayerSchema.safeParse(body);
    if (!result.success) return res.status(400).json({ error: result.error.flatten() });
    res.status(201).json(storage.createPlayer(result.data));
  });

  app.patch("/api/players/:id", (req, res) => {
    const player = storage.updatePlayer(Number(req.params.id), req.body);
    if (!player) return res.status(404).json({ error: "Not found" });
    res.json(player);
  });

  app.delete("/api/players/:id", (req, res) => {
    storage.deletePlayer(Number(req.params.id));
    res.status(204).send();
  });

  // ── Games ──────────────────────────────────────────────────────────────────
  app.get("/api/games", (_req, res) => {
    res.json(storage.getGames());
  });

  app.get("/api/games/:id", (req, res) => {
    const game = storage.getGame(Number(req.params.id));
    if (!game) return res.status(404).json({ error: "Not found" });
    res.json(game);
  });

  app.post("/api/games", (req, res) => {
    const result = insertGameSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error.flatten() });
    res.status(201).json(storage.createGame(result.data));
  });

  app.patch("/api/games/:id", (req, res) => {
    const game = storage.updateGame(Number(req.params.id), req.body);
    if (!game) return res.status(404).json({ error: "Not found" });
    res.json(game);
  });

  app.delete("/api/games/:id", (req, res) => {
    storage.deleteGame(Number(req.params.id));
    res.status(204).send();
  });

  // ── Attendance ─────────────────────────────────────────────────────────────
  app.get("/api/games/:id/attendance", (req, res) => {
    res.json(storage.getAttendanceForGame(Number(req.params.id)));
  });

  app.post("/api/games/:id/attendance", (req, res) => {
    const { playerId, status } = req.body;
    if (!playerId || !status) return res.status(400).json({ error: "playerId and status required" });
    res.json(storage.upsertAttendance(Number(req.params.id), Number(playerId), status));
  });

  // ── Messages ───────────────────────────────────────────────────────────────
  app.get("/api/messages", (req, res) => {
    const gameId = req.query.gameId ? Number(req.query.gameId) : undefined;
    res.json(storage.getMessages(gameId));
  });

  app.post("/api/messages", (req, res) => {
    const data = { ...req.body, postedAt: new Date().toISOString() };
    const result = insertMessageSchema.safeParse(data);
    if (!result.success) return res.status(400).json({ error: result.error.flatten() });
    res.status(201).json(storage.createMessage(result.data));
  });

  app.delete("/api/messages/:id", (req, res) => {
    storage.deleteMessage(Number(req.params.id));
    res.status(204).send();
  });
}
