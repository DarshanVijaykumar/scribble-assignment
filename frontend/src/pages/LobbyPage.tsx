import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId, error, isLoading } = useRoomState();

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  useEffect(() => {
    if (!room) return;

    const id = setInterval(() => {
      roomStore.fetchRoom();
    }, 2000);

    return () => clearInterval(id);
  }, [room, roomStore]);

  useEffect(() => {
    if (room?.status === "active") {
      navigate("/game");
    }
  }, [navigate, room?.status]);

  async function handleStartGame() {
    try {
      await roomStore.startGame();
      navigate("/game");
    } catch {
      // error is already surfaced via store state
    }
  }

  if (!room) {
    return null;
  }

  const isHost = participantId === room.hostId;
  const canStart = isHost && room.participants.length >= 2;

  return (
    <section className="panel placeholder-page">
      <div className="lobby-header">
        <PageHeader
          kicker="Waiting for players"
          title="Lobby"
          description="Share the room code with friends so they can join your game."
        />
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="summary-grid">
        <Card title="Participants">
          {room.participants.length === 0 ? (
            <p>No participants are connected to this room yet.</p>
          ) : (
            <ul className="player-list">
              {room.participants.map((participant) => (
                <li key={participant.id}>
                  <span>{participant.name}</span>
                  {participant.id === room.hostId ? (
                    <span className="player-list__meta">Host</span>
                  ) : (
                    <span className="player-list__meta">joined</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Status">
          <p className="status-line" style={{ backgroundColor: isLoading ? '#fef3c7' : '#e0e7ff', color: isLoading ? '#b45309' : '#3730a3' }}>
            {isLoading ? "Refreshing players..." : "Ready to play"}
          </p>
          <p style={{ marginTop: '8px' }}>
            {error ?? (isHost && room.participants.length < 2
              ? "Waiting for more players to join…"
              : "Waiting for the host to start the game.")}
          </p>
        </Card>
      </div>

      {isHost && (
        <div className="button-row button-row--spread">
          <button
            className="button button--primary"
            disabled={!canStart || isLoading}
            onClick={handleStartGame}
          >
            Start Game
          </button>
        </div>
      )}
    </section>
  );
}
