# Feature Specification: Game Start and Drawer Flow

**Feature Branch**: `002-game-start-drawer`

**Created**: 2026-06-11

**Status**: Draft

**Input**: User description: "Implement Scenario 2 — game start, drawer assignment, secret word visibility"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Drawer Is Assigned When the Game Starts (Priority: P1)

When the host starts a game with at least 2 players, the first player in the room's participant
list is automatically assigned the drawer role for the round. All other players are guessers.
This assignment is visible to every player on the Game screen.

**Why this priority**: Drawer assignment is the prerequisite for every other game mechanic.
Without it, neither word selection nor guess validation can proceed.

**Independent Test**: Start a game with two players. Confirm the first player to have joined
is labelled "Drawer" on the Game screen and all other players are labelled "Guesser." No
interaction beyond starting the game is required.

**Acceptance Scenarios**:

1. **Given** a room with at least 2 participants in lobby status, **When** the host starts the
   game, **Then** the participant who joined first (index 0 in the participant list) is assigned
   the drawer role; all remaining participants are assigned the guesser role.
2. **Given** the game has started, **When** any player views the Game screen, **Then** the
   drawer's name is clearly labelled as "Drawer" and every other participant is labelled "Guesser."
3. **Given** a room created with players Alice (first) and Bob (second), **When** the game
   starts, **Then** Alice is the drawer regardless of join order relative to host status.

---

### User Story 2 — Secret Word Is Selected Deterministically (Priority: P2)

When a game starts, the system selects the secret word for the round using the first entry of
the starter word list (`rocket`). Every round of the same session uses the same word because
the index is fixed at 0 and no random selection occurs.

**Why this priority**: Deterministic word selection makes the game verifiable and testable.
It must be locked down before word-visibility rules can be validated.

**Independent Test**: Start two separate games in two separate rooms. Confirm both games use
`rocket` as the secret word, verifying the selection is deterministic and not random.

**Acceptance Scenarios**:

1. **Given** a game starts for the first time, **When** the secret word is selected, **Then**
   the word is `rocket` (the first entry in the starter word list).
2. **Given** two separate rooms each start a game independently, **When** both games' secret
   words are inspected, **Then** both are `rocket` — confirming the selection is deterministic,
   not random.
3. **Given** the starter word list is `["rocket", "pizza", "castle", "guitar", "sunflower"]`,
   **When** a game starts, **Then** the word selected is always `rocket` (index 0).

---

### User Story 3 — Only the Drawer Sees the Secret Word (Priority: P3)

On the Game screen, the secret word is visible only to the player who is the drawer. Guessers
see a placeholder (e.g., a blank or "???" label) instead of the actual word. This ensures the
game is fair and the guessing challenge is preserved.

**Why this priority**: Word visibility is the core secrecy mechanic. Without it, all players
can see the answer and the game has no challenge.

**Independent Test**: Open two browser tabs for the same game — one as the drawer, one as a
guesser. Confirm the drawer's tab shows `rocket` and the guesser's tab shows a placeholder
instead of the word. No guessing or drawing interaction is required.

**Acceptance Scenarios**:

1. **Given** a game is active and the secret word is `rocket`, **When** the drawer views the
   Game screen, **Then** the secret word `rocket` is displayed clearly on their screen.
2. **Given** a game is active and the secret word is `rocket`, **When** a guesser views the
   Game screen, **Then** the word is hidden — the guesser sees a placeholder such as "???" or
   a blank, not `rocket`.
3. **Given** the Game screen is loaded by a player whose participant ID does not match the
   drawer's ID, **When** the word area is inspected, **Then** no version of the secret word
   is present in the visible content.

---

### Edge Cases

- **Empty player name on game start**: A player with an empty or whitespace-only name MUST
  NOT be admitted to a room (validated at join/create time per Scenario 1). No additional
  check is required at game-start time, but if such a participant exists, the drawer label
  still applies — the name displays as whatever was stored.
- **Whitespace-only name trimmed to empty**: Submitting a name of `"   "` (spaces only) MUST
  be treated as empty and rejected with a visible error before the player enters the room.
  Trimming happens before the rejection check.
- **Single player tries to start**: Not possible — the Start Game button is disabled until
  ≥2 participants are present (enforced by Scenario 1). This edge case is already handled.
- **Word list is exhausted**: Out of scope — only one round per session is in scope; word
  rotation is explicitly excluded.
- **Drawer identity after refresh**: If a guesser refreshes their tab, the Game screen MUST
  still show the placeholder for the secret word, not the word itself. The server MUST NOT
  return the secret word to non-drawer participants.
- **Two tabs for the same participant (drawer)**: Both tabs show the secret word because both
  share the same participant ID. This is an accepted edge case — no multi-session detection
  is in scope.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When a game starts, the system MUST assign the drawer role to the participant
  at index 0 of the room's participant list (i.e., the player who joined or created the room
  first).
- **FR-002**: When a game starts, all participants other than the drawer MUST be assigned the
  guesser role.
- **FR-003**: The drawer assignment MUST be stored on the room state on the server so all
  clients receive it through their normal poll cycle.
- **FR-004**: The system MUST select the secret word deterministically by always using index 0
  of the starter word list (`rocket`).
- **FR-005**: The secret word MUST be stored server-side and returned to the client only when
  the requesting participant is the drawer.
- **FR-006**: When a guesser requests the room snapshot, the response MUST NOT include the
  secret word in any form.
- **FR-007**: When the drawer requests the room snapshot, the response MUST include the secret
  word.
- **FR-008**: The Game screen MUST display the drawer's name with a "Drawer" label visible to
  all players.
- **FR-009**: The Game screen MUST display each guesser's name with a "Guesser" label visible
  to all players.
- **FR-010**: Player names MUST be trimmed of leading and trailing whitespace before being
  stored. A name that is empty or whitespace-only after trimming MUST be rejected with a
  visible error message; this validation applies at room creation and room join.

### Key Entities

- **Room** (extended from Scenario 1): Adds `drawerId: string` (the participant ID of the
  drawer) and `secretWord: string` (the word for the current round); both set on game start.
- **RoomSnapshot** (viewer-aware projection): Returns `secretWord` only when the requesting
  `participantId` matches `drawerId`; otherwise omits or masks the field. Returns `drawerId`
  to all clients so the drawer label can be rendered.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of game starts, the participant at position 0 in the room's participant
  list is assigned the drawer role — verifiable by inspecting the Game screen with the first
  joiner.
- **SC-002**: In 100% of game starts across independent rooms, the secret word is `rocket` —
  confirming deterministic selection with zero randomness.
- **SC-003**: A guesser's Game screen never displays the secret word — verified across all
  acceptance scenarios for US3 with two browser tabs.
- **SC-004**: A drawer's Game screen always displays the correct secret word immediately upon
  game start, without any additional user action.

## Assumptions

- Player name trimming and empty-name rejection were introduced in Scenario 1 (join/create
  validation). Scenario 2 inherits that invariant and does not re-implement it; FR-010 restates
  it for completeness.
- "First player" means the participant stored at index 0 of `room.participants`, which is the
  creator of the room (established in Scenario 1 where the creator is always the first entry).
- The secret word index is hardcoded at 0 for this lab. No round counter, rotation, or
  randomisation is in scope.
- The `participantId` sent with the GET room snapshot request is trusted at face value; no
  authentication layer exists. The word visibility rule relies on the client sending its own
  correct ID, which is stored in the frontend state from the join/create response.
- Drawer and guesser role labels on the Game screen are rendered from the `drawerId` field
  in the snapshot — no separate role list from the server is needed for this scenario.
