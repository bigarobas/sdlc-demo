// npm run intents — where every piece of work has got to.
//
// Deliberately a script and not a skill. Which artifacts exist, what `Status:` says, whether
// a pull request is open — none of that needs judgement, so none of it should cost a model
// call. A script also gives the same answer twice, which a model does not guarantee, and can
// be called by CI and by the `/sdlc` skill as well as by a person.
//
// The skill decides what to do. This only reports what is true.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const ROOT = 'docs/sdlc';
const ARTIFACTS = ['intent', 'spec', 'plan'];

function statusOf(file) {
  if (!existsSync(file)) return null;
  const m = readFileSync(file, 'utf8').match(/^\s*-\s*\*\*Status:\*\*\s*(\w+)/im);
  return m ? m[1].toLowerCase() : 'unstated';
}

function titleOf(file) {
  if (!existsSync(file)) return null;
  const m = readFileSync(file, 'utf8').match(/^#\s+(.+)$/m);
  return m ? m[1].replace(/^Intent\s+\d+\s+—\s+/, '') : null;
}

// gh is optional: the script must still work offline, or for a colleague who has not
// authenticated. Missing information is reported as unknown rather than guessed at.
function gh(args) {
  const r = spawnSync('gh', args, { encoding: 'utf8', shell: process.platform === 'win32' });
  if (r.status !== 0) return null;
  try {
    return JSON.parse(r.stdout);
  } catch {
    return null;
  }
}

const openPrs = gh(['pr', 'list', '--state', 'open', '--json', 'number,title,headRefName']);
const openIntentIssues = gh([
  'issue',
  'list',
  '--label',
  'intent',
  '--state',
  'open',
  '--json',
  'number,title',
]);

const dirs = existsSync(ROOT)
  ? readdirSync(ROOT, { withFileTypes: true })
      .filter((d) => d.isDirectory() && /^\d{4}-/.test(d.name))
      .map((d) => d.name)
      .sort()
  : [];

const rows = dirs.map((dir) => {
  const path = join(ROOT, dir);
  const have = ARTIFACTS.filter((a) => existsSync(join(path, `${a}.md`)));
  const status = statusOf(join(path, 'intent.md'));
  const title = titleOf(join(path, 'intent.md')) ?? dir;
  const pr = openPrs?.find((p) => p.headRefName.includes(dir) || p.title.includes(dir)) ?? null;

  // What a human has to do next. Only the acceptance steps are human by design; the rest is
  // work to ask for.
  let next;
  if (!have.includes('intent')) next = 'no intent.md — write one';
  else if (status === 'superseded') next = 'superseded — nothing to do';
  else if (status !== 'accepted') next = `accept the intent  →  set Status: accepted`;
  else if (!have.includes('spec')) next = `write the spec  →  /sdlc ${dir}`;
  else if (!have.includes('plan')) next = `write the plan  →  /sdlc ${dir}`;
  else if (pr) next = `review PR #${pr.number}`;
  else next = 'artifacts complete — implement, or done';

  return { dir, title, status: status ?? '—', have, pr, next };
});

const pad = (s, n) => String(s).padEnd(n);
console.log('');
console.log(pad('ID', 26) + pad('STATUS', 12) + pad('ARTIFACTS', 20) + 'NEXT');
console.log('-'.repeat(96));

if (!rows.length) console.log('  no intents yet');
for (const r of rows) {
  console.log(pad(r.dir, 26) + pad(r.status, 12) + pad(r.have.join(' '), 20) + r.next);
  if (r.title && r.title !== r.dir) console.log('  ' + r.title);
}

// Issues labelled `intent` with no directory yet are waiting on the drafting agent.
const started = new Set(dirs);
const waiting = (openIntentIssues ?? []).filter(
  (i) => !rows.some((r) => existsSync(join(ROOT, r.dir, 'intent.md')) && r.title === i.title),
);

if (openIntentIssues === null) {
  console.log('\n  (gh unavailable — open issues and pull requests not checked)');
} else if (waiting.length) {
  console.log('\nlabelled `intent`, awaiting or in drafting:');
  for (const i of waiting) console.log(`  #${i.number}  ${i.title}`);
}

const unlabelled = gh(['issue', 'list', '--state', 'open', '--json', 'number,title,labels']);
const untriaged = (unlabelled ?? []).filter((i) => !i.labels.some((l) => l.name === 'intent'));
if (untriaged.length) {
  console.log('\nopen issues not yet triaged — apply the `intent` label to start one:');
  for (const i of untriaged) console.log(`  #${i.number}  ${i.title}`);
}
console.log('');
