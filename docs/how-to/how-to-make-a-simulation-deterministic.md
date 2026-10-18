# How to make a simulation deterministic

*How-to guide, for developers preparing game logic for replays, lockstep multiplayer or golden tests, or chasing a desync.*

This guide shows you how to audit and fix the simulation with the
`determinism-audit` workflow.

1. Branch, e.g. `fix/determinism`.
2. Run:
   ```
   /gameplay-programmer:determinism-audit with args { scope: "<path or system>" }
   ```
3. If the result lists `unverifiedLenses`, re-run with a narrower `scope` or
   ask the agent to audit that lens by hand.
4. If a fix changed outcomes on purpose, check the commit regenerating golden
   hashes says so, and tell the game designer and QA.
5. If the project must match across platforms, check the
   `about-determinism` explanation page it wrote states the floating-point
   policy; if it says "same platform only", raise that with the project
   manager.
6. Ask the devops engineer to run the replay test in CI if it is not already.

See the [determinism-audit reference](../reference/workflows/determinism-audit.md)
and the [deterministic-simulation skill reference](../reference/skills/deterministic-simulation.md).
