# Build your first game rule with the gameplay programmer

*Tutorial, for someone new to this plugin who wants to see the role do one job from start to finish.*

In this tutorial we will have the gameplay programmer implement one small rule
in a project's game logic: "armour reduces damage, to a minimum of 1". We will
watch it write the case list, the failing tests, the code, the replay check and
the docs, and end with a pull request ready for the code reviewer.

You need: Claude Code, a project repository with a `CLAUDE.md` and project
profile (they name the language, test command and docs folder), and the
`engineering-practices` and `gameplay-programmer` plugins installed (see the
[README](../../README.md#install)).

## 1. Write the rule into the spec

First, add this section to the project's rules spec (the profile says where it
lives) and commit it on a new branch, e.g. `feat/armour-damage`:

```markdown
### Armour
- Damage taken = incoming damage - armour.
- Damage taken is never less than 1.
- Armour is a per-unit-type value in content data.
```

The game designer normally owns this file; for the tutorial we write it
ourselves.

## 2. Ask the role for the case list

Now start Claude Code in the repository and type:

```
Use the gameplay-programmer agent. Plan the "armour" rule from the Armour
section of the rules spec. Only return the case list and the doc pages it owes.
Do not write code yet.
```

The agent first onboards (it reads `CLAUDE.md` and the profile). The output
should look like this:

```
Cases:
- damage 10, armour 3 -> 7 taken
- damage 3, armour 3 -> 1 taken (minimum)
- damage 2, armour 5 -> 1 taken (minimum)
- armour 0 -> full damage taken
- armour read from the unit type's content record
AMBIGUOUS: damage 0 (e.g. a blocked hit) -> default: 0 taken, minimum applies only to hits > 0
Docs: reference (unit type schema gains `armour`), reference (damage rule API)
```

Notice the `AMBIGUOUS:` line. The role does not guess silently; it picks a
default it will put in a named constant and tells the designer.

## 3. Run the implement-system workflow

Type:

```
/gameplay-programmer:implement-system with args { system: "armour", spec: "rules spec, Armour section" }
```

The workflow runs six phases. You should see, in order:

1. **Plan**: the case list from step 2 again, plus the planned doc pages.
2. **Build**: a new test file for the armour system appears; the tests fail,
   then pass once the code is written. A commit like
   `feat(rules): apply armour to incoming damage` lands.
3. **Attack**: three agents try to break it (determinism, edge cases,
   contract). Each returns failing tests as text; none edits files.
4. **Fix**: one agent adds any returned tests and fixes the code.
5. **Docs**: reference pages updated in the project's `docs/reference/`.
6. **Check**: the suite and replay test pass; every touched page is one
   Diataxis kind.

The final output should look like:

```
{ status: "done", cases: 5, ambiguousForDesigner: ["damage 0 ..."],
  attackTestsAdded: 1, docs: ["docs/reference/unit-types.md", ...] }
```

Notice `attackTestsAdded`. Even a rule this small usually gets one extra case
from the attack phase, often a boundary such as negative armour.

## 4. Look at what it produced

Run `git log --oneline` and `git diff main --stat`. You should see the test
file, the rule code in the engine-independent core, the content schema change,
and the docs pages, all on one branch. Open the reference page and notice it
starts with a line naming its kind and audience.

## 5. Open the pull request

Finally, ask:

```
Open a draft pull request for this branch following engineering-practices.
```

The pull request is ready for the code reviewer.

## What we did

We took one rule from spec to reviewed-ready code: a case list, failing tests
first, code in the engine-independent core, an adversarial pass, and the docs
in the same PR. Next, try [How to implement a game system](../how-to/how-to-implement-a-game-system.md)
on a rule of your own, or read [About the gameplay programmer role](../explanation/about-the-role.md).
