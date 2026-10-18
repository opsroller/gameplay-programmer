# implement-system

*Reference, for users and maintainers of the gameplay-programmer plugin.*

| Field | Value |
|---|---|
| Kind | Workflow |
| File | [`workflows/implement-system.js`](../../../workflows/implement-system.js) |
| Command | `/gameplay-programmer:implement-system` |
| Skills used | game-systems, deterministic-simulation, state-machines-and-events, gameplay-testing, gameplay-debugging-and-profiling (tool budget); engineering-practices git-workflow (hand-off) |

## Args

| Arg | Required | Value |
|---|---|---|
| `system` | yes | Name of the rule, system or tool. |
| `spec` | yes | Path or section of the spec. |
| `target` | no | `"system"` (default): a rule or system in the engine-independent core. `"tool"`: a tool or command-line program over the core. |
| `wp` | no | Work package id. Plan checks it against the project's work-package list; it must exist and be this system's or tool's package. Goes into the PR body as `Refs:` and makes `next` point at deliver-package. |
| `branch` | no | Existing branch to work on; its open PR is reused. |
| `pr` | no | Existing PR to work on, with its head branch. |

Missing `system` or `spec`: returns the usage string. Any other `target`:
returns an error string and runs nothing.

## Tool target

With `target: "tool"`, the plan must also return `tool`, or the run stops
with `blocked: planning for tool ...`:

| Field | Meaning |
|---|---|
| `buildOption` | Build option that adds the tool to the project build. Off by default; on by default only when the project profile says its tools ship on. |
| `smokeTest` | One command that runs the built tool end to end on a small committed input, with expected exit code and output. Added to the test suite. |
| `budget` | Performance budget: metric (wall time, peak memory), limit, the input it is measured on, how to measure it. |

The cases cover options, input and output formats, exit codes, errors on
standard error and `--help`. The tool calls the core's public API and
copies no rules. Attack adds a fourth lens, `performance budget`, and its
determinism, edge-case and contract lenses check output bytes, exit
codes and the build option. Check builds with the option on, runs the
smoke test, measures the budget and confirms a build with it off leaves
the tool out.

## In-engine smoke test

For a system (not a tool), the plan always returns `engineSmoke`. When
the running game reaches the system (it is bound to the engine, loaded by
a scene, level or content file, or called from engine-side code), core
unit tests cannot catch a broken binding, load or registration, so the
work owes one smoke test that starts the engine headless on real content.

