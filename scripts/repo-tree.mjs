// npm run repo-tree          regenerate the repository tree shown in section 05
// npm run check:repo-tree    fail if the committed output is stale, or a path is undescribed
//
// Deliberately shaped like scripts/diagram.mjs: same --check flag, same coverage-before-drift
// ordering, same failure-message shape. A second convention doing the first one's job is a
// second thing for a colleague to learn.
//
// The drift check is the point. The version of this tree that shipped before was typed by
// hand, and a read-through found it wrong four ways at once — three missing workflows, a
// wrong count derived from them, a missing skill, and two shipped cycles it did not show —
// while the build stayed green and every eval passed. Now the structure is regenerated and
// compared, so a workflow added without regenerating turns the build red. [intent 0003]

import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { deriveTree } from './repo-tree/model.mjs';

const OUT = 'site/src/generated/repo-tree.json';
const DESCRIPTIONS = 'scripts/repo-tree/descriptions.json';

const check = process.argv.includes('--check');

const tree = deriveTree();
const descriptions = JSON.parse(readFileSync(DESCRIPTIONS, 'utf8'));

// Coverage first: a file nobody has described is a file nobody has thought about. This is the
// half that cannot be derived, so it is the half that needs forcing. [spec D4]
const missing = tree.nodes.map((n) => n.path).filter((p) => !descriptions[p]?.short);
if (missing.length) {
  console.error(`\n✗ ${missing.length} path(s) have no description:\n  ${missing.join('\n  ')}`);
  console.error(`\nAdd them to ${DESCRIPTIONS} and say what they are for.\n`);
  process.exit(1);
}

// And the other direction: a description for a path that no longer exists is a claim about a
// file that is gone. Deleting a workflow should force deleting its description, not leave one
// behind to be copied into the next thing that looks similar.
const orphans = Object.keys(descriptions)
  .filter((k) => !k.startsWith('_'))
  .filter((k) => !tree.nodes.some((n) => n.path === k));
if (orphans.length) {
  console.error(`\n✗ ${orphans.length} description(s) match no file:\n  ${orphans.join('\n  ')}`);
  console.error(`\nRemove them from ${DESCRIPTIONS}.\n`);
  process.exit(1);
}

const payload = {
  nodes: tree.nodes.map((n) => ({
    path: n.path,
    kind: n.kind,
    short: descriptions[n.path].short,
    ...(descriptions[n.path].detail ? { detail: descriptions[n.path].detail } : {}),
  })),
  otherChains: tree.otherChains,
};

const rendered = JSON.stringify(payload, null, 2) + '\n';

if (check) {
  if (!existsSync(OUT)) {
    console.error(`\n✗ ${OUT} is missing. Run \`npm run repo-tree\`.\n`);
    process.exit(1);
  }
  if (readFileSync(OUT, 'utf8') !== rendered) {
    console.error(`\n✗ ${OUT} is stale — the repository has changed since it was generated.`);
    console.error(`  Run \`npm run repo-tree\` and commit the result.\n`);
    process.exit(1);
  }
  console.log(`  repo tree up to date (${payload.nodes.length} entries)`);
} else {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, rendered);
  console.log(`  repo tree: ${payload.nodes.length} entries, ${payload.otherChains} other chains`);
}
