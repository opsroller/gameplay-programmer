---
name: gameplay-debugging-and-profiling
description: 'Use when a gameplay bug, desync, crash, lifecycle or leak bug, or slowdown must be found and fixed: reproducing from seed and input log, minimising, finding the first divergence, debug views and commands, and measuring the simulation''s share of the frame before optimising.'
---

# Gameplay debugging and profiling

Finding the cause is usually harder than fixing it (Factorio's desync
write-ups). Determinism and logging turn finding into a mechanical search.

## Debugging method

1. **Capture.** Get seed, content version, build, and the input log (or the
   save and the steps). No repro, no fix: if only a description exists, try to
   rebuild it as a scenario test from the description first.
2. **Reproduce as a test.** Turn the capture into a failing test (replay or
   scenario). It must fail for the reported reason.
3. **Minimise.** Shorten the input log (bisect it), shrink the scenario,
   remove unrelated content, until removing anything makes it pass. A
   property-test failure arrives already shrunk.
4. **Find the first divergence**, not the loudest symptom: compare per-tick
   state hashes or readable state dumps against the expected run (or two
   builds); investigate the first tick and subsystem that differ. For a
   regression, bisect commits with the failing test.
5. **Explain the cause** in one sentence before changing code. If you cannot,
   you have not found it.
6. **Fix at the cause**, keep the test, run the full suite and the replay
   tests.
7. **Look for siblings**: the same mistake elsewhere (another unordered
   iteration, another clock read).

## Bugs outside the simulation

Ticks and state hashes only exist in the simulation. For other bugs the
method is the same (reproduce as a test, minimise, first divergence, one
sentence, fix at the cause, siblings), but the failing test and the first
divergence differ:

- **Lifecycle** (start-up, load and unload, pause and resume, quit and
  teardown, threads): test with a headless engine run that drives the steps
  and fails on wrong order, state, error or exit code. Write down the
  expected sequence of steps for each object (created, entered, ready,
  running, exiting, freed) with its owner and thread, trace the actual one,
  and find the first step that differs.
- **Resource** (leaks, double release, use after release): test the
  smallest create and release cycle and fail when counts do not return to
  their start or the engine's leak report, a sanitizer (LeakSanitizer,
  AddressSanitizer) or Valgrind reports one. Name the allocation, its owner,
  and the release path that misses it.
- **Integration** (data or calls across the boundary to the engine,
  platform or content): test at the boundary; log what crosses it against
  the contract and find the first call whose input or output is wrong.

When the test needs it, change the test harness (runner, fixtures,
test-only hooks release builds never run) or add a CI step, in its own
commit apart from the fix.

## Tools to build into the game (development builds)

- **State inspector**: current state of any entity and machine, time in
  state, last transition and cause.
- **Debug draw / overlays** via presentation (the graphics programmer draws;
  you supply the data): ranges, paths, targets, grid occupancy.
- **Debug commands**: spawn, set value, skip to phase, set seed, step one
  tick, pause and single-step the simulation independently of rendering.
- **Event log**: commands and events per tick with payloads, ring-buffered,
  dumped on crash or assert.
- **Asserts on invariants** in development builds (`gameplay-testing`
  invariants double as runtime asserts).

## Profiling method

1. **Know the budget**: the simulation's share of the frame (or of a turn's
   response time) on the slowest target hardware, from the project profile.
2. **Measure first** with a profiler or scoped timers around each system's
   update; use a reproducible heavy scenario (seeded) as the benchmark.
3. **Find the top cost**, fix that only, re-measure. Typical gameplay costs:
   O(n^2) queries (fix with a spatial partition), per-tick allocation (fix
   with pools or preallocated buffers), recomputing derived values (dirty
   flags, caches), scattered memory access (data locality), too-frequent
   updates (update less often where the design allows).
4. **Keep the benchmark** as a regression check; record numbers in the PR.
5. **Do not trade determinism for speed**: multithreading the simulation needs
   an explicit, ordered merge.

## Checklist

- [ ] Failing test reproduces the bug before the fix.
- [ ] Repro minimised; first divergence identified; cause stated.
- [ ] Fix at the cause; full suite and replay tests pass; siblings checked.
- [ ] Profiling: budget known, measured before and after, numbers in PR.

## Failure modes

- "Could not reproduce, added a null check." The symptom is hidden, the cause
  remains.
- Debugging by print statements in a non-deterministic build: every run
  differs.
- Optimising the code you suspect instead of the code the profiler shows.
- Debug features that alter simulation state in release builds.

## Documentation this work owes

A bug fix updates **reference** if behaviour changed, and adds a
troubleshooting **how-to** if players or contributors can hit it. New debug
tools need **reference** (commands, overlays) and a **how-to** ("How to
capture a replay for a bug report").
