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
| Handoff | 1 | commits and pushes | Cuts a `fix/<slug>` branch if on the default branch, commits and pushes everything this run wrote, runs the checks on the pushed head. Opens no PR. Blocks if it cannot push or the checks fail. |

## Outputs

| Field | Meaning |
|---|---|
| `status` | `done`, `blocked` or `unverified`. |
| `cause` | One-sentence root cause. |
| `test` | The regression test. |
| `siblingsFixed` | Other instances fixed. |
| `unverifiedSearches` | Sibling searches whose agent failed. |
| `docs`, `undocumented` | Pages touched; gaps and why. |
| `handoff` | The deliver-package `prior` handoff; see [Handoff](#handoff). |
| `next` | How to ship it: deliver-package with the whole result as `prior`, or land-pr on the branch with no work package. |

## Handoff

`handoff` is the object engineering-practices
[deliver-package](https://github.com/opsroller/engineering-practices/blob/main/docs/reference/workflow-deliver-package.md)
takes as `prior`, so pass the whole result and the fix ships without
being built again: `from` (`gameplay-programmer:investigate-gameplay-bug`),
`branch`, `pr`, `head_sha`, `tests_pass`, `docs`, `undocumented`, `notes`
(root cause, regression test, unverified sibling searches). With no work
package, land the branch with land-pr instead; `next` names both.

## Run modes

Run modes v2. Besides its own args, the workflow takes the optional `run` arg defined in the engineering-practices
[workflow run modes reference](https://github.com/opsroller/engineering-practices/blob/main/docs/reference/workflow-run-modes.md):
`run: { mode: "inline" }` runs every phase in the calling session with no subagents, `run.only` runs chosen phases or steps,
and `run.from` with `run.results` resumes a stopped run. Without `run`, the workflow and its outputs are as above.
See [how to run a workflow inline](https://github.com/opsroller/engineering-practices/blob/main/docs/how-to/how-to-run-a-workflow-inline.md).

Step labels, for `run.only` and `run.results`: `reproduce`, `diagnose`, `fix`, `siblings:<layer>` (`siblings:simulation`, `siblings:engine`, `siblings:tests`), `fix-siblings`, `docs`, `check`, `handoff`.

Independent steps: `check`. They review work this run produced, so in inline mode send each to a reviewer with no part in the work and name them in `run.reviewers`; a step you answer yourself is reported in `self_reviewed`.
