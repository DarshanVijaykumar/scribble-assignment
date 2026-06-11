# Implementation Plan: Drawing Canvas and Guess Submission

**Branch**: `003-drawing-canvas-guessing` | **Date**: 2026-06-11 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-drawing-canvas-guessing/spec.md`

## Summary

Add an interactive drawing canvas for the drawer and a validated guess submission flow for
guessers. Canvas strokes and submitted guesses are stored server-side and distributed to all
players via the existing ~2-second HTTP polling cycle. A correct guess awards exactly 100
points (case-insensitive, trim-normalised); incorrect guesses award 0. All inputs are
validated on both client and server per constitution Principle V.

## Technical Context

**Language/Version**: TypeScript 5.6.3 / Node.js 18+ (backend), TypeScript 5.6.3 / React 18
(frontend) — same as Scenarios 1 & 2.

**Primary Dependencies**: Express 4 + Zod 3 (backend), React + React Router 6 + Vite 5
(frontend). No new top-level dependencies added.

**Storage**: In-memory Map (existing `roomStore.ts`). No persistence.

**Testing**: Vitest 3 — both backend and frontend (existing test infrastructure).

**Target Platform**: Local development server; Chrome/Firefox with two tabs.

**Project Type**: Web application — backend REST API + React SPA.

**Performance Goals**: Canvas stroke delivery ≤ 2-second polling lag. Guess scoring
response ≤ 200ms server processing time (in-memory operations).

**Constraints**: HTTP polling only — no WebSockets or SSE. In-memory state only. No new
top-level npm dependencies.

**Scale/Scope**: Single active room during manual testing; up to ~5 concurrent players per
room as intended by the assignment.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Brownfield Discipline | ✅ PASS | All changes extend existing scaffold files; no rewrites. |
| II. Spec-First | ✅ PASS | spec.md committed before any code. |
| III. Deterministic Rules | ✅ PASS | Case-insensitive trim comparison; +100/0 scoring; word = `rocket`. |
| IV. Polling Only | ✅ PASS | GamePage polling reuses LobbyPage pattern; no WebSocket introduced. |
| V. Validated Inputs | ✅ PASS | Empty/whitespace guess rejected on client before network call AND server-side. |

**Post-design re-check**: All principles still hold after data-model and contracts design.
No complexity violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/003-drawing-canvas-guessing/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── api.md           ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit-tasks)
```

### Source Code — Changes Required

```text
backend/
├── src/
│   ├── models/
│   │   └── game.ts          ← add Point, Stroke, GuessEntry types; extend Participant (score), Room (strokes, guesses)
│   ├── services/
│   │   └── roomStore.ts     ← extend startRoom (init score/strokes/guesses), add addStroke, clearStrokes, submitGuess
│   ├── api/
│   │   ├── schemas.ts       ← add Zod schemas: AddStrokeBody, ClearStrokesBody, SubmitGuessBody
│   │   └── rooms.ts         ← add POST /strokes, DELETE /strokes, POST /guesses routes; extend GET snapshot
│   └── seed/
│       └── starterData.ts   ← no change needed

frontend/
├── src/
│   ├── components/
│   │   ├── DrawingCanvas.tsx   ← NEW: interactive canvas (drawer) + read-only (guesser)
│   │   ├── GuessForm.tsx       ← EXTEND: wire up submission with trim/empty validation
│   │   ├── Scoreboard.tsx      ← EXTEND: render participant scores from snapshot
│   │   └── ResultPanel.tsx     ← EXTEND: render guess history from snapshot
│   ├── pages/
│   │   └── GamePage.tsx        ← EXTEND: add polling loop, integrate DrawingCanvas, wire Scoreboard/ResultPanel
│   └── services/
│       └── api.ts              ← add addStroke, clearStrokes, submitGuess API calls
```

**Structure Decision**: Web application (Option 2). Backend and frontend are already
separate packages under `backend/` and `frontend/`. All new files follow the existing
conventions in those packages.

## Complexity Tracking

No constitution violations. No complexity justification required.
