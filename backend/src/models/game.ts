export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "active" | "results";

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  points: Point[];
}

export interface GuessEntry {
  participantId: string;
  participantName: string;
  text: string;
  correct: boolean;
  timestamp: string;
}

export interface Participant {
  id: string;
  name: string;
  score: number;
  joinedAt: string;
}

export interface Room {
  code: string;
  hostId: string;
  drawerId?: string;
  secretWord?: string;
  status: RoomStatus;
  participants: Participant[];
  strokes: Stroke[];
  guesses: GuessEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  hostId: string;
  drawerId?: string;
  secretWord?: string;
  status: RoomStatus;
  participants: Participant[];
  strokes: Stroke[];
  guesses: GuessEntry[];
  availableWords: string[];
  roles: ParticipantRole[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}
