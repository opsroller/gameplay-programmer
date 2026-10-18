export const meta = {
  name: 'implement-system',
  description: 'Implement a game system test-first from its spec, then adversarially check determinism and edge cases',
  whenToUse: 'Build one rule or system. args: { system: "<name>", spec: "<spec section or path>" }',
  phases: [{ title: 'Cases', detail: 'enumerate rules and edge cases' }, { title: 'Build', detail: 'tests then code' }, { title: 'Attack', detail: 'try to break it' }],
}
const system = (args && args.system) || 'the requested system'
const spec = (args && args.spec) || 'the rules spec'
const CASES = { type: 'object', properties: { cases: { type: 'array', items: { type: 'string' } } }, required: ['cases'] }
const BREAKS = { type: 'object', properties: { failures: { type: 'array', items: { type: 'string' } } }, required: ['failures'] }
phase('Cases')
const c = await agent(`Read ${spec} for ${system}. List every rule, number and edge case as one-line test cases. Flag anything ambiguous as "AMBIGUOUS: ...".`, { schema: CASES, label: 'cases' })
phase('Build')
await agent(`Implement ${system} following the gameplay-programmer game-systems and unit-testing skills and the project profile. Write tests for these cases first, then the code, until all pass:\n- ${c.cases.join('\n- ')}\nImplement stated defaults for AMBIGUOUS items as named constants and list them. Commit with Conventional Commits.`, { label: 'build' })
phase('Attack')
const lenses = ['determinism (seeds, time, iteration order)', 'edge cases and bounds', 'contract fidelity against the contracts doc']
const found = await parallel(lenses.map(l => () => agent(`Try to break the new ${system} code through ${l}. Write a failing test for each real problem you find (don't fix the code). Return the failures.`, { schema: BREAKS, phase: 'Attack', label: `attack:${l.split(' ')[0]}` })))
const failures = found.filter(Boolean).flatMap(f => f.failures)
if (failures.length) await agent(`Fix the code so these new failing tests pass without weakening them:\n- ${failures.join('\n- ')}\nRun all tests, commit and push.`, { label: 'fix' })
return { cases: c.cases.length, failures_fixed: failures }
