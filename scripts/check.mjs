// npm run check — everything that does not need the site built.
//
// Formatting, the eval suite, and the diagram drift check. About two seconds, no Astro, no
// server, no network. These catch problems in the *process* half of the repository: hooks
// that stopped denying, artifacts that lost a required section, a diagram that no longer
// matches the workflows.
//
// `npm run verify` runs this and then builds. The split exists because a change to
// docs/sdlc/** cannot break the build, and spending twenty-five seconds proving that on
// every commit teaches people to ignore the result.

import { spawnSync } from 'node:child_process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

// Node 22 is only needed for Astro, which none of these touch — so unlike verify.mjs this
// deliberately does not gate on the version. A colleague on Node 20 can still check their
// artifacts.

export function runChecks() {
  const steps = [
    ['formatting', ['exec', '--', 'prettier', '--check', '.']],
    ['evals', ['run', 'check:evals']],
    ['diagram', ['run', 'check:diagram']],
  ];

  for (const [label, args] of steps) {
    console.log(`\n▶ ${label}`);
    const r = spawnSync(npm, args, { stdio: 'inherit', shell: process.platform === 'win32' });
    if (r.status !== 0) {
      console.error(`\n✗ ${label} failed`);
      return false;
    }
  }
  return true;
}

// Only exit the process when run directly, so verify.mjs can import and continue.
//
// pathToFileURL, not string concatenation: on Windows a path is `C:\x\y`, and the correct
// URL is `file:///C:/x/y` with three slashes. Building it by hand produced two, the
// comparison never matched, and `npm run check` exited zero having run nothing at all —
// a silent green, which is the failure this repository keeps rediscovering.
import { pathToFileURL } from 'node:url';

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(runChecks() ? 0 : 1);
}
