# API Contracts: Room Setup and Lobby

**Base URL**: `http://localhost:3001`
**Content-Type**: `application/json` (all requests and responses)

---

## Shared Types

### RoomSnapshot

```json
{
  "code": "ABCD",
  "hostId": "<uuid>",
  "status": "lobby",
  "participants": [
    { "id": "<uuid>", "name": "Alice", "joinedAt": "<ISO 8601>" }
  ],
  "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
  "roles": ["drawer", "guesser"]
}
```

`status` is `"lobby"` or `"active"`.

### Error Response

```json
{ "message": "<human-readable description>" }
```

---

## POST /rooms

Create a new room. The caller becomes the host.

### Request

```json
{ "playerName": "Alice" }
```

| Field        | Type   | Required | Validation |
|--------------|--------|----------|-----------|
| `playerName` | string | yes      | Non-empty after trim |

### Response — 201 Created

```json
{
  "participantId": "<uuid>",
  "room": { "<RoomSnapshot>" }
}
```

`room.hostId` equals `participantId`. `room.participants` has exactly one entry.

### Error Responses

| Status | Condition |
|--------|-----------|
| 400    | `playerName` missing, empty, or whitespace-only |

---

## POST /rooms/:code/join

Join an existing room.

### Path Parameters

| Param  | Validation |
|--------|-----------|
| `code` | Trimmed and uppercased before lookup |

### Request

```json
{ "playerName": "Bob" }
```

| Field        | Type   | Required | Validation |
|--------------|--------|----------|-----------|
| `playerName` | string | yes      | Non-empty after trim |

### Response — 200 OK

```json
{
  "participantId": "<uuid>",
  "room": { "<RoomSnapshot>" }
}
```

### Error Responses

| Status | Condition |
|--------|-----------|
| 400    | `playerName` missing, empty, or whitespace-only |
| 404    | Room not found for the given code |

---

## GET /rooms/:code

Fetch the current room snapshot. Called by the Lobby poller.

### Path Parameters

| Param  | Validation |
|--------|-----------|
| `code` | Uppercased before lookup |

### Query Parameters

| Param           | Type   | Required |
|-----------------|--------|----------|
| `participantId` | string | no       |

### Response — 200 OK

```json
{ "room": { "<RoomSnapshot>" } }
```

### Error Responses

| Status | Condition |
|--------|-----------|
| 404    | Room not found |

---

## POST /rooms/:code/start

Start the game. Only the host may call this endpoint, and at least 2 participants must be present.
Transitions `room.status` from `"lobby"` to `"active"`.

**This endpoint is new — does not exist in the starter scaffold.**

### Path Parameters

| Param  | Validation |
|--------|-----------|
| `code` | Uppercased before lookup |

### Request

```json
{ "participantId": "<caller uuid>" }
```

| Field           | Type   | Required | Notes |
|-----------------|--------|----------|-------|
| `participantId` | string | yes      | Must match `room.hostId` |

### Response — 200 OK

```json
{ "room": { "<RoomSnapshot>" } }
```

`room.status` is `"active"`.

### Error Responses

| Status | Condition |
|--------|-----------|
| 400    | `participantId` missing |
| 403    | Caller is not the host |
| 409    | Fewer than 2 participants in the room |
| 404    | Room not found |
