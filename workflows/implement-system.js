// SPDX-License-Identifier: GPL-2.0-or-later
export const meta = {
  name: 'implement-system',
  description: 'Implement one game rule or system, or a tool or CLI over the game core, test-first from its spec; attack it for determinism, edge cases, contract drift (and, for a tool, its performance budget), fix, document it in the same PR and push it as a handoff for engineering-practices deliver-package or land-pr. Use for any new or changed rule or gameplay tool. args: { system: "<system or tool name>", spec: "<path or section of the spec>", target: "system" | "tool" (optional, default "system"), wp: "<work package id, optional>", branch: "<existing branch, optional>", pr: "<existing PR, optional>" }',
  phases: [
    { title: 'Plan', detail: 'case list from the spec, ambiguities, doc kinds affected (compass); for a tool, build option, smoke test and performance budget' },
    { title: 'Build', detail: 'failing tests from the case list, then code, until green' },
    { title: 'Attack', detail: 'parallel read-only attempts to break it; each returns failing test code' },
    { title: 'Fix', detail: 'one agent adds the attack tests and fixes the code; only tests still failing block, notes never do' },
    { title: 'Docs', detail: 'write or update the planned Diataxis pages in the same PR' },
    { title: 'Check', detail: 'suite and replay tests green (for a tool, smoke test and budget); each touched page holds one kind' },
    { title: 'Hand off', detail: 'push, open or reuse a draft PR, return a handoff for deliver-package or land-pr' },
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

const USAGE = 'usage: implement-system { system: "<system or tool name>", spec: "<path or section of the spec>", target: "system" | "tool" (optional, default "system"), wp: "<work package id, optional>", branch: "<existing branch, optional>", pr: "<existing PR, optional>" }'
if (!args || !args.system || !args.spec) return USAGE
const system = args.system
const spec = args.spec
const target = args.target === undefined || args.target === null ? 'system' : String(args.target)
if (!['system', 'tool'].includes(target)) return `target must be "system" or "tool", got "${target}". ${USAGE}`
const tool = target === 'tool'
const wp = args.wp ? String(args.wp) : ''
const where = args.pr
  ? `Work on the existing PR ${args.pr} and its head branch; do not create a new branch or PR.`
  : args.branch
    ? `Work on the existing branch ${args.branch} (reuse its open PR if one exists); do not create a new branch.`
    : 'Work on the current feature branch; if you are on the default branch, cut a Conventional branch (feat/<slug>) from the latest remote default branch.'

const DOCS_FRAGMENT = 'Classify every user-visible change in this work with the Diataxis compass (action/cognition x study/work). For each, update or add exactly one page of that kind under the project docs/<kind>/ (location per the project profile), keep each page to one kind, title it by the project pattern (how-to-<goal>, about-<topic>, reference named for the thing), and link to the related pages of the other kinds. Report pages touched and any change you left undocumented and why.'

// Only failures block. Every step returns blocking problems and
// informational notes in separate fields, and the workflow stops on the
// blocking field alone, so a note never turns green work into "blocked".
const RED_RULE = 'A new test is red when it runs and fails, or when the build fails only because the test calls an API this change has not added yet (the compiler or type checker names that missing symbol and nothing else). Record each as "<test>: fails" or "<test>: does not compile, missing <symbol>"; a build error from anything else is not red, so fix or report it before going on.'
const NOTES_RULE = 'Put a problem in the blocking list only if it is a failure you can point to: a test that still fails, a suite or check that is red, a case you could not implement or fix. Everything else (observations, follow-up ideas, questions for the designer, things already fixed, "nothing found") goes in notes, never in the blocking list; an empty blocking list means done.'

// A tool or CLI is a target with three extra obligations: it is built
// only through its own build option, it has an end-to-end smoke test, and
// it meets a measured performance budget.
const TOOL_PLAN = 'This target is a tool or command-line program, not an in-game system. Its cases cover its interface: arguments and options, standard input and output formats, exit codes (zero on success, non-zero on each failure), error messages on standard error, and --help. It must reuse the engine-independent core through its public API and never copy rules. Also return tool: the build option that enables it in the project build (name, default off unless the profile says otherwise, so shipping builds do not include it), one smoke test (a command that runs the built tool end to end on a small committed input, with its expected exit code and output), and a performance budget (metric such as wall time or peak memory, the limit, the input it is measured on, and how to measure it with the project tooling). Use the spec\'s numbers where it gives them; otherwise state your default as AMBIGUOUS.'

// A system the running game reaches (bound to the engine, loaded by a
// scene or level) also owes one in-engine smoke test: the engine started
// headless on the real content, asserting one observable result. Unit
// tests on the core cannot catch a binding, loading or registration break.
const ENGINE_PLAN = 'Decide whether the running game reaches this system (it is bound to the engine, loaded by a scene, level or content file, or called from engine-side code), per the gameplay-programmer engine-integration skill. Return engineSmoke: needed (true when the running game reaches it), why, and when needed: test, one smoke test that starts the engine headless (or the project\'s automated run mode) on real committed content, drives the system once and asserts one observable result with a non-zero exit on failure, using the project\'s existing engine test harness if it has one; and ci, the pipeline change that makes the project\'s CI run it on every pull request (a new job or step, the engine binary or cache it needs, and the file the change goes in), or "none: <the existing job that already runs it>". If the project has no way to start the engine headless in CI, say so in ci and state the smallest addition as AMBIGUOUS.'

const PLAN = {
  type: 'object',
  properties: {
    cases: { type: 'array', items: { type: 'string' } },
    ambiguous: { type: 'array', items: { type: 'string' } },
    docKinds: { type: 'array', items: { type: 'object', properties: { kind: { type: 'string', enum: ['tutorial', 'how-to', 'reference', 'explanation'] }, page: { type: 'string' }, why: { type: 'string' } }, required: ['kind', 'page', 'why'] } },
    tool: {
      type: 'object',
      properties: {
        buildOption: { type: 'string' },
        smokeTest: { type: 'string' },
        budget: { type: 'string' },
      },
      required: ['buildOption', 'smokeTest', 'budget'],
    },
    wpCheck: {
      type: 'object',
      properties: {
        found: { type: 'boolean' },
        plan: { type: 'string' },
        title: { type: 'string' },
        matches: { type: 'boolean' },
        why: { type: 'string' },
      },
      required: ['found', 'matches'],
    },
    engineSmoke: {
      type: 'object',
      properties: {
        needed: { type: 'boolean' },
        why: { type: 'string' },
        test: { type: 'string' },
        ci: { type: 'string' },
      },
      required: ['needed', 'why'],
    },
  },
  required: ['cases', 'ambiguous', 'docKinds', 'engineSmoke'],
}
const BUILD = { type: 'object', properties: { green: { type: 'boolean' }, testFile: { type: 'string' }, branch: { type: 'string' }, smoke: { type: 'string' }, engineSmoke: { type: 'string' }, ciChange: { type: 'string' }, measured: { type: 'string' }, non_original: { type: 'array', items: { type: 'string' } }, notes: { type: 'string' } }, required: ['green', 'testFile', 'branch'] }
const ATTACK = { type: 'object', properties: { failures: { type: 'array', items: { type: 'object', properties: { problem: { type: 'string' }, testCode: { type: 'string' } }, required: ['problem', 'testCode'] } }, notes: { type: 'array', items: { type: 'string' } } }, required: ['failures'] }
const FIX = { type: 'object', properties: { green: { type: 'boolean' }, red: { type: 'array', items: { type: 'string' }, description: 'one per new test: "<test>: fails" or "<test>: does not compile, missing <symbol>"' }, failing: { type: 'array', items: { type: 'string' } }, notes: { type: 'array', items: { type: 'string' } } }, required: ['green', 'failing'] }
const DOCS = { type: 'object', properties: { pages: { type: 'array', items: { type: 'string' } }, undocumented: { type: 'array', items: { type: 'string' } } }, required: ['pages', 'undocumented'] }
const CHECK = { type: 'object', properties: { pass: { type: 'boolean' }, problems: { type: 'array', items: { type: 'string' } }, notes: { type: 'array', items: { type: 'string' } } }, required: ['pass', 'problems'] }
const HANDOFF = { type: 'object', properties: { branch: { type: 'string' }, pr: { type: 'string' }, head_sha: { type: 'string' }, tests_pass: { type: 'boolean' }, problem: { type: 'string' } }, required: ['branch', 'tests_pass'] }

const strings = (xs) => (Array.isArray(xs) ? xs.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim()) : [])
const notes = []

phase('Plan')
const plan = await agent(
  `You are the gameplay programmer. Follow the gameplay-programmer game-systems skill, step 1. Read ${spec} for the ${tool ? 'tool' : 'system'} "${system}" and the project's contracts doc. ` +
  'Return every rule, number and edge case as one-line test cases, and each gap as "AMBIGUOUS: <question> -> default <value>". ' +
  (tool ? TOOL_PLAN + ' ' : '') +
  (tool ? 'A tool is not reached by the running game: return engineSmoke with needed false. ' : ENGINE_PLAN + ' ') +
  'Then plan documentation: use the Diataxis compass to list each doc kind this ' + (tool ? 'tool' : 'system') + ' affects (' +
  (tool ? 'a tool owes reference for its options, exit codes and formats, and a how-to for the job it does; explanation if a design choice is made' : 'a new system owes reference for its interface; explanation if a design choice is made; how-to if someone must do something new') +
  '), with the page path and why. ' +
  (wp ? `Then check the work package id: find "${wp}" in the project's work-package list (the plan named in CLAUDE.md or the project profile) and return wpCheck: found, the plan path, the package title, and matches (true only when that package is this ${tool ? 'tool' : 'system'}'s work), with why. ` : '') +
  'Do not edit files.',
  { schema: PLAN, phase: 'Plan', label: 'plan' })
if (!plan || !Array.isArray(plan.cases) || plan.cases.length === 0) return 'blocked: planning failed (no case list) for ' + system
if (tool && !(plan.tool && plan.tool.buildOption && plan.tool.smokeTest && plan.tool.budget)) return 'blocked: planning for tool ' + system + ' returned no build option, smoke test and performance budget'
// A wrong id would ship the work under another package's row.
if (wp && !(plan.wpCheck && plan.wpCheck.found && plan.wpCheck.matches)) {
  const c = plan.wpCheck || {}
  return `blocked: work package ${wp} ${!c.found ? `is not in the project's work-package list${c.plan ? ` (${c.plan})` : ''}` : `is "${c.title || '?'}", not the ${tool ? 'tool' : 'system'} "${system}"${c.why ? `: ${c.why}` : ''}`}; pass the right wp, or leave it out. ${USAGE}`
}
const ambiguous = Array.isArray(plan.ambiguous) ? plan.ambiguous : []
const docKinds = Array.isArray(plan.docKinds) ? plan.docKinds : []
const t = tool ? plan.tool : null
const es = !tool && plan.engineSmoke && plan.engineSmoke.needed ? plan.engineSmoke : null
if (es && !(es.test && es.ci)) return 'blocked: planning for ' + system + ' says the running game reaches it but returned no in-engine smoke test and CI change'
log(`${plan.cases.length} cases, ${ambiguous.length} ambiguous, ${docKinds.length} doc pages planned`)

phase('Build')
const build = await agent(
  `Implement ${tool ? 'the tool' : ''} "${system}" following the gameplay-programmer skills game-systems, deterministic-simulation, state-machines-and-events (if it has modes) and gameplay-testing, and the project profile. ${where} ` +
  (tool
    ? `Keep the logic in the engine-independent core and make the tool a thin command-line front end over its public API. Add it to the project build behind the build option ${t.buildOption}. Add the smoke test to the project's test suite (so it runs wherever the suite runs, building with the option on): ${t.smokeTest}. Measure the performance budget (${t.budget}) and report the measured value. `
    : 'Keep it in the engine-independent core. ' +
      (es ? `Then add the in-engine smoke test (${es.test}) and make CI run it (${es.ci}); if the pipeline file belongs to another role, make the change per the engineering-practices peer-coordination skill and say so in notes. Run the smoke test locally and report its result. ` : '')) +
  'Write failing tests for these cases first, in one test file for this ' + (tool ? 'tool' : 'system') + ', then the simplest code that passes, then refactor:\n- ' + plan.cases.join('\n- ') +
  (ambiguous.length ? '\nImplement each stated default as a named constant and keep this list for the game designer:\n- ' + ambiguous.join('\n- ') : '') +
  '\nLog every non-original item you add (third-party code, data or assets) per the engineering-practices provenance skill.\nRun the full test suite with the project\'s commands. Commit with Conventional Commits. Return whether the suite is green' + (tool ? ' (including the smoke test, with the budget met)' : '') + ', the path of the test file, the branch name, the non-original items added (empty if none)' + (tool ? ', the smoke test result and the measured budget value' : '') + (es ? ', the in-engine smoke test result (engineSmoke) and the CI change made (ciChange: file and job, or none)' : '') + '.',
  { schema: BUILD, phase: 'Build', label: 'build' })
if (!build || !build.green) return 'blocked: build did not reach green for ' + system + (build && build.notes ? ': ' + build.notes : '')
if (build.notes) notes.push('build: ' + build.notes)
if (es && !build.engineSmoke) return 'blocked: build for ' + system + ' did not report the in-engine smoke test result'

phase('Attack')
const lenses = tool
  ? [
      'determinism: same input and options give byte-identical output and exit code; seeds, clock reads, iteration order, locale, float formatting (deterministic-simulation skill)',
      'edge cases and bounds: empty, missing or malformed input, unknown options, maximum sizes, unwritable output, every failure exit code (game-systems case list discipline)',
      'contract fidelity: options, formats and exit codes against the spec; uses the core\'s public API with no copied rules; the build option keeps it out of builds that leave it off (game-systems)',
      `performance budget: ${t.budget}; measure on the stated input and on a larger realistic one, and report a failing test or benchmark if the budget is exceeded (gameplay-debugging-and-profiling)`,
    ]
  : [
      'determinism: seeds, RNG ownership and streams, clock reads, iteration order, float use (deterministic-simulation skill)',
      'edge cases and bounds: empty, zero, maximum, simultaneous events, invalid commands (game-systems case list discipline)',
      'contract fidelity: public API and result/event types against the project contracts doc and the spec numbers (game-systems)',
    ]
const attacks = await parallel(lenses.map((lens) => () => agent(
  `Try to break the new "${system}" code through ${lens}. Do NOT edit any file. For each real problem, return a short description and the code of one failing test written for the project's test framework, ready to add to ${build.testFile}. Put only real, reproducible problems in failures; observations and ideas go in notes. Return an empty failures list if you find nothing.`,
  { schema: ATTACK, phase: 'Attack', label: 'attack:' + lens.split(':')[0], independent: true })))
const unverified = []
const failures = []
attacks.forEach((a, i) => {
  if (!a || !Array.isArray(a.failures)) unverified.push(lenses[i].split(':')[0])
  else {
    a.failures.forEach((f) => failures.push(f))
    strings(a.notes).forEach((n) => notes.push(lenses[i].split(':')[0] + ': ' + n))
  }
})
if (unverified.length) log('attack lenses that crashed (left unverified): ' + unverified.join(', '))

phase('Fix')
if (failures.length) {
  const fix = await agent(
    `Add these failing tests to ${build.testFile} in one edit, confirm each is red first (${RED_RULE}), then fix the "${system}" code so they pass without weakening any test. Run the full suite and replay tests${tool ? ' and the smoke test' : es ? ' and the in-engine smoke test' : ''}. Commit.\n\n` +
    failures.map((f, i) => `${i + 1}. ${f.problem}\n${f.testCode}`).join('\n\n') +
    '\nReturn green (the full suite passes), red (how each new test was red before the fix), failing (each test or problem above that still fails after your fixes, one line each) and notes. ' + NOTES_RULE,
    { schema: FIX, phase: 'Fix', label: 'fix' })
  if (!fix) return { status: 'blocked', reason: 'fix agent failed', open: failures.map((f) => f.problem) }
  const failing = strings(fix.failing)
  strings(fix.notes).forEach((n) => notes.push('fix: ' + n))
  strings(fix.red).forEach((r) => notes.push('red before fix: ' + r))
  if (!fix.green || failing.length) return { status: 'blocked', open: failing.length ? failing : ['suite not green after fixes'], notes }
}

phase('Docs')
const docs = await agent(
  `Document "${system}" in the same PR. Planned pages:\n` +
  (docKinds.length ? docKinds.map((d) => `- ${d.kind}: ${d.page} (${d.why})`).join('\n') : '- (none planned; re-run the compass)') +
  (es ? `\nThe how-to or reference page that covers testing names the in-engine smoke test and how to run it locally.` : '') +
  (tool ? `\nThe reference page lists every option, input and output format and exit code, the build option ${t.buildOption}, and the performance budget; the how-to shows how to build it with that option and run it.` : '') +
  '\n' + DOCS_FRAGMENT + ' Also update the project contracts doc if the public API changed. Commit with a docs: or the feature commit per the project convention.',
  { schema: DOCS, phase: 'Docs', label: 'docs' })
if (!docs) return { status: 'blocked', reason: 'docs step failed; code without its docs is not done' }

phase('Check')
const check = await agent(
  `Check the "${system}" work. 1) Run the full test suite and the replay/determinism tests with the project's commands.` +
  (tool ? ` Build with ${t.buildOption} on and run the smoke test (${t.smokeTest}); measure the budget (${t.budget}); then confirm a build with the option off does not include the tool.` : '') +
  (es ? ` Run the in-engine smoke test (${es.test}) and confirm it fails when the system is not bound or loaded (for example, by reading that its assertion would fail on an empty scene), and that CI runs it on pull requests (${build.ciChange || es.ci}).` : '') +
  ` 2) For each touched docs page (${(docs.pages || []).join(', ') || 'none reported'}): it holds one Diataxis kind only, starts with a line saying its kind and audience, its title follows the pattern, and it links to the related pages of other kinds. Do not edit; report problems and notes separately. ` + NOTES_RULE + ' Set pass to true exactly when problems is empty.',
  { schema: CHECK, phase: 'Check', label: 'check', independent: true })
if (!check) return { status: 'unverified', reason: 'check agent failed', docs: docs.pages, unverifiedLenses: unverified, notes }
const problems = strings(check.problems)
strings(check.notes).forEach((n) => notes.push('check: ' + n))
if (problems.length) return { status: 'blocked', open: problems, notes }
if (!check.pass) return { status: 'blocked', open: ['check reported a failure without naming it; run the check again'], notes }

phase('Hand off')
const handoff = await agent(
  `Hand off the "${system}" work. ${where} Make sure every commit is pushed to the branch (${build.branch}); if no pull request is open for it, open a draft PR titled as a Conventional Commit${wp ? ` with "Refs: ${wp}" in the body` : ''}, listing the docs pages by Diataxis kind${es ? ', the in-engine smoke test and the CI change' : ''}${ambiguous.length ? ' and the defaults the game designer must confirm' : ''}. Do not mark it ready, request review or merge: the engineering-practices workflow named in the result does that. Follow the engineering-practices git-workflow skill. Return the branch, PR URL, head commit SHA, and whether the full suite passes on that head.`,
  { schema: HANDOFF, phase: 'Hand off', label: 'handoff' })
if (!handoff || !handoff.branch) return { status: 'blocked', reason: 'hand-off failed; the work is committed on ' + build.branch + ' but may not be pushed', notes }
if (!handoff.tests_pass) return { status: 'blocked', open: ['suite not green on the pushed head' + (handoff.problem ? ': ' + handoff.problem : '')], notes }

const out = {
  status: 'done',
  target,
  cases: plan.cases.length,
  ambiguousForDesigner: ambiguous,
  attackTestsAdded: failures.length,
  unverifiedLenses: unverified,
  docs: docs.pages,
  undocumented: docs.undocumented,
  notes,
  handoff: {
    from: 'gameplay-programmer:implement-system',
    branch: handoff.branch,
    pr: handoff.pr || '',
    head_sha: handoff.head_sha || '',
    tests_pass: true,
    docs: docs.pages || [],
    undocumented: docs.undocumented || [],
    non_original: strings(build.non_original),
    notes,
  },
}
if (es) out.engineSmoke = { test: es.test, ci: build.ciChange || es.ci, result: build.engineSmoke }
if (tool) out.tool = { buildOption: t.buildOption, smokeTest: t.smokeTest, budget: t.budget, measured: build.measured || '' }
out.next = wp
  ? `ship it without rebuilding: /engineering-practices:deliver-package { wp: "${wp}", prior: <this result> }; after the code reviewer passes, /engineering-practices:land-pr { pr: "<the PR>" }`
  : `land it (it marks the PR ready, asks the code reviewer, polls CI and squash-merges once passed): /engineering-practices:land-pr ${handoff.pr ? `{ pr: "${handoff.pr}" }` : `{ branch: "${handoff.branch}" }`}`
return out
})(RUN.agent, RUN.phase, RUN.log)]); return RUN.finish(RUN_OUT)
