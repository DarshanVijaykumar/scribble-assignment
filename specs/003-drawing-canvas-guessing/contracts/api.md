# API Contracts: Drawing Canvas and Guess Submission

**Feature**: 003-drawing-canvas-guessing
**Date**: 2026-06-11
**Base URL**: `http://localhost:3001`

All request and response bodies are `application/json`.
Errors follow the existing `{ error: string }` envelope.

---

## Existing Endpoints Extended

### GET /rooms/:code

Extended to include drawing and guess state.

**Query params**: `participantId` (required, UUID of requesting player)

**Response 200**:
```json
{
  "code": "ABCD",
  "hostId": "uuid",
  "drawerId": "uuid",
  "secretWord": "rocket",
  "status": "active",
  "participants": [
    { "id": "uuid", "name": "Alice", "score": 100, "joinedAt": "2026-06-11T10:00:00Z" }
  ],
  "strokes": [
    {
      "points": [
        { "x": 50, "y": 80 },
        { "x": 55, "y": 85 },
        { "x": 60, "y": 90 }
      ]
    }
  ],
  "guesses": [
    {
      "participantId": "uuid",
      "participantName": "Bob",
      "text": "rocket",
      "correct": true,
      "timestamp": "2026-06-11T10:01:30Z"
    }
  ],
  "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
  "roles": ["drawer", "guesser"]
}
```

Notes:
- `secretWord` is omitted when `participantId` is not the drawer (unchanged from Scenario 2).
- `strokes` and `guesses` are returned to all participants.
- `score` is now included on every participant object.

---

## New Endpoints

### POST /rooms/:code/strokes

Add a drawing stroke. Only the drawer may call this.

**Request body**:
```json
{
  "participantId": "uuid",
  "points": [
    { "x": 50, "y": 80 },
    { "x": 55, "y": 85 }
  ]
}
```

**Response 200**:
```json
{ "ok": true }
```

**Errors**:
| Status | Condition |
|--------|-----------|
| 400 | Room not in `active` status |
| 400 | `points` is empty array |
| 403 | `participantId` is not the drawer |
| 404 | Room code not found |
| 404 | `participantId` not in room |

---

### DELETE /rooms/:code/strokes

Clear all strokes. Only the drawer may call this.

**Request body**:
```json
{
  "participantId": "uuid"
}
```

**Response 200**:
```json
{ "ok": true }
```

**Errors**:
| Status | Condition |
|--------|-----------|
| 400 | Room not in `active` status |
| 403 | `participantId` is not the drawer |
| 404 | Room code not found |
| 404 | `participantId` not in room |

---

### POST /rooms/:code/guesses

Submit a guess. Only guessers may call this.

**Request body**:
```json
{
  "participantId": "uuid",
  "guess": "Rocket"
}
```

**Response 200**:
```json
{
  "correct": true,
  "score": 100
}
```

**Errors**:
| Status | Condition |
|--------|-----------|
| 400 | Room not in `active` status |
| 400 | `guess` is empty or whitespace-only after trimming |
| 403 | `participantId` is the drawer |
| 404 | Room code not found |
| 404 | `participantId` not in room |

**Notes**:
- Server trims and lower-cases `guess` before comparing to `secretWord`.
- Response `score` is the participant's updated total score after this guess.
- Correct guesses add 100 points; incorrect guesses add 0.
