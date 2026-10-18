// SPDX-License-Identifier: GPL-2.0-or-later
export const meta = {
  name: 'implement-system',
  description: 'Implement one game rule or system test-first from its spec, attack it for determinism, edge cases and contract drift, fix, and document it in the same PR. Use for any new or changed rule. args: { system: "<system name>", spec: "<path or section of the rules spec>" }',
  phases: [
    { title: 'Plan', detail: 'case list from the spec, ambiguities, doc kinds affected (compass)' },
    { title: 'Build', detail: 'failing tests from the case list, then code, until green' },
    { title: 'Attack', detail: 'parallel read-only attempts to break it; each returns failing test code' },
    { title: 'Fix', detail: 'one agent adds the attack tests and fixes the code' },
    { title: 'Docs', detail: 'write or update the planned Diataxis pages in the same PR' },
    { title: 'Check', detail: 'suite and replay tests green; each touched page holds one kind' },
  ],
}

// --- run-modes v1 begin ---
const RUN = ((a, realAgent, realPhase, realLog) => {
  const opted = !!(a && typeof a === 'object' && a.run && typeof a.run === 'object')
  const c = opted ? a.run : {}
  const mode = c.mode === 'inline' ? 'inline' : 'agents'
  const results = c.results && typeof c.results === 'object' ? c.results : {}
  const only = Array.isArray(c.only) && c.only.length ? c.only.map(String) : null
  const from = c.from ? String(c.from) : null
  const titles = typeof meta !== 'undefined' && meta && Array.isArray(meta.phases) ? meta.phases.map((p) => p.title) : []
  const unknown = titles.length ? (from ? [from] : []).filter((t) => !titles.includes(t)) : []
  const error = c.mode && !['agents', 'inline'].includes(c.mode)
    ? `run.mode must be "agents" or "inline", got "${c.mode}"`
    : unknown.length ? `run.from names no phase: ${unknown.join(', ')}. Phases: ${titles.join(', ')}` : null
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k)
  const seen = {}
  const out = {}
  const skipped = []
  const next = []
  const logs = []
  let current = ''
  let reached = !from
  let halting = false
  let release = () => {}
  const halted = new Promise((r) => { release = r })
  const picked = (ph, label) => reached && (!only || only.some((s) => s === ph || s === label || label.startsWith(s + ':')))
  const agent = (prompt, opts) => {
    const op = opts || {}
    const ph = op.phase || current
    const base = op.label || ph || 'agent'
    seen[base] = (seen[base] || 0) + 1
    const key = seen[base] > 1 ? `${base}#${seen[base]}` : base
    if (has(results, key)) { out[key] = results[key]; return Promise.resolve(results[key]) }
    if (!picked(ph, base)) { skipped.push(key); return Promise.resolve(null) }
    if (mode === 'agents') {
      return realAgent(prompt, opts).then((r) => { if (r !== null && r !== undefined) out[key] = r; return r })
    }
    next.push({ key, phase: ph, prompt, schema: op.schema || null })
    if (!halting) {
      halting = true
      ;(async () => { for (let i = 0; i < 200; i++) await null; release('__run_halted__') })()
    }
    return new Promise(() => {})
  }
  const phase = (t) => { current = t; if (from && t === from) reached = true; return realPhase(t) }
  const log = (m) => { logs.push(String(m)); return realLog(m) }
  const finish = (value) => {
    if (!opted) return value
    if (value === '__run_halted__') {
      return {
        run: 'inline', status: 'next', next, results: out, skipped, logs,
        how: 'Do each brief in next yourself, in order: follow its prompt in this session (it may tell you to edit files, commit or push), and shape your answer to its schema when one is given. Add each answer to results under its key, then run this workflow again with the same args and run.results set to the merged results. Repeat until status is "done".',
      }
    }
    return { run: mode, status: 'done', result: value, results: out, skipped, logs }
  }
  return { agent, phase, log, finish, halted, error }
})(typeof args === 'undefined' ? undefined : args, agent, phase, log)
if (RUN.error) return RUN.error
const RUN_OUT = await Promise.race([RUN.halted, (async (agent, phase, log) => {
// --- run-modes v1 end (workflow body follows; close it with the tail line) ---

const USAGE = 'usage: implement-system { system: "<system name>", spec: "<path or section of the rules spec>" }'
if (!args || !args.system || !args.spec) return USAGE
const system = args.system
const spec = args.spec

const DOCS_FRAGMENT = 'Classify every user-visible change in this work with the Diataxis compass (action/cognition x study/work). For each, update or add exactly one page of that kind under the project docs/<kind>/ (location per the project profile), keep each page to one kind, title it by the project pattern (how-to-<goal>, about-<topic>, reference named for the thing), and link to the related pages of the other kinds. Report pages touched and any change you left undocumented and why.'

const PLAN = {
  type: 'object',
  properties: {
    cases: { type: 'array', items: { type: 'string' } },
    ambiguous: { type: 'array', items: { type: 'string' } },
    docKinds: { type: 'array', items: { type: 'object', properties: { kind: { type: 'string', enum: ['tutorial', 'how-to', 'reference', 'explanation'] }, page: { type: 'string' }, why: { type: 'string' } }, required: ['kind', 'page', 'why'] } },
  },
  required: ['cases', 'ambiguous', 'docKinds'],
}
const BUILD = { type: 'object', properties: { green: { type: 'boolean' }, testFile: { type: 'string' }, notes: { type: 'string' } }, required: ['green', 'testFile'] }
const ATTACK = { type: 'object', properties: { failures: { type: 'array', items: { type: 'object', properties: { problem: { type: 'string' }, testCode: { type: 'string' } }, required: ['problem', 'testCode'] } } }, required: ['failures'] }
const FIX = { type: 'object', properties: { green: { type: 'boolean' }, open: { type: 'array', items: { type: 'string' } } }, required: ['green', 'open'] }
const DOCS = { type: 'object', properties: { pages: { type: 'array', items: { type: 'string' } }, undocumented: { type: 'array', items: { type: 'string' } } }, required: ['pages', 'undocumented'] }
const CHECK = { type: 'object', properties: { pass: { type: 'boolean' }, problems: { type: 'array', items: { type: 'string' } } }, required: ['pass', 'problems'] }

phase('Plan')
const plan = await agent(
  `You are the gameplay programmer. Follow the gameplay-programmer game-systems skill, step 1. Read ${spec} for the system "${system}" and the project's contracts doc. ` +
  'Return every rule, number and edge case as one-line test cases, and each gap as "AMBIGUOUS: <question> -> default <value>". ' +
  'Then plan documentation: use the Diataxis compass to list each doc kind this system affects (a new system owes reference for its interface; explanation if a design choice is made; how-to if someone must do something new), with the page path and why. Do not edit files.',
  { schema: PLAN, phase: 'Plan', label: 'plan' })
if (!plan || !Array.isArray(plan.cases) || plan.cases.length === 0) return 'blocked: planning failed (no case list) for ' + system
const ambiguous = Array.isArray(plan.ambiguous) ? plan.ambiguous : []
const docKinds = Array.isArray(plan.docKinds) ? plan.docKinds : []
log(`${plan.cases.length} cases, ${ambiguous.length} ambiguous, ${docKinds.length} doc pages planned`)

phase('Build')
const build = await agent(
  `Implement "${system}" following the gameplay-programmer skills game-systems, deterministic-simulation, state-machines-and-events (if it has modes) and gameplay-testing, and the project profile. ` +
  'Keep it in the engine-independent core. Write failing tests for these cases first, in one test file for this system, then the simplest code that passes, then refactor:\n- ' + plan.cases.join('\n- ') +
  (ambiguous.length ? '\nImplement each stated default as a named constant and keep this list for the game designer:\n- ' + ambiguous.join('\n- ') : '') +
  '\nRun the full test suite with the project\'s commands. Commit with Conventional Commits. Return whether the suite is green and the path of the test file.',
  { schema: BUILD, phase: 'Build', label: 'build' })
if (!build || !build.green) return 'blocked: build did not reach green for ' + system + (build && build.notes ? ': ' + build.notes : '')

phase('Attack')
const lenses = [
  'determinism: seeds, RNG ownership and streams, clock reads, iteration order, float use (deterministic-simulation skill)',
  'edge cases and bounds: empty, zero, maximum, simultaneous events, invalid commands (game-systems case list discipline)',
  'contract fidelity: public API and result/event types against the project contracts doc and the spec numbers (game-systems)',
]
const attacks = await parallel(lenses.map((lens) => () => agent(
  `Try to break the new "${system}" code through ${lens}. Do NOT edit any file. For each real problem, return a short description and the code of one failing test written for the project's test framework, ready to add to ${build.testFile}. Return an empty list if you find nothing.`,
  { schema: ATTACK, phase: 'Attack', label: 'attack:' + lens.split(':')[0] })))
const unverified = []
const failures = []
attacks.forEach((a, i) => {
  if (!a || !Array.isArray(a.failures)) unverified.push(lenses[i].split(':')[0])
  else a.failures.forEach((f) => failures.push(f))
})
if (unverified.length) log('attack lenses that crashed (left unverified): ' + unverified.join(', '))

phase('Fix')
if (failures.length) {
  const fix = await agent(
    `Add these failing tests to ${build.testFile} in one edit, confirm each fails, then fix the "${system}" code so they pass without weakening any test. Run the full suite and replay tests. Commit.\n\n` +
    failures.map((f, i) => `${i + 1}. ${f.problem}\n${f.testCode}`).join('\n\n') +
    '\nReturn green and any problem you could not fix.',
    { schema: FIX, phase: 'Fix', label: 'fix' })
  if (!fix) return { status: 'blocked', reason: 'fix agent failed', open: failures.map((f) => f.problem) }
  if (!fix.green || (fix.open && fix.open.length)) return { status: 'blocked', open: fix.open && fix.open.length ? fix.open : ['suite not green after fixes'] }
}

phase('Docs')
const docs = await agent(
  `Document "${system}" in the same PR. Planned pages:\n` +
  (docKinds.length ? docKinds.map((d) => `- ${d.kind}: ${d.page} (${d.why})`).join('\n') : '- (none planned; re-run the compass)') +
  '\n' + DOCS_FRAGMENT + ' Also update the project contracts doc if the public API changed. Commit with a docs: or the feature commit per the project convention.',
  { schema: DOCS, phase: 'Docs', label: 'docs' })
if (!docs) return { status: 'blocked', reason: 'docs step failed; code without its docs is not done' }

phase('Check')
const check = await agent(
  `Check the "${system}" work. 1) Run the full test suite and the replay/determinism tests with the project's commands. 2) For each touched docs page (${(docs.pages || []).join(', ') || 'none reported'}): it holds one Diataxis kind only, starts with a line saying its kind and audience, its title follows the pattern, and it links to the related pages of other kinds. Do not edit; report problems.`,
  { schema: CHECK, phase: 'Check', label: 'check' })
if (!check) return { status: 'unverified', reason: 'check agent failed', docs: docs.pages, unverifiedLenses: unverified }
if (!check.pass) return { status: 'blocked', open: check.problems }

return {
  status: 'done',
  cases: plan.cases.length,
  ambiguousForDesigner: ambiguous,
  attackTestsAdded: failures.length,
  unverifiedLenses: unverified,
  docs: docs.pages,
  undocumented: docs.undocumented,
}
})(RUN.agent, RUN.phase, RUN.log)]); return RUN.finish(RUN_OUT)
