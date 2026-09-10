// Emit the pipeline as inline-able SVG.
//
// Hand-placed rather than laid out by a graph library, because this graph is not arbitrary:
// columns are SDLC stages and rows are tiers, so placement is arithmetic. That keeps every
// attribute under our control — which matters most for theming, since an inline SVG can
// inherit the page's colours through CSS variables and a rasterised image cannot.
//
// Colour carries meaning, not decoration: pink marks a human decision, and nothing else.

const LANES = [
  { id: 'human', label: 'Human', height: 104 },
  { id: 'local', label: 'Local session', height: 196 },
  { id: 'github', label: 'GitHub Actions', height: 268 },
  { id: 'external', label: 'External', height: 84 },
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
const BOX_H = 46;
const BOX_GAP = 7;

const colX = (n) => GUTTER + (n - 1) * (COL_W + COL_GAP);

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Cheap word wrap. Good enough for short labels at a known font size.
function wrap(text, max) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > max && line) {
      lines.push(line);
      line = w;
    } else {
      line = (line + ' ' + w).trim();
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function renderSvg({ nodes, annotations }) {
  const ann = annotations;
  const laneY = {};
  let y = HEAD_H;
  for (const lane of LANES) {
    laneY[lane.id] = y;
    y += lane.height;
  }
  const totalH = y + 74; // room for the loop-back arrow and legend
  const totalW = colX(6) + COL_W + PAD;

  // Bucket nodes into (lane, stage) cells, hooks excluded — they get one grouped box.
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

  const out = [];

  // --- lane bands ---
  LANES.forEach((lane, i) => {
    out.push(
      `<rect x="0" y="${laneY[lane.id]}" width="${totalW}" height="${lane.height}" ` +
        `class="lane ${i % 2 ? 'lane-alt' : ''}"/>`,
      `<text x="${PAD}" y="${laneY[lane.id] + 20}" class="lane-label">${esc(lane.label)}</text>`,
    );
  });

  // --- stage headers ---
  for (const s of STAGES) {
    const x = colX(s.n);
    out.push(
      `<text x="${x}" y="20" class="stage-n">${s.n}</text>`,
      `<text x="${x + 16}" y="20" class="stage-label">${esc(s.label)}</text>`,
      `<line x1="${x - 5}" y1="30" x2="${x - 5}" y2="${totalH - 66}" class="col-rule"/>`,
    );
  }

  // --- node boxes ---
  for (const [key, items] of cells) {
    const [lane, stage] = key.split(':');
    let ny = laneY[lane] + 28;
    for (const { node, a } of items) {
      const x = colX(Number(stage));
      const cls = [
        'box',
        `kind-${node.kind}`,
        a.gate ? 'gate' : '',
        a.cost === 'free' ? 'free' : '',
      ]
        .filter(Boolean)
        .join(' ');
      out.push(`<g class="${cls}">`);
      out.push(`<rect x="${x}" y="${ny}" width="${COL_W}" height="${BOX_H}" rx="5"/>`);
      out.push(
        `<text x="${x + 9}" y="${ny + 17}" class="box-label">${esc(node.label.replace(/\n/g, ' '))}</text>`,
      );
      const noteLines = wrap(a.note ?? '', 32).slice(0, 2);
      noteLines.forEach((l, i) =>
        out.push(`<text x="${x + 9}" y="${ny + 30 + i * 11}" class="box-note">${esc(l)}</text>`),
      );
      if (a.cost === 'agent') {
        out.push(`<circle cx="${x + COL_W - 11}" cy="${ny + 12}" r="3.5" class="dot-agent"/>`);
      }
      out.push(`</g>`);
      ny += BOX_H + BOX_GAP;
    }
  }

  // --- human decisions ---
  const decSeen = {};
  for (const d of ann._decisions ?? []) {
    const x = colX(d.stage);
    const i = (decSeen[d.stage] = (decSeen[d.stage] ?? -1) + 1);
    const dy = laneY.human + 24 + i * 38;
    out.push(
      `<g class="decision">`,
      `<rect x="${x}" y="${dy}" width="${COL_W}" height="32" rx="16"/>`,
      `<text x="${x + COL_W / 2}" y="${dy + 20}" class="decision-label">${esc(d.label)}</text>`,
      `</g>`,
    );
  }

  // --- hooks: one grouped box, because five separate ones would say less ---
  const hooksY = laneY.local + 150;
  out.push(
    `<g class="hooks">`,
    `<rect x="${colX(1)}" y="${hooksY}" width="${colX(4) + COL_W - colX(1)}" height="38" rx="5"/>`,
    `<text x="${colX(1) + 10}" y="${hooksY + 16}" class="box-label">${hooks.length} hooks — deterministic, always on</text>`,
    `<text x="${colX(1) + 10}" y="${hooksY + 30}" class="box-note">${esc(hooks.map((h) => h.node.label).join(' · '))}</text>`,
    `</g>`,
  );

  // --- the loop back to Plan ---
  const loopY = totalH - 52;
  out.push(
    `<path d="M ${colX(6) + COL_W / 2} ${laneY.external + LANES[3].height - 4} ` +
      `V ${loopY} H ${colX(1) + COL_W / 2} V ${laneY.human + 26 + 32}" class="loop"/>`,
    `<text x="${(colX(1) + colX(6)) / 2}" y="${loopY - 7}" class="loop-label">` +
      `a breach becomes the next intent — no tokens, no model</text>`,
  );

  const style = `
  :root{
    --dv-pink:#e20074; --dv-navy:#0a0528; --dv-light:#f0f0f5;
    --dv-blue:#315aa1; --dv-blue-dark:#2d3555;
    --d-bg:#ffffff; --d-lane:#fafafc; --d-lane-alt:#f4f4f8;
    --d-line:#dcdce6; --d-text:#0a0528; --d-muted:#5f5f72; --d-box:#ffffff;
  }
  @media (prefers-color-scheme: dark){:root:not([data-theme="light"]){
    --d-bg:#161513; --d-lane:#1c1b19; --d-lane-alt:#201f1c;
    --d-line:#37342e; --d-text:#eae6df; --d-muted:#a49c8f; --d-box:#232019;
    --dv-blue:#6f9bdd; --dv-pink:#ff5fae;
  }}
  text{font-family:ui-sans-serif,system-ui,'Segoe UI',Roboto,sans-serif;fill:var(--d-text)}
  .lane{fill:var(--d-lane)} .lane-alt{fill:var(--d-lane-alt)}
  .lane-label{font-size:11px;font-weight:600;fill:var(--d-muted);letter-spacing:.06em;text-transform:uppercase}
  .stage-n{font-size:13px;font-weight:700;fill:var(--dv-pink);font-family:ui-monospace,monospace}
  .stage-label{font-size:13px;font-weight:600}
  .col-rule{stroke:var(--d-line);stroke-width:1;stroke-dasharray:2 4}
  .box rect{fill:var(--d-box);stroke:var(--d-line);stroke-width:1}
  .box-label{font-size:11.5px;font-weight:600}
  .box-note{font-size:9.5px;fill:var(--d-muted)}
  .kind-workflow rect{stroke:var(--dv-blue)}
  .kind-environment rect{stroke:var(--dv-blue-dark);stroke-dasharray:4 3}
  .gate rect{stroke:var(--dv-pink);stroke-width:2}
  .kind-service rect{stroke:var(--d-line);stroke-dasharray:3 3}
  .dot-agent{fill:var(--dv-pink)}
  .decision rect{fill:none;stroke:var(--dv-pink);stroke-width:1.5}
  .decision-label{font-size:11px;font-weight:600;fill:var(--dv-pink);text-anchor:middle}
  .hooks rect{fill:none;stroke:var(--d-muted);stroke-width:1;stroke-dasharray:5 4}
  .loop{fill:none;stroke:var(--dv-pink);stroke-width:1.5;stroke-dasharray:5 4;marker-end:url(#arrow)}
  .loop-label{font-size:10px;fill:var(--dv-pink);text-anchor:middle;font-style:italic}
  `;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}" role="img" aria-label="The sdlc-demo pipeline: six SDLC stages across four tiers">
<style>${style}</style>
<defs><marker id="arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L8 4 L0 8 z" fill="var(--dv-pink)"/></marker></defs>
<rect width="${totalW}" height="${totalH}" fill="var(--d-bg)"/>
${out.join('\n')}
</svg>`;
}
