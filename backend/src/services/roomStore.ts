import { randomUUID } from "node:crypto";
import type { GuessEntry, Participant, Room, RoomSnapshot, Stroke } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

const rooms = new Map<string, Room>();

function now() {
  return new Date().toISOString();
}

function generateCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let index = 0; index < 4; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return code;
}

function generateUniqueCode() {
  let code = generateCode();

  while (rooms.has(code)) {
    code = generateCode();
  }

  return code;
}

function displayName(name?: string) {
  return name || "Player";
}

function createParticipant(name?: string): Participant {
  return {
    id: randomUUID(),
    name: displayName(name),
    score: 0,
    joinedAt: now()
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function createRoom(playerName?: string) {
  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    hostId: participant.id,
    status: "lobby",
    participants: [participant],
    strokes: [],
    guesses: [],
    createdAt: now(),
    updatedAt: now()
  };

  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function joinRoom(code: string, playerName?: string) {
  const room = rooms.get(code.trim());

  if (!room) {
    return null;
  }

  const participant = createParticipant(playerName);
  room.participants.push(participant);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function getRoom(code: string) {
  const room = rooms.get(code);
  return room ? cloneRoom(room) : null;
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

export function startRoom(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return null;
  }

  if (participantId !== room.hostId) {
    return { error: "forbidden" as const };
  }

  if (room.participants.length < 2) {
    return { error: "conflict" as const };
  }

  room.status = "active";
  room.drawerId = room.participants[0].id;
  room.secretWord = STARTER_WORDS[0];
  room.strokes = [];
  room.guesses = [];
  for (const p of room.participants) {
    p.score = 0;
  }
  saveRoom(room);

  return { snapshot: toRoomSnapshot(getRoom(code)!, participantId) };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const isDrawer = viewerParticipantId !== undefined && viewerParticipantId === room.drawerId;

  return {
    code: room.code,
    hostId: room.hostId,
    ...(room.drawerId !== undefined && { drawerId: room.drawerId }),
    ...(isDrawer && room.secretWord !== undefined && { secretWord: room.secretWord }),
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    strokes: room.strokes.map((s) => ({ points: s.points.map((p) => ({ ...p })) })),
    guesses: room.guesses.map((g) => ({ ...g })),
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}

export function addStroke(code: string, stroke: Stroke) {
  const room = rooms.get(code);
  if (!room) return null;
  room.strokes.push({ points: stroke.points.map((p) => ({ ...p })) });
  room.updatedAt = now();
  rooms.set(code, room);
  return true;
}

export function clearStrokes(code: string) {
  const room = rooms.get(code);
  if (!room) return null;
  room.strokes = [];
  room.updatedAt = now();
  rooms.set(code, room);
  return true;
}

export function submitGuess(code: string, participantId: string, guessText: string) {
  const room = rooms.get(code);
  if (!room) return null;

  const participant = room.participants.find((p) => p.id === participantId);
  if (!participant) return { error: "notFound" as const };

  const trimmed = guessText.trim();
  if (trimmed.length === 0) return { error: "emptyGuess" as const };

  if (participantId === room.drawerId) return { error: "forbidden" as const };

  const correct = trimmed.toLowerCase() === (room.secretWord ?? "").toLowerCase();
  if (correct) {
    participant.score += 100;
  }

  const entry: GuessEntry = {
    participantId,
    participantName: participant.name,
    text: trimmed,
    correct,
    timestamp: now()
  };
  room.guesses.push(entry);
  room.updatedAt = now();
  rooms.set(code, room);

  return { correct, score: participant.score };
}
