# How to expose a game system to the engine

*How-to guide, for developers connecting engine-independent game logic to the engine or a scripting layer.*

This guide shows you how to have the gameplay programmer bind a system through
the thin adapter.

1. Check the system's public API is in the contracts doc. If not, ask the
   agent to add it first.
2. Ask:
   ```
   Use gameplay-programmer, engine-integration skill: expose <system> to the
   engine. Commands: <list>. Events: <list>.
   ```
3. Check the diff: conversions in the conversion module, no rule or tuning
   number in the adapter, errors from the core caught at the adapter.
4. Check the headless smoke test was added and passes with the project's test
   command.
5. Tell the graphics programmer, UI developer and sound designer which events
   now exist (via the project manager if your project routes work that way).

If the engine needs a value every frame (positions for smooth motion), ask for
the interpolation factor to be passed through, not for presentation to read
core state mid-step.

See the [engine-integration skill reference](../reference/skills/engine-integration.md).
