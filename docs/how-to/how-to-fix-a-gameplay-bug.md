# How to fix a gameplay bug

*How-to guide, for developers and testers who need a wrong rule, desync or game-logic crash fixed.*

This guide shows you how to get from a bug report to a fix with a regression
test, using the `investigate-gameplay-bug` workflow.

1. Collect what you can: the seed, the content version, the build, and the
   input log or a save from just before the bug. Development builds can
   usually record these (see the project's reference for its debug commands).
2. Branch, e.g. `fix/stamina-negative`.
3. Run:
   ```
   /gameplay-programmer:investigate-gameplay-bug with args { bug: "<issue link or description>", capture: "<path, optional>" }
   ```
4. If it returns `could not reproduce`, add detail to the report (exact steps,
   a capture) and run again. Do not accept a fix without a failing test.
5. If it returns `blocked` with `open` items, resolve them and run again.
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

See the [investigate-gameplay-bug reference](../reference/workflows/investigate-gameplay-bug.md).
