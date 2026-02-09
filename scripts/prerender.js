/**
 * Build-time pre-renderer
 *
 * Runs AFTER `vite build`.  It:
 *  1. Transpiles the HomeSkeleton JSX component using Vite's esbuild
 *  2. Renders it to static HTML with ReactDOMServer.renderToStaticMarkup
 *  3. Injects that markup into the built dist/index.html
 *
 * The result is a fully-formed HTML page with visible skeleton UI
 * that the browser can paint immediately — before any JS has loaded.
 * Once the JS bundle executes it hydrates/replaces the skeleton.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '..', 'dist');
const htmlPath = path.join(distDir, 'index.html');

async function prerender() {
  // Use esbuild (ships with Vite) to transpile JSX to plain JS
  const esbuild = require('esbuild');

  // Bundle the HomeSkeleton tree into a single CJS file we can require()
  const outfile = path.join(__dirname, '_HomeSkeleton.cjs');
  await esbuild.build({
    entryPoints: [path.resolve(__dirname, '../src/components/HomeSkeleton.jsx')],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    outfile,
    external: ['react', 'react-dom'],
    // Ignore CSS imports — we only need the markup structure
    loader: { '.css': 'empty' },
    jsx: 'automatic',
    jsxImportSource: 'react',
  });

  // Now require the transpiled component and render it
  const React = require('react');
  const ReactDOMServer = require('react-dom/server');
  const { default: HomeSkeleton } = require(outfile);

  const skeletonHtml = ReactDOMServer.renderToStaticMarkup(
    React.createElement(HomeSkeleton)
  );

  // Clean up temp file
  fs.unlinkSync(outfile);

  // ---------- Inject into built HTML ----------
  if (!fs.existsSync(htmlPath)) {
    console.error('dist/index.html not found — run `npm run build` first.');
    process.exit(1);
  }

  let html = fs.readFileSync(htmlPath, 'utf-8');

  html = html.replace(
    '<div id="root"></div>',
    `<div id="root">${skeletonHtml}</div>`
  );

  fs.writeFileSync(htmlPath, html, 'utf-8');
  console.log('Pre-rendered skeleton injected into dist/index.html');
}

prerender().catch((err) => {
  console.error('Pre-render failed:', err);
  process.exit(1);
});
