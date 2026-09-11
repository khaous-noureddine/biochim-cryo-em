# Git workflow

- Work on the current feature branch.
- Never commit directly to main.
- Before committing, run the relevant tests.
- Review `git diff` and do not commit generated files or large checkpoints.
- Use complete commit messages to explain what changed.
- When the requested task is complete, commit all intended changes.
- Push the current branch to origin.
- Do not force-push.

# Agent operating loop

- These instructions are tool-independent and apply to Codex, OpenCode, and
  any other coding agent working in this repository.
- Write all new documentation and all documentation updates in English,
  including operational project memory, user guides, technical documents,
  comments intended as documentation, and commit messages.
- Before planning or implementing substantial work, read `project/GOAL.md`,
  `project/STATUS.md`, `project/PLAN.md`, and `project/DECISIONS.md`, in that
  order.
- Select the first unfinished checkpoint whose prerequisites are satisfied.
- Keep one checkpoint in progress at a time. Split work further when it cannot
  be implemented, verified, documented, committed, and pushed as one coherent
  change.
- After each verified checkpoint, update `project/STATUS.md`, check off only
  completed work in `project/PLAN.md`, and record durable architectural or
  product decisions in `project/DECISIONS.md`.
- If user steering changes scope or an accepted behavior, serialize the durable
  part into the appropriate project file instead of relying on chat history.
- Do not create alternative goal, plan, status, or decision files. These four
  files are the single operational memory for this repository.

# Product source of truth

- Treat `aline_011208/` as the behavioral reference for ALINE compatibility.
- Reproduce every useful ALINE capability, including capabilities supplied by
  its plugins. Replace obsolete external services and platform-specific
  mechanisms with maintained equivalents instead of copying broken 2008
  integrations.
- Keep the legacy source unchanged unless the user explicitly requests a
  change to it.
- Keep the operational project memory current according to the loop above.
- Do not declare full ALINE parity until every item in the feature inventory
  has an implementation and verification result, or a documented modern
  replacement accepted by the user.

# Completion and verification

- A feature is complete only when its behavior is implemented, relevant tests
  pass, its user-facing workflow is verified when practical, persistence and
  undo/redo implications are handled, and the durable project documentation is
  current.
- Preserve unrelated working-tree changes and exclude them from commits.
- Stop and request user direction only when a decision requires new authority,
  domain validation, credentials, or a product choice that materially changes
  the accepted result. Record the blocker in `project/STATUS.md`.
