---
name: engine-integration
description: Use when exposing game logic to a game engine or binding code across a language boundary.
---

# Engine integration

- The adapter owns a core object, converts types (core cells to engine
  vectors, result structs to engine collections), and emits engine
  signals or events. It contains no rules.
- Each area (core bindings, presentation, audio, UI) registers its own
  classes through its own entry point, so teams add one line to the
  shared registration, not edit each other's code.
- Prefix bound names with the project's prefix to avoid engine clashes.
- Load the built module headless in CI to catch registration errors.
