# Tasks: Drawing Canvas and Guess Submission

**Input**: Design documents from `specs/003-drawing-canvas-guessing/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/api.md ✅ | quickstart.md ✅

**Tests**: Not explicitly requested — no test tasks generated.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US4)

---

## Phase 1: Setup

**Purpose**: No new project infrastructure is required for this brownfield feature. The backend and frontend packages, tooling, and test runner are already configured from Scenarios 1 and 2.

*(No tasks — proceed to Phase 2)*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend the shared data model, room store, API snapshot, and frontend API client so that every user story has the types and services it needs. The GamePage polling loop is also wired here so all stories can be independently verified once their UI is in place.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T001 Add Point, Stroke, GuessEntry types; extend Participant with `score: number`; extend Room with `strokes: Stroke[]` and `guesses: GuessEntry[]` in `backend/src/models/game.ts`
- [x] T002 Extend `startRoom()` in `backend/src/services/roomStore.ts` to initialise `strokes: []`, `guesses: []`, and `score: 0` per participant when game transitions to active
- [x] T003 Add `addStroke(code, stroke)`, `clearStrokes(code)`, and `submitGuess(code, participantId, guessText)` functions to `backend/src/services/roomStore.ts` (depends on T001, T002)
- [x] T004 [P] Add Zod schemas `AddStrokeBody`, `ClearStrokesBody`, and `SubmitGuessBody` in `backend/src/api/schemas.ts`
- [x] T005 Extend `toRoomSnapshot()` / `GET /rooms/:code` handler in `backend/src/api/rooms.ts` to include `strokes`, `guesses`, and `score` per participant in the response (depends on T001)
- [x] T006 [P] Update `RoomSnapshot` type in `frontend/src/services/api.ts` to include `strokes: Stroke[]`, `guesses: GuessEntry[]`, and `score: number` per participant; add `addStroke`, `clearStrokes`, `submitGuess` API client functions
- [x] T007 Add 2-second polling loop to `frontend/src/pages/GamePage.tsx` (mirror LobbyPage pattern: `useEffect` + `setInterval` + `fetchRoom`; store snapshot in component state; stop polling on unmount)

**Checkpoint**: Foundation ready — backend types, room store functions, API contracts, frontend types, and polling are all in place. User story work can now begin.

---

## Phase 3: User Story 1 — Drawer Draws on the Canvas (Priority: P1) 🎯 MVP

**Goal**: The drawer can draw free-hand strokes on the canvas. Guessers see the accumulated drawing update within one polling cycle.

**Independent Test**: Open two browser tabs (Alice = drawer, Bob = guesser). Draw a shape on Alice's canvas. Confirm the same shape appears on Bob's canvas within ~2 seconds. No guess submission needed.

### Implementation for User Story 1

- [x] T008 [US1] Add `POST /rooms/:code/strokes` route in `backend/src/api/rooms.ts` — validate that `participantId` equals `room.drawerId` (403 otherwise), that `points` is non-empty (400 otherwise), and that room is active (400 otherwise); call `addStroke()` (depends on T003, T004, T005)
- [x] T009 [P] [US1] Create `DrawingCanvas` component in `frontend/src/components/DrawingCanvas.tsx` — accepts `strokes: Stroke[]`, `isDrawer: boolean`, and `onNewStroke: (stroke: Stroke) => void` props; uses `<canvas>` with `pointerdown`/`pointermove`/`pointerup` events when `isDrawer` is true; re-renders all strokes from props on each update (depends on T006)
- [x] T010 [US1] Integrate `DrawingCanvas` into `frontend/src/pages/GamePage.tsx` — replace the canvas placeholder with `<DrawingCanvas>`; pass `strokes` from polled snapshot; pass `isDrawer` derived from `snapshot.drawerId === participantId`; on `onNewStroke` callback call `addStroke` API and push stroke into local state immediately for snappy feedback (depends on T007, T009)

**Checkpoint**: US1 fully functional — drawer draws, guesser sees strokes within one poll cycle.

---

## Phase 4: User Story 3 — Guesser Submits a Guess (Priority: P1)

**Goal**: A guesser types a guess, which is trim-normalised, empty-rejected, and case-insensitively compared to the secret word. Correct → +100 points; incorrect → 0 points.

**Independent Test**: As Bob (guesser), type `ROCKET` and submit. Confirm 100 points appear. Type `pizza` — confirm 0 points. Type `   ` — confirm an error message and no score change. No canvas drawing needed.

### Implementation for User Story 3

- [x] T011 [US3] Add `POST /rooms/:code/guesses` route in `backend/src/api/rooms.ts` — validate room is active (400), trim input and reject if empty (400), reject if `participantId` equals `room.drawerId` (403), compare `trim(guess).toLowerCase()` to `secretWord.toLowerCase()`, increment participant score by 100 if correct, append `GuessEntry` to `room.guesses`, return `{ correct, score }` (depends on T003, T004, T005)
- [x] T012 [US3] Wire up `GuessForm` in `frontend/src/components/GuessForm.tsx` — trim input before submit; show inline error and abort if trimmed value is empty; call `submitGuess` API; display a correct/incorrect indicator from the response (depends on T006)
- [x] T013 [US3] Integrate the wired `GuessForm` into `frontend/src/pages/GamePage.tsx` — render `<GuessForm>` only when `participantId !== snapshot.drawerId`; pass `participantId`, `roomCode`, and a callback to refresh the snapshot after a guess (depends on T007, T012)

**Checkpoint**: US3 fully functional — validated guess submission, correct scoring, and drawer lock-out all work.

---

## Phase 5: User Story 2 — Drawer Clears the Canvas (Priority: P2)

**Goal**: The drawer can reset the canvas to blank at any time. Guessers see the blank canvas on their next poll.

**Independent Test**: Draw several strokes as Alice (drawer), then click Clear. Alice's canvas goes blank immediately. Bob's canvas goes blank within ~2 seconds.

### Implementation for User Story 2

- [x] T014 [US2] Add `DELETE /rooms/:code/strokes` route in `backend/src/api/rooms.ts` — validate room is active (400), validate `participantId` equals `room.drawerId` (403), call `clearStrokes()`; return `{ ok: true }` (depends on T003, T004, T005)
- [x] T015 [US2] Add a Clear button to `DrawingCanvas` in `frontend/src/components/DrawingCanvas.tsx` — accept an `onClear: () => void` prop; render the button only when `isDrawer` is true; call `onClear` on click (depends on T009)
- [x] T016 [US2] Wire up the Clear action in `frontend/src/pages/GamePage.tsx` — on `onClear` callback call `clearStrokes` API and set local strokes state to `[]` immediately for instant feedback (depends on T010, T015)

**Checkpoint**: US2 fully functional — clear syncs to all clients within one poll.

---

## Phase 6: User Story 4 — Guess List Synced to All Players (Priority: P2)

**Goal**: All players see a running log of submitted guesses (submitter name, text, correct/incorrect) updated by polling. The scoreboard shows live scores for all participants.

**Independent Test**: Open three tabs (Alice = drawer, Bob and Carol = guessers). Bob submits a guess. Confirm the guess appears in all three tabs' guess lists within ~2 seconds. Carol's tab also shows the scoreboard updating.

### Implementation for User Story 4

- [x] T017 [P] [US4] Implement `ResultPanel` in `frontend/src/components/ResultPanel.tsx` — accept `guesses: GuessEntry[]` prop; render each entry as a list row showing submitter name, guess text, and a correct/incorrect indicator; most recent entry at the top (depends on T006)
- [x] T018 [P] [US4] Implement `Scoreboard` in `frontend/src/components/Scoreboard.tsx` — accept `participants: ParticipantSnapshot[]` prop; render each participant's name and score; sort by score descending (depends on T006)
- [x] T019 [US4] Integrate `ResultPanel` and `Scoreboard` into `frontend/src/pages/GamePage.tsx` — pass `snapshot.guesses` to `<ResultPanel>` and `snapshot.participants` to `<Scoreboard>`; both update automatically with the polling cycle (depends on T007, T017, T018)

**Checkpoint**: All four user stories are fully functional and independently testable.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verify builds, tests, and end-to-end quickstart scenarios pass before marking the feature complete.

- [x] T020 Run `npm run build` in `backend/` and verify it compiles without TypeScript errors
- [x] T021 [P] Run `npm run build` in `frontend/` and verify it compiles without TypeScript errors
- [x] T022 [P] Run `npm test` in `backend/` and verify all existing tests still pass (no regressions in roomStore or schema tests)
- [x] T023 [P] Run `npm test` in `frontend/` and verify all existing tests still pass
- [x] T024 Run through all scenarios in `quickstart.md` (S3-A through S3-J) with two browser tabs to confirm end-to-end acceptance criteria are met

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No prior phase — can start immediately. BLOCKS all user stories.
- **US1 (Phase 3)**: Depends on Phase 2 completion. No dependency on US2/US3/US4.
- **US3 (Phase 4)**: Depends on Phase 2 completion. No dependency on US1/US2/US4.
- **US2 (Phase 5)**: Depends on Phase 2 + T009 (`DrawingCanvas` component) from US1.
- **US4 (Phase 6)**: Depends on Phase 2. T019 also depends on T007 (polling already in place).
- **Polish (Phase 7)**: Depends on all desired user stories complete.

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2. Independent of US3/US4.
- **US3 (P1)**: Starts after Phase 2. Independent of US1/US4.
- **US2 (P2)**: Starts after Phase 2 + T009 (needs `DrawingCanvas` to add Clear button).
- **US4 (P2)**: Starts after Phase 2 (ResultPanel and Scoreboard are standalone components).

### Within Each User Story

- Backend route → depends on roomStore function (T003) and Zod schema (T004) being in place
- Frontend component → depends on updated API types (T006)
- GamePage integration → depends on polling (T007) and component being created

### Parallel Opportunities

- T004 (Zod schemas) and T006 (frontend API types/functions) can run in parallel after T001
- T009 (DrawingCanvas component) can be built in parallel with T008 (backend POST /strokes route) after T006/T003
- T017 (ResultPanel) and T018 (Scoreboard) are fully independent and can run in parallel
- T020–T023 (build + test verification) can all run in parallel

---

## Parallel Example: Phase 2 (Foundational)

```
# T001 must run first (defines types), then:
Parallel: T002 (roomStore startRoom), T004 (Zod schemas), T006 (frontend types)
Sequential: T003 after T002, T005 after T003/T004, T007 after T005/T006
```

## Parallel Example: User Story 1

```
Parallel after T006/T003:
  Task T008: POST /rooms/:code/strokes backend route (backend/src/api/rooms.ts)
  Task T009: DrawingCanvas component (frontend/src/components/DrawingCanvas.tsx)
