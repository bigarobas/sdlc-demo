// The repository tree shown in section 05, derived.  [spec 0003 D1-D3]
//
// A SECOND CONSUMER OF ONE DERIVER, not a second deriver. `deriveModel()` already returns 22
// nodes carrying a file path — 10 workflows, 5 hooks, 5 skills, 2 subagents — and has since
// the pipeline diagram shipped. This module takes those and adds the few things the diagram
// has no reason to know about: top-level configuration, and one example artifact chain.
//
// Extending `deriveModel()` instead would have been shorter and wrong. Those extra files
// would then appear as nodes in the pipeline diagram, where they do not belong, and would
// immediately fail the diagram's own "every derived node has an annotation" assertion. The
// evals assert the diagram still derives 27 nodes for exactly this reason. [spec D3]

import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { deriveModel } from '../diagram/model.mjs';

const SDLC = 'docs/sdlc';

// The one chain shown in full, named by the reporter on issue #46: "just one for example
// 0002-navigation-usability with its intent,spec,plan". Everything else in docs/sdlc/ is
// summarised as a count, so the omission cannot read as "there are only two".
const EXAMPLE_CHAIN = '0002-navigation-usability';

// Top-level configuration the section already showed. Listed rather than globbed because
// answer 3 asked for "every workflow file and top-level config currently shown", and because
// a glob is what hid five hook files behind one line in the version being replaced.
const CONFIG = [
  { path: '.nvmrc', kind: 'config' },
  { path: 'package.json', kind: 'config' },
  { path: 'bands.yaml', kind: 'config' },
  { path: 'evals/run.mjs', kind: 'eval' },
  { path: '.claude/settings.json', kind: 'config' },
];

/**
 * Every entry in the tree, flat. `path` carries the nesting, so there is no nested structure
 * that can disagree with itself — the renderer derives depth by splitting on "/".
 */
// Forward slashes, always. `deriveModel()` builds some of its paths with path.join, which
// yields backslashes on Windows — so the generated JSON came out with `.claude\skills\...`
// on the laptop and `.claude/skills/...` on a Linux runner. The committed artifact would then
// be permanently stale in CI and green locally, which is the laptop-versus-runner failure
// AGENTS.md already lists three times. Normalise once, here, where every path enters.
const slash = (p) => p.replace(/\\/g, '/');

export function deriveTree() {
  const nodes = [];

  // --- from the pipeline deriver -----------------------------------------------------------
  // Only nodes that are a file. Environments and external services are real parts of the
  // pipeline and are not things you can point at in a directory listing.
  for (const n of deriveModel().nodes) {
    if (!n.file) continue;
    nodes.push({ path: slash(n.file), kind: n.kind, label: n.label });
  }

  // --- top-level configuration -------------------------------------------------------------
  for (const c of CONFIG) {
    if (existsSync(c.path)) nodes.push({ ...c, path: slash(c.path) });
  }

  // --- one example artifact chain ----------------------------------------------------------
  const chain = join(SDLC, EXAMPLE_CHAIN);
  if (existsSync(chain)) {
    for (const f of readdirSync(chain).sort()) {
      if (f.endsWith('.md')) nodes.push({ path: slash(join(chain, f)), kind: 'artifact' });
    }
  }

  // How many other chains exist. A number, not a list — and derived, so it cannot drift the
  // way "only 0000-bootstrap" did in the hand-written version this replaces.
  const others = existsSync(SDLC)
    ? readdirSync(SDLC, { withFileTypes: true }).filter(
        (d) => d.isDirectory() && /^\d{4,}-/.test(d.name) && d.name !== EXAMPLE_CHAIN,
      ).length
    : 0;

  nodes.sort((a, b) => a.path.localeCompare(b.path));

  return { nodes, otherChains: others };
}

/** Paths that must carry a description. Every derived entry, with no exceptions. */
export function describedPaths(tree) {
  return tree.nodes.map((n) => n.path);
}

/** Guard for the D3 contract: the pipeline diagram must be unaffected by anything here. */
export function diagramNodeCount() {
  return deriveModel().nodes.length;
}
