# deterministic-simulation

*Reference, for users and maintainers of the gameplay-programmer plugin.*

| Field | Value |
|---|---|
| Kind | Skill |
| File | [`skills/deterministic-simulation/SKILL.md`](../../../skills/deterministic-simulation/SKILL.md) |
| Trigger | Use when game logic must reproduce exactly from a seed and an input log (replays, lockstep multiplayer, bug repro, golden tests), or when adding randomness, timing or iteration to the simulation. Covers fixed timestep, seeded RNG streams, ordering, floating point, state hashing and replay. |
| Covers | Fixed timestep, time as argument, seeded RNG streams (simulation vs cosmetic), explicit ordering, floating-point policy, recorded inputs, state hash, replay and golden tests. |
| Produces | State hash; replay test; RNG streams; documented float policy. |
| Docs owed | Explanation `about-determinism`; reference for hash coverage, RNG streams, replay format; how-to for record/replay and golden-hash regeneration. |
| Sections | Rules; Proving it; Checklist; Failure modes; Documentation this work owes |
