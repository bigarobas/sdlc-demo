// STAGE 6 (Maintain) — check the live site against bands.yaml.  [spec D3]
//
// Zero tokens, zero model calls: fetch, a threshold, an exit code. This is the half of the
// SDLC loop that must never fail for quota reasons, because it is what re-triggers Stage 1.
// A monitoring system that stops working when your weekly limit runs out is not monitoring.
//
// Exit 0 = healthy. Exit 1 = breached; the workflow opens an `intent` issue from the report
// printed on stdout, which closes the circle: a measurement becomes a problem statement.

import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

const config = parse(readFileSync('bands.yaml', 'utf8'));
const target = config.target;
const bands = config.bands ?? {};

const results = [];
const breaches = [];

function record(name, ok, detail, severity) {
  results.push({ name, ok, detail, severity });
  if (!ok) breaches.push({ name, detail, severity });
}

async function fetchTarget() {
  const res = await fetch(target, { redirect: 'follow' });
  const body = await res.arrayBuffer();
  return { status: res.status, bytes: body.byteLength };
}

// --- availability, with retries so one blip is not an incident ---------------------------
// bands.yaml asks for `breach_after` consecutive failures. Rather than persisting state
// between scheduled runs, take the readings inside one run: same semantics, no storage.
const availability = bands.availability;
let sample = null;

if (availability) {
  const attempts = Math.max(1, availability.breach_after ?? 1);
  let lastError = null;

  for (let i = 0; i < attempts; i++) {
    try {
      sample = await fetchTarget();
      if (sample.status === availability.expect) break;
      lastError = `HTTP ${sample.status}`;
    } catch (err) {
      lastError = err.message;
      sample = null;
    }
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, 5000));
  }

  const ok = sample?.status === availability.expect;
  record(
    'availability',
    ok,
    ok
      ? `HTTP ${sample.status} from ${target}`
      : `expected HTTP ${availability.expect}, got ${lastError} after ${attempts} attempts`,
    availability.severity,
  );
}

// --- page weight -------------------------------------------------------------------------
const weight = bands.page_weight;
if (weight) {
  if (!sample) {
    record('page_weight', true, 'skipped: the site did not respond', weight.severity);
  } else {
    const ok = sample.bytes <= weight.max;
    const kb = (n) => `${(n / 1000).toFixed(1)} kB`;
    record(
      'page_weight',
      ok,
      `${kb(sample.bytes)} against a budget of ${kb(weight.max)}`,
      weight.severity,
    );
  }
}

// --- build time --------------------------------------------------------------------------
// Needs the GitHub API, so it only runs where a token exists. Reported as skipped rather
// than silently passing: a check that quietly does nothing is worse than no check.
const build = bands.build_time;
if (build) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;

  if (!token || !repo) {
    record('build_time', true, 'skipped: no GITHUB_TOKEN available', build.severity);
  } else {
    try {
      const url = `https://api.github.com/repos/${repo}/actions/workflows/${build.workflow}/runs?status=success&per_page=1`;
      const res = await fetch(url, {
        headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json' },
      });
      const data = await res.json();
      const run = data.workflow_runs?.[0];

      if (!run) {
        record(
          'build_time',
          true,
          `skipped: no successful ${build.workflow} runs yet`,
          build.severity,
        );
      } else {
        const seconds = Math.round(
          (new Date(run.updated_at) - new Date(run.run_started_at)) / 1000,
        );
        const ok = seconds <= build.max;
        record('build_time', ok, `${seconds}s against a budget of ${build.max}s`, build.severity);
      }
    } catch (err) {
      record('build_time', true, `skipped: ${err.message}`, build.severity);
    }
  }
}

// --- report ------------------------------------------------------------------------------
const lines = results.map((r) => `- ${r.ok ? 'ok' : 'BREACH'} · **${r.name}** — ${r.detail}`);

console.error(`\nControl bands for ${target}\n${lines.join('\n')}\n`);

if (breaches.length === 0) {
  console.error('✓ all bands within limits');
  process.exit(0);
}

// stdout is the issue body: a measurement, phrased as the start of an intent.
const worst = breaches.some((b) => b.severity === 'high') ? 'high' : breaches[0].severity;
console.log(
  [
    `## Problem`,
    ``,
    `A control band was breached on ${target}, measured at ${new Date().toISOString()}.`,
    ``,
    ...lines,
    ``,
    `## Proposed outcome`,
    ``,
    `The breached band is back within the limit set in \`bands.yaml\`, or the limit is`,
    `deliberately changed and the reason recorded.`,
    ``,
    `## Affected systems`,
    ``,
    `The published site at ${target}, and whatever produced the change.`,
    ``,
    `## Constraints`,
    ``,
    `Severity: ${worst}. Thresholds live in \`bands.yaml\`; this issue was opened by`,
    `\`.github/workflows/bands.yml\` with no model involved.`,
    ``,
    `## Open questions`,
    ``,
    `- Is the threshold wrong, or is the site wrong?`,
  ].join('\n'),
);

process.exit(1);
