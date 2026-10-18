// SPDX-License-Identifier: GPL-2.0-or-later
export const meta = {
  name: 'investigate-gameplay-bug',
  description: 'Reproduce a gameplay bug as a failing test, minimise it, find the first divergence and root cause, fix it at the cause, check for siblings, and document it in the same PR. Use for wrong rules, desyncs, crashes in game logic. args: { bug: "<issue link or description>", capture: "<optional path to seed/input log/save>" }',
  phases: [
    { title: 'Reproduce', detail: 'turn the report or capture into a failing test' },
    { title: 'Diagnose', detail: 'minimise, find the first divergence, state the cause, plan doc kinds (compass)' },
    { title: 'Fix', detail: 'fix at the cause; full suite and replay tests green' },
    { title: 'Siblings', detail: 'parallel read-only search for the same mistake elsewhere' },
    { title: 'Docs', detail: 'update the planned Diataxis pages in the same PR' },
    { title: 'Check', detail: 'verify the fix, the regression test and one kind per page' },
    { title: 'Handoff', detail: 'commit and push the fix, return a handoff for deliver-package or land-pr' },
  ],
}

// --- run-modes v2 begin ---
const RUN = ((a, realAgent, realPhase, realLog) => {
  const opted = !!(a && typeof a === 'object' && a.run && typeof a.run === 'object')
  const c = opted ? a.run : {}
  const mode = c.mode === 'inline' ? 'inline' : 'agents'
  const results = c.results && typeof c.results === 'object' ? c.results : {}
  const reviewers = c.reviewers && typeof c.reviewers === 'object' ? c.reviewers : {}
  const only = Array.isArray(c.only) && c.only.length ? c.only.map(String) : null
  const from = c.from ? String(c.from) : null
  const titles = typeof meta !== 'undefined' && meta && Array.isArray(meta.phases) ? meta.phases.map((p) => p.title) : []
  const unknown = titles.length ? (from ? [from] : []).filter((t) => !titles.includes(t)) : []
  const error = c.mode && !['agents', 'inline'].includes(c.mode)
    ? `run.mode must be "agents" or "inline", got "${c.mode}"`
    : unknown.length ? `run.from names no phase: ${unknown.join(', ')}. Phases: ${titles.join(', ')}` : null
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k)
  // An answer must carry every required key of its schema, as the runtime
  // enforces for agents; returns the missing keys, or null when it fits.
  const missing = (v, schema) => {
    if (v === null || v === undefined) return 'an answer'
    if (!schema || schema.type !== 'object') return null
    if (typeof v !== 'object' || Array.isArray(v)) return 'a JSON object'
    const gap = (schema.required || []).filter((k) => !has(v, k) || v[k] === undefined)
    return gap.length ? gap.join(', ') : null
  }
  const seen = {}
  const out = {}
  // Who answered each step marked independent: "subagent" when this run
  // spawned it, else the reviewer named in run.reviewers, else "self".
  const by = {}
  const who = (k) => (typeof reviewers[k] === 'string' && reviewers[k].trim() ? reviewers[k].trim() : 'self')
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
    const independent = op.independent === true
    const ph = op.phase || current
    const base = op.label || ph || 'agent'
    seen[base] = (seen[base] || 0) + 1
    const key = seen[base] > 1 ? `${base}#${seen[base]}` : base
    let note = null
    if (has(results, key)) {
      const gap = missing(results[key], op.schema)
      if (!gap) { out[key] = results[key]; if (independent) by[key] = who(key); return Promise.resolve(results[key]) }
      note = `answer missing ${gap}; answer this brief again`
    }
    if (!picked(ph, base)) { skipped.push(key); return Promise.resolve(null) }
    if (mode === 'agents') {
      const pass = Object.assign({}, op)
      delete pass.independent
      return realAgent(prompt, opts ? pass : opts).then((r) => {
        if (r !== null && r !== undefined) { out[key] = r; if (independent) by[key] = 'subagent' }
        return r
      })
    }
    const brief = { key, phase: ph, prompt, schema: op.schema || null }
    if (independent) brief.independent = true
    if (note) brief.note = note
    next.push(brief)
    if (!halting) {
      halting = true
      // Wait 200 microtask turns before pausing, so every sibling in a
      // parallel() or pipeline() fan-out queues its brief into this pause.
      ;(async () => { for (let i = 0; i < 200; i++) await null; release('__run_halted__') })()
    }
    return new Promise(() => {})
  }
  const phase = (t) => { current = t; if (from && t === from) reached = true; return realPhase(t) }
  const log = (m) => { logs.push(String(m)); return realLog(m) }
  const finish = (value) => {
    if (!opted) return value
    const self_reviewed = Object.keys(by).filter((k) => by[k] === 'self')
    if (value === '__run_halted__') {
      return {
        run: 'inline', status: 'next', next, results: out, reviewers: by, self_reviewed, skipped, logs,
        how: 'Do each brief in next, in order: follow its prompt in this session (it may tell you to edit files, commit or push), and shape your answer to its schema when one is given, with every required field. A brief marked independent reviews work this run produced, so do not answer it yourself: send its prompt to a reviewer with no part in the work (the project\'s code-reviewer role, a fresh session or a fresh subagent), use their answer, and name them in run.reviewers under its key; if you must answer it yourself, it is listed in self_reviewed and must be reported as self-reviewed. A brief with a note was answered before without the fields it names. Add each answer to results under its key, then run this workflow again with the same args, run.results set to the merged results and run.reviewers to the merged reviewers. Repeat until status is "done". To avoid pasting results back on every call, drive the run with engineering-practices tools/run-inline.mjs and a state file instead: it stores each answer and prints only the next briefs.',
      }
    }
    return { run: mode, status: 'done', result: value, results: out, reviewers: by, self_reviewed, skipped, logs }
  }
  return { agent, phase, log, finish, halted, error }
})(typeof args === 'undefined' ? undefined : args, agent, phase, log)
if (RUN.error) return RUN.error
const RUN_OUT = await Promise.race([RUN.halted, (async (agent, phase, log) => {
// --- run-modes v2 end (workflow body follows; close it with the tail line) ---

const USAGE = 'usage: investigate-gameplay-bug { bug: "<issue link or description>", capture: "<optional path to seed/input log/save>" }'
if (!args || !args.bug) return USAGE
const bug = args.bug
const capture = args.capture ? ' The capture is at ' + args.capture + '.' : ' There is no capture; rebuild the situation from the description.'

const DOCS_FRAGMENT = 'Classify every user-visible change in this work with the Diataxis compass (action/cognition x study/work). For each, update or add exactly one page of that kind under the project docs/<kind>/ (location per the project profile), keep each page to one kind, title it by the project pattern (how-to-<goal>, about-<topic>, reference named for the thing), and link to the related pages of the other kinds. Report pages touched and any change you left undocumented and why.'

const REPRO = { type: 'object', properties: { reproduced: { type: 'boolean' }, test: { type: 'string' }, notes: { type: 'string' } }, required: ['reproduced', 'test'] }
const DIAG = {
  type: 'object',
  properties: {
    cause: { type: 'string' },
    firstDivergence: { type: 'string' },
    pattern: { type: 'string' },
    docKinds: { type: 'array', items: { type: 'object', properties: { kind: { type: 'string', enum: ['tutorial', 'how-to', 'reference', 'explanation'] }, page: { type: 'string' }, why: { type: 'string' } }, required: ['kind', 'page', 'why'] } },
  },
  required: ['cause', 'firstDivergence', 'pattern', 'docKinds'],
}
const FIX = { type: 'object', properties: { green: { type: 'boolean' }, open: { type: 'array', items: { type: 'string' } } }, required: ['green', 'open'] }
const SIB = { type: 'object', properties: { sites: { type: 'array', items: { type: 'object', properties: { location: { type: 'string' }, why: { type: 'string' }, testCode: { type: 'string' } }, required: ['location', 'why'] } } }, required: ['sites'] }
const DOCS = { type: 'object', properties: { pages: { type: 'array', items: { type: 'string' } }, undocumented: { type: 'array', items: { type: 'string' } } }, required: ['pages', 'undocumented'] }
const CHECK = { type: 'object', properties: { pass: { type: 'boolean' }, problems: { type: 'array', items: { type: 'string' } } }, required: ['pass', 'problems'] }
const HANDOFF = { type: 'object', properties: { branch: { type: 'string' }, pr: { type: 'string' }, head_sha: { type: 'string' }, tests_pass: { type: 'boolean' }, problem: { type: 'string' } }, required: ['branch', 'tests_pass'] }

phase('Reproduce')
const repro = await agent(
  `Follow the gameplay-programmer gameplay-debugging-and-profiling skill, steps 1-2. Bug: ${bug}.${capture} ` +
  'Write one failing test (replay or scenario, per the gameplay-testing skill) that fails for the reported reason. Do not change game code. Commit the test on the bug branch only if the project allows failing tests on branches; otherwise leave it staged. Return whether it reproduces and the test path/name.',
  { schema: REPRO, phase: 'Reproduce', label: 'reproduce' })
if (!repro) return 'blocked: reproduce agent failed'
if (!repro.reproduced) return { status: 'blocked', reason: 'could not reproduce; no fix without a failing test', notes: repro.notes || '' }

phase('Diagnose')
const diag = await agent(
  `Follow gameplay-debugging-and-profiling steps 3-5 on the failing test ${repro.test}. Minimise it, find the first diverging tick and subsystem (state hashes or readable dumps; bisect commits if it is a regression), and state the root cause in one sentence. ` +
  'Name the general mistake as a searchable pattern (e.g. "iteration over an unordered container in simulation code"). Then plan documentation with the Diataxis compass: a bug fix updates reference if behaviour changed and adds a troubleshooting how-to if users can hit it; list page, kind and why (empty list if none). Do not edit game code.',
  { schema: DIAG, phase: 'Diagnose', label: 'diagnose' })
if (!diag || !diag.cause) return { status: 'blocked', reason: 'diagnosis failed; cause not stated', test: repro.test }

phase('Fix')
const fix = await agent(
  `Fix the cause: ${diag.cause} (first divergence: ${diag.firstDivergence}). Fix at the cause, not the symptom; keep ${repro.test} unchanged and make it pass. Follow game-systems and deterministic-simulation. Run the full suite and the replay tests with the project's commands. Commit with a fix: Conventional Commit. Return green and anything still open.`,
  { schema: FIX, phase: 'Fix', label: 'fix' })
if (!fix) return { status: 'blocked', reason: 'fix agent failed', cause: diag.cause }
if (!fix.green || (fix.open && fix.open.length)) return { status: 'blocked', cause: diag.cause, open: fix.open && fix.open.length ? fix.open : ['suite not green'] }

phase('Siblings')
const lenses = ['the simulation core', 'the engine binding/adapter and content loading', 'the tests and fixtures (same wrong assumption)']
const sibs = await parallel(lenses.map((l) => () => agent(
  `Search ${l} for other instances of this mistake: "${diag.pattern}". Do NOT edit files. For each real instance return the location, why it is the same mistake, and, where testable, the code of a failing test for it.`,
  { schema: SIB, phase: 'Siblings', label: 'siblings:' + l.split(' ')[1] })))
const unverified = []
const sites = []
sibs.forEach((s, i) => { if (!s || !Array.isArray(s.sites)) unverified.push(lenses[i]); else s.sites.forEach((x) => sites.push(x)) })
if (unverified.length) log('sibling searches that crashed (left unverified): ' + unverified.join('; '))
if (sites.length) {
  const sfix = await agent(
    'Apply these sibling fixes in one pass: add each provided test first (each to the test file of the system it covers), confirm it fails, then fix. Run the full suite. Commit.\n' +
    sites.map((x, i) => `${i + 1}. ${x.location}: ${x.why}${x.testCode ? '\n' + x.testCode : ''}`).join('\n'),
    { schema: FIX, phase: 'Siblings', label: 'fix-siblings' })
  if (!sfix || !sfix.green || (sfix.open && sfix.open.length)) return { status: 'blocked', reason: 'sibling fixes incomplete', open: sfix && sfix.open && sfix.open.length ? sfix.open : sites.map((x) => x.location) }
}

phase('Docs')
const docKinds = Array.isArray(diag.docKinds) ? diag.docKinds : []
const docs = await agent(
  'Document this bug fix in the same PR. Planned pages:\n' +
  (docKinds.length ? docKinds.map((d) => `- ${d.kind}: ${d.page} (${d.why})`).join('\n') : '- none planned; confirm with the compass that behaviour visible to users did not change') +
  `\nCause: ${diag.cause}. ` + DOCS_FRAGMENT,
  { schema: DOCS, phase: 'Docs', label: 'docs' })
if (!docs) return { status: 'blocked', reason: 'docs step failed' }

phase('Check')
const check = await agent(
  `Verify: 1) revert the fix locally (do not commit) and confirm ${repro.test} fails, then restore and confirm it passes; 2) the full suite and replay tests pass; 3) each touched docs page (${(docs.pages || []).join(', ') || 'none'}) holds one Diataxis kind, starts with its kind-and-audience line, follows the title pattern and links related kinds. Report problems; do not commit, and restore the working tree before returning.`,
  { schema: CHECK, phase: 'Check', label: 'check', independent: true })
if (!check) return { status: 'unverified', reason: 'check agent failed', cause: diag.cause }
if (!check.pass) return { status: 'blocked', open: check.problems }

// The handoff is what engineering-practices deliver-package takes as
// prior, so the fix ships without being built again.
phase('Handoff')
const hand = await agent(
  `Hand off the fix for: ${bug}. If you are on the default branch, cut a Conventional branch (fix/<slug>) from the latest remote default branch; otherwise stay on the current feature branch. Commit everything this run wrote: the regression test ${repro.test}, the fix, any sibling tests and fixes, and the docs pages (${(docs.pages || []).join(', ') || 'none'}) as Conventional Commits, and push. Run the full suite and the replay tests with the project's commands, and the docs or link checks the project profile names, on the pushed head. Do not open, mark ready or merge a PR: the engineering-practices workflow named in the result does that. Follow the engineering-practices git-workflow skill. Return the branch, any open PR, the head commit SHA, whether the checks pass on that head, and the problem if not.`,
  { schema: HANDOFF, phase: 'Handoff', label: 'handoff' })
if (!hand || !hand.branch) return { status: 'blocked', reason: 'handoff failed; the fix may be uncommitted or not pushed' + (hand && hand.problem ? ': ' + hand.problem : ''), cause: diag.cause }
if (!hand.tests_pass) return { status: 'blocked', cause: diag.cause, open: [`checks fail on ${hand.branch}${hand.head_sha ? ' at ' + hand.head_sha : ''}: ${hand.problem || 'no details'}`] }

return {
  status: 'done',
  cause: diag.cause,
  test: repro.test,
  siblingsFixed: sites.length,
  unverifiedSearches: unverified,
  docs: docs.pages,
  undocumented: docs.undocumented,
  handoff: {
    from: 'gameplay-programmer:investigate-gameplay-bug',
    branch: hand.branch,
    pr: hand.pr || '',
    head_sha: hand.head_sha || '',
    tests_pass: true,
    docs: docs.pages || [],
    undocumented: docs.undocumented || [],
    notes: [`root cause: ${diag.cause}`, `regression test: ${repro.test}`].concat(unverified.length ? ['sibling searches left unverified: ' + unverified.join('; ')] : []),
  },
  next: `ship it without rebuilding: /engineering-practices:deliver-package { wp: "<the package>", prior: <this result> }; with no work package, /engineering-practices:land-pr { branch: "${hand.branch}" }`,
}
})(RUN.agent, RUN.phase, RUN.log)]); return RUN.finish(RUN_OUT)
