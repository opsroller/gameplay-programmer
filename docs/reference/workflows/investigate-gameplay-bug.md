# investigate-gameplay-bug

*Reference, for users and maintainers of the gameplay-programmer plugin.*

| Field | Value |
|---|---|
| Kind | Workflow |
| File | [`workflows/investigate-gameplay-bug.js`](../../../workflows/investigate-gameplay-bug.js) |
| Command | `/gameplay-programmer:investigate-gameplay-bug` |
| Skills used | gameplay-debugging-and-profiling, gameplay-testing, game-systems, deterministic-simulation, engine-integration, state-machines-and-events, data-driven-content (by bug kind) |

## Args

| Arg | Required | Value |
|---|---|---|
| `bug` | yes | Issue link or description. |
| `capture` | no | Path to a seed, input log, save or leak report. |
| `kind` | no | Bug kind: `simulation`, `lifecycle`, `resource` or `integration`; see [Bug kinds](#bug-kinds). Omitted: Reproduce classifies the bug. |

Missing `bug`: returns the usage string. An unknown `kind`: returns an
error naming the kinds, and the usage string.

## Bug kinds

The kind decides the failing test, how Diagnose finds the first
divergence, the skills and checks the Fix follows, and where Siblings
searches.

| Kind | Means | Failing test | First divergence | Checks | Sibling lenses (labels) |
|---|---|---|---|---|---|
| `simulation` | Wrong rule, desync or crash in the deterministic game logic. | Replay or scenario test. | First diverging tick and subsystem, from per-tick state hashes or dumps. | Full suite and replay tests. | `simulation` core, `engine` adapter and content loading, `tests` |
| `lifecycle` | Wrong order or state across start-up, load and unload, pause and resume, quit and teardown, threads. | Headless engine test that drives the lifecycle steps. | First lifecycle step whose order, owner or state differs from the expected sequence. | Full suite and headless engine tests. | `adapter` lifecycle hooks, `owners` with the same lifecycle, `tests` |
| `resource` | Leak or lifetime error: memory, objects, nodes, handles, files, GPU resources, threads. | Smallest create and release cycle; fails on a count that does not return, a leak report, a sanitizer or the exit code. | The leaking allocation, its owner and the release path that misses it. | Full suite and the leak check the test added. | `owners` of the same resource, `adapter` teardown and quit paths, `tests` |
| `integration` | Wrong data or calls across the boundary to the engine, platform or content. | Adapter unit test or headless engine test at the boundary. | First boundary call whose input or output is wrong. | Full suite and headless engine tests. | `adapter` conversions, `content` loading, platform and config, `tests` |

## Phases

| Phase | Agents | Edits files | Does |
|---|---|---|---|
| Reproduce | 1 | tests, test harness and CI only | Classifies the bug if `kind` is not given; one failing test of the kind's type. No game code changes. May change the test harness (runner, fixtures, test-only hooks release builds never run) and CI steps when the test needs them, in their own `test:` or `ci:` commit, listed in `harness`. Stops if not reproduced or no kind. |
| Diagnose | 1 | no | Minimise, the kind's first divergence, one-sentence cause, searchable pattern, doc kinds via the compass. |
| Fix | 1 | yes | Fix at the cause, apart from the harness and CI commits; regression test unchanged; the kind's checks green. Returns `open` (blocking items) and `notes` (non-blocking); blocks only when not green or `open` is not empty. |
| Siblings | 3 parallel + 0-1 | search: no; fix: yes | Search the kind's three lenses for the same pattern; one agent applies all sibling fixes, with the same `open` and `notes` split. Each sibling test must be red first: it fails, or the build fails only on a missing API it calls; recorded in `red` and copied to `notes`. |
| Docs | 1 | yes | Planned pages, one kind per page. |
| Check | 1 | no | Regression test fails without the fix and passes with it; the kind's checks; harness and CI changes kept apart from the fix; docs kinds. |
| Handoff | 1 | commits and pushes | Cuts a `fix/<slug>` branch if on the default branch, commits and pushes everything this run wrote, runs the checks on the pushed head. Opens no PR. Blocks if it cannot push or the checks fail. |

## Outputs

| Field | Meaning |
|---|---|
| `status` | `done`, `blocked` or `unverified`. |
| `kind` | The bug kind used. |
| `cause` | One-sentence root cause. |
| `test` | The regression test. |
| `harness` | Test-harness and CI changes Reproduce made. |
| `siblingsFixed` | Other instances fixed. |
| `unverifiedSearches` | Sibling searches whose agent failed. |
| `docs`, `undocumented` | Pages touched; gaps and why. |
| `notes` | Non-blocking notes from Fix and the sibling fix (follow-ups, observations). |
| `handoff` | The deliver-package `prior` handoff; see [Handoff](#handoff). |
| `next` | How to ship it: deliver-package with the whole result as `prior`, or land-pr on the branch with no work package. |

## Handoff

`handoff` is the object engineering-practices
[deliver-package](https://github.com/opsroller/engineering-practices/blob/main/docs/reference/workflow-deliver-package.md)
takes as `prior`, so pass the whole result and the fix ships without
being built again: `from` (`gameplay-programmer:investigate-gameplay-bug`),
`branch`, `pr`, `head_sha`, `tests_pass`, `docs`, `undocumented`, `notes`
(bug kind, root cause, regression test, harness and CI changes,
unverified sibling searches, then the fix notes). With no work
package, land the branch with land-pr instead; `next` names both.

## Run modes

Run modes v2. Besides its own args, the workflow takes the optional `run` arg defined in the engineering-practices
[workflow run modes reference](https://github.com/opsroller/engineering-practices/blob/main/docs/reference/workflow-run-modes.md):
`run: { mode: "inline" }` runs every phase in the calling session with no subagents, `run.only` runs chosen phases or steps,
and `run.from` with `run.results` resumes a stopped run. Without `run`, the workflow and its outputs are as above.
See [how to run a workflow inline](https://github.com/opsroller/engineering-practices/blob/main/docs/how-to/how-to-run-a-workflow-inline.md).

Step labels, for `run.only` and `run.results`: `reproduce`, `diagnose`, `fix`, `siblings:<lens>` (by kind, see [Bug kinds](#bug-kinds): `siblings:simulation`, `siblings:engine`, `siblings:adapter`, `siblings:owners`, `siblings:content`, `siblings:tests`), `fix-siblings`, `docs`, `check`, `handoff`.

Independent steps: `check`. They review work this run produced, so in inline mode send each to a reviewer with no part in the work and name them in `run.reviewers`; a step you answer yourself is reported in `self_reviewed`.
