# Quickstart Validation Guide: Drawing Canvas and Guess Submission

**Feature**: 003-drawing-canvas-guessing
**Date**: 2026-06-11

## Prerequisites

- Node.js 18+ installed
- Backend running on port 3001: `cd backend && npm run dev`
- Frontend running on port 5173: `cd frontend && npm run dev`
- Two browser tabs open to `http://localhost:5173`

## Setup — Create a Game with Two Players

1. **Tab 1 (Alice — becomes Drawer)**:
   - Go to home → "Create Room"
   - Name: `Alice` → Submit → note the room code (e.g. `ABCD`)
   - You are now in the Lobby as host.

2. **Tab 2 (Bob — Guesser)**:
   - Go to home → "Join Room"
   - Name: `Bob`, Room code: `ABCD` → Submit
   - You are now in the Lobby.

3. **Back in Tab 1 (Alice)**:
   - Click "Start Game" (enabled because ≥ 2 players).
   - Both tabs should transition to the Game screen.
   - Alice is labelled "Drawer"; Bob is labelled "Guesser".

---

## Scenario Validation Checklist

### S3-A: Canvas Drawing Syncs to Guesser

1. In Tab 1 (Alice), click and drag on the canvas to draw a shape.
2. Wait up to 2 seconds.
3. **Expected**: The same stroke appears on Bob's canvas in Tab 2.

### S3-B: Clear Canvas Syncs to Guesser

1. In Tab 1 (Alice), draw a few strokes.
2. Click "Clear" (or the clear button on Alice's Game screen).
3. **Expected**: Alice's canvas goes blank immediately.
4. Wait up to 2 seconds.
5. **Expected**: Bob's canvas in Tab 2 also goes blank.

### S3-C: Correct Guess Awards 100 Points

1. In Tab 2 (Bob), type `ROCKET` in the guess input and submit.
2. **Expected**: Bob's score shows 100. A "correct" indicator appears in the guess list.
3. Check Tab 1 (Alice) after one polling cycle.
4. **Expected**: Alice's view also shows Bob scored 100 and the guess list includes Bob's entry.

### S3-D: Case-Insensitive Correct Guess

1. In Tab 2 (Bob), type `Rocket` (mixed case) and submit.
2. **Expected**: Awarded 100 points (same as `rocket`).

### S3-E: Padded Correct Guess (Trim Normalisation)

1. In Tab 2 (Bob), type `  rocket  ` (leading/trailing spaces) and submit.
2. **Expected**: Awarded 100 points — trimming applied before comparison.

### S3-F: Incorrect Guess Awards 0 Points

1. In Tab 2 (Bob), type `pizza` and submit.
2. **Expected**: Bob's score does not change. An "incorrect" indicator appears in the guess list.

### S3-G: Empty Guess Is Rejected

1. In Tab 2 (Bob), leave the guess input empty and attempt to submit.
2. **Expected**: A visible error message appears. No network call is made. Score unchanged.

### S3-H: Whitespace-Only Guess Is Rejected

1. In Tab 2 (Bob), type `   ` (spaces only) and attempt to submit.
2. **Expected**: Same behaviour as S3-G — rejected with an error message.

### S3-I: Drawer Cannot Guess

1. In Tab 1 (Alice / Drawer), check the Game screen.
2. **Expected**: No guess input field is visible to Alice.

### S3-J: Guess List Visible to All Players

1. After Bob submits several guesses, check both Tab 1 and Tab 2.
2. **Expected**: Both tabs show the full guess history (guesser name, text, correct/incorrect).

---

## API Smoke Tests (curl)

Replace `ABCD` and UUIDs with real values from the steps above.

```bash
# Add a stroke (replace drawerId)
curl -s -X POST http://localhost:3001/rooms/ABCD/strokes \
  -H "Content-Type: application/json" \
  -d '{"participantId":"<drawerId>","points":[{"x":10,"y":20},{"x":15,"y":25}]}'
# Expected: {"ok":true}

# Clear strokes
curl -s -X DELETE http://localhost:3001/rooms/ABCD/strokes \
  -H "Content-Type: application/json" \
  -d '{"participantId":"<drawerId>"}'
# Expected: {"ok":true}

# Submit a correct guess (replace guesserId)
curl -s -X POST http://localhost:3001/rooms/ABCD/guesses \
  -H "Content-Type: application/json" \
  -d '{"participantId":"<guesserId>","guess":"ROCKET"}'
# Expected: {"correct":true,"score":100}

# Submit an empty guess
curl -s -X POST http://localhost:3001/rooms/ABCD/guesses \
  -H "Content-Type: application/json" \
  -d '{"participantId":"<guesserId>","guess":"   "}'
# Expected: 400 {"error":"..."}

# Drawer tries to guess (should fail)
curl -s -X POST http://localhost:3001/rooms/ABCD/guesses \
  -H "Content-Type: application/json" \
  -d '{"participantId":"<drawerId>","guess":"rocket"}'
# Expected: 403 {"error":"..."}
```

---

## Run Automated Tests

```bash
# Backend unit + integration tests
cd backend && npm test

# Frontend unit tests
cd frontend && npm test
```

All tests must pass before the feature is considered complete.

## References

- API contracts: [contracts/api.md](contracts/api.md)
- Data model: [data-model.md](data-model.md)
- Spec: [spec.md](spec.md)
