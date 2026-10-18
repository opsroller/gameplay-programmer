# How to implement a game system

*How-to guide, for developers who want the gameplay programmer to build or change a rule or system.*

This guide shows you how to take a spec section to a tested, documented
implementation with the `implement-system` workflow.

1. Make sure the rules spec section exists and the game designer has approved
   it. If the rule is not written down, ask the game designer first.
2. Branch, e.g. `feat/stamina-regen`, or pass `branch` or `pr` to work on
   one you were assigned.
3. Run, adding `wp` if the work belongs to a work package:
   ```
   /gameplay-programmer:implement-system with args { system: "<name>", spec: "<path or section>", wp: "WP-NN" }
   ```
4. If it returns `status: "blocked"`, read `open`: every entry there is a
   failure. Fix or answer each one (often a spec question) and run it again.
   The case list is recomputed, so resolved ambiguities become plain cases.
   `notes` never block; read them for follow-ups.
5. If it returns `unverifiedLenses`, run the missing attack yourself:
   "Use gameplay-programmer to attack the `<name>` system for `<lens>`; return failing tests only."
6. If the running game reaches the system, the result carries
   `engineSmoke`: the in-engine smoke test and the CI change that runs
   it. Check the CI change landed in the same PR; if another role owns
   the pipeline file, make sure they agreed to it.
7. Send `ambiguousForDesigner` to the game designer.
8. Ship it from the `next` field, without rebuilding. With a work
   package, pass the whole result to deliver-package:
   ```
   /engineering-practices:deliver-package { wp: "WP-NN", prior: <the implement-system result> }
   ```
   Without one, run `/engineering-practices:land-pr { pr: "<the PR>" }`;
   it marks the PR ready, asks the code reviewer, and squash-merges once
   the reviewer passes it and CI is green.

If the system has modes (phases, behaviours, AI states), say so in the
request; the build follows the `state-machines-and-events` skill.

To build a tool or command-line program instead, see
[how to build a gameplay tool](how-to-build-a-gameplay-tool.md).

If you only want part of the job, ask the agent directly, e.g. "plan only" or
"tests only".

See the [implement-system reference](../reference/workflows/implement-system.md)
for args, phases and outputs.
