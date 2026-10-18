# How to fix a gameplay bug

*How-to guide, for developers and testers who need a gameplay bug fixed: a wrong rule, desync or game-logic crash, or a lifecycle, leak or engine-integration bug.*

This guide shows you how to get from a bug report to a fix with a regression
test, using the `investigate-gameplay-bug` workflow.

1. Collect what you can: the seed, the content version, the build, and the
   input log or a save from just before the bug. Development builds can
   usually record these (see the project's reference for its debug commands).
   For a leak or a quit or teardown bug, collect the engine's output on exit
   (leak or orphan report) instead.
2. Branch, e.g. `fix/stamina-negative`.
3. Run, naming the kind if you know it (`simulation`, `lifecycle`,
   `resource` or `integration`; see
   [Bug kinds](../reference/workflows/investigate-gameplay-bug.md#bug-kinds)):
   ```
   /gameplay-programmer:investigate-gameplay-bug with args { bug: "<issue link or description>", capture: "<path, optional>", kind: "<optional>" }
   ```
   Leave `kind` out and the workflow classifies the bug itself.
4. If it returns `could not reproduce`, add detail to the report (exact steps,
   a capture) and run again. Do not accept a fix without a failing test.
5. If it returns `blocked` with `open` items, resolve them and run again.
   `notes` never block; read them and file follow-ups where needed.
6. If `unverifiedSearches` is not empty, ask the agent to search those areas
   for the same pattern.
7. Ship it. The workflow has already committed and pushed the fix, so do
   not rebuild it. For a work package, pass the whole result as `prior`:
   `/engineering-practices:deliver-package { wp: "<the package>", prior: <the result> }`.
   Otherwise land the branch:
   `/engineering-practices:land-pr { branch: "<handoff.branch>" }`.
   Link the issue in the PR.

For a desync between two machines or two builds, provide both captures; the
workflow compares per-tick state to find the first divergence.

If the failing test needs a CI step or a test-harness hook (for example a
CI step that runs the game headless and fails on its leak report), the
workflow adds it in its own `test:` or `ci:` commit, apart from the fix,
and lists it in `harness`.

See the [investigate-gameplay-bug reference](../reference/workflows/investigate-gameplay-bug.md).
