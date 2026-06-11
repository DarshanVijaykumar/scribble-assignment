# Feature Specification: Drawing Canvas and Guess Submission

**Feature Branch**: `003-drawing-canvas-guessing`

**Created**: 2026-06-11

**Status**: Draft

**Input**: User description: "Implement Scenario 3 — interactive drawing canvas, clear canvas, guess submission, trim/reject empty guesses, case-insensitive comparison, polling sync, +100 for correct, 0 for incorrect."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Drawer Draws on the Canvas (Priority: P1)

The drawer uses a free-hand drawing tool on the Game screen to illustrate the secret word.
Strokes are rendered in real time on the drawer's own canvas. Guessers see the accumulated
drawing updated each time their polling cycle fires. The canvas is blank at game start.

**Why this priority**: The drawing canvas is the central interaction surface of the game.
Without it, guessers have nothing to react to and guess submission has no meaningful context.

**Independent Test**: Open two browser tabs — one as the drawer, one as a guesser. Draw a
shape on the drawer's tab. Confirm the guesser's tab shows the same shape within one polling
cycle (approximately 2 seconds). No guess submission is required.

**Acceptance Scenarios**:

1. **Given** a game is active and the current player is the drawer, **When** the player clicks
   and drags on the canvas, **Then** a continuous stroke is rendered at the pointer position
   in a visible colour.
2. **Given** the drawer has drawn one or more strokes, **When** a guesser's polling cycle
   completes, **Then** the guesser's canvas reflects all strokes the drawer has made up to
   that point.
3. **Given** a game has just started, **When** any player views the Game screen, **Then** the
   canvas is empty — no strokes from a previous session are visible.

---

### User Story 2 — Drawer Clears the Canvas (Priority: P2)

The drawer can reset the canvas to a blank state at any time during the round. When the
canvas is cleared, guessers see the blank canvas on their next polling cycle.

**Why this priority**: Without a clear action, the drawer has no recovery path if they make
a mistake. A clear resets state for both sides, keeping the game fair.

**Independent Test**: Open two browser tabs — drawer and guesser. Draw strokes on the
drawer's tab, then press the Clear button. Confirm the drawer's canvas becomes blank
immediately and the guesser's canvas becomes blank within one polling cycle.

**Acceptance Scenarios**:

1. **Given** the drawer has drawn at least one stroke, **When** the drawer activates the
   Clear Canvas control, **Then** the canvas on the drawer's screen becomes blank immediately.
2. **Given** the drawer has cleared the canvas, **When** the guesser's next polling cycle
   completes, **Then** the guesser's canvas is also blank.
3. **Given** the drawer clears the canvas and then draws new strokes, **When** the guesser
   polls again, **Then** only the new strokes appear — no remnants of the pre-clear drawing.

---

### User Story 3 — Guesser Submits a Guess (Priority: P1)

A guesser types a word into the guess input field and submits it. The system trims leading
and trailing whitespace, rejects empty or whitespace-only submissions with a visible error,
and compares the trimmed, case-folded guess to the secret word. A correct guess awards 100
points; an incorrect guess awards 0 points. The result (correct or incorrect) is visible
to the guesser on the Game screen.

**Why this priority**: Guess submission and scoring are the win condition of the game.
They must work correctly before the canvas drawing can be considered meaningful.

**Independent Test**: Join a game as a guesser. Submit the secret word (e.g., `ROCKET`)
in uppercase. Confirm the guess is accepted and 100 points are awarded. Then submit a wrong
word; confirm 0 points are awarded. Both results must appear without a page reload.

**Acceptance Scenarios**:

1. **Given** a guesser is on the Game screen, **When** they type a non-empty guess and
   submit, **Then** the trimmed, lowercase version of the guess is compared to the secret
   word; if it matches, 100 points are added to their score.
2. **Given** a guesser submits a word that does not match the secret word (after
   case-folding and trimming), **Then** their score does not change (0 points awarded
   for that guess).
3. **Given** a guesser submits `"  rocket  "` (padded with spaces) when the secret word is
   `rocket`, **Then** the guess is treated as correct — trimming is applied before comparison.
4. **Given** a guesser submits `"ROCKET"` or `"Rocket"` when the secret word is `rocket`,
   **Then** the guess is treated as correct — comparison is case-insensitive.
5. **Given** a guesser submits an empty string or a whitespace-only string, **When** the
   submit action is triggered, **Then** the submission is rejected with a visible error
   message; no network request is made and the score is unchanged.

---

### User Story 4 — Guess List Is Synced to All Players via Polling (Priority: P2)

All players on the Game screen see a running list of submitted guesses (including who submitted
them and whether each was correct or incorrect). This list is refreshed by the existing
polling mechanism so no player needs to reload the page to see new entries.

**Why this priority**: Shared visibility of guesses makes the game social. All players
should be aware of what has been tried, creating shared engagement.

**Independent Test**: Open three browser tabs — one drawer, two guessers. One guesser
submits a guess. Confirm the guess appears in the guess list on both guesser tabs and the
drawer's tab within one polling cycle.

**Acceptance Scenarios**:

1. **Given** a guesser submits a valid guess, **When** any player's polling cycle completes,
   **Then** the submitted guess appears in the shared guess list visible to all players.
2. **Given** multiple guesses have been submitted, **When** a player's Game screen polls,
   **Then** all guesses are shown in submission order, each labelled with the submitter's
   name and a correct/incorrect indicator.
3. **Given** the drawer is viewing the Game screen, **When** a guesser submits any guess,
   **Then** the drawer sees the guess in their list on the next poll — correct or not.

---

### Edge Cases

- **Empty guess submitted**: Trimmed to empty and rejected with a visible error before any
  network call is made. This applies on both client and server.
