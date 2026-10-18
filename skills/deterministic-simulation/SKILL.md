---
name: deterministic-simulation
description: Use when game logic must reproduce exactly from a seed and an input log (replays, lockstep multiplayer, bug repro, golden tests), or when adding randomness, timing or iteration to the simulation. Covers fixed timestep, seeded RNG streams, ordering, floating point, state hashing and replay.
---

# Deterministic simulation

Determinism: the same initial state plus the same inputs gives the same
result, down to the bit (Fiedler). It turns every bug into a recording you
can replay, makes tests exact, and is the precondition for replays and
lockstep networking. It is easy to keep and expensive to retrofit.

## Rules

1. **Fixed timestep.** The simulation advances in steps of a constant `dt`.
   The engine loop accumulates real time and calls `step` zero or more times
   per frame, capping catch-up steps so a slow frame cannot spiral; the
   renderer interpolates with `alpha = leftover / dt` (Nystrom "Game Loop";
   Fiedler "Fix Your Timestep"). Pick `dt` larger than the worst-case update
   cost. Turn-based games: one step per action, no `dt` at all.
2. **Time is an argument.** Never read a clock in the simulation. Timers are
   tick counts or accumulated `dt`.
3. **Randomness is state.** One seeded generator (or a few named streams)
   owned by the game state, saved and hashed with it. Use a specified
   algorithm (e.g. a PCG or xorshift family generator) implemented in the
   project, not a platform default whose sequence may change.
   - Separate **simulation** and **cosmetic** streams: particles and camera
     shake must not consume simulation numbers.
   - Derive per-system or per-entity streams from the seed plus a stable key
     when systems' call counts vary independently.
   - Generate bounded integers without modulo bias.
4. **Order is explicit.** Iterate in a defined order (entity id, insertion
   order). Never depend on hash-map/set iteration, pointer addresses, or an
   unstable sort without a tiebreaker.
5. **Floating point is controlled.** Same binary on the same platform is
   usually safe; across compilers, CPUs, debug/release or fast-math flags it is
   not. If cross-platform determinism matters, use fixed-point or integer math
   for simulation state, and keep transcendental functions out or
   table-driven. Write the decision in the explanation doc.
6. **No hidden inputs.** No uninitialised memory, locale-dependent parsing,
   environment reads, threads racing on shared state, or engine physics the
   core does not own. Everything that affects the outcome enters as an input.
7. **Inputs are recorded.** Inputs are compact commands tagged with the tick
   they apply to (Command pattern). Seed + initial state + input log = replay.

## Proving it

- **State hash.** A function hashes all simulation state (including RNG
  state) in a fixed order, e.g. FNV-1a or CRC32. Optionally one hash per
  subsystem so the first diverging subsystem is obvious.
- **Replay test in CI.** Record a session (or generate one from a seed),
  replay it, assert the per-tick hashes match the recording. Run it twice in
  one process and across build configurations the project ships.
- **Golden hashes.** Store final hashes for a few canonical seeds; when a rule
  changes on purpose, regenerate them in the same commit and say so (Factorio
  regenerates its integration CRCs on intended logic changes).
- **Desync hunt.** See `gameplay-debugging-and-profiling`: dump state per
  tick in a readable form from two runs, diff, investigate the *first*
  diverging tick and subsystem, not the loudest symptom.

## Checklist

- [ ] Fixed `dt` (or discrete turns); catch-up steps capped.
- [ ] No clock, environment or global RNG reads in the core (grep for them).
- [ ] RNG seeded, owned by state, serialised, hashed; cosmetic stream separate.
- [ ] Every collection iterated in defined order; sorts have tiebreakers.
- [ ] Float policy decided and documented.
- [ ] State hash covers every field; a test fails if a new field is not hashed.
- [ ] Replay test runs in CI.

## Failure modes

- A second caller draws from the simulation RNG (a UI shuffle), shifting every
  later number.
- A new state field is not included in the hash or the save, so replays
  "match" while the game diverges.
- Variable `dt` in the simulation: tunnelling, exploding springs, frame-rate
  dependent difficulty.
- Determinism verified only on one machine and one build type.

## Documentation this work owes

The determinism model is a decision between alternatives: an **explanation**
page (`about-determinism`: timestep, RNG streams, float policy, why).
**Reference** for the hash coverage, RNG streams and keys, replay file format.
**How-to** pages for new procedures ("How to record and replay a session",
"How to regenerate golden hashes").
