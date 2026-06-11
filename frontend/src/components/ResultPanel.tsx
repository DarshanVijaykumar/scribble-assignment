import type { GuessEntry } from "../services/api";
import { Card } from "./Card";

interface ResultPanelProps {
  guesses: GuessEntry[];
}

export function ResultPanel({ guesses }: ResultPanelProps) {
  const ordered = [...guesses].reverse();

  return (
    <Card title="Activity">
      {ordered.length === 0 ? (
        <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
          Guesses will appear here.
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.875rem" }}>
          {ordered.map((entry, i) => (
            <li
              key={`${entry.participantId}-${entry.timestamp}-${i}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "0.25rem 0",
                borderBottom: "1px solid #f3f4f6",
                color: entry.correct ? "#16a34a" : "#dc2626"
              }}
            >
              <span>
                <strong>{entry.participantName}</strong>: {entry.text}
              </span>
              <span>{entry.correct ? "✓" : "✗"}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
