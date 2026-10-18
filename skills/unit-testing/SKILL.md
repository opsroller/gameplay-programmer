---
name: unit-testing
description: Use when writing or fixing tests for game logic.
---

# Unit testing

- One test file per system, so parallel work doesn't collide.
- Build positions from readable literals (string grids) so the test
  shows the situation.
- Seed everything. A test that depends on luck is a bug.
- Assert on result data (what cleared, in what order, score), not
  internals.
- Run sanitizers or the language's equivalent checks before marking
  work done. Reproduce CI failures locally with CI's exact commands.
