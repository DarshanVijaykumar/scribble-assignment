# Research: Game End and Results Screen

**Feature**: 004-game-end-results | **Date**: 2026-06-11

## Decision Log

---

### 1. Room Status Model — Add `"results"` State

**Decision**: Extend `RoomStatus` to `"lobby" | "active" | "results"`.

**Rationale**: The results screen is a distinct phase with its own rules (secretWord visible to all,
Play Again button active). Using a dedicated status value keeps the state machine explicit and allows
`GET /rooms/:code` polling to return the correct phase without additional flags. Adding a separate
`roundEnded` boolean alongside `"active"` would be an implicit state; a named status is clearer.

**Alternatives considered**:
- Keep `"active"` status and add a `roundEnded: boolean` flag — rejected; implicit sub-states
  complicate every place that already branches on `status`.
- Use a new `results` top-level object inside `Room` — over-engineered for a single assignment round.

---

### 2. Game-End Trigger — `submitGuess` Transitions to `"results"`

**Decision**: `submitGuess` in `roomStore.ts` sets `room.status = "results"` immediately when a
correct guess is stored, before saving.

**Rationale**: Server is authoritative (constitution Principle III); transitioning synchronously in
the same operation ensures atomicity. All subsequent polling by any tab will immediately see
`status: "results"`.

**Alternatives considered**:
- Separate `POST /:code/end-round` endpoint called by the guesser on correct answer — introduces a
  second round-trip and a race condition if the frontend crashes before calling it.
- Timer-based round end — out of scope per constitution; no timers allowed.

---

### 3. Results Rendering — Conditional View Inside `GamePage`

**Decision**: `GamePage.tsx` conditionally renders a Results view when `snapshot.status === "results"`.
No new page component or route is added.

**Rationale**: Brownfield discipline (Principle I) says to extend existing scaffold without rewriting.
`GamePage` already owns the game polling loop and snapshot state. Introducing a new `ResultsPage` with
its own route would require routing changes and duplicating the polling setup. A conditional render
block inside `GamePage` is the minimal, traceable change.

**Alternatives considered**:
- New `ResultsPage.tsx` + `/results` route — cleaner long-term but unnecessary scope increase for a
  single-round assignment.
- Redirect to `LobbyPage` immediately — no results would ever be shown; contradicts the entire feature.

---

### 4. Secret Word Visibility in Results State

**Decision**: `toRoomSnapshot` reveals `secretWord` to **all** participants (not just the drawer)
when `room.status === "results"`.

**Rationale**: The spec requires "Reveal correct word" for all players (FR-002). The existing
`toRoomSnapshot` hides `secretWord` from non-drawers using `isDrawer` guard. We extend that guard
to also reveal when `status === "results"`.

**Alternatives considered**:
- Add a separate `correctWord` field to `RoomSnapshot` only present in results state — redundant
  duplication; `secretWord` already holds the word.

---

### 5. Restart Endpoint — `POST /:code/restart`

**Decision**: New endpoint `POST /:code/restart` with body `{ participantId }`. Validates host,
resets scores to 0, clears strokes and guesses, sets `status = "lobby"`, preserves players.

**Rationale**: Follows the same host-only pattern as `POST /:code/start`. Reusing `startRoom`
was considered but rejected — `startRoom` also sets `drawerId` and `secretWord` (game setup),
which `restart` must not do (only lobby reset is in scope).

**Alternatives considered**:
- Reuse `startRoom` to both reset and start a new game in one shot — conflates "return to lobby"
  with "start game"; violates separation of concerns and breaks the two-step lobby flow.
- Client-side reset — backend is authoritative; all state lives server-side (constitution Principle IV).

---

### 6. Polling Redirect — `GamePage` Navigates to Lobby on Status Change

**Decision**: `GamePage`'s polling `useEffect` watches `snapshot.status` and calls
`navigate("/lobby")` when it transitions to `"lobby"` (i.e., after restart).

**Rationale**: `LobbyPage` already does the same pattern for `"active"` → navigate to `/game`.
Mirroring it in `GamePage` for `"results"` → `"lobby"` is consistent and requires no new machinery.

**Alternatives considered**:
- Separate `useEffect` in a Results sub-component — same logic, more layers; rejected for simplicity.

---

## Gap Analysis vs. Existing Scaffold

| Gap | Current State | Required Change |
|-----|---------------|-----------------|
| `RoomStatus` missing `"results"` | `"lobby" \| "active"` | Add `"results"` to union type (both models) |
| `submitGuess` doesn't end round | Awards points, stores guess, stays `"active"` | Add `room.status = "results"` on correct guess |
| No restart function | — | Add `restartRoom(code, participantId)` to roomStore |
| No `POST /:code/restart` route | — | Add route to rooms.ts |
| `toRoomSnapshot` hides secretWord | Drawer-only | Reveal when `status === "results"` |
| `GamePage` doesn't handle results state | Only renders game UI | Add conditional results view block |
| `api.ts` missing restartRoom call | — | Add `restartRoom` to api object |
| `roomStore.ts` (frontend) missing restartRoom | — | Add `restartRoom` to `RoomStore` class |
