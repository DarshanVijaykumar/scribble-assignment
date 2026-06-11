# Data Model: Game Start and Drawer Flow

**Date**: 2026-06-11
**Feature**: specs/002-game-start-drawer/spec.md

## Entities

### Room (extended)

New fields added to the existing `Room` type in `backend/src/models/game.ts`:

| Field        | Type     | Set when       | Notes |
|--------------|----------|----------------|-------|
| `drawerId`   | `string` | Game start     | `participants[0].id`; undefined until status becomes `"active"` |
| `secretWord` | `string` | Game start     | `STARTER_WORDS[0]` = `"rocket"`; undefined until status becomes `"active"` |

Both fields are `string` (not optional) on the internal `Room` type once set. They are
absent from `Room` objects in lobby status; `startRoom()` writes them atomically with the
`"active"` status transition.

Revised full `Room` shape:

| Field          | Type            | Notes |
|----------------|-----------------|-------|
| `code`         | string          | Unique room identifier |
| `hostId`       | string (UUID)   | Creator's participant id |
| `drawerId`     | string (UUID)   | Set on game start; `participants[0].id` |
| `secretWord`   | string          | Set on game start; always `"rocket"` |
| `status`       | `"lobby" \| "active"` | |
| `participants` | `Participant[]` | |
| `createdAt`    | ISO 8601        | |
| `updatedAt`    | ISO 8601        | |

### RoomSnapshot (viewer-aware projection)

Fields added to `RoomSnapshot` in `backend/src/models/game.ts`:

| Field        | Type              | Visibility |
|--------------|-------------------|-----------|
| `drawerId`   | `string`          | All clients — needed to render role labels |
| `secretWord` | `string` (optional) | Drawer only — omitted from guesser snapshots |

`toRoomSnapshot(room, viewerParticipantId)`:
- Always includes `drawerId` (when set; undefined in lobby).
- Includes `secretWord` only when `viewerParticipantId === room.drawerId`.

### Frontend RoomSnapshot (type extension)

Fields added to `RoomSnapshot` interface in `frontend/src/services/api.ts`:

| Field        | Type               | Notes |
|--------------|--------------------|-------|
| `drawerId`   | `string` (optional) | Absent in lobby snapshots |
| `secretWord` | `string` (optional) | Absent for guessers; present for drawer when active |

## State Transitions

```
"lobby"
   │
   └─── POST /rooms/:code/start (host, ≥2 players)
            │
            ▼
        "active"
            │  drawerId  = participants[0].id
            │  secretWord = STARTER_WORDS[0]  ("rocket")
```

Both fields are set atomically inside `startRoom()` before `saveRoom()` is called.

## Word Selection Rule

```
secretWord = STARTER_WORDS[0]   →   "rocket"
```

`STARTER_WORDS` = `["rocket", "pizza", "castle", "guitar", "sunflower"]`

The index is hardcoded at 0. No randomisation, no round counter, no rotation.

## Role Derivation (Frontend)

```typescript
const isDrawer = participantId === room.drawerId;
```

No separate role field is needed. The drawer label is derived from `drawerId` on the snapshot.
