// npm run diagram — regenerate the pipeline diagram from the repository.
import { writeFileSync, mkdirSync } from 'node:fs';
import { deriveModel, loadAnnotations } from './diagram/model.mjs';
import { renderSvg } from './diagram/render-svg.mjs';

const { nodes } = deriveModel();
const annotations = loadAnnotations();

const missing = nodes.filter((n) => !annotations[n.id]).map((n) => n.id);
if (missing.length) {
  console.error(`\n✗ ${missing.length} node(s) have no annotation:\n  ${missing.join('\n  ')}`);
  console.error(`\nAdd them to scripts/diagram/annotations.json and say what they are for.\n`);
  process.exit(1);
}

mkdirSync('docs', { recursive: true });
writeFileSync('docs/pipeline.svg', renderSvg({ nodes, annotations }));
console.log(`✓ docs/pipeline.svg — ${nodes.length} nodes`);
