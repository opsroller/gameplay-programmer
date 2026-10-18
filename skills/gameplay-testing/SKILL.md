---
name: gameplay-testing
description: Use when writing, fixing or planning tests for game logic: unit tests per rule, scenario tests from readable fixtures, property and stateful tests for invariants, replay and golden tests for determinism, and keeping the suite fast and reliable.
---

# Gameplay testing

Games are complex interacting systems shipped on deadlines; automated tests
let a team change them quickly without manual regression passes. Rare built
Sea of Thieves with automated tests from day one (unit, integration and
"actor" tests that treat engine objects as first-class dependencies) and
credited them with faster verification, more stable builds and less crunch.
Most of your tests should not need the engine at all, because the core does
not.

## The suite, bottom to top

| Layer | What it checks | Needs engine? | Share |
|---|---|---|---|
| Unit | One rule or function; spec numbers by name | No | Most |
| Scenario | A small game situation built from a readable fixture, stepped, asserted | No | Many |
| Property / stateful | Invariants over generated states and command sequences | No | Some, for core rules |
| Replay / golden | Recorded seed + inputs reproduce per-tick state hashes | No | A few seeds |
| Binding smoke | Engine loads the module, adapter forwards a command, emits an event | Yes, headless | Few |
| Play / QA | Feel, fun, readability | Humans | Not your automation |

## Method

1. **Start from the case list** (`game-systems`): each line becomes a test
   named for the rule: `armour_reduces_damage_to_minimum_one`.
2. **Arrange with readable fixtures.** Build positions from literals the
   reader can see (string grids, small tables, builder functions), not 40
   lines of setup.
3. **Seed everything.** A test that depends on luck is a bug. Pass explicit
   seeds; when a test needs a specific random outcome, inject a scripted
   generator.
4. **Assert on results and observable state**, not private internals: who took
   damage, in which order, the resulting score.
5. **Write properties for invariants** the designer would call laws:
   conservation (no cards created or destroyed), bounds (health in
   `0..max`), idempotence (applying an empty turn changes nothing),
   round-trip (save then load equals original), determinism (same seed, same
   hash), model agreement (fast implementation equals a simple reference).
6. **Write stateful tests for systems driven by sequences**: define commands
   with preconditions, run random sequences against the real system and a
   simple model, check invariants after every step; the framework shrinks a
   failure to a short readable sequence (rule-based testing, as in Hypothesis
   or any QuickCheck-family library).
7. **Add a replay test** for any system that touches the simulation
   (`deterministic-simulation`).
8. **Bug fix = failing test first.** Reproduce the bug as a test, watch it
   fail, then fix.
9. **Run what CI runs.** Use the project's exact commands, sanitizers or
   strict modes included, before marking work done.

## Keeping the suite healthy

- Fast: unit and scenario tests in milliseconds; the whole core suite well
  under a minute. Slow tests get run less and rot.
- One test file per system so parallel work does not collide.
- A flaky test is a determinism bug or a test bug: quarantine it with an
  issue the same day, fix it, never just retry.
- Generated content (levels, decks) gets a validation test that loads all of
  it (`data-driven-content`).
- Be pragmatic on throwaway prototypes; be strict on anything going to
  production.

## Checklist

- [ ] Every spec rule and number has a named test.
- [ ] Fixtures are readable; no test relies on luck.
- [ ] At least one property per core invariant; stateful test for
      sequence-driven systems.
- [ ] Replay/golden test for simulation changes.
- [ ] Bug fixes come with a regression test that failed first.
- [ ] Full suite passes with CI's commands locally.

## Failure modes

- Testing through the engine what could be tested in the core: slow, flaky,
  rarely run.
- Snapshot tests nobody reads, regenerated on every failure.
- Asserting internals, so refactors break tests while behaviour is fine.
- Weakening an assertion to make a failing test pass.

## Documentation this work owes

Tests themselves are not docs, but new test machinery is: **reference** for
fixture formats and helpers; a **how-to** ("How to add a scenario test", "How
to run the gameplay tests") when contributors must do something new. A bug fix
updates reference if behaviour changed.
