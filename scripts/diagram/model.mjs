// Derive the pipeline model from the repository itself.  [plan Evening 6]
//
// Nothing here is hand-maintained. Every node comes from a file that has to exist for the
// pipeline to work, so the diagram cannot describe a pipeline that is not there. What the
// files cannot tell us — which stage something belongs to, whether it costs anything, which
// node is a gate — lives in annotations.json, and an eval requires every derived node to
// have an entry.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

const WORKFLOWS = '.github/workflows';
const SKILLS = '.claude/skills';
const AGENTS = '.claude/agents';
const HOOKS = '.claude/hooks';

function frontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return m ? parse(m[1]) : {};
}

export function deriveModel() {
  const nodes = [];
  const edges = [];

  // --- workflows -------------------------------------------------------------------------
  for (const file of readdirSync(WORKFLOWS).sort()) {
    if (!/\.ya?ml$/.test(file)) continue;
    const doc = parse(readFileSync(join(WORKFLOWS, file), 'utf8'));

    // `on:` parses as boolean true in YAML 1.1, which is why this looks odd.
    const triggers = Object.keys(doc.true ?? doc.on ?? {});
    const jobs = Object.entries(doc.jobs ?? {});

    const environments = jobs.map(([, j]) => j.environment?.name ?? j.environment).filter(Boolean);

    const body = readFileSync(join(WORKFLOWS, file), 'utf8');
    const secrets = [...new Set([...body.matchAll(/secrets\.([A-Z_]+)/g)].map((m) => m[1]))].filter(
      (s) => s !== 'GITHUB_TOKEN',
    );
    const usesAgent = /anthropics\/claude-code-action/.test(body);

    nodes.push({
      id: `wf:${file.replace(/\.ya?ml$/, '')}`,
      kind: 'workflow',
      label: doc.name ?? file,
      file: `${WORKFLOWS}/${file}`,
      triggers,
      environments,
      secrets,
      usesAgent,
    });

    for (const env of environments) {
      edges.push({ from: `wf:${file.replace(/\.ya?ml$/, '')}`, to: `env:${env}`, kind: 'deploys' });
    }
  }

  // --- environments ----------------------------------------------------------------------
  const envNames = [...new Set(nodes.flatMap((n) => n.environments ?? []))];
  for (const name of envNames) {
    nodes.push({ id: `env:${name}`, kind: 'environment', label: name });
  }

  // --- hooks -----------------------------------------------------------------------------
  const settingsPath = '.claude/settings.json';
  if (existsSync(settingsPath)) {
    const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
    for (const [event, groups] of Object.entries(settings.hooks ?? {})) {
      for (const group of groups) {
        for (const hook of group.hooks ?? []) {
          const script = hook.command.match(/([\w-]+)\.mjs/)?.[1];
          if (!script) continue;
          const id = `hook:${script}`;
          if (nodes.some((n) => n.id === id)) continue;
          nodes.push({
            id,
            kind: 'hook',
            label: script,
            event,
            matcher: group.matcher,
            file: `${HOOKS}/${script}.mjs`,
          });
        }
      }
    }
  }

  // --- skills and subagents --------------------------------------------------------------
  for (const dir of readdirSync(SKILLS).sort()) {
    const p = join(SKILLS, dir, 'SKILL.md');
    if (!existsSync(p)) continue;
    const fm = frontmatter(readFileSync(p, 'utf8'));
    nodes.push({ id: `skill:${dir}`, kind: 'skill', label: fm.name ?? dir, file: p });
  }

  for (const file of readdirSync(AGENTS).sort()) {
    if (!file.endsWith('.md')) continue;
    const fm = frontmatter(readFileSync(join(AGENTS, file), 'utf8'));
    const name = fm.name ?? file.replace(/\.md$/, '');
    nodes.push({ id: `agent:${name}`, kind: 'subagent', label: name, file: `${AGENTS}/${file}` });
  }

  // --- external services, inferred from what the workflows actually reference -------------
  const allSecrets = new Set(nodes.flatMap((n) => n.secrets ?? []));
  const services = [];
  if ([...allSecrets].some((s) => s.startsWith('FTP'))) {
    services.push({ id: 'svc:ftp', kind: 'service', label: 'FTP host\nrashid.fr' });
  }
  if (allSecrets.has('SLACK_WEBHOOK_URL')) {
    services.push({ id: 'svc:slack', kind: 'service', label: 'Slack' });
  }
  if (allSecrets.has('CLAUDE_CODE_OAUTH_TOKEN')) {
    services.push({ id: 'svc:claude', kind: 'service', label: 'Claude\n(Pro quota)' });
  }
  nodes.push(...services);

  // --- the control-band loop back to Plan -------------------------------------------------
  if (existsSync('bands.yaml')) {
    const bands = parse(readFileSync('bands.yaml', 'utf8'));
    const band = nodes.find((n) => n.id === 'wf:bands');
    if (band) {
      band.bands = Object.keys(bands.bands ?? {});
      band.target = bands.target;
    }
  }

  return { nodes, edges };
}

export function loadAnnotations() {
  const p = 'scripts/diagram/annotations.json';
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : {};
}
