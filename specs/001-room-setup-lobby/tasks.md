---
description: "Task list for Room Setup and Lobby (Scenario 1)"
---

# Tasks: Room Setup and Lobby

**Input**: Design documents from `specs/001-room-setup-lobby/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/rooms-api.md ✅

**Tests**: Included for backend units where behaviour is non-trivial (startRoom logic). Manual
end-to-end validation follows quickstart.md scenarios A–F.

**User input groupings applied**:
1 Create host model → US1 (Phase 3)
2 Validate join → US2 (Phase 4)
3 Add polling → US3 (Phase 5)
4 Add start endpoint → US4 (Phase 6)
5 Host-only UI → US4 (Phase 6)
6 Manual testing → Polish (Phase 7)

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared state dependency)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Exact file paths are included in every task description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: One-line fix that unblocks all API calls in local dev.

- [ ] T001 Fix `API_BASE_URL` default in `frontend/src/services/api.ts` — remove the trailing `/bug` so the default is `"http://localhost:3001"`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend the shared backend data model with `hostId` and `"active"` status.
All four user stories depend on these type changes.

- [ ] T002 Add `hostId: string` to the `Room` interface in `backend/src/models/game.ts`
- [ ] T003 [P] Add `hostId: string` to the `RoomSnapshot` interface in `backend/src/models/game.ts`
- [ ] T004 [P] Extend `RoomStatus` type from `"lobby"` to `"lobby" | "active"` in `backend/src/models/game.ts`

---

## Phase 3: US1 — Host Creates a Room (P1)

**Story goal**: The first player to create a room is automatically the host; the host badge is
visible in the Lobby participant list.

**Independent test**: Create a room in one tab. Confirm the Lobby shows the creator's name with a
Host badge. No second player or start action is required.

- [ ] T005 [US1] Update `createRoom()` in `backend/src/services/roomStore.ts` to capture the creator's `participant.id` and set `hostId: participant.id` on the room object
- [ ] T006 [US1] Update `toRoomSnapshot()` in `backend/src/services/roomStore.ts` to include `hostId: room.hostId` in the returned snapshot
- [ ] T007 [US1] Add `hostId: string` to the `RoomSnapshot` interface in `frontend/src/services/api.ts`
- [ ] T008 [US1] Extend the `RoomSnapshot` status type to `"lobby" | "active"` in `frontend/src/services/api.ts`
- [ ] T009 [US1] In `frontend/src/pages/LobbyPage.tsx`, display a "Host" label next to the participant whose `id` matches `room.hostId` in the participant list

---

## Phase 4: US2 — Guest Joins by Code (P2)

**Story goal**: Empty/whitespace player names and invalid/empty room codes are rejected with
clear error messages on both the frontend and backend.

**Independent test**: Attempt joining with (a) empty name, (b) whitespace-only name, (c) empty
code, (d) unknown code. Each must show a distinct error. Then join with valid inputs and confirm
arrival on the Lobby.

- [ ] T010 [US2] In `backend/src/api/schemas.ts`, change `playerName` in `createRoomSchema` to `z.string().trim().min(1, "Player name is required")`
- [ ] T011 [US2] In `backend/src/api/schemas.ts`, change `playerName` in `joinRoomSchema` to `z.string().trim().min(1, "Player name is required")`
- [ ] T012 [P] [US2] Add `startRoomSchema` to `backend/src/api/schemas.ts`: `z.object({ participantId: z.string().min(1) })` (needed by Phase 6 but safe to add here)
- [ ] T013 [US2] Add frontend validation to `frontend/src/pages/CreateRoomPage.tsx`: before calling `roomStore.createRoom()`, trim the name and show an inline error if empty
- [ ] T014 [US2] Add frontend validation to `frontend/src/pages/JoinRoomPage.tsx`: before calling `roomStore.joinRoom()`, trim the name and show an inline error if empty; also show an inline error if the room code is empty or whitespace-only after trimming
- [ ] T015 [US2] In `backend/src/services/roomStore.ts`, update `joinRoom()` to trim the `code` parameter before the `rooms.get()` lookup (complements the `.toUpperCase()` already applied in the router)

---

## Phase 5: US3 — Lobby Auto-Refreshes (P3)

**Story goal**: The participant list updates automatically every ~2 seconds while the player is
on the Lobby screen, and polling stops when they navigate away.

**Independent test**: With two Lobby tabs open, have a third tab join the room. Both existing
tabs should show the new joiner within ~2 seconds without any button press. Check the Network
tab to confirm polling starts on mount and stops on unmount.

- [ ] T016 [US3] In `frontend/src/pages/LobbyPage.tsx`, add a `useEffect` that starts `setInterval(() => { roomStore.fetchRoom(); }, 2000)` on mount and clears the interval in the cleanup return
- [ ] T017 [US3] In the same `useEffect` (or a separate one), watch `room.status`: when it transitions to `"active"`, call `navigate("/game")` — this drives guest navigation after the host starts the game

---

## Phase 6: US4 — Host Starts the Game (P4)

**Story goal**: Only the host sees an enabled Start Game button (enabled at ≥2 players). Clicking
it transitions the room to `"active"` on the server; all players reach the Game screen within
~2 seconds via their poll cycle.

**Independent test**: With exactly 2 players in the Lobby, confirm the host sees an active button
and the guest does not. Click Start Game; confirm both tabs reach the Game screen within ~2 seconds.

- [ ] T018 [US4] Add `startRoom(code: string, participantId: string)` to `backend/src/services/roomStore.ts`:
  - Return `null` if room not found
  - Return `{ error: "forbidden" as const }` if `participantId !== room.hostId`
  - Return `{ error: "conflict" as const }` if `room.participants.length < 2`
  - Otherwise set `status: "active"`, call `saveRoom()`, and return `{ snapshot: toRoomSnapshot(updatedRoom) }`
- [ ] T019 [US4] Add unit tests for `startRoom()` in `backend/src/services/roomStore.test.ts`: success case, not-host (403), insufficient players (409), room-not-found (404)
- [ ] T020 [US4] Add `router.post("/:code/start", ...)` to `backend/src/api/rooms.ts`:
  - Parse `startRoomSchema` from request body
  - Call `startRoom(code.toUpperCase(), participantId)`
  - Map `null` → 404, `"forbidden"` → 403, `"conflict"` → 409
  - On success respond `200` with `{ room: snapshot }`
- [ ] T021 [US4] Add `startRoom(code: string, participantId: string)` method to `frontend/src/services/api.ts` calling `POST /rooms/:code/start` with `{ participantId }` in the body; return type `{ room: RoomSnapshot }`
- [ ] T022 [US4] Add `startGame()` method to the `RoomStore` class in `frontend/src/state/roomStore.ts`:
  - Guard: return early if `room` or `participantId` is null
  - Call `api.startRoom(room.code, participantId)` inside `withLoading()`
  - On success call `setRoomSnapshot(response.room)`
- [ ] T023 [US4] In `frontend/src/pages/LobbyPage.tsx`, replace the current unconstrained Start Game button with logic that:
  - Shows the button **only** when `participantId === room.hostId`
  - Enables the button **only** when `room.participants.length >= 2`
  - Displays a message like "Waiting for more players…" when the host is present but count < 2
- [ ] T024 [US4] Wire the Start Game button `onClick` in `frontend/src/pages/LobbyPage.tsx` to call `roomStore.startGame()` then `navigate("/game")`

---

## Phase 7: Polish and Manual Testing

**Purpose**: Build validation and end-to-end verification against quickstart.md scenarios A–F.

- [ ] T025 Run `cd backend && npm run build` and fix any TypeScript errors introduced by the model/service changes
- [ ] T026 [P] Run `cd frontend && npm run build` and fix any TypeScript errors introduced by the type and component changes
- [ ] T027 [P] Remove the now-redundant manual "Refresh Room" button from `frontend/src/pages/LobbyPage.tsx` (polling replaces it; keeping it creates a confusing duplicate)
- [ ] T028 Manually validate all quickstart.md scenarios (A through F) using two browser tabs; document any deviation from expected outcomes

---

## Dependencies

```
T001 (fix URL bug)                    ← unblocks all FE API calls

