---
description: "Task list for Game Start and Drawer Flow (Scenario 2)"
---

# Tasks: Game Start and Drawer Flow

**Input**: Design documents from `specs/002-game-start-drawer/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/rooms-api.md ✅

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared state dependency)
- **[Story]**: Which user story this task belongs to (US1–US3)
- Exact file paths in every task description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Extend the backend type model — required by all three user stories.

- [x] T001 Add `drawerId?: string` and `secretWord?: string` to the `Room` interface in `backend/src/models/game.ts`
- [x] T002 [P] Add `drawerId?: string` and `secretWord?: string` to the `RoomSnapshot` interface in `backend/src/models/game.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Wire drawer assignment and word selection into `startRoom()`, and activate the viewer filter in `toRoomSnapshot()`. All three user stories depend on these two service changes.

- [x] T003 In `backend/src/services/roomStore.ts`, extend `startRoom()`: after setting `status: "active"`, also set `room.drawerId = room.participants[0].id` and `room.secretWord = STARTER_WORDS[0]` before calling `saveRoom()`
- [x] T004 In `backend/src/services/roomStore.ts`, update the `startRoom()` call to `toRoomSnapshot`: pass the caller's `participantId` as the second argument — `toRoomSnapshot(getRoom(code)!, participantId)`
- [x] T005 In `backend/src/services/roomStore.ts`, remove the `void viewerParticipantId` line from `toRoomSnapshot()` and replace the snapshot return with viewer-aware logic: always include `drawerId` (when set on the room); include `secretWord` only when `viewerParticipantId === room.drawerId`
- [x] T006 [P] Add `drawerId?: string` and `secretWord?: string` to the `RoomSnapshot` interface in `frontend/src/services/api.ts`

---

## Phase 3: US1 — Drawer Is Assigned When the Game Starts (P1)

**Story goal**: First joiner becomes the drawer; all others become guessers; drawer assignment
is observable to all players on the Game screen.

**Independent test**: Start a game with Alice (first) and Bob. Confirm Alice's Game screen shows
"Drawer" in the Player Info card, and Bob's shows "Guesser". No guessing interaction required.

- [x] T007 [US1] In `backend/src/services/roomStore.test.ts`, add a test verifying that after `startRoom()`, the returned snapshot contains `drawerId` equal to `participants[0].id`
- [x] T008 [US1] In `frontend/src/pages/GamePage.tsx`, derive `isDrawer = participantId === room.drawerId` and replace the static "Playing" status in the Player Info card with `isDrawer ? "Drawer" : "Guesser"`
- [x] T009 [US1] In `frontend/src/pages/GamePage.tsx`, add a participants role list (can be within the existing Scoreboard or a new card): for each participant, display their name with a "Drawer" badge if `participant.id === room.drawerId`, otherwise "Guesser"

---

## Phase 4: US2 — Secret Word Is Selected Deterministically (P2)

**Story goal**: Secret word is always `"rocket"` (index 0 of starter list); two independent
rooms both use the same word, confirming no randomisation.

**Independent test**: Start games in two separate rooms. Inspect the drawer's Game screen in
each — both must show `"rocket"`. Also verify via the Network tab that the backend sends the
same value every time.

- [ ] T010 [US2] In `backend/src/services/roomStore.test.ts`, add a test verifying that after `startRoom()`, the returned snapshot's `secretWord` equals `"rocket"` (i.e., `STARTER_WORDS[0]`)
- [ ] T011 [US2] In `backend/src/services/roomStore.test.ts`, add a test verifying that `toRoomSnapshot()` includes `secretWord` when called with the drawer's `participantId` and omits it when called with a non-drawer's `participantId`

---

## Phase 5: US3 — Only the Drawer Sees the Secret Word (P3)

**Story goal**: The secret word is visible only to the drawer on the Game screen. Guessers see
`"???"`. The server response for a guesser contains no `secretWord` field.

**Independent test**: Two tabs for the same active game — drawer tab shows `"rocket"`, guesser
tab shows `"???"`. Confirm via DevTools Network that the guesser's GET /rooms/:code response
has no `secretWord` property.

- [ ] T012 [US3] In `frontend/src/pages/GamePage.tsx`, add a "Secret Word" display area: render `room.secretWord` if the field is present (drawer), or render `"???"` if absent (guesser)

---

## Phase 6: Polish and Build Validation

- [ ] T013 Run `cd backend && npm run build` and fix any TypeScript errors from the model and service changes
- [ ] T014 [P] Run `cd frontend && npm run build` and fix any TypeScript errors from the type and GamePage changes
- [ ] T015 [P] Run `cd backend && npm test` and confirm all tests pass including the new drawer-assignment and word-selection tests

---

## Dependencies

```
T001, T002 (model types)         ← must complete before T003–T006

T003, T004, T005 (service)       ← must complete before T007–T012
T006 (FE types)                  ← must complete before T008, T009, T012

T007–T009 (US1)                  ← independent of US2/US3 phases

T010, T011 (US2 tests)           ← depend on T003–T005

T012 (US3 word display)          ← depends on T006 (FE type), T005 (BE filter)

T013, T014, T015 (builds/tests)  ← must run after all implementation tasks
```

## Parallel Execution Opportunities

- **T001 + T002**: Both edit the same file (run sequentially).
- **T006** can run alongside T003–T005 (different file).
- **T007 + T008 + T009**: T007 is backend tests; T008 and T009 are frontend — independent.
- **T010 + T011**: Both edit `roomStore.test.ts` — run sequentially.
- **T013 + T014 + T015** [P]: Backend build, frontend build, and test run are all independent.

## Implementation Strategy

**MVP** (minimum demonstrable increment): Phases 1–2 + T008 + T012 (T001–T006, T008, T012).
At this point the drawer sees the word, guessers see `"???"`, and the backend enforces the
filter — all three spec outcomes are satisfied with just 8 tasks.

**Full increment**: Add T007, T009–T011 (test coverage + role list for all participants),
then T013–T015 (build validation).
