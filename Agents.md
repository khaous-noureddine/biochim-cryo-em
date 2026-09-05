# Git workflow

- Work on the current feature branch.
- Never commit directly to main.
- Before committing, run the relevant tests.
- Review `git diff` and do not commit generated files or large checkpoints.
- Use complete commit messages to explain what changed.
- When the requested task is complete, commit all intended changes.
- Push the current branch to origin.
- Do not force-push.

# Product source of truth

- Treat `aline_011208/` as the behavioral reference for ALINE compatibility.
- Read `docs/product-vision.md`, `docs/current-state.md`, `docs/roadmap.md`, and
  `docs/decisions.md` before planning substantial product work.
- Reproduce every useful ALINE capability, including capabilities supplied by
  its plugins. Replace obsolete external services and platform-specific
  mechanisms with maintained equivalents instead of copying broken 2008
  integrations.
- Keep the legacy source unchanged unless the user explicitly requests a
  change to it.
- Update `docs/current-state.md`, `docs/roadmap.md`, and `docs/decisions.md`
  whenever completed work materially changes product status, priorities, or an
  architectural decision.
- Do not declare full ALINE parity until every item in the feature inventory
  has an implementation and verification result, or a documented modern
  replacement accepted by the user.

# Completion and verification

- A feature is complete only when its behavior is implemented, relevant tests
  pass, its user-facing workflow is verified when practical, persistence and
  undo/redo implications are handled, and the durable project documentation is
  current.
- Preserve unrelated working-tree changes and exclude them from commits.
