import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, startRoom } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 4-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{4}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("createRoom sets hostId to the creator's participant id", () => {
    const result = createRoom("Alice");

    expect(result.room.hostId).toBe(result.participantId);
  });

  it("joinRoom returns null for an unknown room code", () => {
    const result = joinRoom("ZZZZ", "Bob");

    expect(result).toBeNull();
  });

  describe("startRoom", () => {
    it("returns null when the room does not exist", () => {
      const result = startRoom("ZZZZ", "any-id");

      expect(result).toBeNull();
    });

    it("returns forbidden error when caller is not the host", () => {
      const { room } = createRoom("Alice");
      const join = joinRoom(room.code, "Bob");
      const result = startRoom(room.code, join!.participantId);

      expect(result).toEqual({ error: "forbidden" });
    });

    it("returns conflict error when fewer than 2 participants", () => {
      const { room, participantId } = createRoom("Alice");
      const result = startRoom(room.code, participantId);

      expect(result).toEqual({ error: "conflict" });
    });

    it("transitions the room to active when host starts with 2+ players", () => {
      const { room, participantId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      const result = startRoom(room.code, participantId);

      expect(result).not.toBeNull();
      expect(result).not.toHaveProperty("error");
      const snapshot = (result as { snapshot: ReturnType<typeof import("./roomStore.js")["toRoomSnapshot"]> }).snapshot;
      expect(snapshot.status).toBe("active");
      expect(snapshot.hostId).toBe(participantId);
      expect(snapshot.participants).toHaveLength(2);
    });
  });
});
