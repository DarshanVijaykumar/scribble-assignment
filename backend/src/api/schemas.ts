import { z } from "zod";

const pointSchema = z.object({
  x: z.number(),
  y: z.number()
});

export const addStrokeSchema = z.object({
  participantId: z.string().min(1, "participantId is required"),
  points: z.array(pointSchema).min(1, "points must not be empty")
});

export const clearStrokesSchema = z.object({
  participantId: z.string().min(1, "participantId is required")
});

export const submitGuessSchema = z.object({
  participantId: z.string().min(1, "participantId is required"),
  guess: z.string()
});

export const createRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Player name is required")
});

export const joinRoomSchema = z.object({
  playerName: z.string().trim().min(1, "Player name is required")
});

export const startRoomSchema = z.object({
  participantId: z.string().min(1, "participantId is required")
});

export const roomCodeParamsSchema = z.object({
  code: z.string()
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
