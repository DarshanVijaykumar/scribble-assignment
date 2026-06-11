import type { Participant } from "../services/api";
import { Card } from "./Card";

interface ScoreboardProps {
  participants: Participant[];
}

export function Scoreboard({ participants }: ScoreboardProps) {
  const sorted = [...participants].sort((a, b) => b.score - a.score);

  return (
    <Card title="Scoreboard">
      <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.875rem" }}>
        {sorted.map((p) => (
          <li
            key={p.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "0.25rem 0",
              borderBottom: "1px solid #f3f4f6"
            }}
          >
            <span>{p.name}</span>
            <strong>{p.score}</strong>
          </li>
        ))}
      </ul>
    </Card>
  );
}
