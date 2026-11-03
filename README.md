# Brasswick

A calm, back-room-after-soundcheck PWA for independent artists in Cincinnati and the Midwest.

Live: https://brasswick.pages.dev

- **Scene**: map of 15 real local studios, photographers and videographers, taken from public listings (OpenStreetMap and the businesses' own sites). "Verified local" means checked against a public listing on Nov 3 2026, not claimed by the business.
- **Book**: session request flow with a 25% deposit estimate. No money moves and the business isn't messaged. Requests are stored in D1.
- **Manager**: AI chat and weekly check-in (Cloudflare Workers AI).
- **Release**: drop date → week-by-week story timeline, with optional AI tailoring.
- **Collab**: opt-in board matched by genre and vibe.
- **Link page**: `/@handle`.
- **Pro**: Stripe-gated. Stays in preview (everything unlocked) until `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` and `STRIPE_PRICE_PRO` are set.

Stack: React + Vite + TypeScript PWA, served by a Cloudflare Pages advanced-mode `_worker.js` with D1 (`DB`) and Workers AI (`AI`) bindings.

```
npm i
npm run build:all   # dist/ + dist-worker/_worker.js
```
