# Feature Specification: Room Setup and Lobby

**Feature Branch**: `001-room-setup-lobby`

**Created**: 2026-06-10

**Status**: Draft

**Input**: User description: "Room Setup and Lobby"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Host Creates a Room (Priority: P1)

A player who wants to host a drawing game visits the Start screen and clicks "Create Room."
The system generates a unique room code, registers that player as the host, and redirects
them to the Lobby screen showing themselves as the only participant.

**Why this priority**: Room creation is the entry point for the entire game. Without it, no
other feature can be exercised.

**Independent Test**: Open one browser tab, create a room, confirm a unique code is shown,
and confirm the Lobby lists exactly one participant (the creator). The room system is
independently testable with a single browser tab and delivers a clear MVP: a hosted, isolated room.

**Acceptance Scenarios**:

1. **Given** the Start screen is visible, **When** a player clicks "Create Room" and submits a valid
   name, **Then** a room with a unique code is created, the creator is marked as the host, and the
   player is taken to the Lobby screen.
2. **Given** the player is on the Lobby screen, **When** they view the participant list, **Then** they
   appear as the sole participant and their host status is visible (e.g., a "Host" label).
3. **Given** two rooms have been created independently, **When** each host views their Lobby, **Then**
   each sees only their own participants and room code — rooms are fully isolated.

---

### User Story 2 — Guest Joins a Room by Code (Priority: P2)

A second player receives a room code from the host, visits the Start screen, clicks "Join Room,"
and enters the code. If the code is valid they land on the Lobby screen as a participant.
If the code is invalid or empty they receive a clear error message.

**Why this priority**: Multiplayer is the core value proposition. Without join, the game cannot
progress to at least 2 players and cannot start.

**Independent Test**: Open two browser tabs. In tab 1, create a room and note the code. In tab 2,
join with that code. Confirm tab 2's Lobby lists both participants after a refresh. Independently
demonstrates the join flow without requiring any gameplay.

**Acceptance Scenarios**:

1. **Given** a room exists with a known code, **When** a second player enters that code and submits
   a non-empty, non-whitespace-only name, **Then** they join the room and are taken to the Lobby screen.
2. **Given** the Join Room form, **When** a player submits an empty room code, **Then** a visible error
   message is shown and no network request is made.
3. **Given** the Join Room form, **When** a player submits a code that does not match any room, **Then**
   a clear error message is shown (e.g., "Room not found").
4. **Given** the Join Room form, **When** a player submits a whitespace-only or empty player name,
   **Then** a visible error message is shown and they are not added to the room.

---

### User Story 3 — Lobby Auto-Refreshes Participant List (Priority: P3)

Once in the Lobby, all participants see the current participant list update automatically without
pressing a manual refresh button. The list reflects new joiners within approximately 2 seconds.

**Why this priority**: Polling is required by the constitution and by Scenario 1. Without it,
players cannot tell when others have joined and the host cannot confirm the 2-player minimum before
starting.

**Independent Test**: With two tabs both on the Lobby screen for the same room, have a third tab join.
Confirm the participant list in both existing tabs updates within ~2 seconds without any manual
action.

**Acceptance Scenarios**:

1. **Given** a player is on the Lobby screen, **When** another player joins the same room, **Then**
   the first player's Lobby participant list updates to include the new joiner within approximately
   2 seconds without a manual action.
2. **Given** a player is on the Lobby screen, **When** polling is active, **Then** requests to the
   backend occur at approximately 2-second intervals.
3. **Given** a player navigates away from the Lobby screen, **When** they leave, **Then** polling
   stops and no further background requests are made for that room.

---

### User Story 4 — Host Starts the Game (Priority: P4)

Once at least 2 players are present in the Lobby, the host sees an active "Start Game" button.
Non-host participants do not see (or cannot use) the Start Game control. The host clicking it
transitions all players to the Game screen.

**Why this priority**: This is the final Lobby action and the gateway to all gameplay scenarios.
It depends on users 1–3 being complete and provides the transition to Scenario 2.

**Independent Test**: With exactly 2 players in the Lobby (one host, one guest), confirm only the
host sees an active Start Game button. Press it and confirm both tabs transition to the Game screen.

