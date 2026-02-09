/**
 * Production static file server
 *
 * Serves the pre-rendered dist/ output with:
 *  - gzip/brotli compression
 *  - Correct cache headers for hashed assets
 *  - SPA fallback (serves index.html for all non-asset routes)
 *
 * Usage:
 *   npm run build:full   # vite build + prerender
 *   npm run serve         # start this server
 */

import express from 'express';
import compression from 'compression';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '..', 'dist');
const PORT = process.env.PORT || 3000;

const app = express();

// Compress all responses
app.use(compression());

// Serve hashed assets with long cache
app.use(
  '/assets',
  express.static(path.join(distDir, 'assets'), {
    maxAge: '1y',
    immutable: true,
  })
);

// Serve other static files (favicon, manifest, etc.) with short cache
app.use(express.static(distDir, { maxAge: '1h' }));

// SPA fallback — return the pre-rendered index.html for any route
// so client-side routing works and users always see the skeleton first
app.get('*', (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
