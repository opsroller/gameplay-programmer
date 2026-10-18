# gameplay-programmer

A Claude Code plugin for the **gameplay programmer** job function: the person
who turns a game designer's rules into code that behaves exactly as designed,
every time. It implements rules and systems in an engine-independent core,
keeps the simulation deterministic (fixed timestep, seeded randomness, replay
hashes), models modes as state machines and flows as commands and events,
tests with unit, scenario, property and replay tests, binds the core to the
engine through a thin adapter, keeps content data-driven, and debugs and
profiles gameplay. It works on any game project: the project's own
`CLAUDE.md` and profile say which language, engine and commands to use.

## Install

```
/plugin marketplace add opsroller/claude-plugins
/plugin install gameplay-programmer@opsroller
```

It builds on `engineering-practices` (install it too).

## Documentation

**Start here.** [Build your first game rule](docs/tutorials/first-task.md)
walks through one rule from spec to pull request.

**Getting a job done.** The how-to guides cover the role's everyday tasks:
[implement a game system](docs/how-to/how-to-implement-a-game-system.md),
[build a gameplay tool](docs/how-to/how-to-build-a-gameplay-tool.md),
[fix a gameplay bug](docs/how-to/how-to-fix-a-gameplay-bug.md),
[make a simulation deterministic](docs/how-to/how-to-make-a-simulation-deterministic.md),
[expose a system to the engine](docs/how-to/how-to-expose-a-system-to-the-engine.md) and
[make content data-driven](docs/how-to/how-to-make-content-data-driven.md).

**Looking something up.** The [reference](docs/reference/index.md) describes
the agent, the seven skills and the three workflows with their args and
outputs.

**Understanding the role.** [About the gameplay programmer role](docs/explanation/about-the-role.md)
explains what the job is, why the plugin works the way it does, its boundaries
with neighbouring roles, and how the role grows from junior to principal.
The research behind it is in [SOURCES.md](SOURCES.md).

Versioned with semver tags; changes follow Conventional Commits.

## License

Copyright (C) 2026 Charles (opsroller) and contributors. Licensed under the GNU General Public License v2.0 or later (`GPL-2.0-or-later`); see `LICENSE`.
