import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { DrawingCanvas } from "../components/DrawingCanvas";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { type RoomSnapshot, type Stroke, api } from "../services/api";
import { useRoomState, useRoomStore } from "../state/roomStore";

const POLL_INTERVAL_MS = 2000;

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room: initialRoom, participantId } = useRoomState();
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(initialRoom);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!initialRoom) {
      navigate("/", { replace: true });
      return;
    }
    setSnapshot(initialRoom);
  }, [navigate, initialRoom]);

  const poll = useCallback(async () => {
    if (!initialRoom || !participantId) return;
    try {
      const result = await api.fetchRoom(initialRoom.code, participantId);
      setSnapshot(result.room);
    } catch {
      // retain previous snapshot on transient error
    }
  }, [initialRoom, participantId]);

  useEffect(() => {
    if (!initialRoom) return;
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, [poll, initialRoom]);

  useEffect(() => {
    if (snapshot?.status === "lobby") {
      roomStore.setRoomSnapshot(snapshot);
      navigate("/lobby", { replace: true });
    }
  }, [snapshot, navigate, roomStore]);

  const room = snapshot ?? initialRoom;

  if (!room) {
    return null;
  }

  const isDrawer = participantId !== null && participantId === room.drawerId;
  const role = isDrawer ? "Drawer" : "Guesser";
  const roomCode = room.code;

  async function handleNewStroke(stroke: Stroke) {
    if (!participantId) return;
    setSnapshot((prev) => {
      if (!prev) return prev;
      return { ...prev, strokes: [...prev.strokes, stroke] };
    });
    try {
      await api.addStroke(roomCode, participantId, stroke.points);
    } catch {
      // stroke will re-sync on next poll
    }
  }

  async function handleClear() {
    if (!participantId) return;
    setSnapshot((prev) => {
      if (!prev) return prev;
      return { ...prev, strokes: [] };
    });
    try {
      await api.clearStrokes(roomCode, participantId);
    } catch {
      // will re-sync on next poll
    }
  }

  async function handleGuessSubmit(guess: string) {
    if (!participantId) return null;
    const result = await api.submitGuess(roomCode, participantId, guess);
    await poll();
    return result;
  }

  const isHost = participantId !== null && participantId === room.hostId;

  async function handlePlayAgain() {
    try {
      await roomStore.restartRoom();
    } catch {
      // error surfaced via store
    }
  }

  if (room.status === "results") {
    return (
      <section className="panel game-page">
        <div className="game-page__header">
          <div className="game-page__header-left">
            <span className="section-kicker">Round Over</span>
            <h1 className="game-page__title">Results</h1>
          </div>
          <RoomCodeBadge code={room.code} />
        </div>

        <div className="game-page__layout">
          <aside className="game-page__sidebar game-page__sidebar--left">
            <Scoreboard participants={room.participants} />
          </aside>

          <div className="game-page__main">
            <Card title="The Word Was">
              <p style={{ fontSize: "2rem", fontWeight: "bold", textAlign: "center", padding: "1rem 0" }}>
                {room.secretWord ?? "—"}
              </p>
            </Card>
            <ResultPanel guesses={room.guesses} />
          </div>

          <aside className="game-page__sidebar game-page__sidebar--right">
          </aside>
        </div>

        <div className="button-row">
          {isHost ? (
            <button className="button button--primary" onClick={handlePlayAgain}>
              Play Again
            </button>
          ) : (
            <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
              Waiting for the host to start a new game…
            </p>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          <h1 className="game-page__title">Guess the Word!</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard participants={room.participants} />
          <ResultPanel guesses={room.guesses} />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            <DrawingCanvas
              strokes={room.strokes}
              isDrawer={isDrawer}
              onNewStroke={handleNewStroke}
              onClear={handleClear}
            />
          </Card>
        </div>

        <aside className="game-page__sidebar game-page__sidebar--right">
          <Card title="Player Info">
            <dl className="detail-list">
              <div>
                <dt>Name</dt>
                <dd>{room.participants.find((p) => p.id === participantId)?.name ?? "Unknown player"}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{role}</dd>
              </div>
              <div>
                <dt>Secret Word</dt>
                <dd>{isDrawer && room.secretWord ? room.secretWord : "???"}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Players">
            <ul className="player-list">
              {room.participants.map((p) => (
                <li key={p.id}>
                  <span>{p.name}</span>
                  <span className="player-list__meta">
                    {p.id === room.drawerId ? "Drawer" : "Guesser"}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          {!isDrawer && (
            <Card title="Your Guess">
              <GuessForm onSubmit={handleGuessSubmit} />
            </Card>
          )}
        </aside>
      </div>

      <div className="button-row">
        <button className="button button--secondary" onClick={() => navigate("/lobby")}>
          Exit Game
        </button>
      </div>
    </section>
  );
}
