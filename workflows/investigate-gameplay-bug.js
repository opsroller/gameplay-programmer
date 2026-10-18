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
  ],
}

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
  `Verify: 1) revert the fix locally (do not commit) and confirm ${repro.test} fails, then restore and confirm it passes; 2) the full suite and replay tests pass; 3) each touched docs page (${(docs.pages || []).join(', ') || 'none'}) holds one Diataxis kind, starts with its kind-and-audience line, follows the title pattern and links related kinds. Report problems; do not edit.`,
  { schema: CHECK, phase: 'Check', label: 'check' })
if (!check) return { status: 'unverified', reason: 'check agent failed', cause: diag.cause }
if (!check.pass) return { status: 'blocked', open: check.problems }

return { status: 'done', cause: diag.cause, test: repro.test, siblingsFixed: sites.length, unverifiedSearches: unverified, docs: docs.pages, undocumented: docs.undocumented }
