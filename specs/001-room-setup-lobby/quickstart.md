# Quickstart Validation Guide: Room Setup and Lobby

**Purpose**: Runnable scenarios that confirm the feature works end-to-end after implementation.

## Prerequisites

- Node.js 18+ and npm 9+
- Backend running on `http://localhost:3001`
- Frontend running on `http://localhost:5173`

## Start the Backend

```bash
cd backend && npm install && npm run dev
```

Confirm: `GET http://localhost:3001/health` returns `{ "ok": true }`.

## Start the Frontend

```bash
cd frontend && npm install && npm run dev
```

Open `http://localhost:5173`.

---

## Scenario A — Host Creates a Room

1. On the Start screen, click **Create Room**.
2. Enter a non-empty player name (e.g., `Alice`) and submit.
3. **Expected**: Redirected to the Lobby screen. The room code badge is visible.
   The participant list shows `Alice`. A **Host** badge appears next to Alice's name.
   The **Start Game** button is visible but disabled (only 1 player).

---

## Scenario B — Guest Joins with a Valid Code

1. Copy the room code from Scenario A's Lobby.
2. In a second browser tab, go to the Start screen → **Join Room**.
3. Enter a name (e.g., `Bob`) and the room code; submit.
4. **Expected**: Tab 2 lands on the Lobby screen showing both Alice and Bob.
   Within ~2 seconds, Tab 1's Lobby also shows Bob without any manual action.

---

## Scenario C — Invalid Join Attempts

Test each independently (reset between attempts):

| Input | Expected error |
|-------|----------------|
| Empty room code | "Room code is required" (or similar), no network call |
| Unknown room code (e.g., `ZZZZ`) | "Room not found" (or similar) |
| Whitespace-only player name | "Player name is required" (or similar) |

---

## Scenario D — Host-Only Start Game

1. Complete Scenario B (Alice as host, Bob as guest).
2. In Tab 2 (Bob / guest): **Expected** — no Start Game button is visible.
3. In Tab 1 (Alice / host) with 2 players: **Expected** — Start Game button is enabled.
4. Click **Start Game** in Tab 1.
5. **Expected**: Tab 1 navigates to the Game screen immediately.
   Within ~2 seconds, Tab 2 also navigates to the Game screen via its poll cycle.

---

## Scenario E — Room Isolation

1. Create two separate rooms (Room 1 with Alice, Room 2 with Charlie) in separate tabs.
2. Have Bob join Room 1.
3. **Expected**: Room 1's Lobby shows Alice and Bob. Room 2's Lobby shows only Charlie.
   The room codes are different. Each room is fully independent.

---

## Scenario F — Polling Lifecycle

1. Open the Lobby screen for a room.
2. Open the browser's Network tab.
3. **Expected**: Requests to `GET /rooms/:code` appear approximately every 2 seconds.
4. Navigate away from the Lobby (e.g., click the browser back button or go to Start).
5. **Expected**: Polling stops — no further `GET /rooms/:code` requests appear.

---

## Build Validation

Run before submitting:

```bash
cd backend && npm run build
cd frontend && npm run build
```

Both must exit 0 with no errors.
