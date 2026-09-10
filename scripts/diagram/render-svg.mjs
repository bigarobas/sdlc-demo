// Emit the pipeline as inline-able SVG.
//
// Hand-placed rather than laid out by a graph library, because this graph is not arbitrary:
// columns are SDLC stages and rows are tiers, so placement is arithmetic. That keeps every
// attribute under our control — which matters most for theming, since an inline SVG can
// inherit the page's colours through CSS variables and a rasterised image cannot.
//
// Two rules the drawing obeys:
//   1. Pink means a human decision or a human gate. Nothing else is pink except `$`.
//   2. Every kind of thing gets its own SHAPE, not just its own colour — a diagram read from
//      the back of a room, or by someone who cannot separate these hues, still has to work.

const LANES = [
  { id: 'human', label: 'Human' },
  { id: 'local', label: 'Local session' },
  { id: 'github', label: 'GitHub Actions' },
  { id: 'external', label: 'External' },
];

const STAGES = [
  { n: 1, label: 'Plan' },
  { n: 2, label: 'Design' },
  { n: 3, label: 'Build' },
  { n: 4, label: 'Test' },
  { n: 5, label: 'Deploy' },
  { n: 6, label: 'Maintain' },
];

const GUTTER = 104;
const COL_W = 176;
const COL_GAP = 10;
const HEAD_H = 52;
const PAD = 16;
const BOX_GAP = 8;
const LANE_TOP = 26;
const LEGEND_H = 96;

const colX = (n) => GUTTER + (n - 1) * (COL_W + COL_GAP);
const boxHeight = (kind) => (kind === 'environment' ? 36 : 60);

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function truncate(s, max) {
  const t = String(s ?? '');
  return t.length > max ? t.slice(0, max - 1) + '…' : t;
}

// --- one distinct silhouette per kind -----------------------------------------------------
// Drawn as paths rather than picked from a font, so nothing depends on which glyphs the
// viewer happens to have installed.
function glyph(kind, x, y) {
  const g = (d, cls = '') => `<path d="${d}" class="glyph ${cls}"/>`;
  switch (kind) {
    case 'skill': // a page with a folded corner — knowledge, written down
      return g(`M${x} ${y} h7 l3 3 v8 h-10 z M${x + 7} ${y} v3 h3`);
    case 'subagent': // head and shoulders — something that acts on your behalf
      return (
        `<circle cx="${x + 5}" cy="${y + 3.5}" r="2.6" class="glyph"/>` +
        g(`M${x + 0.5} ${y + 11} a4.5 4.5 0 0 1 9 0`)
      );
    case 'workflow': // a play triangle in a frame — something that runs, unattended
      return g(`M${x} ${y} h11 v11 h-11 z M${x + 4} ${y + 3} l4.5 2.5 l-4.5 2.5 z`);
    case 'environment': // a padlock — a place a credential lives
      return g(`M${x + 1} ${y + 5} h9 v7 h-9 z M${x + 2.5} ${y + 5} v-2 a3 3 0 0 1 6 0 v2`);
    case 'service': // a cloud — somebody else's computer
      return g(
        `M${x + 1} ${y + 10} a3 3 0 0 1 0.6 -5.9 a3.6 3.6 0 0 1 6.9 -0.6 a2.8 2.8 0 0 1 1.5 6.5 z`,
      );
    default:
      return '';
  }
}

