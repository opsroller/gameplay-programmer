# investigate-gameplay-bug

*Reference, for users and maintainers of the gameplay-programmer plugin.*

| Field | Value |
|---|---|
| Kind | Workflow |
| File | [`workflows/investigate-gameplay-bug.js`](../../../workflows/investigate-gameplay-bug.js) |
| Command | `/gameplay-programmer:investigate-gameplay-bug` |
| Skills used | gameplay-debugging-and-profiling, gameplay-testing, game-systems, deterministic-simulation |

## Args

| Arg | Required | Value |
|---|---|---|
| `bug` | yes | Issue link or description. |
| `capture` | no | Path to a seed, input log or save. |

Missing `bug`: returns the usage string.

## Phases

| Phase | Agents | Edits files | Does |
|---|---|---|---|
| Reproduce | 1 | test only | One failing replay or scenario test. Stops if not reproduced. |
| Diagnose | 1 | no | Minimise, first divergence, one-sentence cause, searchable pattern, doc kinds via the compass. |
| Fix | 1 | yes | Fix at the cause; regression test unchanged; suite and replay tests green. |
| Siblings | 3 parallel + 0-1 | search: no; fix: yes | Search core, adapter and content loading, tests for the same pattern; one agent applies all sibling fixes. |
| Docs | 1 | yes | Planned pages, one kind per page. |
| Check | 1 | no | Regression test fails without the fix and passes with it; suite; docs kinds. |

## Outputs

| Field | Meaning |
|---|---|
| `status` | `done`, `blocked` or `unverified`. |
| `cause` | One-sentence root cause. |
| `test` | The regression test. |
| `siblingsFixed` | Other instances fixed. |
| `unverifiedSearches` | Sibling searches whose agent failed. |
| `docs`, `undocumented` | Pages touched; gaps and why. |
