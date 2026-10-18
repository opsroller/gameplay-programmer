// SPDX-License-Identifier: GPL-2.0-or-later
export const meta = {
  name: 'determinism-audit',
  description: 'Audit game logic for sources of non-determinism through parallel read-only lenses, add or strengthen state-hash replay tests, fix what they expose, and document the determinism model. Use before replays, lockstep multiplayer or golden tests, or after a desync. args: { scope: "<path or system name of the simulation code>" }',
  phases: [
    { title: 'Plan', detail: 'locate the simulation code, state hash and replay tests; plan doc kinds (compass)' },
    { title: 'Audit', detail: 'one read-only agent per lens; each returns findings' },
    { title: 'Prove', detail: 'one agent adds or strengthens the replay and hash-coverage tests' },
    { title: 'Fix', detail: 'one agent fixes confirmed findings until replays match' },
    { title: 'Docs', detail: 'write the determinism explanation and reference pages' },
    { title: 'Check', detail: 'replays match twice and across build configurations; one kind per page' },
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

const USAGE = 'usage: determinism-audit { scope: "<path or system name of the simulation code>" }'
if (!args || !args.scope) return USAGE
const scope = args.scope

const DOCS_FRAGMENT = 'Classify every user-visible change in this work with the Diataxis compass (action/cognition x study/work). For each, update or add exactly one page of that kind under the project docs/<kind>/ (location per the project profile), keep each page to one kind, title it by the project pattern (how-to-<goal>, about-<topic>, reference named for the thing), and link to the related pages of the other kinds. Report pages touched and any change you left undocumented and why.'

const PLAN = {
  type: 'object',
  properties: {
    files: { type: 'array', items: { type: 'string' } },
    hasStateHash: { type: 'boolean' },
    hasReplayTest: { type: 'boolean' },
    docKinds: { type: 'array', items: { type: 'object', properties: { kind: { type: 'string', enum: ['tutorial', 'how-to', 'reference', 'explanation'] }, page: { type: 'string' }, why: { type: 'string' } }, required: ['kind', 'page', 'why'] } },
  },
  required: ['files', 'hasStateHash', 'hasReplayTest', 'docKinds'],
}
const FINDINGS = { type: 'object', properties: { findings: { type: 'array', items: { type: 'object', properties: { location: { type: 'string' }, problem: { type: 'string' }, fix: { type: 'string' } }, required: ['location', 'problem', 'fix'] } } }, required: ['findings'] }
const PROVE = { type: 'object', properties: { replayTest: { type: 'string' }, failingNow: { type: 'array', items: { type: 'string' } } }, required: ['replayTest', 'failingNow'] }
const FIX = { type: 'object', properties: { green: { type: 'boolean' }, open: { type: 'array', items: { type: 'string' } } }, required: ['green', 'open'] }
const DOCS = { type: 'object', properties: { pages: { type: 'array', items: { type: 'string' } }, undocumented: { type: 'array', items: { type: 'string' } } }, required: ['pages', 'undocumented'] }
const CHECK = { type: 'object', properties: { pass: { type: 'boolean' }, problems: { type: 'array', items: { type: 'string' } } }, required: ['pass', 'problems'] }

phase('Plan')
const plan = await agent(
  `Follow the gameplay-programmer deterministic-simulation skill. For ${scope}: list the simulation source files, say whether a state hash and a replay test exist, and plan docs with the Diataxis compass (the determinism model is a decision: an explanation page about-determinism; reference for hash coverage, RNG streams, replay format; how-to for record/replay if new). Do not edit files.`,
  { schema: PLAN, phase: 'Plan', label: 'plan' })
if (!plan || !Array.isArray(plan.files) || plan.files.length === 0) return 'blocked: could not locate simulation code for ' + scope

phase('Audit')
const lenses = [
  'time: clock reads, variable dt in the simulation, timers in frames instead of ticks',
  'randomness: unseeded or global generators, platform-default algorithms, cosmetic code drawing from the simulation stream, modulo bias',
  'ordering: unordered container iteration, pointer/address ordering, unstable sorts without tiebreakers, event processing order',
  'numbers and hidden inputs: floating point across builds and platforms, uninitialised fields, locale, environment, threads, engine physics the core does not own',
  'coverage: state fields missing from the state hash, save format or replay; RNG state not hashed',
]
const audits = await parallel(lenses.map((l) => () => agent(
  `Audit these files for non-determinism through the lens of ${l}:\n- ${plan.files.join('\n- ')}\nDo NOT edit files. Return each real finding with location, problem and proposed fix. Empty list if clean.`,
  { schema: FINDINGS, phase: 'Audit', label: 'audit:' + l.split(':')[0] })))
const unverified = []
const findings = []
audits.forEach((a, i) => { if (!a || !Array.isArray(a.findings)) unverified.push(lenses[i].split(':')[0]); else a.findings.forEach((f) => findings.push(f)) })
if (unverified.length) log('audit lenses that crashed (left unverified): ' + unverified.join(', '))
log(findings.length + ' findings')

phase('Prove')
const prove = await agent(
  `Following deterministic-simulation ("Proving it") and gameplay-testing, ${plan.hasStateHash ? 'strengthen the existing state hash so it covers every simulation field and RNG state, and add a test that fails when a field is not hashed' : 'add a state hash over all simulation state and RNG state, with a coverage test'}; ` +
  `${plan.hasReplayTest ? 'extend the replay test' : 'add a replay test'} that runs a few fixed seeds with generated inputs twice in one process and compares per-tick hashes. Run it and list which checks fail now. Commit with a test: Conventional Commit.`,
  { schema: PROVE, phase: 'Prove', label: 'prove' })
if (!prove) return { status: 'blocked', reason: 'prove agent failed', findings: findings }

phase('Fix')
const failing = Array.isArray(prove.failingNow) ? prove.failingNow : []
if (findings.length || failing.length) {
  const fix = await agent(
    'Fix these determinism problems in one pass, following deterministic-simulation; prefer the smallest change at the cause. Keep tests unweakened. If a fix changes outcomes on purpose, regenerate golden hashes in the same commit and say so.\n' +
    findings.map((f, i) => `${i + 1}. ${f.location}: ${f.problem} -> ${f.fix}`).join('\n') +
    (failing.length ? '\nFailing checks: ' + failing.join('; ') : '') +
    `\nRun ${prove.replayTest} and the full suite. Commit with fix: commits.`,
    { schema: FIX, phase: 'Fix', label: 'fix' })
  if (!fix) return { status: 'blocked', reason: 'fix agent failed', open: findings.map((f) => f.location) }
  if (!fix.green || (fix.open && fix.open.length)) return { status: 'blocked', open: fix.open && fix.open.length ? fix.open : ['replay or suite not green'] }
}

phase('Docs')
const docKinds = Array.isArray(plan.docKinds) ? plan.docKinds : []
const docs = await agent(
  'Document the determinism model in the same PR. Planned pages:\n' +
  (docKinds.length ? docKinds.map((d) => `- ${d.kind}: ${d.page} (${d.why})`).join('\n') : '- explanation about-determinism; reference for hash coverage and RNG streams') +
  '\n' + DOCS_FRAGMENT,
  { schema: DOCS, phase: 'Docs', label: 'docs' })
if (!docs) return { status: 'blocked', reason: 'docs step failed' }

phase('Check')
const check = await agent(
  `Verify: 1) ${prove.replayTest} passes twice in a row and under every build configuration the project ships (per the project profile); 2) no audit finding is left unaddressed; 3) each touched docs page (${(docs.pages || []).join(', ') || 'none'}) holds one Diataxis kind, starts with its kind-and-audience line, follows the title pattern and links related kinds. Report problems; do not edit.`,
  { schema: CHECK, phase: 'Check', label: 'check' })
if (!check) return { status: 'unverified', reason: 'check agent failed', findings: findings.length }
if (!check.pass) return { status: 'blocked', open: check.problems }

return { status: 'done', findingsFixed: findings.length, unverifiedLenses: unverified, replayTest: prove.replayTest, docs: docs.pages, undocumented: docs.undocumented }
})(RUN.agent, RUN.phase, RUN.log)]); return RUN.finish(RUN_OUT)
