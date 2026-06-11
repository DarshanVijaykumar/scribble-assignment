import { useState } from "react";

interface GuessFormProps {
  disabled?: boolean;
  onSubmit: (guess: string) => Promise<{ correct: boolean } | null>;
}

export function GuessForm({ disabled = false, onSubmit }: GuessFormProps) {
  const [guessText, setGuessText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFeedback(null);

    const trimmed = guessText.trim();
    if (trimmed.length === 0) {
      setError("Guess cannot be empty.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await onSubmit(trimmed);
      if (result !== null) {
        setFeedback(result.correct ? "correct" : "incorrect");
        setGuessText("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit guess.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="form__field">
        <input
          className="form__input"
          value={guessText}
          onChange={(event) => {
            setGuessText(event.target.value);
            setError(null);
            setFeedback(null);
          }}
          placeholder="Type your guess here..."
          disabled={disabled || submitting}
        />
      </label>
      {error && (
        <p className="form__error" role="alert" style={{ color: "#dc2626", fontSize: "0.875rem" }}>
          {error}
        </p>
      )}
      {feedback && (
        <p
          role="status"
          style={{
            color: feedback === "correct" ? "#16a34a" : "#dc2626",
            fontSize: "0.875rem",
            fontWeight: 600
          }}
        >
          {feedback === "correct" ? "Correct! +100 points" : "Incorrect — try again!"}
        </p>
      )}
      <div className="button-row button-row--compact">
        <button
          className="button button--primary"
          type="submit"
          disabled={disabled || submitting}
        >
          Submit Guess
        </button>
      </div>
    </form>
  );
}
