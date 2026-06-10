<!--
SYNC IMPACT REPORT
==================
Version change: [unversioned] → 1.0.0
Modified principles: All placeholders replaced with concrete values (initial authoring)
Added sections:
  - Core Principles (5 principles)
  - Engineering Standards
  - Development Workflow
  - Governance
Removed sections: None (template tokens cleared)
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ — Constitution Check gate aligns with principles below
  - .specify/templates/spec-template.md ✅ — Scope and acceptance criteria format compatible
  - .specify/templates/tasks-template.md ✅ — Task types match principles (backend/frontend split, validation, polling)
Follow-up TODOs: None — all placeholders resolved.
-->

# Scribble Assignment Constitution

## Core Principles

### I. Brownfield Discipline

Changes MUST be made incrementally on top of the existing scaffold. Rewriting the
starter from scratch is prohibited. Every modification MUST be traceable to a
business scenario in the README. Unrelated refactors, cosmetic cleanups, or
speculative abstractions MUST NOT be committed alongside feature work.

### II. Spec-First, Artifact-Driven Development

No implementation work begins until the relevant Spec Kit artifact (spec, plan,
tasks) is committed and internally consistent. Each business scenario MUST have
at least one acceptance criterion in the spec before code is written. Deviations
between implementation and spec MUST be documented in the spec, not silently
absorbed into the code.

### III. Deterministic Game Rules (NON-NEGOTIABLE)

Game logic MUST be deterministic and testable in isolation:
- Word selection MUST use the starter seed list (`rocket`, `pizza`, `castle`, `guitar`, `sunflower`) and MUST be deterministic (index-based, not random).
- Guess comparison MUST be case-insensitive and trim-normalized before matching.
- Scoring MUST award exactly 100 points for a correct guess and 0 for incorrect; no bonus or partial credit.
- Player name validation MUST reject empty or whitespace-only strings with a visible error message.
- Drawer assignment MUST follow a defined, repeatable rule (e.g., first player in the room list).

### IV. Polling Over Real-Time

State synchronization MUST use HTTP polling only (approximately 2-second interval).
WebSockets, Server-Sent Events, or any real-time push mechanism are explicitly
out of scope. Polling MUST be started when a player enters the Lobby or Game screen
and MUST be stopped when they leave. The backend MUST remain stateless between
requests; all room state lives in the in-memory store.

### V. Validated Inputs at Every Boundary

Every user-facing input (room code, player name, guess text) MUST be validated
before processing. Empty or whitespace-only values MUST be rejected with a clear,
user-visible error message. Validation MUST happen on the frontend before the
network call and MUST also be enforced on the backend. Client-side validation
does not substitute for server-side validation.

## Engineering Standards

- **Language & Runtime**: TypeScript throughout; Node.js 18+ (backend), Vite + React (frontend).
- **Storage**: In-memory only. No database, no file persistence. Restarting the backend resets all rooms.
- **Out-of-scope items** (MUST NOT be added): WebSockets, authentication, deployment config, multiple
  rounds, drawer rotation, timers, countdowns, custom word packs, spectator mode, or unjustified
  new top-level dependencies.
- **AI usage**: AI-generated code MUST be reviewed and understood by the author before committing.
  Blindly committing AI output without review violates this constitution.
- **Commits**: Commits MUST be granular and traceable to a specific scenario or artifact task.
  Bulk "implement everything" commits are not acceptable.
- **Build gate**: Both `backend/npm run build` and `frontend/npm run build` MUST pass before
  submitting the PR.

## Development Workflow

1. **Discovery**: Read starter files; document at least 3 gaps and 2 assumptions before specifying.
2. **Specify**: Write acceptance criteria tied to a business scenario before touching code.
3. **Clarify**: Resolve ambiguity through structured clarification (`/speckit-clarify`) before planning.
4. **Plan**: Update state model, data flow, and file-level plan before decomposing tasks.
5. **Tasks**: Decompose into ordered, dependency-aware tasks before implementing.
6. **Implement**: One scenario slice at a time; commit after each meaningful increment.
7. **Validate**: Verify acceptance criteria with two browser tabs before moving to the next scenario.
8. **Review**: Self-review every AI-generated diff against the spec before committing.

Skipping steps or batching multiple scenarios into a single implementation pass is a
constitution violation.

## Governance

This constitution supersedes all other informal conventions in this repository.
Amendments require:
1. A clear rationale tied to a project constraint or learning objective.
2. A version bump following semantic versioning (MAJOR for principle removal/redefinition,
   MINOR for additions, PATCH for clarifications).
3. An updated Sync Impact Report prepended to this file.
4. Re-checking all dependent templates for consistency.

All PRs MUST verify compliance with every principle above. Complexity MUST be
justified against a specific acceptance criterion. Use the README as the authoritative
source for out-of-scope boundaries.

**Version**: 1.0.0 | **Ratified**: 2026-06-10 | **Last Amended**: 2026-06-10