| Field | Meaning |
|---|---|
| `needed` | `true` when the running game reaches the system. |
| `why` | One line on how the game reaches it, or why it does not. |
| `test` | When needed: the smoke test. Starts the engine headless (or the project's automated run mode) on committed content, drives the system once, asserts one observable result, exits non-zero on failure. Uses the project's engine test harness if it has one. |
| `ci` | When needed: the pipeline change that runs it on every pull request (job or step, the engine binary or cache it needs, the file it goes in), or `none: <existing job>`. With no headless engine run in CI, the smallest addition is listed as `AMBIGUOUS`. |

With `needed: true` and no `test` or `ci`, the run stops with
`blocked: planning for ...`. Build adds the test and the CI change (via
engineering-practices peer-coordination when another role owns the
pipeline file) and must report `engineSmoke`, the local result, or the
run stops. Fix re-runs it, and Check runs it and confirms CI runs it on
pull requests. A tool target always returns `needed: false`; its own
smoke test is in [Tool target](#tool-target).

## Phases

| Phase | Agents | Edits files | Does |
|---|---|---|---|
| Plan | 1 | no | Case list, `AMBIGUOUS:` items with defaults, doc kinds via the compass. |
| Build | 1 | yes | Failing tests in one test file, then code, until the suite is green. Adds the in-engine smoke test and its CI change when needed. Commits. |
| Attack | 3, parallel | no | Lenses: determinism, edge cases and bounds, contract fidelity. Each returns failing test code. |
| Fix | 0-1 | yes | One agent adds all returned tests in one edit, confirms each is red, then fixes the code. A test is red when it fails, or when the build fails only on the API it calls that does not exist yet (the missing symbol and nothing else); each is recorded in `red` and copied to `notes` as `red before fix:`. Any other build error is not red. Runs only if tests were returned. Returns `failing` (tests still failing) apart from `notes`; only `failing` or a red suite blocks. |
| Docs | 1 | yes | Writes the planned pages in the project's docs, one kind per page. |
| Check | 1 | no | Suite and replay tests (for a tool, also smoke test, budget, option off; for a system the game reaches, the in-engine smoke test and its CI job); each touched page one kind, kind line, title pattern, links. Returns `problems` (failures) apart from `notes`; only `problems` blocks. |
| Hand off | 1 | no (pushes) | Pushes the branch; opens a draft PR if none is open. Does not mark it ready, request review or merge. |

## Outputs

| Field | Meaning |
|---|---|
| `status` | `done`, `blocked` (with `open` or `reason`, and `notes`) or `unverified` (check agent failed). `open` holds only failures. |
| `target` | `system` or `tool`. |
| `cases` | Number of cases planned. |
| `ambiguousForDesigner` | Defaults implemented as named constants, for the game designer. |
| `attackTestsAdded` | Tests added from the Attack phase. |
| `unverifiedLenses` | Attack lenses whose agent failed. |
| `docs`, `undocumented` | Pages touched; changes left undocumented and why. |
| `notes` | Informational notes from Build, Attack, Fix and Check, prefixed by step. Never blocking. |
| `engineSmoke` | Only when the game reaches the system: `test`, `ci` (the change made) and `result` (the local run Build reported). |
| `tool` | Tool target only: `buildOption`, `smokeTest`, `budget`, and `measured` (the value Build measured). |
| `handoff` | `{ from, branch, pr, head_sha, tests_pass, docs, undocumented, non_original, notes }`, the handoff object engineering-practices deliver-package takes as `prior`. |
| `next` | With `wp`: run deliver-package with `prior` set to this result, then land-pr. Without: land-pr, which marks the PR ready and asks the code reviewer. |

## Handing off

Pass the whole result to
[deliver-package](https://github.com/opsroller/engineering-practices/blob/main/docs/reference/workflow-deliver-package.md)
as `prior`; it ships the package without building it again. Without a
work package, run
[land-pr](https://github.com/opsroller/engineering-practices/blob/main/docs/reference/workflow-land-pr.md)
on the PR: it marks it ready, asks the code reviewer and squash-merges
once the reviewer passes it and CI is green.

A string starting `blocked:` means planning or building failed before any
structured result. `blocked: work package ... is not in the project's
work-package list` or `... is "<title>", not the system ...` means `wp`
was wrong: run again with the right id, or without `wp`.

## Run modes

Run modes v2. Besides its own args, the workflow takes the optional `run` arg defined in the engineering-practices
[workflow run modes reference](https://github.com/opsroller/engineering-practices/blob/main/docs/reference/workflow-run-modes.md):
`run: { mode: "inline" }` runs every phase in the calling session with no subagents, `run.only` runs chosen phases or steps,
and `run.from` with `run.results` resumes a stopped run. Without `run`, the workflow and its outputs are as above.
See [how to run a workflow inline](https://github.com/opsroller/engineering-practices/blob/main/docs/how-to/how-to-run-a-workflow-inline.md).

Step labels, for `run.only` and `run.results`: `plan`, `build`, `attack:<lens>` (`attack:determinism`, `attack:edge cases and bounds`, `attack:contract fidelity`, and for a tool `attack:performance budget`), `fix`, `docs`, `check`, `handoff`.

Independent steps: `attack:<lens>`, `check`. They review work this run produced, so in inline mode send each to a reviewer with no part in the work and name them in `run.reviewers`; a step you answer yourself is reported in `self_reviewed`.
