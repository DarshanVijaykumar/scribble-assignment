# Research: Room Setup and Lobby

**Date**: 2026-06-10
**Feature**: specs/001-room-setup-lobby/spec.md

## Codebase Findings

### Decision: Backend data model gaps
- **What was found**: `backend/src/models/game.ts` — `Room` has no `hostId` field; `RoomStatus`
  is typed as `"lobby"` only (no `"active"` state); `Participant` has no role field.
- **Decision**: Add `hostId: string` to `Room` and `RoomSnapshot`; add `"active"` to `RoomStatus`
  (needed by `POST /rooms/:code/start`).
- **Rationale**: The spec requires host-only controls and a start-game transition. Without `hostId`
  on the snapshot the frontend cannot determine which participant is the host.
- **Alternatives considered**: Passing host status as a separate query-string param — rejected,
  it creates a trust boundary issue (anyone could claim host).

### Decision: Backend validation gap
- **What was found**: `backend/src/api/schemas.ts` — both `createRoomSchema` and `joinRoomSchema`
  use `z.string().optional()`. Empty strings and whitespace-only names are accepted silently;
  the `displayName()` helper falls back to `"Player"` instead of rejecting the input.
- **Decision**: Replace with `z.string().trim().min(1, "Player name is required")` in both schemas
  to enforce FR-005 on the server side.
- **Rationale**: Constitution Principle V requires validation at every boundary; server-side
  enforcement is mandatory even if the frontend also validates.
- **Alternatives considered**: Keeping the optional fallback — rejected, it silently hides bad
  data and violates the constitution.

### Decision: Missing start-game endpoint
- **What was found**: `backend/src/api/rooms.ts` — no `POST /rooms/:code/start` route exists.
  `backend/src/services/roomStore.ts` has no `startRoom` function.
- **Decision**: Add `startRoom(code)` to roomStore and wire `POST /rooms/:code/start` in the
  router. The endpoint sets `status: "active"` and returns the updated snapshot.
- **Rationale**: FR-010 requires a server-side status transition so all polling clients observe
  the change without client-to-client coordination.
- **Alternatives considered**: Client-side only transition — rejected, state would desync across
  tabs.

### Decision: Frontend polling gap
- **What was found**: `frontend/src/pages/LobbyPage.tsx` — has a manual "Refresh Room" button
  calling `roomStore.fetchRoom()`. No `setInterval` or polling is implemented.
  `frontend/src/state/roomStore.ts` — `fetchRoom()` exists and is ready to be called on a
  timer.
- **Decision**: Add a `useEffect` in `LobbyPage` that starts a 2-second `setInterval` calling
  `fetchRoom()` on mount and clears it on unmount via the cleanup return.
- **Rationale**: FR-006 and FR-007 require automatic polling that stops when the player leaves.
  The existing `fetchRoom()` method already handles the API call — only the interval wrapper
  is missing.
- **Alternatives considered**: Moving polling into the store — possible but mixes lifecycle
  concerns with data concerns; component-level `useEffect` is the idiomatic React approach
  and keeps the store transport-agnostic.

### Decision: Frontend host tracking gap
- **What was found**: `frontend/src/state/roomStore.ts` — `RoomState` has no `hostId` field;
  `RoomSnapshot` in `frontend/src/services/api.ts` has no `hostId` field.
  `LobbyPage.tsx` — "Start Game" button is always visible and enabled, navigates directly to
  `/game` without any server call.
- **Decision**: Add `hostId` to the `RoomSnapshot` type and propagate it through `RoomState`.
  Gate the "Start Game" button on `state.participantId === state.room.hostId && participants.length >= 2`.
  Wire the button to a new `startGame()` store method that calls `POST /rooms/:code/start`.
- **Rationale**: FR-008 and FR-009 require host-only and minimum-player enforcement. Without
  these checks any guest can start the game or do so with 0 players.
- **Alternatives considered**: Hard-coding the first participant as host client-side — rejected,
  the server is the source of truth (constitution Principle IV / brownfield discipline).

### Decision: API base URL bug
- **What was found**: `frontend/src/services/api.ts` line 22 — `API_BASE_URL` defaults to
  `"http://localhost:3001/bug"`. The `/bug` suffix means all requests fail in local dev unless
  `VITE_API_URL` is set.
- **Decision**: Fix the default to `"http://localhost:3001"`.
- **Rationale**: Correctness. This is a starter scaffold bug, not a feature.
- **Alternatives considered**: None — the correct URL is unambiguous.

### Decision: Game-state transition for non-host players
- **What was found**: When the host starts the game, guests are still on the Lobby screen. Since
  there are no WebSockets, guests must discover the status change via their existing poll cycle.
- **Decision**: `fetchRoom()` returns the room snapshot including `status`. When `status === "active"`
  the Lobby screen navigates to `/game`. This satisfies FR-010's "within ~2 seconds" guarantee.
- **Rationale**: Consistent with Constitution Principle IV (polling-only sync). No additional
  endpoint or mechanism is needed.
- **Alternatives considered**: A dedicated `/rooms/:code/status` endpoint — unnecessary; the
  existing GET snapshot already includes status.
