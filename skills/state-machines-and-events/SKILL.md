---
name: state-machines-and-events
description: Use when a game mode, entity behaviour, turn structure or flow (menus-to-play, phases, AI modes) depends on state, or when systems must talk to each other. Covers finite, hierarchical and pushdown state machines, commands in, events out, and event-queue pitfalls.
---

# State machines and event flows

## When you need a state machine

Use one when behaviour depends on internal state, the state is one of a small
number of distinct modes, and the thing reacts to a sequence of inputs over
time (Nystrom "State"). The smell that calls for it is **flag soup**:
`isJumping && !isDucking && chargeTime > 0`, where combinations multiply and
some are impossible.

## Method

1. **List states and inputs.** Draw the table: rows are states, columns are
   inputs/events, cells are the next state plus actions. Empty cells are
   decisions: ignore, or error? Write them down.
2. **Pick the form.**
   | Situation | Form |
   |---|---|
   | Few states, no shared behaviour | Enum + switch, transition function `next(state, input)` |
   | States own data (a charge timer) | State objects; data lives in the state |
   | Several states share handling (all "on ground" states can jump) | Hierarchical: unhandled input passes to the superstate |
   | Temporary mode that must return to the previous one (pause, fire, dialogue) | Pushdown: push/pop a stack of states |
   | Independent aspects (movement and equipment) | Two concurrent machines, not their product |
   | Rich AI choosing among many goals | Behaviour trees or utility/planning, not a giant FSM |
3. **Use enter/exit actions** for setup and teardown that must happen on every
   way in or out, so it is written once.
4. **Make transitions pure where you can**: `(state, input) -> (state', events)`.
   That is trivially testable and replayable.
5. **Test the table, not the code.** One test per cell that matters, plus a
   property test that random input sequences never reach an invalid state
   (`gameplay-testing`).
6. **Expose the current state for debugging**: name, time in state, last
   transition and its cause.

## Commands in, events out

- **Commands** (requests, future tense, one handler): `MoveUnit`,
  `PlayCard`. The core validates and applies them. Commands carry values, not
  references, so they serialise for replays and networking.
- **Events** (facts, past tense, many listeners): `UnitMoved`, `CardPlayed`.
  The core emits them in its results; presentation, audio, UI and analytics
  listen.
- Choose **synchronous observer** when you only need to decouple *who*
  reacts. Choose an **event queue** only when you must decouple *when*
  (batching, merging duplicates, cross-thread hand-off).

## Event-queue rules

- Scope queues to a domain; a global event bus is a global variable with
  hidden dependencies.
- Events carry the data the handler needs; by handling time, the sender may be
  gone or changed (stale state).
- Guard against feedback loops: do not emit while handling the same event
  type, or bound the passes per tick; log event chains in debug builds.
- Process the queue at a defined point in the tick, in FIFO order, so results
  stay deterministic.
- Prefer a fixed-capacity ring buffer; decide what happens on overflow.

## Checklist

- [ ] State table written, every empty cell decided.
- [ ] No boolean combinations encoding modes.
- [ ] Enter/exit actions hold shared setup and teardown.
- [ ] Transitions tested per cell; invariant tested by property test.
- [ ] Commands are values; events are past-tense facts with payloads.
- [ ] Queues scoped, ordered, bounded, loop-guarded.

## Failure modes

- Transitions scattered across callbacks so no one can draw the machine.
- Product explosion: one machine for movement x weapon x status.
- Presentation timers driving rule transitions (rules wait for an animation to
  finish); instead the rule completes and presentation catches up.
- Handlers mutating state the emitter still reads in the same tick.

## Documentation this work owes

**Reference** for the state table or diagram and every command and event with
its payload (other roles hook these). **Explanation** if a design choice was
made: why this form (flat, hierarchical, pushdown) and how ordering is
guaranteed.