Sequential: T010 after T008 and T009
```

## Parallel Example: User Story 4

```
Parallel after T006:
  Task T017: ResultPanel component (frontend/src/components/ResultPanel.tsx)
  Task T018: Scoreboard component (frontend/src/components/Scoreboard.tsx)
Sequential: T019 after T017, T018, T007
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 3 — both P1)

1. Complete Phase 2: Foundational (T001–T007)
2. Complete Phase 3: US1 — drawing canvas (T008–T010)
3. Complete Phase 4: US3 — guess submission (T011–T013)
4. **STOP and VALIDATE**: Two-tab test: draw → guess → confirm +100 / 0 scoring
5. Demo the core game loop

### Incremental Delivery

1. Phase 2 complete → foundation ready
2. Add US1 → drawing syncs across tabs ✓
3. Add US3 → guess submission + scoring works ✓
4. Add US2 → canvas clear syncs ✓
5. Add US4 → full guess log + scoreboard visible to all ✓
6. Polish → builds clean, tests pass, quickstart validated ✓

### Parallel Team Strategy

With two developers after Phase 2:
- **Developer A**: US1 (T008–T010) then US2 (T014–T016)
- **Developer B**: US3 (T011–T013) then US4 (T017–T019)

---

## Notes

- [P] tasks touch different files — safe to run concurrently
- [Story] label maps each task to a specific user story for spec traceability
- Commit after each task or logical group (constitution Principle I)
- The `DrawingCanvas` component (T009) is the most complex new piece — build it standalone first, then integrate (T010)
- `GuessForm` already exists as a stub — T012 extends it, does not replace it
- `ResultPanel` and `Scoreboard` already exist as stubs — T017/T018 extend them
- Constitution Principle III: `trim(guess).toLowerCase() === secretWord.toLowerCase()` is the exact comparison — no fuzzy matching
- Constitution Principle IV: polling already in LobbyPage — copy that exact pattern for GamePage (T007)
