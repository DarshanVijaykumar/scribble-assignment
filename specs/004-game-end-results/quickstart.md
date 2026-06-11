# Quickstart Validation Guide: Game End and Results Screen

**Feature**: 004-game-end-results | **Date**: 2026-06-11

## Prerequisites

- Node.js 18+ installed
- Backend and frontend dependencies installed (`npm install` in both `backend/` and `frontend/`)
- No other process running on ports 3001 (backend) and 5173 (frontend)

## Start the App

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Open **two browser tabs** at `http://localhost:5173`.

---

## Validation Scenarios

### Scenario A: Results Screen Appears for All Players

1. **Tab 1**: Create a room as "Alice".
2. **Tab 2**: Join the same room as "Bob".
3. **Tab 1** (host): click **Start Game**. Both tabs navigate to the game screen.
4. **Tab 2** (Bob / guesser): type `rocket` in the guess form and submit.

**Expected within 2 seconds**:
- Both tabs transition to the results view (no longer showing the drawing canvas / guess form).
- The correct word `rocket` is visible to both players.
- Scoreboard shows Bob: 100, Alice: 0.
- Guess history shows Bob's guess `rocket` marked correct (✓).

---

### Scenario B: Host Sees Play Again, Non-Host Does Not

1. Reach the results screen as in Scenario A.
2. **Tab 2** (Bob / non-host): Verify the **Play Again** button is **absent**; a "Waiting for host"
   message is visible.
3. **Tab 1** (Alice / host): Verify the **Play Again** button is **present**.

---

### Scenario C: Play Again Returns Everyone to Lobby with Clean State

1. Reach the results screen as in Scenario A.
2. **Tab 1** (Alice / host): Click **Play Again**.

**Expected within 2 seconds**:
- Both tabs navigate back to the lobby screen.
- Both tabs show the same two players (Alice and Bob) in the participant list.
- No scores, guesses, or canvas strokes are visible if you immediately start and play a new game.

---

### Scenario D: New Game Starts with Clean State

1. After Scenario C, **Tab 1** (host): click **Start Game** again.
2. Both tabs navigate to the game screen.
3. Confirm all player scores are 0 and the guess list is empty.

---

## Automated Checks

Run these before considering the feature complete:

```bash
# Backend unit tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# Type-check both packages
cd backend && npm run build
cd frontend && npm run build
```

Both builds MUST pass with no TypeScript errors. See [data-model.md](data-model.md) and
[contracts/api.md](contracts/api.md) for the exact types and endpoint signatures to verify.
