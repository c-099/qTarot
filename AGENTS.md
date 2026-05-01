# qTarot — Agent instructions

## Two modes: CLI and web

- **CLI**: `getrandom.js` — Node script, draws 3 cards at once
- **Web**: `index.html` + `script.js` + `api/draw.js` — Vercel-hosted, one card at a time

```bash
# CLI
set QRNG_API_KEY=<your-key> && node getrandom.js

# Web (local dev)
npx vercel dev
# Then set QRNG_API_KEY in Vercel dashboard (Settings → Environment Variables)
```

Get a free QRNG API key at https://outshift.cisco.com/quantum/quantum-random-number-generator

## How it works

1. POSTs to Cisco QRNG API for raw 16-bit blocks (5 for CLI, 1 per card for web).
2. Rejection-samples values < 65520, mod 156 to get a uniform 0–155.
3. Draws cards: index = `mapped[i] % 78`, reversed = `mapped[i] >= 78`.
4. CLI prints all 3 + LLM prompt. Web reveals one card at a time, auto-retries on rejection, builds prompt after 3 accepted draws.

## Card data

78-card tarot deck in `CARDS` array: 22 Major Arcana (The Fool–The World) + 56 Minor Arcana (Wands, Pentacles, Swords, Cups × Ace–King). Array is duplicated in `getrandom.js` and `api/draw.js` (no shared modules — keep both in sync).

## Web architecture

- `api/draw.js` — Vercel Serverless Function (Node). Proxies QRNG API, holds `QRNG_API_KEY` server-side. Returns `{ raw, accepted, card, reversed }`.
- `script.js` — Vanilla JS, no build step. Calls `GET /api/draw` per card.
- `vercel.json` — Empty `{}`, Vercel auto-detects `api/` dir and `index.html`.

## Conventions

- No formatter, linter, test runner, or type checker.
- Keep it dependency-free — no npm packages.
- Use `fetch` (built into Node 18+).
