// Read the generated build stamp, tolerantly.
//
// import.meta.glob rather than a direct import: a direct import of a missing file is a build
// error, so a wiring mistake would break the whole site rather than omit one footer line.
// The plan corrected the spec on this — the generator always running and the import
// tolerating absence are two different mitigations, and only having both is safe.
//
// Shared by the layout (the preview marker) and the page (the footer), so the two cannot
// disagree about which build they are describing.

const modules = import.meta.glob('../generated/build-info.json', { eager: true });

/** @type {{env:string, sha:string|null, shaFull:string|null, pr:number|null, builtAt:string, dirty:boolean}|null} */
export const build = Object.values(modules)[0]?.default ?? null;

export const isPreview = build?.env === 'preview';

const REPO = 'https://github.com/bigarobas/sdlc-demo';

export const commitUrl = build?.shaFull ? `${REPO}/commit/${build.shaFull}` : null;
export const prUrl = build?.pr ? `${REPO}/pull/${build.pr}` : null;

/** Minutes matter, seconds do not. UTC, because a build has no local time. */
export function builtAtLabel() {
  if (!build?.builtAt) return null;
  return build.builtAt.replace('T', ' ').slice(0, 16) + ' UTC';
}
