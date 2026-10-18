# gameplay-programmer reference

*Reference landing page, for users and maintainers of the gameplay-programmer plugin.*

Dry descriptions of everything the plugin contains, consulted while working.
For steps, see the [how-to guides](../how-to/); for the reasoning behind the
methods, see [About the gameplay programmer role](../explanation/about-the-role.md).

## The agent

- [gameplay-programmer agent](agent.md): the role as a subagent, its sections and boundaries.

## Skills

Building the game logic:
- [game-systems](skills/game-systems.md): spec to engine-independent core.
- [state-machines-and-events](skills/state-machines-and-events.md): modes, commands and events.
- [data-driven-content](skills/data-driven-content.md): schemas, type objects, validation.

Keeping it correct:
- [deterministic-simulation](skills/deterministic-simulation.md): timestep, RNG, ordering, hashing.
- [gameplay-testing](skills/gameplay-testing.md): the test suite, bottom to top.
- [gameplay-debugging-and-profiling](skills/gameplay-debugging-and-profiling.md): repro, divergence, budgets.

Connecting it:
- [engine-integration](skills/engine-integration.md): the thin adapter.

## Workflows

- [implement-system](workflows/implement-system.md): `{ system, spec, target?, wp?, branch?, pr? }`
- [investigate-gameplay-bug](workflows/investigate-gameplay-bug.md): `{ bug, capture? }`
- [determinism-audit](workflows/determinism-audit.md): `{ scope }`

## Plugin manifest

`.claude-plugin/plugin.json`:

| Field | Value |
|---|---|
| `name` | `gameplay-programmer` |
| `version` | `0.4.1` |
| `author.name` | `opsroller` |
| `repository` | `https://github.com/opsroller/gameplay-programmer` |
| `license` | `GPL-2.0-or-later` |
| `keywords` | `role`, `job-function`, `gameplay`, `game-systems`, `deterministic-simulation`, `testing`, `data-driven` |

## Sources

[SOURCES.md](../../SOURCES.md): the research this plugin is built on.
