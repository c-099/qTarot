# qTarot — Agent instructions

## Web app — Vercel-hosted, one card at a time

```bash
# Local dev
npx vercel dev
# Set QRNG_API_KEY in Vercel dashboard (Settings → Environment Variables)
```

## How it works

1. POSTs to Cisco QRNG API for 1 raw 16-bit block per card.
2. Rejection-samples values < 65520, mod 156 to get a uniform 0–155.
3. Draws card: index = `mapped % 78`, reversed = `mapped >= 78`.
4. Rejects duplicates.
5. Reveals one card at a time (hold button 3.33s to draw), auto-retries on rejection, builds prompt after 3 accepted draws.

## Card data

78-card tarot deck in `CARDS` array: 22 Major Arcana (The Fool–The World) + 56 Minor Arcana (Wands, Pentacles, Swords, Cups × Ace–King). Array is located in `api/draw.js`.

## Web architecture

- `api/draw.js` — Vercel Serverless Function (Node). Proxies QRNG API, holds `QRNG_API_KEY` server-side. Returns `{ raw, accepted, card, reversed }`.
- `script.js` — Vanilla JS, no build step. Calls `GET /api/draw` per card. Hold-to-draw button (3.33s), auto-retry on rejection, 3.33s cooldown after 3rd card.
- `index.html` — Static page with name/question inputs, 3 card slots, prompt output, GitHub link, Buy Me a Coffee button.
- `vercel.json` — Empty `{}`, Vercel auto-detects `api/` dir and `index.html`.

## Conventions

- No formatter, linter, test runner, or type checker.
- Keep it dependency-free — no npm packages.
- Use `fetch` (built into Node 18+).
