# implement-system

*Reference, for users and maintainers of the gameplay-programmer plugin.*

| Field | Value |
|---|---|
| Kind | Workflow |
| File | [`workflows/implement-system.js`](../../../workflows/implement-system.js) |
| Command | `/gameplay-programmer:implement-system` |
| Skills used | game-systems, deterministic-simulation, state-machines-and-events, gameplay-testing |

## Args

| Arg | Required | Value |
|---|---|---|
| `system` | yes | Name of the rule or system. |
| `spec` | yes | Path or section of the rules spec. |

Missing args: returns the usage string.

## Phases

| Phase | Agents | Edits files | Does |
|---|---|---|---|
| Plan | 1 | no | Case list, `AMBIGUOUS:` items with defaults, doc kinds via the compass. |
| Build | 1 | yes | Failing tests in one test file, then code, until the suite is green. Commits. |
| Attack | 3, parallel | no | Lenses: determinism, edge cases and bounds, contract fidelity. Each returns failing test code. |
| Fix | 0-1 | yes | One agent adds all returned tests in one edit, then fixes the code. Runs only if tests were returned. |
| Docs | 1 | yes | Writes the planned pages in the project's docs, one kind per page. |
| Check | 1 | no | Suite and replay tests; each touched page one kind, kind line, title pattern, links. |

## Outputs

| Field | Meaning |
|---|---|
| `status` | `done`, `blocked` (with `open` or `reason`) or `unverified` (check agent failed). |
| `cases` | Number of cases planned. |
| `ambiguousForDesigner` | Defaults implemented as named constants, for the game designer. |
| `attackTestsAdded` | Tests added from the Attack phase. |
| `unverifiedLenses` | Attack lenses whose agent failed. |
| `docs`, `undocumented` | Pages touched; changes left undocumented and why. |

A string starting `blocked:` means planning or building failed before any
structured result.

## Run modes

Run modes v1. Besides its own args, the workflow takes the optional `run` arg defined in the engineering-practices
[workflow run modes reference](https://github.com/opsroller/engineering-practices/blob/main/docs/reference/workflow-run-modes.md):
`run: { mode: "inline" }` runs every phase in the calling session with no subagents, `run.only` runs chosen phases or steps,
and `run.from` with `run.results` resumes a stopped run. Without `run`, the workflow and its outputs are as above.
See [how to run a workflow inline](https://github.com/opsroller/engineering-practices/blob/main/docs/how-to/how-to-run-a-workflow-inline.md).

Step labels, for `run.only` and `run.results`: `plan`, `build`, `attack:<lens>` (`attack:determinism`, `attack:edge cases and bounds`, `attack:contract fidelity`), `fix`, `docs`, `check`.
