---
name: engine-integration
description: 'Use when exposing engine-independent game logic to a game engine, scripting layer or another language through a binding: the thin adapter, type conversion, commands in and events out, error containment, lifetime, and the headless smoke test.'
---

# Engine integration

The core knows the rules; the engine knows how to draw, play sound and read
devices. The adapter between them is thin, boring and rule-free. If you can
delete the engine and the core's tests still pass, the boundary is right.

## Shape of the adapter

```
engine input  --> adapter: build Command (values) --> core.apply / core.step
core Result   --> adapter: convert types, emit engine events/signals --> presentation, audio, UI
engine loop   --> adapter: accumulate time, call core.step(dt) N times, pass alpha to presentation
```

The adapter:
- **Owns** one core instance (or a handle to it) and its lifetime.
- **Converts types** both ways: core coordinates to engine vectors, result
  records to engine collections, ids to engine object references. Conversion
  is the only logic it holds.
- **Forwards commands** built from input; it never decides whether a move is
  legal. The core answers.
- **Emits events** from the core's result, in the result's order, so
  presentation can sequence animation.
- **Drives time** with the fixed-step accumulator (`deterministic-simulation`)
  and hands the interpolation factor to presentation.
- Holds **no rules, no tuning, no randomness**.

## Method

1. List the core API the engine needs: commands, queries, result and event
   types. Keep it small; add on demand.
2. Write the binding for one command and one event end to end first; prove it
   in the engine headless; then widen.
3. Map every core type to one engine type in a single conversion module.
4. **Contain errors at the boundary.** Errors raised in the core (exceptions,
   panics, error results) are caught or converted at the adapter: an engine
   or host built without that error mechanism cannot receive them, and
   unwinding across the boundary is undefined or fatal. Convert them to an
   engine-side error value or log entry plus a safe state.
5. **Build adapter and core with the same error-handling, runtime and warning
   flags** (exception/unwind settings, sanitizers, standard library), so a
   mismatch cannot hide behind the boundary.
6. **Name bound symbols with the project's prefix** to avoid clashing with
   engine or third-party names.
7. **Register per area.** Each area (core bindings, presentation, audio, UI)
   registers its own types through its own entry point; areas add one line to
   a shared registration rather than editing each other's code.
8. **Lifetime and threads.** Decide who frees what; never hand the engine a
   raw pointer into core state that the next step may invalidate; give it ids
   or copies. Call the core from one thread unless the core says otherwise.
9. **Headless smoke test in CI.** Load the built module in the engine without a
   window, register types, apply one command, observe one event. This catches
   registration, symbol and ABI errors the core's unit tests cannot.

## Checklist

- [ ] No rule, tuning number or random draw in the adapter.
- [ ] One conversion module; every core type maps to one engine type.
- [ ] Core errors caught/converted at the adapter; none cross the boundary.
- [ ] Adapter and core share error-handling, runtime and warning flags.
- [ ] Bound names prefixed; each area registers itself.
- [ ] Engine holds ids or copies, not pointers into core state.
- [ ] Headless load-and-call smoke test runs in CI.
- [ ] Contracts doc lists the bound API.

## Failure modes

- Rules creeping into engine scripts "just for this feature".
- Engine object references stored inside core state, making it untestable and
  unsavable.
- An uncaught core error terminating the host.
- Presentation reading core state mid-step and showing half-applied rules.
- A binding that compiles but fails to register, discovered only on device.

## Documentation this work owes

**Reference** for the bound API (types, commands, events, signals, names) in
the contracts doc or reference page. A **how-to** ("How to expose a new
command to the engine") the first time the procedure exists. An **explanation**
if the boundary itself was a design choice.
