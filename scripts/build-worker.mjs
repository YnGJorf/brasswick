// Bundles worker/index.ts + every file in dist/ into a single dist-worker/_worker.js
// (Cloudflare Pages "advanced mode"), plus a ready-to-run deploy payload.
import { build } from 'esbuild'
import { readdirSync, readFileSync, statSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, extname } from 'node:path'
import { gzipSync } from 'node:zlib'

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain; charset=utf-8',
}
const walk = (dir, base = '') => readdirSync(dir).flatMap((f) => {
  const full = join(dir, f)
  return statSync(full).isDirectory() ? walk(full, `${base}/${f}`) : [[`${base}/${f}`, full]]
})
const files = {}
for (const [path, full] of walk('dist')) {
  if (path === '/_headers' || path === '/_redirects') continue
  files[path] = [TYPES[extname(path)] || 'application/octet-stream', readFileSync(full).toString('base64')]
}

const assetsPlugin = {
  name: 'assets',
  setup(b) {
    b.onResolve({ filter: /^virtual:assets$/ }, () => ({ path: 'assets', namespace: 'virtual' }))
    b.onLoad({ filter: /.*/, namespace: 'virtual' }, () => ({ contents: `export const FILES = ${JSON.stringify(files)};`, loader: 'js' }))
  },
}

mkdirSync('dist-worker', { recursive: true })
await build({
  entryPoints: ['worker/index.ts'], bundle: true, format: 'esm', target: 'es2022', platform: 'neutral',
  outfile: 'dist-worker/_worker.js', minify: true, plugins: [assetsPlugin], logLevel: 'warning',
})
const code = readFileSync('dist-worker/_worker.js', 'utf8')
const gz = gzipSync(code).length
console.log(`_worker.js: ${(code.length / 1024).toFixed(0)} KB raw, ${(gz / 1024).toFixed(0)} KB gzipped, ${Object.keys(files).length} assets`)
if (gz > 2.9 * 1024 * 1024) { console.error('Too big for the 3 MB Pages limit'); process.exit(1) }

// Payload for the Cloudflare API "execute" sandbox (multipart deploy to the brasswick Pages project).
// The MCP request body is capped at 4 MB, so ship the worker gzipped + base64 and inflate it in the sandbox.
const gz64 = gzipSync(Buffer.from(code), { level: 9 }).toString('base64')
const payload = `async () => {
  const b64 = ${JSON.stringify(gz64)};
  const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const worker = await new Response(new Blob([bin]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  const form = new FormData();
  form.append('manifest', '{}');
  form.append('branch', 'main');
  form.append('_worker.js', new Blob([worker], { type: 'application/javascript+module' }), '_worker.js');
  const d = await cloudflare.request({ method: 'POST', path: \`/accounts/\${accountId}/pages/projects/brasswick/deployments\`, body: form });
  return { status: d.status, bytes: worker.length, id: d.result?.id, url: d.result?.url, env: d.result?.environment, stage: d.result?.latest_stage, errors: d.errors };
}`
writeFileSync('dist-worker/deploy-payload.js', payload)
