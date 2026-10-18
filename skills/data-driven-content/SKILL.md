---
name: data-driven-content
description: Use when designers need to add or tune kinds, numbers, levels or content without code changes: type objects, content schemas, load-time validation, inheritance/templates, hot reload and content tests.
---

# Data-driven content

Designers should change content without waiting for an engineering change;
when they cannot, they hack around missing features (Bilas). Move *what
varies* into data the designer owns and keep *how it behaves* in tested code.

## Decide what becomes data

| It is... | Put it in |
|---|---|
| A number the designer tunes (costs, timings, odds) | Data field |
| A new "kind" differing only by numbers and flags | Type Object: a data record the instance points to |
| A kind needing a behaviour from a known set | Data field naming the behaviour; code holds the set |
| Genuinely new behaviour | Code (a new behaviour in the set), then data selects it |
| Layouts, sequences, waves, levels | Content files loaded at start or on demand |

Rule: data selects and parameterises behaviour; it does not become a
programming language unless the project chose a scripting layer deliberately.

## Method

1. **Write the schema first**: fields, types, ranges, defaults, references to
   other records, units. The schema is reference documentation and the
   validator's input.
2. **Separate type from instance** (Nystrom "Type Object"): the type record is
   shared and read-only at runtime; the instance holds only what changes.
3. **Validate at load, fail loudly**: unknown fields, missing required fields,
   out-of-range values, dangling references, duplicate ids. Report file,
   record and field in one message a designer can act on.
4. **Inheritance sparingly**: a child record may override a parent's fields;
   keep trees shallow; decide resolve-on-read vs copy-on-load and document it.
   Watch counts: template systems designed for dozens grow into thousands.
5. **Stable ids**: content refers to content by id, never by array position;
   ids survive renames so saves and replays stay valid.
6. **Load into immutable structures** the simulation reads; content is part
   of determinism (same content + seed + inputs = same game). Include a content
   version or hash in replays and saves.
7. **Hot reload** in development builds when the engine allows: reload,
   revalidate, keep the old data on error.
8. **Test all content**: a test loads every shipped content file through the
   validator; a few scenario tests use real content records.
9. **Hand over**: tell the game designer which fields exist, their units and
   ranges, and how to add a new kind.

## Checklist

- [ ] Schema written; validator enforces it; errors name file/record/field.
- [ ] No tuning numbers left in code that the spec says are tunable.
- [ ] Types shared and immutable at runtime; instances hold only state.
- [ ] Ids stable; no positional references.
- [ ] All content loads in a test; content version recorded in saves/replays.
- [ ] Designer has the reference page and a how-to for adding a kind.

## Failure modes

- Data that silently accepts typos (`helth: 10`) and the game uses a default.
- Behaviour smuggled into data as ever-growing flag sets.
- Copy-on-load inheritance plus later edits to the parent: children do not
  update.
- Content edited by hand in a format nobody can diff or validate.

## Documentation this work owes

**Reference** for each content schema (fields, types, units, ranges, defaults)
and a **how-to** for the designer's new task ("How to add a new unit type").
An **explanation** if a design choice was made (what is data vs code,
inheritance model).