**Acceptance Scenarios**:

1. **Given** the Lobby has at least 2 participants, **When** the host views the Lobby, **Then** a
   "Start Game" button is visible and enabled for the host only.
2. **Given** the Lobby has fewer than 2 participants, **When** the host views the Lobby, **Then**
   the "Start Game" button is disabled or absent, with feedback indicating more players are needed.
3. **Given** a non-host participant views the Lobby, **When** any number of players are present,
   **Then** the "Start Game" control is not available to them.
4. **Given** the Lobby has at least 2 participants, **When** the host clicks "Start Game," **Then**
   the game transitions to the active Game state and all players are taken to the Game screen on
   their next poll cycle (within ~2 seconds).

---

### Edge Cases

- What happens when a player submits a room code with leading/trailing whitespace? The code MUST
  be trimmed before lookup; a padded valid code MUST succeed.
- What happens when a player enters a player name that is whitespace-only (e.g., spaces only)?
  Submission MUST be rejected with a visible message.
- What happens if the backend is restarted mid-session? All in-memory rooms are lost; the frontend
  MUST surface a "room not found" or similar error gracefully on the next poll.
- What happens when two players create rooms at the same time? Each room MUST receive a distinct
  code; no collision occurs.
- What happens if a player tries to join a room that has already started? Out of scope for this
  scenario — joining mid-game is not supported.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST generate a unique room code on room creation.
- **FR-002**: The first player to create a room MUST be assigned the host role for that room.
- **FR-003**: System MUST reject a join attempt with an empty or whitespace-only room code, surfacing
  a visible error message to the user.
- **FR-004**: System MUST reject a join attempt with a room code that does not match any existing
  room, surfacing a visible error message (e.g., "Room not found").
- **FR-005**: System MUST reject a player name that is empty or whitespace-only at both the frontend
  (before network call) and the backend (server-side validation).
- **FR-006**: System MUST display the participant list on the Lobby screen, updated via polling at
  approximately a 2-second interval.
- **FR-007**: Polling MUST start when a player enters the Lobby screen and stop when they leave.
- **FR-008**: Only the host MUST see an enabled "Start Game" button; non-hosts MUST NOT have access
  to this control.
- **FR-009**: The "Start Game" button MUST be disabled (or absent) until at least 2 participants
  are present in the room.
- **FR-010**: When the host starts the game, the room state MUST transition so that all players
  are directed to the Game screen on their next poll.
- **FR-011**: Rooms MUST be fully isolated: participants, state, and codes of one room MUST NOT
  be visible to or affect another room.
- **FR-012**: Room codes MUST be trimmed before lookup when a player joins.

### Key Entities

- **Room**: Identified by a unique code; holds a list of participants and the current game phase
  (lobby, active, finished). Stores which participant is the host.
- **Participant**: A player in a room, identified by their display name. Has a host flag.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can create a room and reach the Lobby screen in under 5 seconds on a local
  network.
- **SC-002**: A second player can join an existing room using a valid code and appear on both
  participants' Lobby screens within approximately 2 seconds of joining, without manual refresh.
- **SC-003**: Invalid inputs (empty code, unknown code, empty name) each produce a distinct,
  user-visible error message — verified across all 4 invalid-input acceptance scenarios.
- **SC-004**: Two independently created rooms remain fully isolated: each host sees only their own
  participants and code.
- **SC-005**: The host can start a game with exactly 2 participants and both players transition to
  the Game screen within approximately 2 seconds.

## Assumptions

- Player names are display names only; no authentication or persistent identity is required.
- Room codes are case-insensitive on lookup (trim applied; case sensitivity is not specified in
  the README, so case-insensitive matching is the safer default).
- The in-memory backend is the source of truth; no client-side caching of room state is required.
- Joining a room that has already started is out of scope for this feature.
- The polling interval of ~2 seconds is a target; minor variance (±0.5s) is acceptable.
- The Lobby screen already exists as a scaffold; this feature adds polling and host controls to it.
- The Start screen with "Create Room" and "Join Room" flows already exists in the scaffold.
