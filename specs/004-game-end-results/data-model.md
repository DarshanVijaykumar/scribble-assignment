# Data Model: Game End and Results Screen

**Feature**: 004-game-end-results | **Date**: 2026-06-11

## State Machine

```
lobby ──(host starts)──► active ──(correct guess)──► results ──(host restarts)──► lobby
```

The `"results"` state is the only new node. All three transitions already have (or will have) a
dedicated server action.

---

## Changes to Existing Types

### `RoomStatus` (backend: `models/game.ts`, frontend: `services/api.ts`)

```typescript
// Before
export type RoomStatus = "lobby" | "active";

// After
export type RoomStatus = "lobby" | "active" | "results";
```

No other type changes are required. `Room`, `RoomSnapshot`, `Participant`, `GuessEntry`, and
`Stroke` are **unchanged**.

---

## `RoomSnapshot` — Results State Payload

When `status === "results"`, the snapshot returned by `GET /rooms/:code` has these additional
characteristics vs. the `"active"` state:

| Field | Active | Results |
|-------|--------|---------|
| `secretWord` | Present for drawer only | Present for **all** participants |
| `status` | `"active"` | `"results"` |
| `participants[].score` | Live scores | Final scores for the completed round |
| `guesses` | Partial / in-progress | Complete guess history for the round |
| `strokes` | Live canvas strokes | Final strokes (read-only; no new strokes accepted) |

---

## New Backend Function: `restartRoom`

```typescript
function restartRoom(code: string, participantId: string):
  | null                          // room not found
  | { error: "forbidden" }        // caller is not the host
  | { error: "invalidStatus" }    // room is not in "results" state
  | { snapshot: RoomSnapshot }    // success — room is now "lobby"
```

**Mutations performed** (all in one synchronous save):
- `room.status = "lobby"`
- `room.strokes = []`
- `room.guesses = []`
- `room.secretWord = undefined`
- `room.drawerId = undefined`
- `for (const p of room.participants) p.score = 0`

**Preserved**: `room.code`, `room.hostId`, `room.participants` (array with names intact),
`room.createdAt`.

---

## `submitGuess` Mutation (extended)

Existing function gains one additional mutation on a correct guess:

```
if (correct) {
  participant.score += 100;
  room.status = "results";   // ← NEW
}
```

No new parameters or return-value changes.

---

## Validation Rules

| Rule | Where enforced |
|------|----------------|
| Restart caller must match `room.hostId` | `restartRoom` + `POST /:code/restart` route |
| Restart only valid when `status === "results"` | `restartRoom` |
| `participantId` must be non-empty string | Zod `restartRoomSchema` |
| No strokes or guesses accepted when `status === "results"` | Existing route guards (`status !== "active"`) already block these |
