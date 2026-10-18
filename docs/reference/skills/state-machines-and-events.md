# state-machines-and-events

*Reference, for users and maintainers of the gameplay-programmer plugin.*

| Field | Value |
|---|---|
| Kind | Skill |
| File | [`skills/state-machines-and-events/SKILL.md`](../../../skills/state-machines-and-events/SKILL.md) |
| Trigger | Use when a game mode, entity behaviour, turn structure or flow (menus-to-play, phases, AI modes) depends on state, or when systems must talk to each other. Covers finite, hierarchical and pushdown state machines, commands in, events out, and event-queue pitfalls. |
| Covers | Finite, hierarchical, pushdown and concurrent state machines; enter/exit actions; commands (requests) in, events (facts) out; event-queue rules. |
| Produces | State table; transition functions; command and event types; per-cell and property tests. |
| Docs owed | Reference for state table and command/event payloads; explanation if a design choice was made. |
| Sections | When you need a state machine; Method; Commands in, events out; Event-queue rules; Checklist; Failure modes; Documentation this work owes |
