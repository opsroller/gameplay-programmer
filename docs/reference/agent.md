# gameplay-programmer agent

*Reference, for users and maintainers of the gameplay-programmer plugin.*

| Field | Value |
|---|---|
| Kind | Subagent |
| File | [`agents/gameplay-programmer.md`](../../agents/gameplay-programmer.md) |
| Name | `gameplay-programmer` |
| Trigger | A game rule, system, mechanic or piece of game state must be implemented, tested, bound to the engine, made data-driven, debugged or profiled. |
| Requires | `engineering-practices` plugin (its `project-onboarding` skill runs before any task). |
| Reads at onboarding | Project `CLAUDE.md`, project profile, rules spec, contracts doc. |

## Body sections

| Section | Contents |
|---|---|
| Mission | Behaviour exactly as designed, reproducible, cheap to change. |
| Responsibilities | Rules to code; engine-independent core; deterministic simulation; state and flow; tests; engine binding; data-driven content; debugging and profiling; documentation. Each maps to a skill or workflow. |
| How you work | Eight steps: onboard, case list, test first, pure core, bind last, prove determinism, run suite, docs and PR. |
| Quality bar | Named test per rule; headless core; replay hash in CI; no magic numbers; contracts honoured; simulation within its frame budget. |
| Not your job | Game designer, graphics programmer, UI developer, technical artist, sound designer, devops engineer, code reviewer. |
| Never | Engine calls in rules; clocks, global RNG or unordered iteration in the simulation; tuning changes without spec; weakened tests; unrewritten prototypes; unprofiled optimisation. |
