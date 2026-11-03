import { chromium } from 'playwright-core'
const B = 'https://brasswick.pages.dev'
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'] })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
const p = await ctx.newPage()
const shot = async (url, name, wait = 3500) => { await p.goto(B + url, { waitUntil: 'load' }); await p.waitForTimeout(wait); await p.screenshot({ path: `screenshots/${name}.png` }) }
await shot('/?phase=dusk#/scene', '1-scene', 6000)
await shot('/?phase=night#/book/music-resource-center', '2-booking')
await shot('/?phase=day#/plan', '3-release-plan')
await shot('/?phase=dawn#/manager', '4-manager', 12000)
await b.close()
