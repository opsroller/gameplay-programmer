---
name: game-systems
description: Use when turning a rules spec into game logic, or shaping game state, rules, results and tuning in an engine-independent core. Covers the case list, the pure-core architecture, results as data, named tuning and choosing decoupling patterns.
---

# Game systems

A game system is rules applied to state. Your job is to make those rules
exact, reproducible and cheap to change. Architecture exists to reduce how
much you must hold in your head before you can change something safely
(Nystrom); add abstraction when a real second case appears, not before.

## Method

1. **Read the spec into a case list.** One line per rule, number, condition
   and edge case: "damage is reduced by armour, minimum 1"; "a unit at 0
   health is removed at end of turn"; "two hits in the same tick both apply". Mark gaps `AMBIGUOUS:` with the default you
   will use. Send the ambiguities to the game designer; do not block on them.
2. **Model the state.** Plain data: what must be saved, replayed or hashed.
   Separate *simulation state* (rules depend on it) from *presentation state*
   (animation timers, particles), which never lives in the core.
3. **Define the API as commands in, results out.**
   `step(state, inputs, dt) -> result` or `apply(state, command) -> result`.
   Time, randomness and input arrive as arguments.
4. **Return results as data.** Each call returns what changed, at the finest
   grain presentation needs and in display order (moved, damaged, died,
   spawned, scored). Presentation animates from the result alone and never
   re-derives rules.
5. **Name every number.** Each spec value becomes a named constant or a
   content data field (`data-driven-content`). The name matches the spec's term.
6. **Write tests from the case list first** (`gameplay-testing`), then the
   simplest code that passes, then refactor.
7. **Document the contract.** Public types and functions go into the project's
   contracts doc; a breaking change is a `!` commit and a note to dependants.

## Choosing structure (Game Programming Patterns)

| Need | Reach for | Watch out for |
|---|---|---|
| Many entities each doing their own thing per tick | Update Method | Order dependence; mutating the list while iterating |
| Behaviour mixed and matched across entity kinds | Component (or ECS) | Components reaching into each other; hidden ordering |
| Many "kinds" that differ by data | Type Object | Behaviour that data cannot express; see `data-driven-content` |
| Actions that are queued, replayed, undone, sent over a network | Command | Commands that capture references instead of values |
| Behaviour that depends on a mode | State machine (`state-machines-and-events`) | Flag soup |
| One system must react to another without knowing it | Observer (synchronous) or Event Queue (deferred) | Global buses; feedback loops; stale data |
| Reads and writes in one tick must not see each other | Double Buffer (current/next state) | Forgetting to swap |
| Expensive derived values | Dirty Flag, cache | Forgetting to set dirty; stale cache in saves |
| Spatial queries | Spatial Partition (grid first) | Choosing a fancy structure before measuring |

Decision rules:
- Prefer plain functions over plain data until a pattern pays for itself.
- Prefer composition to deep inheritance: class hierarchies harden as
  designers' requests cut across categories (Bilas).
- Keep systems' update order explicit in one place.
- Prototype freely, but either throw prototypes away or rewrite them to this
  quality bar before they enter production.
- Flexible first while the design moves; optimise structure once it settles
  ("easier to make a fun game fast than a fast game fun").

## Quality bar

- [ ] Every case-list line has a test; every `AMBIGUOUS:` is a named
      constant and was reported.
- [ ] Core builds and tests with no engine, rendering, audio or UI dependency.
- [ ] No clock, global RNG or I/O inside rules (`deterministic-simulation`).
- [ ] Results carry everything presentation needs; presentation computes no
      rule.
- [ ] No magic numbers; names match the spec.
- [ ] Contracts doc updated.

## Failure modes

- **Rules in the view.** An engine script decides who takes damage; tests
  cannot reach it and the two copies drift.
- **God object.** One `Game` class owns everything; every change touches it.
- **Speculative frameworks.** An event bus and plugin system for three rules.
- **Silent spec drift.** A "small" number change in code with no spec change.
- **Results too coarse.** "Board changed" forces presentation to diff state and
  guess animation order.

## Documentation this work owes

A new system is a new feature: **reference** for its interface (public API,
state fields, result and event types, tuning names) in the project's reference
docs and contracts doc; an **explanation** page (`about-<system>`) if a design
choice was made (structure, alternatives rejected, determinism assumptions); a
**how-to** if designers or other roles must do something new (e.g. add a new
kind via data). Same PR as the code.
