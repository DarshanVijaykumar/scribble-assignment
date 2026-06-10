# Data Model: Room Setup and Lobby

**Date**: 2026-06-10
**Feature**: specs/001-room-setup-lobby/spec.md

## Entities

### Room

Stored in the backend in-memory `Map<string, Room>`.

| Field        | Type                        | Notes |
|--------------|-----------------------------|-------|
| `code`       | `string` (4-char uppercase) | Unique key; generated on creation; collision-safe loop |
| `hostId`     | `string` (UUID)             | ID of the participant who created the room; **new field** |
| `status`     | `"lobby" \| "active"`       | `"active"` added; transitions to `"active"` on start |
| `participants` | `Participant[]`           | Ordered list; first entry is always the host |
| `createdAt`  | `string` (ISO 8601)         | Set once on creation |
| `updatedAt`  | `string` (ISO 8601)         | Updated on every mutation |

### Participant

Embedded in `Room.participants`.

| Field      | Type            | Notes |
|------------|-----------------|-------|
| `id`       | `string` (UUID) | Generated with `randomUUID()` on join/create |
| `name`     | `string`        | Trimmed; min length 1; required |
| `joinedAt` | `string` (ISO 8601) | Set once when the participant is added |

### RoomSnapshot (API response projection)

Returned by all room endpoints. Clients receive this instead of the raw `Room`.

| Field          | Type                        | Notes |
|----------------|-----------------------------|-------|
| `code`         | `string`                    | Room code |
| `hostId`       | `string`                    | ID of the host participant; **new field** |
| `status`       | `"lobby" \| "active"`       | Current room phase |
| `participants` | `Participant[]`             | Full participant list |
| `availableWords` | `string[]`                | Starter word list (passed through unchanged) |
| `roles`        | `ParticipantRole[]`         | Starter roles (passed through unchanged) |

## State Transitions

```
[created]
    │
    ▼
 "lobby"  ──── POST /rooms/:code/start (host only, ≥2 players) ────▶  "active"
```

- Only `"lobby" → "active"` is in scope for this feature.
- `"active" → "finished"` and `"finished" → "lobby"` (restart) are out of scope for Scenario 1.

## Validation Rules

| Field         | Rule |
|---------------|------|
| `playerName`  | Required; trim applied; min length 1 after trim; max length unconstrained for now |
| `code` (join) | Required; trim applied; converted to uppercase before lookup |
| `code` (start) | Must match an existing room in `"lobby"` status |
| Start request | Caller's `participantId` must equal `room.hostId` |
| Start request | `room.participants.length >= 2` |

## Frontend State

`RoomState` (in `frontend/src/state/roomStore.ts`) is extended with:

| Field           | Type              | Notes |
|-----------------|-------------------|-------|
| `room`          | `RoomSnapshot \| null` | Current room snapshot |
| `participantId` | `string \| null`  | This client's participant ID |
| `error`         | `string \| null`  | Last error message |
| `isLoading`     | `boolean`         | True during any in-flight request |

`hostId` is derived from `room.hostId` — not a separate field in `RoomState`.
The Lobby compares `participantId === room.hostId` to gate the Start Game button.