- **Whitespace-only guess**: `"   "` trims to `""` and is rejected the same way as a
  fully empty guess.
- **Mixed-case correct guess**: `"ROCKET"`, `"Rocket"`, `"rOcKeT"` all match `rocket`
  after case-folding — all award 100 points.
- **Duplicate correct guess by the same player**: No de-duplication rule is in scope; each
  submission is evaluated independently. A second correct guess awards another 100 points.
- **Drawer attempts to guess**: The guess input is not shown to the drawer. If the server
  receives a guess from the drawer's `participantId`, it MUST reject it with an error.
- **Canvas state on guesser refresh**: After a page reload, the guesser's canvas MUST
  re-render all existing strokes from the polled state — no strokes are lost on refresh.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Game screen MUST render an interactive canvas on which the drawer can
  draw free-hand strokes by clicking and dragging with a pointer device.
- **FR-002**: The drawer's canvas MUST be the only interactive drawing surface; the
  guesser's canvas MUST be read-only (drawing disabled).
- **FR-003**: The system MUST persist each drawing stroke server-side so it can be
  returned to polling clients.
- **FR-004**: The drawer MUST be able to clear all strokes on the canvas via a clearly
  labelled control; the clear action MUST update the server-side stroke state to empty.
- **FR-005**: Guesser clients MUST receive the current stroke list and guess list through
  the existing polling mechanism (approximately 2-second interval); no additional real-time
  channel may be introduced.
- **FR-006**: The guess input field MUST be visible only to guessers; the drawer MUST NOT
  see a guess input field on their Game screen.
- **FR-007**: Before submitting a guess, the system MUST trim leading and trailing
  whitespace from the input value.
- **FR-008**: If the trimmed guess value is empty, the submission MUST be rejected with
  a user-visible error message; no network call is made.
- **FR-009**: Guess comparison MUST be case-insensitive: both the submitted guess and the
  secret word are lower-cased before being compared.
- **FR-010**: A correct guess (trimmed, case-folded match with the secret word) MUST
  award exactly 100 points to the submitting participant's score.
- **FR-011**: An incorrect guess MUST award 0 points; the participant's score MUST NOT
  change.
- **FR-012**: The server MUST enforce FR-007 through FR-011 independently of any
  client-side validation.
- **FR-013**: The server MUST reject a guess submission from a participant whose ID
  matches the room's `drawerId`.
- **FR-014**: Each submitted guess MUST be appended to a server-side guess log for the
  room, storing at minimum: the submitter's name, the guess text (as submitted), and a
  correct/incorrect flag.
- **FR-015**: The guess log MUST be returned to all polling clients so the shared guess
  list is visible to drawer and guessers alike.
- **FR-016**: Scores MUST be stored per participant in the room's server-side state and
  returned in every room snapshot so the scoreboard reflects the current totals.

### Key Entities

- **Room** (extended from Scenario 2): Adds `strokes: Stroke[]` (ordered list of all
  drawing strokes for the round, cleared when the drawer clears the canvas) and
  `guesses: GuessEntry[]` (append-only log of all submitted guesses).
- **Stroke**: Represents a single continuous path drawn on the canvas — at minimum a
  sequence of `{x, y}` points captured during a pointer-down-to-pointer-up interaction.
- **GuessEntry**: Records one guess attempt — at minimum `participantName: string`,
  `text: string` (the as-submitted value), `correct: boolean`, and `timestamp` (for
  ordering).
- **Participant** (extended): Adds `score: number` (starts at 0 on game start, incremented
  by 100 on each correct guess).
- **RoomSnapshot** (extended): Includes `strokes`, `guesses`, and each participant's
  `score`; never includes the `secretWord` for non-drawer participants (unchanged from
  Scenario 2).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A guesser's correct submission (case-insensitive, trimmed) is reflected as
  +100 points in the scoreboard visible to all players within one polling cycle
  (≤ 2 seconds).
- **SC-002**: An empty or whitespace-only guess submission is rejected 100% of the time
  with a visible error message before any server contact — verified across all submission
  paths (button click, Enter key).
- **SC-003**: The drawer's canvas strokes appear on a guesser's canvas within one polling
  cycle of being drawn — verifiable with two browser tabs and a stopwatch.
- **SC-004**: The clear-canvas action results in a blank canvas for all players within one
  polling cycle — verified with two tabs.
- **SC-005**: All submitted guesses (correct and incorrect) appear in the shared guess list
  for all players within one polling cycle — verified with three browser tabs.
- **SC-006**: The guess input field is absent from the drawer's Game screen in 100% of
  test observations — verified by inspecting the drawer's tab after game start.

## Assumptions

- The polling interval remains approximately 2 seconds as established by Scenario 1 and
  Scenario 2; no change to the polling cadence is introduced by this scenario.
- Only one round per session is in scope. The stroke list and guess log are never rotated
  or archived; they accumulate for the lifetime of the room.
- Score initialisation (each participant starts at 0) happens at game start (Scenario 2
  transition from lobby to game). Scenario 3 only increments scores; it does not reset them.
- A "correct" guess is defined strictly as: `trim(guess).toLowerCase() === secretWord.toLowerCase()`.
  No fuzzy matching, synonym matching, or partial credit applies.
- The secret word is always `rocket` (index 0 of the starter list), as established in
  Scenario 2. Scenario 3 inherits this; no new word selection logic is introduced.
- The canvas drawing tool uses a single fixed colour and stroke width. Colour and thickness
  selection are out of scope.
- Stroke data is captured as a sequence of pointer coordinates during a drag gesture
  (pointer-down to pointer-up). Each drag gesture is one stroke entry.
- The `participantId` sent with each guess submission is trusted at face value; no
  authentication layer exists. Server-side drawer-rejection (FR-013) uses this ID.
