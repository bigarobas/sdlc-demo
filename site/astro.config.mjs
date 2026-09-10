// @ts-check
import { defineConfig } from 'astro/config';

// Both deploy targets live in a subfolder, so `base` is never '/'.
//   production : https://rashid.fr/sdlc/
//   preview    : https://rashid.fr/sdlc-preview/
//
// CI overrides these with `--site` / `--base` on the `astro build` command line,
// which keeps the config free of environment-variable plumbing that behaves
// differently on Windows and on ubuntu runners.
export default defineConfig({
  site: 'https://rashid.fr',
  base: '/sdlc/',
});
