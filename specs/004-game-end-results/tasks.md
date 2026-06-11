# Tasks: Game End and Results Screen

**Input**: Design documents from `specs/004-game-end-results/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/api.md ✅

**Tests**: Not requested in spec — no test tasks generated.

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

## Path Conventions

Web app: `backend/src/`, `frontend/src/`

---

## Phase 1: Setup

No new project initialization required — this is a brownfield extension of the existing scaffold.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend the `RoomStatus` type union in both packages. All user stories depend on
the `"results"` value existing before any business logic is written.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T001 [P] Add `"results"` to the `RoomStatus` type union in `backend/src/models/game.ts`
- [x] T002 [P] Add `"results"` to the `status` field of `RoomSnapshot` interface in `frontend/src/services/api.ts`

**Checkpoint**: Both packages compile with the new status value. All downstream branching on
`status === "results"` is now type-safe.

---

## Phase 3: User Story 1 — View Results After Round Ends (Priority: P1) 🎯 MVP

**Goal**: When a correct guess is submitted the room transitions to `"results"` state and all
players see a results screen showing the correct word, final scores, and complete guess history
within one polling cycle.

**Independent Test**: Open two tabs, start a game, submit the correct word (`rocket`). Both
tabs must transition to the results view within 2 seconds and display the word, scores, and
guess history accurately. (See `quickstart.md` Scenario A.)

### Implementation for User Story 1

- [x] T003 [P] [US1] Extend `submitGuess` in `backend/src/services/roomStore.ts` to set `room.status = "results"` immediately after awarding 100 points on a correct guess (before `saveRoom`)
- [x] T004 [US1] Extend `toRoomSnapshot` in `backend/src/services/roomStore.ts` to include `secretWord` for all participants (not just the drawer) when `room.status === "results"`
- [x] T005 [P] [US1] Add a conditional results view block in `frontend/src/pages/GamePage.tsx` that renders when `snapshot.status === "results"`: display the revealed word (`room.secretWord`), the `<Scoreboard>` component, and the `<ResultPanel>` component; replace the game layout entirely

**Checkpoint**: User Story 1 is fully functional. Both browser tabs show the results screen
with correct data after a successful guess. The canvas and guess form are no longer visible
in results state.

---

## Phase 4: User Story 2 — Host Restarts the Game (Priority: P1)

**Goal**: The host sees a "Play Again" button on the results screen. Pressing it resets all
round state, preserves the player list, and returns every player to the lobby within one
polling cycle.

**Independent Test**: After reaching results, the host clicks Play Again. Both tabs navigate
to the lobby. Player list is intact. Starting a new game shows 0 scores and an empty canvas.
(See `quickstart.md` Scenarios B, C, D.)

### Implementation for User Story 2

- [x] T006 [P] [US2] Add `restartRoomSchema` (Zod object with `participantId: string.min(1)`) to `backend/src/api/schemas.ts`
- [x] T007 [P] [US2] Add `restartRoom(code, participantId)` function to `backend/src/services/roomStore.ts`: validate host, validate `status === "results"`, reset scores/strokes/guesses/secretWord/drawerId, set `status = "lobby"`, call `saveRoom`; return `null` (not found), `{ error: "forbidden" }`, `{ error: "invalidStatus" }`, or `{ snapshot }` (success)
- [x] T008 [US2] Add `POST /:code/restart` route to `backend/src/api/rooms.ts`: parse params with `roomCodeParamsSchema`, parse body with `restartRoomSchema`, call `restartRoom`; respond 404/403/400/200 per `contracts/api.md`
- [x] T009 [P] [US2] Add `restartRoom(code, participantId)` call to the `api` object in `frontend/src/services/api.ts`: `POST /rooms/:code/restart` with `{ participantId }` body, returns `{ room: RoomSnapshot }`
- [x] T010 [P] [US2] Add `restartRoom()` method to the `RoomStore` class in `frontend/src/state/roomStore.ts`: call `api.restartRoom` with current room code and participantId, call `setRoomSnapshot` on success
- [x] T011 [US2] Update the results view block in `frontend/src/pages/GamePage.tsx`: show a "Play Again" button only when `participantId === room.hostId`; wire click handler to `roomStore.restartRoom()`; add a `useEffect` that calls `navigate("/lobby")` when `snapshot.status` transitions to `"lobby"`

**Checkpoint**: User Stories 1 and 2 are both functional. Host-triggered restart returns all
players to the lobby with clean state. Non-host players are redirected automatically via polling.

---

## Phase 5: User Story 3 — Non-Host Players Wait for Host Decision (Priority: P2)

**Goal**: Non-host players on the results screen see a visible "Waiting for the host to start
a new game…" message. The Play Again button is absent for them.

**Independent Test**: On the non-host tab at the results screen, confirm the Play Again button
is absent and the waiting message is present. (See `quickstart.md` Scenario B.)

### Implementation for User Story 3

- [x] T012 [US3] Add a "Waiting for the host to start a new game…" paragraph to the results view block in `frontend/src/pages/GamePage.tsx`, rendered only when `participantId !== room.hostId`; confirm the Play Again button conditional from T011 correctly hides it for non-hosts

**Checkpoint**: All three user stories are independently functional and testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Type-safety verification and end-to-end manual validation.

- [x] T013 [P] Verify TypeScript compilation passes with no errors: `cd backend && npm run build`
- [x] T014 [P] Verify TypeScript compilation passes with no errors: `cd frontend && npm run build`
- [ ] T015 Run all four manual validation scenarios in `specs/004-game-end-results/quickstart.md` (Scenarios A, B, C, D) and confirm each expected outcome is met

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — start immediately
- **US1 (Phase 3)**: Depends on Phase 2 (needs `"results"` type value)
- **US2 (Phase 4)**: Depends on Phase 3 (restart button lives inside the results view block from T005/T011)
- **US3 (Phase 5)**: Depends on Phase 4 (waiting message is added to the same results view block as the Play Again button)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational — no dependency on US2 or US3
- **US2 (P1)**: Backend tasks (T006–T008) are independent of US1 and can start in parallel after Foundational; frontend tasks (T009–T011) depend on T005 (results view block) existing
- **US3 (P2)**: Depends on T011 (Play Again button) to be present for the toggle to make sense

### Within Each User Story

- T004 depends on T003 (same file; T003 sets up the results transition, T004 adds secretWord reveal)
- T008 depends on T006 and T007 (route imports both schema and service function)
- T010 depends on T009 (roomStore method calls `api.restartRoom`)
- T011 depends on T005 (results view block must exist), T009, and T010

### Parallel Opportunities

- T001 and T002 can run in parallel (different packages, different files)
- T003 and T005 can run in parallel (different packages, different files)
- T006 and T007 can run in parallel (different files in the same package)
- T006/T007 and T009 can run in parallel (different packages)

---

## Parallel Example: User Story 2

```text
# Backend and frontend foundational work can run in parallel:
Task T006: Add restartRoomSchema to backend/src/api/schemas.ts
Task T007: Add restartRoom to backend/src/services/roomStore.ts
Task T009: Add restartRoom API call to frontend/src/services/api.ts

