# How to make game content data-driven

*How-to guide, for developers and designers who want new kinds or tuning values to be editable as data instead of code.*

This guide shows you how to move hard-coded kinds or numbers into validated
content data.

1. List what designers want to change without code (kinds, numbers, layouts).
2. Ask:
   ```
   Use gameplay-programmer, data-driven-content skill: move <kinds/values>
   into content data with a schema and load-time validation.
   ```
3. Check the result has: a schema, a validator whose errors name file, record
   and field, stable ids, and a test that loads all shipped content.
4. Try a deliberate typo in a content file and run the game or the content
   test; you should get a clear validation error, not a silent default.
5. Give the game designer the new reference page and the how-to for adding a
   kind that the agent wrote.

If a requested change needs new behaviour, not just new numbers, the agent will
add the behaviour in code and let data select it; that part needs a spec from
the game designer.

See the [data-driven-content skill reference](../reference/skills/data-driven-content.md).
