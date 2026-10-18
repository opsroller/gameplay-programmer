# About the gameplay programmer role

*Explanation, for anyone deciding how to use this role or wondering why it works the way it does.*

## What the job is

A gameplay programmer makes the game *behave*. Designers decide that armour
reduces damage or that a door opens when three switches are on; the gameplay
programmer turns that decision into code that holds every time, in every
situation the designer did and did not foresee. Job postings across studios
describe the same core: build gameplay features and systems together with
design, turn design specs into usable systems, prototype quickly, write
maintainable code with automated tests, debug and optimise, and, at senior
levels, own large data-driven systems, spot risk and mentor others.

It sits between two worlds. On one side is design, which changes its mind
often and for good reasons; on the other is the engine, which draws, plays
sound and reads input. Most of the role's methods exist to keep those two
worlds from tangling.

## Why an engine-independent core

The plugin insists that rules live in code with no engine, rendering or UI
dependency, and that the engine reaches them through a thin adapter. The
reasons are practical:

- **Tests become cheap.** Rules can be tested in milliseconds without starting
  the engine. Rare's experience building a long-running live game was that
  automated tests, most of them below the engine level, gave faster
  verification, more stable builds and less crunch. Tests that need the engine
  are slower and flakier, so they get run less.
- **Two copies of a rule always drift.** If the engine script decides who
  takes damage and the core also does, they will disagree one day.
- **The engine can change.** Engines are upgraded, replaced or joined by a
  server build. A core that does not know about any engine survives that.

The cost is a binding layer and a discipline of "results as data": the core
must report what happened in enough detail that presentation can animate it
without re-deriving rules. That discipline is the price of the benefits above,
and most teams that skip it pay later.

## Why determinism

Determinism (the same initial state and inputs give the same result, bit for
bit) sounds like a networking concern, and it is: lockstep multiplayer depends
on it. But its everyday value is debugging. A deterministic game turns every
bug report with a seed and an input log into a replayable recording, and every
desync into a mechanical search for the first diverging tick. Factorio's
developers describe exactly this: per-tick checksums plus readable state dumps
make the first difference "typically just a value of one variable".

Determinism is cheap to keep and expensive to add later, because the things
that break it (clock reads, shared random generators, unordered iteration,
floating-point differences between builds) spread quietly. That is why the
plugin makes it a default rather than an option, and why the floating-point
policy is a decision to be written down: cross-platform bit-exactness may
require fixed-point maths, which is a real cost worth deciding consciously.

## Why state machines, commands and events

Behaviour that depends on mode tends to grow as boolean flags whose
combinations nobody can enumerate. Nystrom's *Game Programming Patterns*
shows the progression from flags to finite, hierarchical and pushdown state
machines, and also their limit: rich AI outgrows them. The plugin uses them
where they fit and says so where they do not.

Commands in and events out is the same idea at the system boundary. Commands
are values, so they can be recorded, replayed, sent over a network or undone.
Events are facts other roles hook: the sound designer plays a sound on
`UnitDied`; the UI developer updates the HUD. Event queues are powerful but
are global state in disguise when overused, so the skill limits them to cases
that truly need deferral.

## Why data-driven content

Designers iterate faster than engineers can rebuild. Scott Bilas's account of
a component-based, data-driven object system makes the case: fixed class
hierarchies harden as requests cut across categories, and designers without
the features they need hack around them. The plugin moves *what varies* into
validated data and keeps *how it behaves* in tested code, and warns about the
other side Bilas also reported: template systems designed for dozens of entries
grow into thousands.

## Testing as a ladder

Unit tests catch a rule broken by a change. Property and stateful tests, in the
QuickCheck tradition, catch the combinations nobody wrote down by generating
many states and command sequences and shrinking a failure to a short readable
case. Replay tests catch determinism regressions. A few headless engine tests
catch binding errors. Humans judge feel and fun; that is not automation's job,
and the plugin does not pretend otherwise.

## Boundaries with neighbouring roles

| Role | They own | Gameplay programmer's part |
|---|---|---|
| Game designer | Rules, numbers, balance, levels, feel targets | Implement, ask, report ambiguities, give tuning through data |
| Graphics programmer | Rendering, camera, animation code, input, draw frame time | Supply results and the interpolation factor to animate |
| UI developer | Menus, HUD, localization, UI accessibility | Supply events and queries the UI shows |
| Sound designer | Sounds, music, mixing | Emit events they hook |
| Technical artist | Assets, materials, pipeline, budgets | Agree content formats where assets carry gameplay data |
| Devops engineer | CI, builds, releases | Keep tests fast and deterministic enough for CI |
| Code reviewer | Review and verdict | Open PRs that are reviewable: tests, docs, small diffs |

The hardest boundary is with design. A gameplay programmer often sees a better
rule while implementing one. The role's answer is to raise it, not to ship it:
spec drift in code is invisible to the designer who owns the experience.

## How the role grows

Frameworks such as SFIA describe programming responsibility in levels, from
applying agreed standards to moderately complex work, to owning complex
integrations and leading reviews, to setting standards and leading strategic
work. In gameplay terms:

- **Junior**: implements well-specified rules with tests; learns the core,
  the adapter and the project's patterns; asks early.
- **Mid**: owns whole systems from spec to docs; spots ambiguities before
  coding; keeps determinism and data-driven discipline without prompting;
  debugs from first divergence.
- **Senior**: designs system architecture with design; plans large,
  data-driven features; spots project risk; mentors; profiles and sets budgets.
- **Principal / lead**: sets the team's standards (testing, determinism,
  boundaries), chooses where flexibility is worth its cost, and raises quality
  across projects.

## Trade-offs this plugin accepts

- **Flexibility before speed.** Following Nystrom, the plugin keeps code
  flexible while the design moves and optimises once it settles, guided by a
  profiler. A game that is fast but not fun is the worse failure.
- **Prototypes are disposable.** Quick, rough code is a legitimate tool, but it
  is rewritten to the quality bar before it enters production.
- **Process has a price.** Case lists, attack passes and docs steps slow a
  single change and speed up the hundredth. For throwaway experiments, use the
  agent directly and skip the workflows.

See the [reference](../reference/index.md) for what each skill contains and
[SOURCES.md](../../SOURCES.md) for the research behind this page.
