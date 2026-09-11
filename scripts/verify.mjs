// The verification loop, as one cross-platform command (spec D7).
//
// Deliberately a Node script rather than shell glue: it has to behave identically
// on a Windows 11 laptop and an ubuntu-latest runner. The obvious off-the-shelf
// choice, start-server-and-test, spawns wmic.exe, which Windows 11 no longer ships.
//
// Steps: build -> serve with the real `base` -> crawl every link -> stop -> evals.

import { spawn, spawnSync } from 'node:child_process';
import { LinkChecker } from 'linkinator';

// Accept the base with or without slashes and normalise to `/x/y/`.
// Git Bash on Windows rewrites a leading-slash value like `/sdlc-preview/`
// into `C:/Program Files/Git/sdlc-preview/` before Node ever sees it, so the
// documented way to pass it is slashless: VERIFY_BASE=sdlc-preview
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

// Fail early and actionably. Astro reports the wrong Node version, but not that `nvm use`
// silently does nothing on Windows without elevation — which is how a shell ends up back on
// Node 20 after you were sure you had switched.
const MIN_MAJOR = 22;
const major = Number(process.versions.node.split('.')[0]);
if (major < MIN_MAJOR) {
  console.error(
    `\n✗ Node ${process.versions.node} is too old — Astro needs >=${MIN_MAJOR}.12.0.\n\n` +
      `  This shell only:\n` +
      `    PowerShell   $env:Path = "$env:APPDATA\\nvm\\v22.19.0;$env:Path"\n` +
      `    Git Bash     export PATH="/c/Users/rashi/AppData/Roaming/nvm/v22.19.0:$PATH"\n\n` +
      `  Permanently: run \`nvm use 22.19.0\` in an ADMINISTRATOR PowerShell.\n` +
      `  Without elevation nvm-windows cannot rewrite its symlink and fails silently.\n`,
  );
  process.exit(1);
}

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
// `astro preview` takes `base` from astro.config.mjs, not from the build output, so it must
// be told the same base the build just used or it serves the wrong path.
//
// It must also NOT be started with a blocking spawnSync: on Windows it daemonises and
// returns, but on Linux it stays in the foreground, so a blocking call never comes back and
// the CI job hangs until its timeout. Spawn it asynchronously and handle both shapes —
// kill the child for the foreground case, `astro preview stop` for the daemon.
const server = spawn(
  npm,
  ['--prefix', 'site', 'run', 'preview', '--', '--port', String(PORT), '--base', BASE],
  { stdio: 'inherit', shell: process.platform === 'win32' },
);
server.on('error', (err) => console.error(`  could not start preview: ${err.message}`));

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
  server.kill();
  stopPreview();
}

if (failed) process.exit(1);

console.log(`\n▶ evals`);
run(['run', 'check:evals'], 'evals');

// The diagram is a build artifact, so a stale one is a failing build — not a stale picture
// somebody notices six months later.
console.log(`\n▶ diagram`);
run(['run', 'check:diagram'], 'diagram drift check');

console.log('\n✓ verify passed');

// Exit explicitly. Killing the npm wrapper does not always take the astro child with it,
// and a surviving child handle keeps the event loop alive — which in CI looks identical to
// the hang this script was just fixed to avoid.
process.exit(0);
