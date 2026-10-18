# Gameplay Programmer

Gameplay programmer: implements game rules and systems as deterministic, tested code with a clean boundary to the engine.

This plugin is a **job function**, not a project. It says how the job is done; the project it works on says with which tools, in its `CLAUDE.md` and project profile.

## Skills

| Skill | Use when |
|---|---|
| `game-systems` | Use when designing or implementing game logic: state, rules, results, randomness and time. |
| `unit-testing` | Use when writing or fixing tests for game logic. |
| `engine-integration` | Use when exposing game logic to a game engine or binding code across a language boundary. |

## Workflows

Multi-agent workflows (Claude Code Workflow scripts in `workflows/`).

| Workflow | Does |
|---|---|
| `/gameplay-programmer:implement-system` | Implement a game system test-first from its spec, then adversarially check determinism and edge cases |

## Agent

`agents/gameplay-programmer.md` defines the role as a subagent.

## Install

```
/plugin marketplace add opsroller/claude-plugins
/plugin install gameplay-programmer@opsroller
```

Versioned on its own with semver tags (`v0.1.0`). Changes follow Conventional Commits.
