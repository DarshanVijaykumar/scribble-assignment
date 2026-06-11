# Research: Drawing Canvas and Guess Submission

**Feature**: 003-drawing-canvas-guessing
**Date**: 2026-06-11

---

## 1. Canvas Drawing — Pointer Event Strategy

**Decision**: Use the HTML5 Canvas 2D API with `pointerdown`, `pointermove`, and `pointerup`
events for stroke capture.

**Rationale**: Pointer events unify mouse, touch, and stylus input. The Canvas 2D `lineTo`/
`moveTo` API is sufficient for free-hand drawing without third-party dependencies (prohibited
by constitution). Strokes are captured as arrays of `{x, y}` points per drag gesture.

**Alternatives considered**:
- SVG paths: More DOM overhead, harder to serialise incrementally.
- Third-party canvas libraries (Fabric.js, Konva.js): Out of scope — constitution bans
  unjustified new top-level dependencies.

**Implementation note**: Coordinates must be normalised relative to the canvas element's
bounding rect (`getBoundingClientRect`) so they remain stable across different window sizes.

---

## 2. Stroke Data Transmission — Full State vs. Delta

**Decision**: Transmit the full ordered stroke list on every GET /rooms/:code poll response.

**Rationale**: The in-memory store already holds the complete stroke list. Sending it wholesale
on each poll is simpler and matches the existing pattern (the full participant list is already
sent every poll). Stroke arrays are small for a single-round, single-drawing game; delta
diffing is an unnecessary optimisation.

**Alternatives considered**:
- Delta/append-only endpoint: Requires client-side merge logic and sequence tracking —
  unjustified complexity for this scope.
- WebSocket push: Explicitly prohibited by constitution (Principle IV).

---

## 3. Guess Validation — Server-Side Location

**Decision**: Validation (trim, empty-check, case-fold, comparison against secretWord) runs
on the server; the client performs the same checks as a UI guard only.

**Rationale**: Constitution Principle V mandates backend enforcement independent of
client-side checks. The server already owns the `secretWord` and cannot expose it to guesser
clients, so the comparison must happen server-side.

---

## 4. Score Storage — Per-Participant Field

**Decision**: Add a `score: number` field to `Participant` (initialised to 0 on game start).
The `POST /rooms/:code/guesses` handler increments it by 100 on a correct guess.

**Rationale**: Storing score on the participant model is consistent with the existing
in-memory Room → Participant structure and avoids a separate scoring table. The score is
returned in every room snapshot so all clients always see the current totals.

**Alternatives considered**:
- Separate scoring endpoint: Redundant when the snapshot already carries participant data.
- Storing score in GuessEntry list and computing on the fly: Stateful accumulation is
  simpler for the polling model used here.

---

## 5. Canvas Clear — Server-Side Reset

**Decision**: A `DELETE /rooms/:code/strokes` endpoint resets the room's `strokes` array
to `[]` server-side. Guessers' canvases go blank on the next poll.

**Rationale**: All state lives server-side (constitution Principle III / IV). The clear
must be authoritative and visible to all pollers — a local-only clear would diverge on
the next poll that returns old strokes.

---

## 6. Drawer Lock-Out from Guessing

**Decision**: The server MUST reject `POST /rooms/:code/guesses` if the submitted
`participantId` matches `room.drawerId`. Return HTTP 403.

**Rationale**: FR-013 in spec. The frontend will hide the guess input from the drawer
(FR-006), but constitution Principle V requires server-side enforcement too.

---

## 7. Existing Polling — Reuse for GamePage

**Decision**: GamePage polls `GET /rooms/:code?participantId=xxx` on the same ~2-second
interval as LobbyPage. The response now includes `strokes`, `guesses`, and `score` per
participant.

**Rationale**: Principle IV mandates polling; the LobbyPage already demonstrates the
pattern with a `useEffect` + `setInterval` + `fetchRoom`. Reusing that exact pattern keeps
the GamePage consistent with no new dependencies.

---

## 8. No NEEDS CLARIFICATION Items Remain

All requirements in the spec have deterministic, implementable answers based on the
existing scaffold and constitution. No ambiguities remain after research.
