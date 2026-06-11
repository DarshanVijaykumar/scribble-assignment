# API Contracts: Game Start and Drawer Flow

Only the contracts that change in Scenario 2 are documented here. For unchanged contracts
(POST /rooms, POST /rooms/:code/join) see
`specs/001-room-setup-lobby/contracts/rooms-api.md`.

---

## Shared Type Changes

### RoomSnapshot (updated)

Two fields are added to the snapshot returned by all room endpoints:

```json
{
  "code": "ABCD",
  "hostId": "<uuid>",
  "drawerId": "<uuid>",
  "status": "active",
  "secretWord": "rocket",
  "participants": [
    { "id": "<uuid>", "name": "Alice", "joinedAt": "<ISO 8601>" },
    { "id": "<uuid>", "name": "Bob",   "joinedAt": "<ISO 8601>" }
  ],
  "availableWords": ["rocket", "pizza", "castle", "guitar", "sunflower"],
  "roles": ["drawer", "guesser"]
}
```

| Field        | Present when | Value |
|--------------|-------------|-------|
| `drawerId`   | `status === "active"` | `participants[0].id` — first joiner |
| `secretWord` | `status === "active"` **AND** viewer is the drawer | `"rocket"` (always) |

When `status === "lobby"`, both fields are absent from the snapshot.
When `status === "active"` and the viewer is a guesser, `secretWord` is absent.

---

## POST /rooms/:code/start (updated response)

Contract defined in Scenario 1. Response shape updated to include `drawerId` and, if the
caller is the drawer, `secretWord`.

### Response — 200 OK (caller is drawer / host == first joiner)

```json
{
  "room": {
    "code": "ABCD",
    "hostId": "<uuid-alice>",
    "drawerId": "<uuid-alice>",
    "status": "active",
    "secretWord": "rocket",
    "participants": [ ... ],
    "availableWords": [ ... ],
    "roles": [ ... ]
  }
}
```

### Response — 200 OK (caller is host but NOT first joiner)

```json
{
  "room": {
    "code": "ABCD",
    "hostId": "<uuid-alice>",
    "drawerId": "<uuid-bob>",
    "status": "active",
    "participants": [ ... ],
    "availableWords": [ ... ],
    "roles": [ ... ]
  }
}
```

Note: `secretWord` is absent because the caller (Alice) is not the drawer (Bob).

---

## GET /rooms/:code (updated response)

### Query Parameters

| Param           | Type   | Required |
|-----------------|--------|----------|
| `participantId` | string | no — but required to receive `secretWord` if drawer |

### Response — 200 OK (viewer is drawer)

```json
{
  "room": {
    "code": "ABCD",
    "hostId": "<uuid>",
    "drawerId": "<same-uuid>",
    "status": "active",
    "secretWord": "rocket",
    "participants": [ ... ],
    "availableWords": [ ... ],
    "roles": [ ... ]
  }
}
```

### Response — 200 OK (viewer is guesser or no participantId provided)

```json
{
  "room": {
    "code": "ABCD",
    "hostId": "<uuid>",
    "drawerId": "<uuid>",
    "status": "active",
    "participants": [ ... ],
    "availableWords": [ ... ],
    "roles": [ ... ]
  }
}
```

`secretWord` is absent. `drawerId` is always present once the game is active.
