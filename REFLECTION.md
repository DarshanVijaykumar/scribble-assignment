# Reflection

## What Was Built

A multiplayer Pictionary-style web game across four incremental scenarios, extending a
brownfield scaffold with no new top-level npm dependencies and no WebSockets — HTTP polling
only throughout.

- **Scenario 1 — Room Setup & Lobby**: Room creation with unique codes, participant join flow,
  host/guest roles, and a lobby that polls for new players.
- **Scenario 2 — Game Start & Drawer Flow**: Host-only game start (minimum 2 players), automatic
  drawer assignment (first joiner), secret word visibility scoped to the drawer only.
- **Scenario 3 — Drawing Canvas & Guessing**: Freehand canvas with stroke sync over polling,
  clear canvas, case-insensitive guess comparison, +100 scoring on correct guess, rejection of
  empty and whitespace-only inputs.
- **Scenario 4 — Game End & Results**: Transition to `"results"` state on correct guess, revealed
  word for all players, full guess history, scoreboard, host-triggered restart that resets round
  state and returns everyone to the lobby with the player list intact.

## What Went Well

**Spec-first discipline held.** Writing spec → plan → tasks before touching code kept scope
contained. Each scenario had a clear contract before implementation, which made the brownfield
constraint (extend, don't rewrite) much easier to enforce.

**The polling model was simpler than expected.** An existing ~2-second `GET /rooms/:code` cycle
meant all state sync — drawing strokes, guess history, status transitions, restart — came for
free once the server state was correct. No special client-side event handling was needed for
any of the state transitions.

**Type unions as feature flags.** Extending `RoomStatus` from `"lobby" | "active"` to include
`"results"` made TypeScript exhaustiveness checks catch every branch that needed updating,
turning a potential oversight into a compile error.

## What Was Difficult

**Secret word scoping across the snapshot boundary.** The `toRoomSnapshot` function is the
single point where server-side `Room` state becomes client-visible `RoomSnapshot`. Getting
`secretWord` conditionally included (drawer only during `"active"`, everyone during `"results"`)
required careful thought about that boundary rather than a simple field copy.

**Canvas stroke representation.** Encoding freehand drawing as an array of `Stroke[]`, each
being an array of `Point[]`, required deciding up front what "a stroke" means (mousedown to
mouseup). Getting the delta sync right — sending only new strokes on each poll rather than the
full array — took iteration.

**Coordinating frontend navigation with polling.** The `useEffect` that watches
`snapshot.status` and calls `navigate("/lobby")` on restart needed to fire reliably without
double-triggering. The polling cycle and React's render cycle interact in subtle ways; the
solution was a simple equality check on status rather than anything more sophisticated.

## What I Would Do Differently

With more time I would add at least one integration test that spins up the actual Express
server and drives two simulated participants through a full round — create room, join, start,
draw, guess correctly, verify results, restart, verify lobby. The current test suite covers
unit-level correctness well but leaves the end-to-end happy path verified only by manual
`quickstart.md` scenarios.

I would also extract the polling interval into a shared constant. It appears as a hardcoded
value in the frontend and as an implicit assumption in the backend snapshot design; a single
source of truth would make it easier to tune during development.
