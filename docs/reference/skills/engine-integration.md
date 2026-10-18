# engine-integration

*Reference, for users and maintainers of the gameplay-programmer plugin.*

| Field | Value |
|---|---|
| Kind | Skill |
| File | [`skills/engine-integration/SKILL.md`](../../../skills/engine-integration/SKILL.md) |
| Trigger | Use when exposing engine-independent game logic to a game engine, scripting layer or another language through a binding: the thin adapter, type conversion, commands in and events out, error containment, lifetime, and the headless smoke test. |
| Covers | Thin adapter between core and engine: type conversion, command forwarding, event emission, fixed-step driving, error containment, shared build flags, prefixed names, per-area registration, lifetime, headless smoke test. |
| Produces | Adapter and conversion module; registration entry; headless smoke test; contracts doc entries. |
| Docs owed | Reference for the bound API; how-to the first time the procedure exists; explanation if the boundary was a design choice. |
| Sections | Shape of the adapter; Method; Checklist; Failure modes; Documentation this work owes |
