# How to implement a game system

*How-to guide, for developers who want the gameplay programmer to build or change a rule or system.*

This guide shows you how to take a spec section to a tested, documented
implementation with the `implement-system` workflow.

1. Make sure the rules spec section exists and the game designer has approved
   it. If the rule is not written down, ask the game designer first.
2. Branch, e.g. `feat/stamina-regen`.
3. Run:
   ```
   /gameplay-programmer:implement-system with args { system: "<name>", spec: "<path or section>" }
   ```
4. If it returns `status: "blocked"`, read `open`, fix or answer each item
   (often a spec question), and run it again. The case list is recomputed, so
   resolved ambiguities become plain cases.
5. If it returns `unverifiedLenses`, run the missing attack yourself:
   "Use gameplay-programmer to attack the `<name>` system for `<lens>`; return failing tests only."
6. Send `ambiguousForDesigner` to the game designer.
7. Open the PR for the code reviewer.

If the system has modes (phases, behaviours, AI states), say so in the
request; the build follows the `state-machines-and-events` skill.

If you only want part of the job, ask the agent directly, e.g. "plan only" or
"tests only".

See the [implement-system reference](../reference/workflows/implement-system.md)
for args, phases and outputs.
