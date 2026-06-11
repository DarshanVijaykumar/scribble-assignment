# Implementation Plan: Game End and Results Screen

**Branch**: `004-game-end-results` | **Date**: 2026-06-11 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/004-game-end-results/spec.md`

## Summary

Extend the game loop to transition into a `"results"` state when a correct guess is submitted.
All players see a results screen showing the revealed word, final scores, and complete guess
history. The host can restart, which resets round state and returns everyone to the lobby while
preserving the player list. State is distributed via the existing ~2-second HTTP polling cycle.
One new endpoint (`POST /:code/restart`) and one new `RoomStatus` value (`"results"`) are the
primary additions.

## Technical Context

**Language/Version**: TypeScript 5.6.3 / Node.js 18+ (backend), TypeScript 5.6.3 / React 18
(frontend) — same as Scenarios 1–3.

**Primary Dependencies**: Express 4 + Zod 3 (backend), React + React Router 6 + Vite 5
(frontend). No new top-level dependencies added.

**Storage**: In-memory Map (existing `roomStore.ts`). No persistence.

**Testing**: Vitest 3 — both backend and frontend (existing test infrastructure).

**Target Platform**: Local development server; Chrome/Firefox with two tabs.

**Project Type**: Web application — backend REST API + React SPA.

**Performance Goals**: Results screen visible within 2-second polling lag after correct guess.
Restart response ≤ 200ms server processing time (in-memory operations).

**Constraints**: HTTP polling only — no WebSockets or SSE. In-memory state only. No new
top-level npm dependencies.

**Scale/Scope**: Single active room during manual testing; up to ~5 concurrent players per
room as intended by the assignment.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Brownfield Discipline | ✅ PASS | All changes extend existing scaffold files. `GamePage` gains a conditional results block; no rewrites. |
| II. Spec-First | ✅ PASS | spec.md committed and validated before any code. |
| III. Deterministic Rules | ✅ PASS | Scoring unchanged (+100/0). Round end triggered by correct guess (deterministic). Restart resets all scores to exactly 0. |
| IV. Polling Only | ✅ PASS | Results state delivered via existing `GET /rooms/:code` polling. No WebSocket or SSE introduced. |
| V. Validated Inputs | ✅ PASS | `restartRoomSchema` validates `participantId`. Host check enforced on both client (button hidden) and server (403). |

**Post-design re-check**: All principles still hold after data-model and contracts design.
No complexity violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/004-game-end-results/
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
│   │   └── game.ts          ← extend RoomStatus: add "results" value
│   ├── services/
│   │   └── roomStore.ts     ← submitGuess: set status="results" on correct guess
│   │                           add restartRoom function
│   │                           toRoomSnapshot: reveal secretWord when status="results"
│   ├── api/
│   │   ├── schemas.ts       ← add restartRoomSchema
│   │   └── rooms.ts         ← add POST /:code/restart route

frontend/
├── src/
│   ├── services/
│   │   └── api.ts           ← extend RoomSnapshot.status type; add restartRoom API call
│   ├── state/
│   │   └── roomStore.ts     ← add restartRoom method to RoomStore class
│   └── pages/
│       └── GamePage.tsx     ← add conditional results view block;
│                               navigate to /lobby when status changes to "lobby"
```

**Structure Decision**: Web application (Option 2). All new code follows the existing
`backend/` + `frontend/` conventions established in Scenarios 1–3.

## Complexity Tracking

No constitution violations. No complexity justification required.
