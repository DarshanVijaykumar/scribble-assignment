# API Contracts: Game End and Results Screen

**Feature**: 004-game-end-results | **Date**: 2026-06-11

All existing endpoints are unchanged. This feature adds one new endpoint and modifies the
behaviour of two existing ones.

---

## Changed: `GET /rooms/:code`

**Change**: When `status === "results"`, `secretWord` is now included in the response for
**all** participants, not just the drawer.

No request changes. Response shape is unchanged; only the presence of `secretWord` changes.

### Response (results state, any participant)

```json
{
  "room": {
    "code": "ABCD",
    "hostId": "uuid-host",
    "drawerId": "uuid-drawer",
    "secretWord": "rocket",
    "status": "results",
    "participants": [
      { "id": "uuid-drawer", "name": "Alice", "score": 0,   "joinedAt": "…" },
      { "id": "uuid-guesser","name": "Bob",   "score": 100, "joinedAt": "…" }
    ],
    "strokes": [ … ],
    "guesses": [
      {
        "participantId": "uuid-guesser",
        "participantName": "Bob",
        "text": "rocket",
        "correct": true,
        "timestamp": "2026-06-11T10:00:01.000Z"
      }
    ],
    "availableWords": ["rocket","pizza","castle","guitar","sunflower"],
    "roles": ["drawer","guesser"]
  }
}
```

---

## Changed: `POST /rooms/:code/guesses`

**Change**: When the submitted guess is correct, the server transitions the room to
`status: "results"` before responding. The response is **unchanged**.

### Response

```json
{ "correct": true, "score": 100 }
```

The caller detects the round ended by observing `status === "results"` on the **next poll**
of `GET /rooms/:code`. No extra field is added to the guess response.

---

## New: `POST /rooms/:code/restart`

Resets round state and returns the room to lobby. Only the host may call this endpoint.
Only valid when `status === "results"`.

### Request

```
POST /rooms/:code/restart
Content-Type: application/json
```

```json
{ "participantId": "uuid-host" }
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `participantId` | string (UUID) | yes | Must match `room.hostId` |

### Responses

#### 200 OK — restart successful

```json
{
  "room": {
    "code": "ABCD",
    "hostId": "uuid-host",
    "status": "lobby",
    "participants": [
      { "id": "uuid-host",    "name": "Alice", "score": 0, "joinedAt": "…" },
      { "id": "uuid-guesser", "name": "Bob",   "score": 0, "joinedAt": "…" }
    ],
    "strokes": [],
    "guesses": [],
    "availableWords": ["rocket","pizza","castle","guitar","sunflower"],
    "roles": ["drawer","guesser"]
  }
}
```

All participants preserved. Scores reset to 0. `drawerId` and `secretWord` absent.

#### 400 Bad Request — room not in results state

```json
{ "message": "Game has not ended yet" }
```

#### 403 Forbidden — caller is not the host

```json
{ "message": "Only the host can restart the game" }
```

#### 404 Not Found — room does not exist

```json
{ "message": "Room not found" }
```

---

## Zod Schema: `restartRoomSchema`

```typescript
export const restartRoomSchema = z.object({
  participantId: z.string().min(1, "participantId is required")
});
```
