---
name: game-systems
description: Use when designing or implementing game logic: state, rules, results, randomness and time.
---

# Game systems

- **Pure core.** Game state and rules live in a library with no engine
  dependency. Engine-facing code is a thin adapter.
- **Deterministic.** All randomness from one seeded generator owned by
  the game state; time arrives as a delta argument, never read from a
  clock. A seed and an input list reproduce a game exactly.
- **Results as data.** Each player action returns a result listing what
  changed, at the finest grain presentation needs, in display order.
  Presentation animates from the result alone.
- **Named tuning.** Every number from the spec is a named constant or a
  data field.
- **Stable contracts.** Public APIs are documented in the project's
  contracts doc; breaking one is a `!` commit and a message to
  dependants.
