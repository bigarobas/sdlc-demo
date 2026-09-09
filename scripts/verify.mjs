// The verification loop, as one cross-platform command (spec D7).
//
// Deliberately a Node script rather than shell glue: it has to behave identically
// on a Windows 11 laptop and an ubuntu-latest runner. The obvious off-the-shelf
// choice, start-server-and-test, spawns wmic.exe, which Windows 11 no longer ships.
//
// Steps: build -> serve with the real `base` -> crawl every link -> stop -> evals.

import { spawnSync } from 'node:child_process';
import { LinkChecker } from 'linkinator';

// Accept the base with or without slashes and normalise to `/x/y/`.
// Git Bash on Windows rewrites a leading-slash value like `/sdlc-demo/preview/`
// into `C:/Program Files/Git/sdlc-demo/preview/` before Node ever sees it, so the
// documented way to pass it is slashless: VERIFY_BASE=sdlc-demo/preview
function normaliseBase(raw) {
  const cleaned = String(raw ?? '')
    .replace(/^[A-Za-z]:[/\\].*?(?=(?:sdlc|$))/, '') // undo MSYS path mangling
    .replace(/^\/+|\/+$/g, '');
  return cleaned ? `/${cleaned}/` : '/';
}

const BASE = normaliseBase(process.env.VERIFY_BASE ?? 'sdlc');
const PORT = 4321;
const ROOT_URL = `http://localhost:${PORT}${BASE}`;

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(args, label) {
  const r = spawnSync(npm, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (r.status !== 0) {
    console.error(`\n✗ ${label} failed`);
    process.exit(r.status ?? 1);
  }
}

// `astro preview` daemonises, so a crashed run can leave a server behind that
// serves a stale build. Always stop before starting, and again in `finally`.
function stopPreview() {
  spawnSync(npm, ['exec', '--', 'astro', 'preview', 'stop'], {
    cwd: 'site',
    stdio: 'ignore',
    shell: process.platform === 'win32',
  });
}

async function waitForServer(url, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`preview server did not answer at ${url} within ${timeoutMs}ms`);
}

console.log(`\n▶ build (base ${BASE})`);
run(['--prefix', 'site', 'run', 'build', '--', '--base', BASE], 'build');

console.log(`\n▶ serve + link check`);
stopPreview(); // in case a previous run left one behind
// `astro preview` takes `base` from astro.config.mjs, not from the build output,
// so it must be told the same base the build just used or it serves the wrong path.
run(
  ['--prefix', 'site', 'run', 'preview', '--', '--port', String(PORT), '--base', BASE],
  'preview start',
);

let failed = false;
try {
  await waitForServer(ROOT_URL);

  const checker = new LinkChecker();
  const broken = [];
  checker.on('link', (link) => {
    if (link.state === 'BROKEN') broken.push(`${link.status} ${link.url}`);
  });
  const result = await checker.check({ path: ROOT_URL, recurse: true });

  console.log(`  ${result.links.length} links checked`);
  if (broken.length) {
    console.error('✗ broken links:\n  ' + broken.join('\n  '));
    failed = true;
  }
} catch (err) {
  console.error(`✗ ${err.message}`);
  failed = true;
} finally {
  stopPreview();
}

if (failed) process.exit(1);

console.log(`\n▶ evals`);
run(['run', 'check:evals'], 'evals');

console.log('\n✓ verify passed');