export function renderSvg({ nodes, annotations }) {
  const ann = annotations;

  // Bucket into (lane, stage). Hooks are excluded — they get one band, because five
  // near-identical boxes would take five times the space to say the same thing.
  const cells = new Map();
  const hooks = [];
  for (const n of nodes) {
    const a = ann[n.id];
    if (!a) continue;
    if (n.kind === 'hook') {
      hooks.push({ node: n, a });
      continue;
    }
    if (a.stage == null) continue;
    const key = `${a.lane}:${a.stage}`;
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key).push({ node: n, a });
  }

  const decisions = ann._decisions ?? [];

  // --- lane heights, measured rather than guessed ---
  const laneHeight = {};
  for (const lane of LANES) {
    let tallest = 0;
    for (const s of STAGES) {
      const items = cells.get(`${lane.id}:${s.n}`) ?? [];
      const h = items.reduce((sum, it) => sum + boxHeight(it.node.kind) + BOX_GAP, 0);
      tallest = Math.max(tallest, h);
    }
    if (lane.id === 'human') {
      const most = Math.max(...STAGES.map((s) => decisions.filter((d) => d.stage === s.n).length));
      tallest = most * 40;
    }
    if (lane.id === 'local') tallest += 48; // the hooks band sits under the boxes
    laneHeight[lane.id] = Math.max(tallest + LANE_TOP + 10, 72);
  }

  const laneY = {};
  let y = HEAD_H;
  for (const lane of LANES) {
    laneY[lane.id] = y;
    y += laneHeight[lane.id];
  }
  const loopY = y + 26;
  const legendY = loopY + 22;
  const totalH = legendY + LEGEND_H;
  const totalW = colX(6) + COL_W + PAD;

  const out = [];

  // --- lane bands ---
  LANES.forEach((lane, i) => {
    out.push(
      `<rect x="0" y="${laneY[lane.id]}" width="${totalW}" height="${laneHeight[lane.id]}" class="lane ${i % 2 ? 'lane-alt' : ''}"/>`,
      `<text x="${PAD}" y="${laneY[lane.id] + 18}" class="lane-label">${esc(lane.label)}</text>`,
    );
  });

  // --- stage headers ---
  for (const s of STAGES) {
    const x = colX(s.n);
    out.push(
      `<text x="${x}" y="20" class="stage-n">${s.n}</text>`,
      `<text x="${x + 16}" y="20" class="stage-label">${esc(s.label)}</text>`,
      `<line x1="${x - 5}" y1="30" x2="${x - 5}" y2="${y}" class="col-rule"/>`,
    );
  }

  // --- nodes ---
  for (const [key, items] of cells) {
    const [lane, stage] = key.split(':');
    let ny = laneY[lane] + LANE_TOP;
    for (const { node, a } of items) {
      const x = colX(Number(stage));
      const h = boxHeight(node.kind);
      const cls = ['box', `kind-${node.kind}`, a.gate ? 'gate' : ''].filter(Boolean).join(' ');
      const rx = node.kind === 'subagent' ? 14 : node.kind === 'skill' ? 2 : 5;

      out.push(`<g class="${cls}">`);
      out.push(`<rect x="${x}" y="${ny}" width="${COL_W}" height="${h}" rx="${rx}"/>`);
      out.push(glyph(node.kind, x + 10, ny + 9));
      out.push(
        `<text x="${x + 28}" y="${ny + 17}" class="box-label">${esc(node.label.replace(/\n/g, ' '))}</text>`,
      );

      const trigger = node.triggerText ?? a.trigger;
      if (trigger) {
        out.push(
          `<text x="${x + 10}" y="${ny + 32}" class="box-trigger">▸ ${esc(truncate(trigger, 30))}</text>`,
        );
      }
      if (a.note && h > 40) {
        out.push(
          `<text x="${x + 10}" y="${ny + 46}" class="box-note">${esc(truncate(a.note, 34))}</text>`,
        );
      }
      if (a.cost === 'agent') {
        out.push(`<text x="${x + COL_W - 14}" y="${ny + 18}" class="cost">$</text>`);
      }
      out.push(`</g>`);
      ny += h + BOX_GAP;
    }
  }

  // --- human decisions ---
  const decSeen = {};
  for (const d of decisions) {
    const x = colX(d.stage);
    const i = (decSeen[d.stage] = (decSeen[d.stage] ?? -1) + 1);
    const dy = laneY.human + LANE_TOP - 6 + i * 40;
    out.push(
      `<g class="decision">`,
      `<rect x="${x}" y="${dy}" width="${COL_W}" height="32" rx="16"/>`,
      `<text x="${x + COL_W / 2}" y="${dy + 20}" class="decision-label">${esc(d.label)}</text>`,
      `</g>`,
    );
  }

  // --- hooks: one band, spanning the stages a session actually passes through ---
  const hooksY = laneY.local + laneHeight.local - 46;
  out.push(
    `<g class="hooks">`,
    `<rect x="${colX(1)}" y="${hooksY}" width="${colX(5) + COL_W - colX(1)}" height="36" rx="5"/>`,
    `<text x="${colX(1) + 10}" y="${hooksY + 15}" class="box-label">${hooks.length} hooks — deterministic, not negotiable</text>`,
    `<text x="${colX(1) + 10}" y="${hooksY + 28}" class="box-trigger">▸ every Write, Edit and Bash call, before it runs · ${esc(hooks.map((h) => h.node.label).join(' · '))}</text>`,
    `</g>`,
  );

  // --- the loop back to Plan ---
  out.push(
    `<path d="M ${colX(6) + COL_W / 2} ${laneY.external + laneHeight.external - 4} V ${loopY} H ${colX(1) + COL_W / 2} V ${laneY.human + LANE_TOP + 26}" class="loop"/>`,
    `<text x="${(colX(1) + colX(6)) / 2}" y="${loopY - 6}" class="loop-label">a breach becomes the next intent — no tokens, no model</text>`,
  );

  // --- legend ---
  const legend = [
    ['skill', 'skill', 'knowledge applied as a constraint'],
    ['subagent', 'subagent', 'its own context window'],
    ['workflow', 'workflow', 'runs in CI, unattended'],
    ['environment', 'environment', 'where a credential lives'],
    ['service', 'external', "somebody else's computer"],
  ];
  out.push(
    `<line x1="0" y1="${legendY - 8}" x2="${totalW}" y2="${legendY - 8}" class="col-rule"/>`,
  );
  legend.forEach(([kind, label, note], i) => {
    const lx = PAD + i * 232;
    out.push(
      `<g class="box kind-${kind} legend-item">`,
      `<rect x="${lx}" y="${legendY}" width="20" height="20" rx="${kind === 'subagent' ? 10 : kind === 'skill' ? 2 : 4}"/>`,
      glyph(kind, lx + 4.5, legendY + 4),
      `</g>`,
      `<text x="${lx + 28}" y="${legendY + 10}" class="legend-label">${esc(label)}</text>`,
      `<text x="${lx + 28}" y="${legendY + 21}" class="legend-note">${esc(note)}</text>`,
    );
  });
  out.push(
    `<g class="decision"><rect x="${PAD}" y="${legendY + 36}" width="20" height="20" rx="10"/></g>`,
    `<text x="${PAD + 28}" y="${legendY + 46}" class="legend-label">human decision</text>`,
    `<text x="${PAD + 28}" y="${legendY + 57}" class="legend-note">nothing moves past it unattended</text>`,
    `<g class="box kind-environment gate"><rect x="${PAD + 232}" y="${legendY + 36}" width="20" height="20" rx="4"/></g>`,
    `<text x="${PAD + 260}" y="${legendY + 46}" class="legend-label">the production gate</text>`,
    `<text x="${PAD + 260}" y="${legendY + 57}" class="legend-note">the credential exists only past this point</text>`,
    `<text x="${PAD + 464}" y="${legendY + 50}" class="cost">$</text>`,
    `<text x="${PAD + 492}" y="${legendY + 46}" class="legend-label">costs Claude quota</text>`,
    `<text x="${PAD + 492}" y="${legendY + 57}" class="legend-note">everything unmarked is free</text>`,
    `<text x="${PAD + 696}" y="${legendY + 46}" class="legend-label">▸ what triggers it</text>`,
    `<text x="${PAD + 696}" y="${legendY + 57}" class="legend-note">derived from the repository, not written by hand</text>`,
  );

  // Every selector is scoped under `.dgm`. A <style> inside an inline SVG is a document-level
  // stylesheet, not a scoped one — unprefixed rules for `.box` or `.gate` would leak out and
  // restyle the page around it. The custom properties are namespaced instead of scoped, so
  // the file still themes correctly when opened on its own.
  const style = `
  :root{
    --dv-pink:#e20074; --dv-navy:#0a0528; --dv-blue:#315aa1; --dv-blue-dark:#2d3555;
    --d-bg:#ffffff; --d-lane:#fafafc; --d-lane-alt:#f4f4f8;
    --d-line:#dcdce6; --d-text:#0a0528; --d-muted:#5f5f72; --d-box:#ffffff;
  }
  @media (prefers-color-scheme: dark){:root:not([data-theme="light"]){
    --d-bg:#0a0528; --d-lane:#120c33; --d-lane-alt:#16103b;
    --d-line:#2d2856; --d-text:#f0f0f5; --d-muted:#9d9ab8; --d-box:#171142;
    --dv-blue:#7ea6e8; --dv-blue-dark:#a9b8dc; --dv-pink:#ff5fae; --dv-navy:#c9c6e0;
  }}
  :root[data-theme="dark"]{
    --d-bg:#0a0528; --d-lane:#120c33; --d-lane-alt:#16103b;
    --d-line:#2d2856; --d-text:#f0f0f5; --d-muted:#9d9ab8; --d-box:#171142;
    --dv-blue:#7ea6e8; --dv-blue-dark:#a9b8dc; --dv-pink:#ff5fae; --dv-navy:#c9c6e0;
  }
  .dgm text{font-family:ui-sans-serif,system-ui,'Segoe UI',Roboto,sans-serif;fill:var(--d-text)}
  .dgm .lane{fill:var(--d-lane)} .dgm .lane-alt{fill:var(--d-lane-alt)}
  .dgm .lane-label{font-size:11px;font-weight:700;fill:var(--d-muted);letter-spacing:.07em;text-transform:uppercase}
  .dgm .stage-n{font-size:13px;font-weight:700;fill:var(--dv-pink);font-family:ui-monospace,monospace}
  .dgm .stage-label{font-size:13px;font-weight:600}
  .dgm .col-rule{stroke:var(--d-line);stroke-width:1;stroke-dasharray:2 4}
  .dgm .box rect{fill:var(--d-box);stroke:var(--d-line);stroke-width:1}
  .dgm .box-label{font-size:11.5px;font-weight:600}
  .dgm .box-trigger{font-size:9px;fill:var(--dv-blue);font-family:ui-monospace,monospace}
  .dgm .box-note{font-size:9.5px;fill:var(--d-muted)}
  .dgm .glyph{fill:none;stroke:var(--d-muted);stroke-width:1.1;stroke-linejoin:round}
  .dgm .kind-skill rect{stroke:var(--dv-navy);stroke-width:1;}
  .dgm .kind-skill .glyph{stroke:var(--dv-navy)}
  .dgm .kind-subagent rect{stroke:var(--dv-blue-dark);stroke-width:1.4}
  .dgm .kind-subagent .glyph{stroke:var(--dv-blue-dark)}
  .dgm .kind-workflow rect{stroke:var(--dv-blue)}
  .dgm .kind-workflow .glyph{stroke:var(--dv-blue)}
  .dgm .kind-environment rect{stroke:var(--dv-blue-dark);stroke-dasharray:4 3}
  .dgm .kind-environment .glyph{stroke:var(--dv-blue-dark)}
  .dgm .kind-service rect{stroke:var(--d-muted);stroke-dasharray:2 3}
  .dgm .gate rect{stroke:var(--dv-pink);stroke-width:2;stroke-dasharray:none}
  .dgm .gate .glyph{stroke:var(--dv-pink)}
  .dgm .cost{font-size:13px;font-weight:700;fill:var(--dv-pink);font-family:ui-monospace,monospace}
  .dgm .decision rect{fill:none;stroke:var(--dv-pink);stroke-width:1.5}
  .dgm .decision-label{font-size:11px;font-weight:600;fill:var(--dv-pink);text-anchor:middle}
  .dgm .hooks rect{fill:none;stroke:var(--d-muted);stroke-width:1;stroke-dasharray:5 4}
  .dgm .loop{fill:none;stroke:var(--dv-pink);stroke-width:1.5;stroke-dasharray:5 4;marker-end:url(#arrow)}
  .dgm .loop-label{font-size:10px;fill:var(--dv-pink);text-anchor:middle;font-style:italic}
  .dgm .legend-label{font-size:10.5px;font-weight:600}
  .dgm .legend-note{font-size:9.5px;fill:var(--d-muted)}
  `;

  return `<svg xmlns="http://www.w3.org/2000/svg" class="dgm" viewBox="0 0 ${totalW} ${totalH}" role="img" aria-label="The sdlc-demo pipeline: six SDLC stages across four tiers, with human decisions marked">
<style>${style}</style>
<defs><marker id="arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L8 4 L0 8 z" fill="var(--dv-pink)"/></marker></defs>
<rect width="${totalW}" height="${totalH}" fill="var(--d-bg)"/>
${out.join('\n')}
</svg>`;
}
