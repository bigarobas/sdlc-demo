// npm run proposals              what is pending, what is installed, what is litter
// npm run proposals -- --install copy the pending ones into place, unstaged
// npm run proposals -- --clean   delete proposals that are already installed
//
// THE PROPOSALS LANE, and why it needs a script.
//
// An agent cannot write `.github/workflows/**`, `.claude/settings.json` or `.claude/hooks/**`
// — a hook denies it. So it writes the proposed version under `proposals/<same path>` and a
// human copies it into place and commits it under their own name. The agent drafts; the human
// installs. That boundary is the whole governance claim, and routing around it with a shell
// command would make every guardrail here decorative.
//
// The boundary is sound. The ERGONOMICS were not, and on 2026-09-15 they failed three times
// in one afternoon:
//
//   1. `cp proposals/x .github/x` run from `main` while the new proposal existed only on an
//      unmerged branch. It copied the old file over itself and printed nothing. A silent
//      no-op that looked exactly like success.
//   2. The same thing again, a different file, an hour later.
//   3. An install committed and never pushed. `origin/main` was untouched, CI kept running
//      the old workflow, and the local log looked right — which is scar #15 in the runbook.
//   4. An install that changed a workflow trigger without running `npm run diagram`, so the
//      derived diagram went stale and turned `main` red within a minute.
//
// None of those were carelessness. Each time the person ran exactly the commands they were
// given, and the commands were incomplete. This script exists so the instructions cannot be.
//
// It NEVER commits and never pushes. Those stay human, which is the point.

import { readdirSync, statSync, readFileSync, copyFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = 'proposals';
const install = process.argv.includes('--install');
const clean = process.argv.includes('--clean');

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function same(a, b) {
  try {
    return readFileSync(a, 'utf8') === readFileSync(b, 'utf8');
  } catch {
    return false;
  }
}

function exists(p) {
  try {
    statSync(p);
    return true;
  } catch {
    return false;
  }
}

const slash = (p) => p.replace(/\\/g, '/');

if (!exists(ROOT)) {
  console.log('\n  No proposals/ directory. Nothing to install.\n');
  process.exit(0);
}

const files = walk(ROOT).map((p) => {
  const target = slash(relative(ROOT, p));
  return {
    proposal: slash(p),
    target,
    state: !exists(target) ? 'new' : same(p, target) ? 'installed' : 'pending',
  };
});

const pending = files.filter((f) => f.state !== 'installed');
const installed = files.filter((f) => f.state === 'installed');

// --- report ---------------------------------------------------------------------------------

console.log('');
if (pending.length) {
  console.log(`  ${pending.length} proposal(s) not yet installed:\n`);
  for (const f of pending) {
    const r = spawnSync('git', ['diff', '--no-index', '--numstat', f.target, f.proposal], {
      encoding: 'utf8',
      shell: process.platform === 'win32',
    });
    const [add = '?', del = '?'] = (r.stdout.trim().split(/\s+/) ?? []).slice(0, 2);
    const churn = f.state === 'new' ? 'new file' : `+${add} -${del}`;
    console.log(`    ${f.target.padEnd(46)} ${churn}`);
  }
} else {
  console.log('  Nothing pending — every proposal matches what is installed.');
}

if (installed.length) {
  console.log(`\n  ${installed.length} already installed and identical:\n`);
  for (const f of installed) console.log(`    ${f.target}`);
  console.log(`\n  AGENTS.md says delete a proposal once it is installed. \`--clean\` does that.`);
}

// --- install ---------------------------------------------------------------------------------

if (install) {
  if (!pending.length) {
    // The failure mode this whole script exists for. `cp` printed nothing and exited zero.
    console.error(`\n  ✗ Nothing to install.`);
    console.error(`\n  Every proposal already matches the installed file, so copying would`);
    console.error(`  change nothing. If you expected a change here, the likely cause is that`);
    console.error(`  the new proposal is on a branch this working tree has not merged yet.`);
    console.error(`  Check with:  git log --oneline origin/main -1\n`);
    process.exit(1);
  }

  for (const f of pending) {
    mkdirSync(dirname(f.target), { recursive: true });
    copyFileSync(f.proposal, f.target);
    console.log(`\n  installed  ${f.target}`);
  }

  console.log(`\n  Copied, and deliberately NOT staged or committed. Those are yours.\n`);

  // A workflow, hook, skill or agent change moves the derived diagram. Leaving this out is
  // what turned main red on 2026-09-15, one minute after an install.
  const derived = /^\.github\/workflows\/|^\.claude\/(hooks|skills|agents)\//;
  if (pending.some((f) => derived.test(f.target))) {
    console.log(`  This changes the derived diagram. Run this BEFORE committing:\n`);
    console.log(`    npm run diagram\n`);
  }

  console.log(`  Then:\n`);
  console.log(`    git add ${pending.map((f) => f.target).join(' ')}`);
  console.log(`    git commit -m "Install: ..."`);
  console.log(`    git push origin main\n`);
  console.log(`  The push is not optional. An install that is committed and never pushed`);
  console.log(`  leaves CI running the old file while your local log looks correct.\n`);
}

// --- clean ----------------------------------------------------------------------------------

if (clean) {
  if (!installed.length) {
    console.log(`\n  Nothing to clean.\n`);
  } else {
    for (const f of installed) {
      rmSync(f.proposal);
      console.log(`  deleted  ${f.proposal}`);
    }
    console.log(`\n  ${installed.length} installed proposal(s) removed. Commit the deletion.\n`);
  }
}

// --- the unpushed check ---------------------------------------------------------------------
// Runs on every invocation, not only after an install, because the commit that goes missing
// is usually one you made a while ago and stopped thinking about.

const upstream = spawnSync('git', ['rev-parse', '--abbrev-ref', '@{u}'], {
  encoding: 'utf8',
  shell: process.platform === 'win32',
});
if (upstream.status === 0) {
  const ahead = spawnSync('git', ['log', '--oneline', '@{u}..HEAD'], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  const commits = ahead.stdout.trim();
  if (commits) {
    console.log(`  ⚠ ${commits.split('\n').length} commit(s) here are not on the remote:\n`);
    for (const line of commits.split('\n')) console.log(`    ${line}`);
    console.log(`\n  CI cannot see these. Push before expecting a workflow to change.\n`);
  }
}

if (!install && !clean && pending.length) {
  console.log(`\n  To install them:  npm run proposals -- --install\n`);
}
