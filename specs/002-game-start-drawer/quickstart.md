# Quickstart Validation Guide: Game Start and Drawer Flow

**Prerequisites**: Scenario 1 complete and passing. Backend on port 3001, frontend on port 5173.

## Scenario A — Drawer Assignment

1. Tab 1: Create a room as **Alice**.
2. Tab 2: Join the same room as **Bob**.
3. Tab 1 (Alice / host): Click **Start Game**.
4. Both tabs navigate to the Game screen.

**Expected on Tab 1 (Alice)**:
- Player Info card shows role **Drawer**.
- Secret word area shows **rocket**.

**Expected on Tab 2 (Bob)**:
- Player Info card shows role **Guesser**.
- Secret word area shows a placeholder (e.g., `???`), NOT `rocket`.

---

## Scenario B — Deterministic Word

1. In a separate browser (or incognito), repeat Scenario A with different player names.
2. **Expected**: Secret word for the drawer is still **rocket** — not any other word.

---

## Scenario C — Guesser Cannot See the Word via Network

1. Open the browser DevTools → Network tab.
2. Start a game (Tab 2 is the guesser).
3. Find the `GET /rooms/:code?participantId=...` response for Tab 2.
4. **Expected**: The JSON response body does NOT contain a `secretWord` field.

---

## Scenario D — First Joiner Is Always Drawer

1. Create a room as **Charlie** (first joiner = index 0).
2. Join as **Dana** then **Eve**.
3. Start the game.
4. **Expected**: Charlie is labelled **Drawer**; Dana and Eve are **Guesser**.

---

## Build Validation

```bash
cd backend && npm run build
cd frontend && npm run build
```

Both must exit 0.
