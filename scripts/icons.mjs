import { chromium } from 'playwright-core'
import { readFileSync } from 'node:fs'
const svg = readFileSync('public/mark.svg', 'utf8')
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] })
for (const [n, f] of [[192, 'pwa-192.png'], [512, 'pwa-512.png'], [180, 'apple-touch-icon.png']]) {
  const p = await b.newPage({ viewport: { width: n, height: n } })
  await p.setContent(`<body style="margin:0;background:#1b1916">${svg.replace('<svg ', `<svg width="${n}" height="${n}" `)}</body>`)
  await p.screenshot({ path: `public/${f}` })
}
await b.close()
