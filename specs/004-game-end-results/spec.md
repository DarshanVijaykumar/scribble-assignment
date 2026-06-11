# Feature Specification: Game End and Results Screen

**Feature Branch**: `004-game-end-results`

**Created**: 2026-06-11

**Status**: Draft

**Input**: User description: "Implement Scenario 4. Show final scores. Reveal correct word. Show complete guess history. Host can restart. Preserve players. Reset all round state. Return everyone to the lobby."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Results After Round Ends (Priority: P1)

When a round ends (a correct guess is submitted), all players in the room are
automatically shown a results screen. The screen reveals the correct word, displays
each player's final score, and lists every guess that was submitted during the round
in chronological order.

**Why this priority**: This is the primary payoff of the game loop. Without a results
screen, players have no closure and no summary of what happened. Everything else in
this feature depends on reaching this screen first.

**Independent Test**: Open two browser tabs in the same room, start the game, submit
the correct word as a guess. Both tabs MUST transition to the results screen showing
the word, scores, and guess list without any extra navigation.

**Acceptance Scenarios**:

1. **Given** a game is in progress and a player submits the correct word, **When** the
   guess is accepted by the system, **Then** all players in the room (drawer and
   guessers) see the results screen within the next polling cycle (≤ 2 seconds).

2. **Given** the results screen is displayed, **When** a player reads the screen,
   **Then** the screen shows: (a) the correct word in a clearly labelled area, (b) a
   ranked or ordered list of all players with their scores, and (c) the complete list
   of guesses submitted during the round in the order they were received.

3. **Given** the results screen is displayed, **When** a player who did not guess
   correctly reads the scoreboard, **Then** their score is shown as 0 points for this
   round.

---

### User Story 2 - Host Restarts the Game (Priority: P1)

The host (the player who created the room) sees a "Play Again" button on the results
screen. When pressed, all round state is cleared—scores reset to zero, guesses cleared,
canvas cleared—and every player in the room is returned to the lobby. The player list
is preserved so players do not need to rejoin.

**Why this priority**: Without a restart mechanism, the game is single-use. This
requirement completes the full game loop and is explicitly listed in the assignment
scenario.

**Independent Test**: After reaching the results screen, the host presses "Play Again".
All browser tabs (host and non-host) transition back to the lobby screen, the player
list matches what it was before the game, and starting a new game from the lobby
proceeds with clean state.

**Acceptance Scenarios**:

1. **Given** the results screen is displayed and the current user is the host, **When**
   the host presses the "Play Again" button, **Then** the room transitions to the lobby
   state: all players are preserved, all scores are reset to zero, all guesses are
   cleared, and canvas strokes are cleared.

2. **Given** the host has pressed "Play Again", **When** a non-host player's polling
   cycle fires, **Then** that player's view transitions to the lobby screen without
   requiring any action from them.

3. **Given** the results screen is displayed and the current user is NOT the host,
   **When** the non-host player views the screen, **Then** the "Play Again" button is
   NOT visible (or is visibly disabled with a label indicating only the host can
   restart).

4. **Given** the host has restarted the game, **When** the host starts a new round
   from the lobby, **Then** the new round begins with all players at 0 points and
   no prior guesses or canvas strokes visible.

---

### User Story 3 - Non-Host Players Wait for Host Decision (Priority: P2)

Non-host players on the results screen see a clear message indicating that the host
controls when the next game begins. They can read the results but cannot trigger a
restart themselves.

**Why this priority**: Without this message, non-host players may be confused about
why nothing happens when they wait on the results screen.

**Independent Test**: Open two tabs—one host, one non-host. After reaching the results
screen, confirm the non-host tab shows a waiting indicator and no restart button.

**Acceptance Scenarios**:

1. **Given** the results screen is displayed and the current user is not the host,
   **When** the player views the screen, **Then** a message such as "Waiting for the
   host to start a new game…" is visible.

2. **Given** the results screen is displayed, **When** the host has not yet pressed
   "Play Again", **Then** non-host players remain on the results screen without being
   redirected.

