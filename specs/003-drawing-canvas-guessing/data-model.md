# Data Model: Drawing Canvas and Guess Submission

**Feature**: 003-drawing-canvas-guessing
**Date**: 2026-06-11

---

## Extended Types (backend `src/models/game.ts`)

### Point

```
Point {
  x: number       // canvas-relative pixel X, normalised to bounding rect
  y: number       // canvas-relative pixel Y, normalised to bounding rect
}
```

### Stroke

```
Stroke {
  points: Point[] // ordered list of sampled pointer positions for one drag gesture
}
```

Invariants:
- A stroke with `points.length === 0` MUST NOT be stored (ignored by server).
- Stroke order is preserved in `Room.strokes[]`; index 0 is the first stroke drawn.

### GuessEntry

```
GuessEntry {
  participantId:   string   // UUID of submitter (for drawer-rejection cross-check)
  participantName: string   // display name stored at submission time
  text:            string   // trimmed guess text as submitted
  correct:         boolean  // true if trim+lowercase(text) === lowercase(secretWord)
  timestamp:       string   // ISO 8601 UTC, set by server at receipt time
}
```

Invariants:
- `text` MUST be stored after trimming (server normalises before storing).
- `correct` is immutable once set; no retroactive re-scoring.

### Participant (extended)

```
Participant {
  id:       string   // UUID (unchanged)
  name:     string   // trimmed display name (unchanged)
  score:    number   // starts at 0 on game start; incremented by 100 per correct guess
  joinedAt: string   // ISO 8601 (unchanged)
}
```

Invariant: `score` is initialised to 0 when `startRoom()` is called (Scenario 2 transition
point). Scenario 3 only increments; it never resets mid-game.

### Room (extended)

```
Room {
  // — existing fields (unchanged) —
  code:         string
  hostId:       string
  drawerId?:    string
  secretWord?:  string
  status:       "lobby" | "active"
  participants: Participant[]   // now includes score
  createdAt:    string
  updatedAt:    string

  // — new fields —
  strokes:  Stroke[]     // ordered drawing strokes; reset to [] on clear
  guesses:  GuessEntry[] // append-only log; never cleared mid-game
}
```

Initialisation at game start:
- `strokes` → `[]`
- `guesses` → `[]`
- Each participant's `score` → `0`

---

## RoomSnapshot (viewer-aware projection, extended)

The GET /rooms/:code response already filters `secretWord` by viewer role.
Scenario 3 adds three fields visible to all viewers:

```
RoomSnapshot {
  // — existing fields (unchanged) —
  code:           string
  hostId:         string
  drawerId?:      string
  secretWord?:    string   // omitted for non-drawer (unchanged)
  status:         "lobby" | "active"
  participants:   ParticipantSnapshot[]
  availableWords: string[]
  roles:          string[]

  // — new fields —
  strokes:  Stroke[]      // full stroke list for current round
  guesses:  GuessEntry[]  // full guess log in submission order
}
```

ParticipantSnapshot now includes `score: number`.

---

## State Transitions

```
Game start (POST /rooms/:code/start)
  → Room.strokes   = []
  → Room.guesses   = []
  → each Participant.score = 0

Drawer adds stroke (POST /rooms/:code/strokes)
  → Room.strokes.push(newStroke)
  → Room.updatedAt = now

Drawer clears canvas (DELETE /rooms/:code/strokes)
  → Room.strokes = []
  → Room.updatedAt = now

Guesser submits guess (POST /rooms/:code/guesses)
  → trim + lowercase guess
  → correct = (trimmed === lowercase(secretWord))
  → if correct: participant.score += 100
  → Room.guesses.push(entry)
  → Room.updatedAt = now
```

---

## Validation Rules

| Field | Rule |
|-------|------|
| Stroke.points | Must be non-empty array; server drops empty strokes silently |
| GuessEntry.text | Must be non-empty after trim; server returns 400 if blank |
| Guess submitter | participantId must NOT equal room.drawerId; server returns 403 |
| Guess submitter | participantId must exist in room.participants; server returns 404 |
| Stroke submitter | participantId must equal room.drawerId; server returns 403 |
| Clear submitter | participantId must equal room.drawerId; server returns 403 |