T002, T003, T004 (model types)        ← must complete before T005, T006

T005, T006 (backend host tracking)   ← must complete before T007, T008, T009 (FE host display)

T010, T011 (BE validation)           ← must complete before T013, T014 (FE validation)

T018 (startRoom service)             ← must complete before T019 (tests), T020 (route)
T020 (start route)                   ← must complete before T021 (FE api.startRoom)
T021 (FE api.startRoom)              ← must complete before T022 (store.startGame)
T022 (store.startGame)               ← must complete before T024 (wire button)

T016 (polling)                       ← enables T017 (status watch for guest nav)

T025, T026 (builds)                  ← must pass before T028 (manual validation)
```

## Parallel Execution Opportunities

**Within Phase 2**: T002, T003, T004 — all edit the same file so run sequentially.

**Within Phase 4**: T010 and T011 edit the same file (run sequentially); T012 [P] edits a
different file section and can be done alongside T013, T014.

**Within Phase 6**: T019 [test] can be written while T020 [route] is being implemented since
they edit different files.

**Within Phase 7**: T025 and T026 [P] — backend and frontend builds are independent.

## Implementation Strategy

**MVP (minimum independently demonstrable increment)**: Complete Phases 1–3 (T001–T009).
At this point, room creation assigns a host and displays a host badge — a verifiable,
end-to-end user story.

**Next increment**: Phase 4 (T010–T015) — validation tightened on both sides.

**Next increment**: Phase 5 (T016–T017) — polling replaces manual refresh.

**Final increment**: Phase 6 (T018–T024) — start-game flow completes the scenario.
