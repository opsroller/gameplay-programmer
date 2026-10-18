# How to build a gameplay tool

*How-to guide, for developers who want a tool or command-line program built over the game's core: a level solver, a replay checker, a balance simulator.*

This guide shows you how to build such a tool with the `implement-system`
workflow, so that it is opt-in in the build, smoke-tested and held to a
performance budget.

1. Write down what the tool must do: its options, input and output
   formats, exit codes, and how fast or small it must be on a named input.
   If the spec gives no budget, the workflow picks a default and lists it
   under `ambiguousForDesigner`.
2. Commit a small input file the smoke test can run on, or say in the spec
   where the tool can generate one.
3. Run:
   ```
   /gameplay-programmer:implement-system with args { system: "<tool name>", spec: "<path or section>", target: "tool", wp: "WP-NN" }
   ```
4. If it returns `blocked: planning for tool ...`, add the missing build
   option, smoke test or budget to the spec and run it again.
5. If it returns `status: "blocked"`, fix each entry in `open` (often the
   budget, from `attack:performance budget`) and run it again.
6. Check `tool.measured` against `tool.budget` and write both in the PR
   description.
7. Ship it from `next`, as in
   [how to implement a game system](how-to-implement-a-game-system.md),
   step 7.

To run the tool yourself, build with the option named in `tool.buildOption`
switched on; builds without it leave the tool out.

See the [implement-system reference](../reference/workflows/implement-system.md#tool-target)
for the tool fields and what each phase checks.
