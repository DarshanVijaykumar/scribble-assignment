# Research: Game Start and Drawer Flow

**Date**: 2026-06-11
**Feature**: specs/002-game-start-drawer/spec.md

## Codebase Findings

### Decision: Room model missing drawerId and secretWord
- **What was found**: `backend/src/models/game.ts` — `Room` has no `drawerId` or `secretWord`
  fields. `RoomSnapshot` equally lacks both. `startRoom()` in `roomStore.ts` already transitions
  `status` to `"active"` (from Scenario 1) but sets nothing beyond that.
- **Decision**: Add `drawerId: string` and `secretWord: string` to `Room`.
  Add `drawerId: string` and `secretWord?: string` (optional) to `RoomSnapshot` — the word is
  included only when the requesting `participantId` matches `drawerId`.
- **Rationale**: FR-003 requires drawer assignment stored server-side; FR-005/FR-006 require
  viewer-aware word delivery. Making `secretWord` optional on the snapshot type signals clearly
  that guessers receive no value for this field.
- **Alternatives considered**: A separate `/rooms/:code/word` endpoint for the drawer only —
  rejected; it adds a round-trip and complicates the polling loop. Embedding visibility in the
  existing snapshot is simpler and consistent with the existing `participantId` query parameter.

### Decision: startRoom() must assign drawer and pick word
- **What was found**: `backend/src/services/roomStore.ts` — `startRoom()` calls `saveRoom()`
  after setting `status: "active"` but does not set `drawerId` or `secretWord`. The `STARTER_WORDS`
  import is already present in the file.
- **Decision**: Extend `startRoom()` to set `room.drawerId = room.participants[0].id` (FR-001)
  and `room.secretWord = STARTER_WORDS[0]` (FR-004, always `"rocket"`).
- **Rationale**: Constitution Principle III mandates deterministic game rules. Using index 0 of
  the existing `STARTER_WORDS` constant satisfies FR-004 without any new data.
- **Alternatives considered**: Random word selection — explicitly prohibited by the constitution
  and out of scope per the spec.

### Decision: toRoomSnapshot() currently ignores viewerParticipantId
- **What was found**: `backend/src/services/roomStore.ts` line 121 —
  `toRoomSnapshot(room, viewerParticipantId)` immediately voids the second parameter
  (`void viewerParticipantId`). This was a placeholder that now must be implemented.
- **Decision**: Remove the `void` statement and use `viewerParticipantId` to conditionally
  include `secretWord`: include it if `viewerParticipantId === room.drawerId`, omit otherwise.
  Also include `drawerId` unconditionally in the snapshot so all clients can render role labels.
- **Rationale**: FR-005/FR-006 mandate server-side filtering. Clients already pass
  `participantId` as a query parameter to `GET /rooms/:code` (established in Scenario 1).
- **Alternatives considered**: Client-side filtering — rejected; it would require sending the
  word to all clients and trusting the client to hide it, which violates FR-006.

### Decision: startRoom() must pass participantId to toRoomSnapshot
- **What was found**: `backend/src/services/roomStore.ts` line 118 — `startRoom()` calls
  `toRoomSnapshot(getRoom(code)!)` without a `viewerParticipantId`. After the fix above, the
  host (who is always a participant, never the drawer) would not receive `secretWord` in the
  start response. This is correct — the host may or may not be the drawer.
- **Decision**: Pass the caller's `participantId` to `toRoomSnapshot` in `startRoom()`:
  `toRoomSnapshot(room, participantId)`. The host receives the word only if they are also the
  drawer (i.e., they are `participants[0]`).
- **Rationale**: Consistent application of the visibility rule across all snapshot calls.
- **Alternatives considered**: Always sending the word in the start response — rejected,
  inconsistent with the filtering contract.

### Decision: GamePage needs drawer/word UI
- **What was found**: `frontend/src/pages/GamePage.tsx` — already reads `room` and
  `participantId` from `useRoomState()`. Has a "Player Info" card and a canvas placeholder.
  No role label or word display exists.
- **Decision**: Derive `isDrawer = participantId === room.drawerId` from snapshot state.
  Render "Drawer" or "Guesser" in the Player Info card. Render `room.secretWord` (if present)
  for the drawer, or a placeholder (e.g., `"???"`) for guessers in a "Secret Word" area.
  No new API call or state shape change is needed — data arrives via the existing snapshot.
- **Rationale**: `room.drawerId` is now in the snapshot (unconditional); `room.secretWord` is
  present only for the drawer. The GamePage can therefore derive everything from existing state.
- **Alternatives considered**: A dedicated "my role" endpoint — rejected; redundant given
  the viewer-aware snapshot already carries the necessary fields.

### Decision: Frontend RoomSnapshot type must be extended
- **What was found**: `frontend/src/services/api.ts` — `RoomSnapshot` interface has no
  `drawerId` or `secretWord` fields. TypeScript will reject any access to these fields until
  the type is updated.
- **Decision**: Add `drawerId?: string` and `secretWord?: string` to the frontend
  `RoomSnapshot` interface. Both are optional because lobby-phase snapshots precede game start
  and will not carry these fields.
- **Rationale**: Optional fields correctly model the lifecycle: absent in lobby, present once
  `status === "active"`.
- **Alternatives considered**: Non-optional with null defaults — possible but adds noise to
  lobby rendering code that never uses these fields.