# Then sequentially:
Task T008: Wire POST /:code/restart route (depends on T006, T007)
Task T010: Add RoomStore.restartRoom method (depends on T009)
Task T011: Update GamePage results view with Play Again + navigation (depends on T005, T010)
```

---

## Implementation Strategy

### MVP First (User Stories 1 and 2 Only)

1. Complete Phase 2: Foundational (T001–T002)
2. Complete Phase 3: User Story 1 (T003–T005)
3. **STOP and VALIDATE**: Correct guess → results screen appears for all players
4. Complete Phase 4: User Story 2 (T006–T011)
5. **STOP and VALIDATE**: Host restarts → all players return to lobby with clean state
6. Complete Phase 5: User Story 3 (T012)
7. Complete Phase 6: Polish (T013–T015)

### Incremental Delivery

1. Foundation (T001–T002) → type-safe status union
2. Add US1 (T003–T005) → round ends, results visible ✅
3. Add US2 (T006–T011) → host can restart, lobby returns ✅
4. Add US3 (T012) → non-host sees waiting message ✅
5. Polish (T013–T015) → builds pass, manual validation complete ✅

---

## Notes

- [P] tasks = different files, no shared in-progress dependencies
- [Story] label maps each task to its user story for traceability
- T003 and T004 are sequential in the same file — complete T003 before T004
- T011 is the most complex task: it adds the Play Again button, the host conditional, AND the lobby-redirect `useEffect` — all in one `GamePage` edit
- No test tasks generated (not requested in spec); quickstart.md Scenarios A–D serve as the manual acceptance test suite
- Constitution Principle III requires scores reset to exactly 0 in `restartRoom` — verify this explicitly in Scenario D
