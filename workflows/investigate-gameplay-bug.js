// SPDX-License-Identifier: GPL-2.0-or-later
export const meta = {
  name: 'investigate-gameplay-bug',
  description: 'Reproduce a gameplay bug as a failing test, minimise it, find the first divergence and root cause, fix it at the cause, check for siblings, and document it in the same PR. Use for wrong rules, desyncs and game-logic crashes (kind simulation), and for engine-lifecycle, resource-leak and engine-integration bugs. args: { bug: "<issue link or description>", capture: "<optional path to seed/input log/save/leak report>", kind: "<optional: simulation | lifecycle | resource | integration>" }',
  phases: [
    { title: 'Reproduce', detail: 'turn the report or capture into a failing test' },
    { title: 'Diagnose', detail: 'minimise, find the first divergence for the bug kind, state the cause, plan doc kinds (compass)' },
    { title: 'Fix', detail: 'fix at the cause; full suite and the kind\'s checks green; blocking items apart from notes' },
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

const USAGE = 'usage: investigate-gameplay-bug { bug: "<issue link or description>", capture: "<optional path to seed/input log/save/leak report>", kind: "<optional: simulation | lifecycle | resource | integration>" }'
if (!args || !args.bug) return USAGE
const bug = args.bug
const capture = args.capture ? ' The capture is at ' + args.capture + '.' : ' There is no capture; rebuild the situation from the description.'

// Each bug kind has its own failing test, divergence search, checks and
// sibling lenses. Only simulation bugs have ticks and state hashes.
const KINDS = {
  simulation: {
    means: 'wrong rule, desync or crash inside the deterministic game logic',
    test: 'a replay or scenario test of the simulation, per the gameplay-testing skill',
    diagnose: 'Minimise it (bisect the input log, shrink the scenario), find the first diverging tick and subsystem (per-tick state hashes or readable dumps against the expected run or a second build; bisect commits if it is a regression)',
    divergence: 'the first diverging tick and subsystem',
    skills: 'game-systems and deterministic-simulation',
    checks: 'the full suite and the replay tests',
    lenses: [['simulation', 'the simulation core'], ['engine', 'the engine binding/adapter and content loading'], ['tests', 'the tests and fixtures (same wrong assumption)']],
  },
  lifecycle: {
    means: 'wrong order or state across engine or host lifecycle steps: start-up, scene or level load and unload, pause and resume, quit and teardown, thread start and stop',
    test: 'a headless engine test (per the engine-integration headless smoke test) that drives the lifecycle steps involved and fails on the wrong order, state, error or exit code',
    diagnose: 'Minimise it to the fewest lifecycle steps that still fail. Write down the expected sequence of lifecycle steps for each object involved (created, entered, ready, running, paused, exiting, freed) with the owner and thread of each, log or trace the actual sequence, and find the first step whose order, owner or state differs; bisect commits if it is a regression',
    divergence: 'the first lifecycle step whose order, owner or state differs from the expected sequence',
    skills: 'engine-integration and state-machines-and-events',
    checks: 'the full suite and the headless engine tests',
    lenses: [['adapter', 'the engine binding/adapter lifecycle hooks (registration, init, ready, exit, teardown)'], ['owners', 'other scenes, nodes, services and threads with the same lifecycle'], ['tests', 'the tests and fixtures (same wrong assumption)']],
  },
  resource: {
    means: 'a leak or lifetime error: memory, objects, nodes, handles, files, GPU resources or threads not released, released twice or used after release',
    test: 'a test that runs the smallest create and release cycle and fails when the resource count does not return to its start, or when the engine\'s leak report, a sanitizer or the exit code reports a leak',
    diagnose: 'Minimise it to the smallest create and release cycle that still leaks. Measure the resource with a tool fit for it (the engine\'s leak or orphan report on exit, LeakSanitizer or AddressSanitizer, Valgrind, live object or handle counts before and after N cycles), name the allocation that is not released, trace who owns it, and find the first release path that should free it and does not (or frees it twice); bisect commits if it is a regression',
    divergence: 'the leaking allocation, its owner and the release path that misses it',
    skills: 'engine-integration (lifetime) and game-systems',
    checks: 'the full suite and the leak check the test added',
    lenses: [['owners', 'code that allocates or owns the same kind of resource'], ['adapter', 'the engine binding/adapter and its teardown and quit paths'], ['tests', 'the tests and fixtures (same wrong assumption)']],
  },
  integration: {
    means: 'wrong data or calls across the boundary between game logic and the engine, platform or content: type conversion, call order, threads, configuration or build flags',
    test: 'a test at the boundary (adapter unit test or headless engine test) that feeds the reported input and fails on the wrong output, call or error',
    diagnose: 'Minimise it to the fewest boundary calls that still fail. Log what crosses the boundary (arguments, conversions, return values, thread, order) against what the contract says should cross, and find the first boundary call whose input or output is wrong; compare platforms or build configurations if only one fails; bisect commits if it is a regression',
    divergence: 'the first boundary call whose input or output is wrong',
    skills: 'engine-integration and data-driven-content',
    checks: 'the full suite and the headless engine tests',
    lenses: [['adapter', 'the engine binding/adapter and its conversions'], ['content', 'content loading, platform and configuration code'], ['tests', 'the tests and fixtures (same wrong assumption)']],
  },
}
const KIND_NAMES = Object.keys(KINDS)
if (args.kind && !KINDS[args.kind]) return `kind must be one of ${KIND_NAMES.join(', ')}, got "${args.kind}". ` + USAGE
const kindList = KIND_NAMES.map((k) => `${k} (${KINDS[k].means}: ${KINDS[k].test})`).join('; ')

const DOCS_FRAGMENT = 'Classify every user-visible change in this work with the Diataxis compass (action/cognition x study/work). For each, update or add exactly one page of that kind under the project docs/<kind>/ (location per the project profile), keep each page to one kind, title it by the project pattern (how-to-<goal>, about-<topic>, reference named for the thing), and link to the related pages of the other kinds. Report pages touched and any change you left undocumented and why.'

const REPRO = {
  type: 'object',
  properties: {
    reproduced: { type: 'boolean' },
    test: { type: 'string' },
    kind: { type: 'string', enum: KIND_NAMES },
    harness: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' },
  },
  required: args.kind ? ['reproduced', 'test'] : ['reproduced', 'test', 'kind'],
}
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
// open holds only what blocks shipping; anything else goes in notes.
const FIX = { type: 'object', properties: { green: { type: 'boolean' }, open: { type: 'array', items: { type: 'string' } }, notes: { type: 'array', items: { type: 'string' } } }, required: ['green', 'open'] }
const FIX_RETURN = 'Return green; in open, only what blocks shipping this fix (a failing test or check, a part of the cause left unfixed, a decision you cannot make); in notes, everything else (follow-ups, observations, failures you confirmed are also on the base branch). An empty open with green true means done.'
const SIB = { type: 'object', properties: { sites: { type: 'array', items: { type: 'object', properties: { location: { type: 'string' }, why: { type: 'string' }, testCode: { type: 'string' } }, required: ['location', 'why'] } } }, required: ['sites'] }
const DOCS = { type: 'object', properties: { pages: { type: 'array', items: { type: 'string' } }, undocumented: { type: 'array', items: { type: 'string' } } }, required: ['pages', 'undocumented'] }
const CHECK = { type: 'object', properties: { pass: { type: 'boolean' }, problems: { type: 'array', items: { type: 'string' } } }, required: ['pass', 'problems'] }
const HANDOFF = { type: 'object', properties: { branch: { type: 'string' }, pr: { type: 'string' }, head_sha: { type: 'string' }, tests_pass: { type: 'boolean' }, problem: { type: 'string' } }, required: ['branch', 'tests_pass'] }

phase('Reproduce')
const kindAsk = args.kind
  ? ` The bug kind is ${args.kind}: ${KINDS[args.kind].means}. Write ${KINDS[args.kind].test}.`
  : ` First classify the bug as one kind: ${kindList}. Return the kind and write the test that kind names.`
const repro = await agent(
  `Follow the gameplay-programmer gameplay-debugging-and-profiling skill, steps 1-2. Bug: ${bug}.${capture}${kindAsk} ` +
  'Write one failing test that fails for the reported reason. Do not change game code. When the test cannot be written without them, you may change the test harness (test runner, fixtures, test-only hooks that release builds compile out or never call) and CI steps (for example a step that runs the engine headless and fails on its leak report); keep those changes in their own test: or ci: commit, separate from any fix, and list each in harness. ' +
  'Commit the test on the bug branch only if the project allows failing tests on branches; otherwise leave it staged. Return whether it reproduces and the test path/name.',
  { schema: REPRO, phase: 'Reproduce', label: 'reproduce' })
if (!repro) return 'blocked: reproduce agent failed'
if (!repro.reproduced) return { status: 'blocked', reason: 'could not reproduce; no fix without a failing test', notes: repro.notes || '' }
const kindName = args.kind || (KINDS[repro.kind] ? repro.kind : null)
if (!kindName) return { status: 'blocked', reason: `reproduce returned no known bug kind (${KIND_NAMES.join(', ')})`, test: repro.test }
const K = KINDS[kindName]
const harness = Array.isArray(repro.harness) ? repro.harness : []

phase('Diagnose')
const diag = await agent(
  `Follow gameplay-debugging-and-profiling steps 3-5 on the failing test ${repro.test}. This is a ${kindName} bug (${K.means}). ${K.diagnose}. Report that as the first divergence: ${K.divergence}. State the root cause in one sentence. ` +
  'Name the general mistake as a searchable pattern (e.g. "iteration over an unordered container in simulation code", "node freed by its parent and again by its owner"). Then plan documentation with the Diataxis compass: a bug fix updates reference if behaviour changed and adds a troubleshooting how-to if users can hit it; list page, kind and why (empty list if none). Do not edit game code.',
  { schema: DIAG, phase: 'Diagnose', label: 'diagnose' })
if (!diag || !diag.cause) return { status: 'blocked', reason: 'diagnosis failed; cause not stated', test: repro.test }

phase('Fix')
const fix = await agent(
  `Fix the cause: ${diag.cause} (first divergence: ${diag.firstDivergence}). Fix at the cause, not the symptom; keep ${repro.test} unchanged and make it pass. Keep the fix out of the test-harness and CI commits${harness.length ? ' (' + harness.join('; ') + ')' : ''}. Follow ${K.skills}. Run ${K.checks} with the project's commands. Commit with a fix: Conventional Commit. ` + FIX_RETURN,
  { schema: FIX, phase: 'Fix', label: 'fix' })
if (!fix) return { status: 'blocked', reason: 'fix agent failed', cause: diag.cause }
const fixNotes = Array.isArray(fix.notes) ? fix.notes : []
if (!fix.green || (fix.open && fix.open.length)) return { status: 'blocked', cause: diag.cause, open: fix.open && fix.open.length ? fix.open : ['suite not green'], notes: fixNotes }

phase('Siblings')
const lenses = K.lenses
const sibs = await parallel(lenses.map(([key, l]) => () => agent(
  `Search ${l} for other instances of this mistake: "${diag.pattern}". Do NOT edit files. For each real instance return the location, why it is the same mistake, and, where testable, the code of a failing test for it.`,
  { schema: SIB, phase: 'Siblings', label: 'siblings:' + key })))
const unverified = []
const sites = []
sibs.forEach((s, i) => { if (!s || !Array.isArray(s.sites)) unverified.push(lenses[i][1]); else s.sites.forEach((x) => sites.push(x)) })
if (unverified.length) log('sibling searches that crashed (left unverified): ' + unverified.join('; '))
const sibNotes = []
if (sites.length) {
  const sfix = await agent(
    `Apply these sibling fixes in one pass: add each provided test first (each to the test file of the system it covers), confirm it fails, then fix. Run ${K.checks}. Commit. ` + FIX_RETURN + '\n' +
    sites.map((x, i) => `${i + 1}. ${x.location}: ${x.why}${x.testCode ? '\n' + x.testCode : ''}`).join('\n'),
    { schema: FIX, phase: 'Siblings', label: 'fix-siblings' })
  if (sfix && Array.isArray(sfix.notes)) sfix.notes.forEach((n) => sibNotes.push(n))
  if (!sfix || !sfix.green || (sfix.open && sfix.open.length)) return { status: 'blocked', reason: 'sibling fixes incomplete', open: sfix && sfix.open && sfix.open.length ? sfix.open : sites.map((x) => x.location), notes: fixNotes.concat(sibNotes) }
}
const notes = fixNotes.concat(sibNotes)

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
  `Verify: 1) revert the fix locally (do not commit) and confirm ${repro.test} fails, then restore and confirm it passes; 2) ${K.checks} pass; 3) any test-harness or CI change (${harness.join('; ') || 'none'}) sits in its own commit apart from the fix and changes no release behaviour; 4) each touched docs page (${(docs.pages || []).join(', ') || 'none'}) holds one Diataxis kind, starts with its kind-and-audience line, follows the title pattern and links related kinds. Report problems; do not commit, and restore the working tree before returning.`,
  { schema: CHECK, phase: 'Check', label: 'check', independent: true })
if (!check) return { status: 'unverified', reason: 'check agent failed', cause: diag.cause }
if (!check.pass) return { status: 'blocked', open: check.problems }

// The handoff is what engineering-practices deliver-package takes as
// prior, so the fix ships without being built again.
phase('Handoff')
const hand = await agent(
  `Hand off the fix for: ${bug}. If you are on the default branch, cut a Conventional branch (fix/<slug>) from the latest remote default branch; otherwise stay on the current feature branch. Commit everything this run wrote: the regression test ${repro.test}, any test-harness or CI changes in their own commit, the fix, any sibling tests and fixes, and the docs pages (${(docs.pages || []).join(', ') || 'none'}) as Conventional Commits, and push. Run ${K.checks} with the project's commands, and the docs or link checks the project profile names, on the pushed head. Do not open, mark ready or merge a PR: the engineering-practices workflow named in the result does that. Follow the engineering-practices git-workflow skill. Return the branch, any open PR, the head commit SHA, whether the checks pass on that head, and the problem if not.`,
  { schema: HANDOFF, phase: 'Handoff', label: 'handoff' })
if (!hand || !hand.branch) return { status: 'blocked', reason: 'handoff failed; the fix may be uncommitted or not pushed' + (hand && hand.problem ? ': ' + hand.problem : ''), cause: diag.cause }
if (!hand.tests_pass) return { status: 'blocked', cause: diag.cause, open: [`checks fail on ${hand.branch}${hand.head_sha ? ' at ' + hand.head_sha : ''}: ${hand.problem || 'no details'}`] }

return {
  status: 'done',
  kind: kindName,
  cause: diag.cause,
  test: repro.test,
  harness,
  siblingsFixed: sites.length,
  unverifiedSearches: unverified,
  docs: docs.pages,
  undocumented: docs.undocumented,
  notes,
  handoff: {
    from: 'gameplay-programmer:investigate-gameplay-bug',
    branch: hand.branch,
    pr: hand.pr || '',
    head_sha: hand.head_sha || '',
    tests_pass: true,
    docs: docs.pages || [],
    undocumented: docs.undocumented || [],
    notes: [`bug kind: ${kindName}`, `root cause: ${diag.cause}`, `regression test: ${repro.test}`]
      .concat(harness.length ? ['test-harness and CI changes: ' + harness.join('; ')] : [])
      .concat(unverified.length ? ['sibling searches left unverified: ' + unverified.join('; ')] : [])
      .concat(notes),
  },
  next: `ship it without rebuilding: /engineering-practices:deliver-package { wp: "<the package>", prior: <this result> }; with no work package, /engineering-practices:land-pr { branch: "${hand.branch}" }`,
}
})(RUN.agent, RUN.phase, RUN.log)]); return RUN.finish(RUN_OUT)
