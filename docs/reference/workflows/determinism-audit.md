# determinism-audit

*Reference, for users and maintainers of the gameplay-programmer plugin.*

| Field | Value |
|---|---|
| Kind | Workflow |
| File | [`workflows/determinism-audit.js`](../../../workflows/determinism-audit.js) |
| Command | `/gameplay-programmer:determinism-audit` |
| Skills used | deterministic-simulation, gameplay-testing |

## Args

| Arg | Required | Value |
|---|---|---|
| `scope` | yes | Path or system name of the simulation code. |

Missing `scope`: returns the usage string.

## Phases

| Phase | Agents | Edits files | Does |
|---|---|---|---|
| Plan | 1 | no | Simulation files; whether a state hash and replay test exist; doc kinds via the compass. |
| Audit | 5, parallel | no | Lenses: time, randomness, ordering, numbers and hidden inputs, hash/save coverage. Each returns findings. |
| Prove | 1 | tests | Adds or strengthens the state hash, hash-coverage test and replay test; lists failing checks. |
| Fix | 0-1 | yes | One agent fixes all findings and failing checks; regenerates golden hashes only on intended outcome changes. |
| Docs | 1 | yes | `about-determinism` explanation and reference pages. |
| Check | 1 | no | Replay passes twice and under each shipped build configuration; findings addressed; docs kinds. |

## Outputs

| Field | Meaning |
|---|---|
| `status` | `done`, `blocked` or `unverified`. |
| `findingsFixed` | Findings fixed. |
| `unverifiedLenses` | Audit lenses whose agent failed. |
| `replayTest` | The replay test. |
| `docs`, `undocumented` | Pages touched; gaps and why. |

## Run modes

Run modes v1. Besides its own args, the workflow takes the optional `run` arg defined in the engineering-practices
[workflow run modes reference](https://github.com/opsroller/engineering-practices/blob/main/docs/reference/workflow-run-modes.md):
`run: { mode: "inline" }` runs every phase in the calling session with no subagents, `run.only` runs chosen phases or steps,
and `run.from` with `run.results` resumes a stopped run. Without `run`, the workflow and its outputs are as above.
See [how to run a workflow inline](https://github.com/opsroller/engineering-practices/blob/main/docs/how-to/how-to-run-a-workflow-inline.md).

Step labels, for `run.only` and `run.results`: `plan`, `audit:<lens>` (`audit:time`, `audit:randomness`, `audit:ordering`, `audit:numbers and hidden inputs`, `audit:coverage`), `prove`, `fix`, `docs`, `check`.
