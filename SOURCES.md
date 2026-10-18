# Sources

*Reference, for maintainers: the research this plugin is built on.*

## Job postings and frameworks

- Treyarch, Senior Gameplay Engineer posting (Game Developer) - https://www.gamedeveloper.com/programming/get-a-job-join-treyarch-as-a-senior-gameplay-engineer-3 - responsibilities: turn design specs into systems, prototype, debug, optimise, mentor; skills list.
- Senior Gameplay Engineer posting (Built In) - https://builtin.com/job/senior-gameplay-engineer/7596063 - data-driven scalable systems, automated tests, risk spotting, mentoring.
- Principal Gameplay Engineer posting (Built In) - https://builtin.com/job/principal-gameplay-engineer/7596069 - principal-level ownership, raising team standards; junior-to-principal ladder.
- Gameplay Programmer posting, Yellow Brick Games (Espresso Jobs) - https://www.espresso-jobs.com/emploi/162358/gameplay-programmer-yellow-brick-games-montreal - collaboration with design and art; combat and systems work.
- SFIA 9, Programming/software development (PROG) - https://sfia-online.org/en/skillcode/9/PROG - responsibility levels used for the junior-to-principal progression.
- O*NET 15-1255.01 Video Game Designers - https://www.onetonline.org/link/details/15-1255.01 - boundary with design: balancing, prototyping and test planning sit with design.

## Books and practitioner write-ups

- Robert Nystrom, *Game Programming Patterns* (contents) - https://gameprogrammingpatterns.com/contents.html - pattern table in game-systems.
- Nystrom, "Architecture, Performance, and Games" - https://gameprogrammingpatterns.com/architecture-performance-and-games.html - decoupling, flexibility before speed, disposable prototypes.
- Nystrom, "Game Loop" - https://gameprogrammingpatterns.com/game-loop.html - fixed update with variable rendering, capped catch-up.
- Nystrom, "State" - https://gameprogrammingpatterns.com/state.html - flag soup, FSM, hierarchical, pushdown, limits.
- Nystrom, "Event Queue" - https://gameprogrammingpatterns.com/event-queue.html - queue rules: scope, stale state, feedback loops, ring buffer.
- Nystrom, "Command" - https://gameprogrammingpatterns.com/command.html - commands for input, AI, undo and replay.
- Nystrom, "Type Object" - https://gameprogrammingpatterns.com/type-object.html - data-defined kinds, inheritance trade-offs.
- Glenn Fiedler, "Deterministic Lockstep" - https://gafferongames.com/post/deterministic_lockstep/ - determinism definition, inputs, checksums, float pitfalls.
- Glenn Fiedler, "Fix Your Timestep!" - https://gafferongames.com/post/fix_your_timestep/ - accumulator, spiral of death, interpolation.
- Factorio Friday Facts #47, "CRC fun" - https://factorio.com/blog/post/fff-47 - per-tick CRC and readable dumps to find the first desync.
- Factorio Friday Facts #60, "Tests all around" - https://factorio.com/blog/post/fff-60 - unit, integration and CRC-checked tests for game logic.
- Bugnet, "How to debug desync in deterministic lockstep games" - https://bugnet.io/blog/how-to-debug-desync-in-deterministic-lockstep-games - per-subsystem hashes, common desync causes, prevention list.
- Hypothesis, "Rule Based Stateful Testing" - https://hypothesis.works/articles/rule-based-stateful-testing/ - stateful property tests: rules, preconditions, short failing sequences.

## Talks

- Rare, "Automated Testing of Gameplay Features in Sea of Thieves" (GDC 2019) - https://gdcvault.com/play/1026366/Automated-Testing-of-Gameplay-Features - unit, integration and actor tests; testing from day one. Summary used: https://glasp.co/youtube/X673tOi8pU8
- Jessica Baker, "Automated Testing at Scale in Sea of Thieves" (Unreal Fest Europe 2019) - https://www.unrealengine.com/events/unreal-fest-europe-2019/automated-testing-at-scale-in-sea-of-thieves - tests as a tool, not a chore, for a live game.
- Scott Bilas, "A Data-Driven Game Object System" (GDC 2002) - https://www.sebaslab.com/wp-content/uploads/2022/07/data-driven-game-object-system1.pdf - components, schemas, templates, why hierarchies harden.
- Timothy Ford, "Overwatch Gameplay Architecture and Netcode" (GDC 2017) - https://gdcvault.com/play/1024001/-Overwatch-Gameplay-Architecture-and - ECS and determinism in a shipped game (abstract only).

## Tools and command-line programs

- Command Line Interface Guidelines (clig.dev) - https://clig.dev/ - exit codes, output to stdout and errors to stderr, `--help`, machine-readable output (tool target cases).
- POSIX.1-2017, Utility Conventions - https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/V1_chap12.html - option and argument syntax (tool target cases).
- GNU Coding Standards, Standards for Command Line Interfaces - https://www.gnu.org/prep/standards/html_node/Command_002dLine-Interfaces.html - `--help`, `--version`, long options (tool target cases).
- CMake, `option()` - https://cmake.org/cmake/help/latest/command/option.html - an example of a boolean build option, default off, that adds an optional target (tool build option).
- Smoke testing (software), Wikipedia - https://en.wikipedia.org/wiki/Smoke_testing_(software) - a quick end-to-end run that shows a build works at all (tool smoke test).
- Addy Osmani, "Performance budgets 101" (web.dev) - https://web.dev/articles/performance-budgets-101 - a budget as a metric, a limit and a check that fails the build (tool performance budget).
- Martin Fowler, "Deployment Pipeline" - https://martinfowler.com/bliki/DeploymentPipeline.html - build once and hand the same build on, instead of rebuilding (Hand off phase).

## Documentation

- Diataxis - https://diataxis.fr - documentation structure; applied through the project's Diataxis guide.
