// npm run diagram          regenerate the pipeline diagram from the repository
// npm run check:diagram    fail if the committed output is stale
//
// The drift check is what makes this diagram trustworthy. Anyone can commit a diagram; the
// question is whether it still describes the code a month later. Here it is regenerated in
// CI and compared, exactly as prettier compares formatting — so a workflow added without
// regenerating turns the build red rather than quietly making the picture a lie.

import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { deriveModel, loadAnnotations } from './diagram/model.mjs';
import { renderSvg } from './diagram/render-svg.mjs';
import { renderMermaid, renderMarkdown } from './diagram/render-mermaid.mjs';

const check = process.argv.includes('--check');

const { nodes } = deriveModel();
const annotations = loadAnnotations();

// Coverage first: a node nobody has described is a node nobody has thought about.
const missing = nodes.filter((n) => !annotations[n.id]).map((n) => n.id);
if (missing.length) {
  console.error(`\n✗ ${missing.length} node(s) have no annotation:\n  ${missing.join('\n  ')}`);
  console.error(`\nAdd them to scripts/diagram/annotations.json and say what they are for.\n`);
  process.exit(1);
}

const mermaid = renderMermaid({ nodes, annotations });
const outputs = {
  // For the site: inline SVG, themed, no JavaScript. Lives under site/src so Astro can
  // import it without reaching outside its own root.
  'site/src/generated/pipeline.svg': renderSvg({ nodes, annotations }),
  // For GitHub: a mermaid fence, rendered natively with no build step.
  'docs/PIPELINE.md': renderMarkdown({ nodes, annotations, mermaid }),
};

let stale = [];
for (const [path, content] of Object.entries(outputs)) {
  if (check) {
    const current = existsSync(path) ? readFileSync(path, 'utf8') : null;
    if (current !== content) stale.push(path);
  } else {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }
}

if (check) {
  if (stale.length) {
    console.error(`\n✗ the pipeline diagram is stale:\n  ${stale.join('\n  ')}`);
    console.error(`\nThe repository changed but the diagram did not. Run:\n  npm run diagram\n`);
    process.exit(1);
  }
  console.log(`  diagram up to date (${nodes.length} nodes)`);
} else {
  console.log(`✓ diagram regenerated — ${nodes.length} nodes`);
  for (const path of Object.keys(outputs)) console.log(`  ${path}`);
}
