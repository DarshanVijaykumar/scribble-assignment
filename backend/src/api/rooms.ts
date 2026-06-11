import { Router } from "express";
import {
  addStrokeSchema,
  clearStrokesSchema,
  createRoomSchema,
  HttpError,
  joinRoomSchema,
  restartRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startRoomSchema,
  submitGuessSchema
} from "./schemas.js";
import {
  addStroke,
  clearStrokes,
  createRoom,
  getRoom,
  joinRoom,
  restartRoom,
  startRoom,
  submitGuess,
  toRoomSnapshot
} from "../services/roomStore.js";

export function createRoomsRouter() {
  const router = Router();

  router.post("/", (request, response, next) => {
    try {
      const { playerName } = createRoomSchema.parse(request.body);
      const result = createRoom(playerName);

      response.status(201).json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/join", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { playerName } = joinRoomSchema.parse(request.body);
      const result = joinRoom(code.toUpperCase(), playerName);

      if (!result) {
        throw new HttpError(404, "Unable to join room");
      }

      response.json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:code", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = roomViewerQuerySchema.parse(request.query);
      const room = getRoom(code.toUpperCase());

      if (!room) {
        throw new HttpError(404, "Unable to load room");
      }

      response.json({
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/start", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = startRoomSchema.parse(request.body);
      const result = startRoom(code.toUpperCase(), participantId);

      if (result === null) {
        throw new HttpError(404, "Room not found");
      }

      if ("error" in result) {
        if (result.error === "forbidden") {
          throw new HttpError(403, "Only the host can start the game");
        }
        throw new HttpError(409, "At least 2 players are required to start the game");
      }

      response.json({ room: result.snapshot });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/restart", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = restartRoomSchema.parse(request.body);
      const result = restartRoom(code.toUpperCase(), participantId);

      if (result === null) {
        throw new HttpError(404, "Room not found");
      }

      if ("error" in result) {
        if (result.error === "forbidden") {
          throw new HttpError(403, "Only the host can restart the game");
        }
        throw new HttpError(400, "Game has not ended yet");
      }

      response.json({ room: result.snapshot });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/strokes", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, points } = addStrokeSchema.parse(request.body);
      const room = getRoom(code.toUpperCase());

      if (!room) throw new HttpError(404, "Room not found");
      if (room.status !== "active") throw new HttpError(400, "Game is not active");

      const participant = room.participants.find((p) => p.id === participantId);
      if (!participant) throw new HttpError(404, "Participant not found");
      if (participantId !== room.drawerId) throw new HttpError(403, "Only the drawer can add strokes");

      addStroke(code.toUpperCase(), { points });
      response.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:code/strokes", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = clearStrokesSchema.parse(request.body);
      const room = getRoom(code.toUpperCase());

      if (!room) throw new HttpError(404, "Room not found");
      if (room.status !== "active") throw new HttpError(400, "Game is not active");

      const participant = room.participants.find((p) => p.id === participantId);
      if (!participant) throw new HttpError(404, "Participant not found");
      if (participantId !== room.drawerId) throw new HttpError(403, "Only the drawer can clear strokes");

      clearStrokes(code.toUpperCase());
      response.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/guesses", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, guess } = submitGuessSchema.parse(request.body);
      const room = getRoom(code.toUpperCase());

      if (!room) throw new HttpError(404, "Room not found");
      if (room.status !== "active") throw new HttpError(400, "Game is not active");

      const trimmed = guess.trim();
      if (trimmed.length === 0) throw new HttpError(400, "Guess cannot be empty");

      const result = submitGuess(code.toUpperCase(), participantId, trimmed);

      if (result === null) throw new HttpError(404, "Room not found");
      if ("error" in result) {
        if (result.error === "forbidden") throw new HttpError(403, "The drawer cannot submit guesses");
        if (result.error === "notFound") throw new HttpError(404, "Participant not found");
        if (result.error === "emptyGuess") throw new HttpError(400, "Guess cannot be empty");
      }

      response.json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