---

### Edge Cases

- What happens if the host leaves the room while others are on the results screen?
  Players remain on the results screen; no automatic promotion of a new host is
  required for this scenario (out of scope per constitution).
- What if a player navigates away from the results screen manually? They return to
  whatever state their browser tab is in; the room state is unaffected.
- What if two guesses arrive simultaneously and both are correct? The first guess
  processed by the server wins; scoring and round-end logic is determined server-side.
- What if the room is empty when "Play Again" is triggered? The room resets to lobby
  state regardless; players who later poll will see the lobby.
- What is the guess history ordering when guesses arrive in the same polling batch?
  Guesses are ordered by server receipt time (insertion order in the guesses list).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST detect when a correct guess ends the round and transition
  the room into a "results" state visible to all players.
- **FR-002**: The results screen MUST display the correct word for the completed round.
- **FR-003**: The results screen MUST display the final score for every player in the
  room, listed in a consistent order (highest score first, then by join order for ties).
- **FR-004**: The results screen MUST display the complete guess history for the round,
  showing each guess in the order it was received, along with the player name who
  submitted it.
- **FR-005**: The results screen MUST be delivered to all players via the existing
  polling mechanism; no real-time push mechanism may be introduced.
- **FR-006**: Only the host MUST see and be able to activate the "Play Again" action
  on the results screen.
- **FR-007**: When the host triggers "Play Again", the system MUST reset all round
  state: scores for every player reset to zero, all submitted guesses cleared, all
  canvas strokes cleared.
- **FR-008**: When the host triggers "Play Again", the system MUST preserve the
  complete player list (names and host designation) and transition the room back to
  lobby state.
- **FR-009**: Non-host players MUST be automatically redirected to the lobby screen
  when the room returns to lobby state, detected via their normal polling cycle.
- **FR-010**: Non-host players on the results screen MUST see a visible message
  indicating they are waiting for the host to start the next game.
- **FR-011**: The "Play Again" button MUST NOT be visible or actionable to non-host
  players.

### Key Entities

- **Room**: Gains a `status` value of `"results"` alongside the existing `"lobby"` and
  `"playing"` states. In results state, it holds `correctWord`, `scores` (map of player
  name → score), and `guesses` (ordered list of submitted guesses).
- **Guess Entry**: Represents a single guess in the history: the submitting player's
  name, the guess text, whether it was correct, and the server receipt order.
- **Player / Participant**: Carries a `score` field (integer, non-negative) that is
  reset to zero when "Play Again" is activated.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All players see the results screen within 2 seconds of the correct guess
  being accepted (one polling cycle).
- **SC-002**: 100% of player scores, guesses, and the correct word are accurately
  reflected on the results screen with no missing or incorrect data.
- **SC-003**: The host's "Play Again" action returns all players to the lobby within
  2 seconds (one polling cycle) after the action is triggered.
- **SC-004**: After "Play Again", every player's score displayed in the lobby is 0;
  no guesses or canvas content from the previous round are visible when a new game
  starts.
- **SC-005**: The non-host waiting message is present on the results screen 100% of
  the time when the room is in results state and the viewer is not the host.

## Assumptions

- The game ends only when a correct guess is submitted; there is no timer or
  round-timeout mechanism (out of scope per constitution).
- "Preserve players" means the player list and host designation carry over; no
  re-entry flow is needed.
- Scores are per-round only. The scoreboard shown on the results screen reflects the
  single completed round; there is no cumulative multi-round leaderboard.
- The drawer's own score for the round is 0 (drawers cannot guess their own word).
- Only one game can be active per room at a time; there is no queue of pending games.
- The in-memory store is the sole source of truth; restarting the backend server
  resets all state including rooms (consistent with existing behaviour).
- Polling interval remains approximately 2 seconds, consistent with Scenarios 1–3.
- The correct word displayed on the results screen is the word that was active during
  the completed round, taken from the room's existing word field.
