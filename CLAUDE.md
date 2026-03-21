# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev        # Start dev server (localhost:4321)
npm run build      # Production build (runs astro build)
npm run preview    # Preview production build locally
```

Node >= 22.12.0 required.

## Architecture

**Astro 6 SSR site** deployed on Vercel. Output mode is `server` (full SSR via `@astrojs/vercel` adapter).

### Bilingual Structure (IT/EN)
- Italian pages at `/` (e.g., `/diventa-socio`, `/chi-siamo`)
- English pages at `/en/` (e.g., `/en/membership`, `/en/about`)
- Page content stored as JSON in `src/content/pages/` (Italian) and `src/content/pages/en/` (English)
- Navigation and footer text also from JSON content files
- Language switcher in BaseLayout maps between IT/EN routes

### API Endpoints (`src/pages/api/`)
All endpoints have `prerender = false` (server-side only).

- **POST `/api/subscribe`** — Membership signup. Adds contact to Mailchimp with auto-generated member number (PNMUK-XXX), confirmation token, and tags (lang-it/lang-en, Socio Ordinario/Socio AWR, In attesa di pagamento). Form data includes `lang` field ('it' or 'en') for bilingual email routing.

- **GET `/api/confirm-payment?token=TOKEN`** — Payment confirmation. Finds member by CONFTOKEN merge field, swaps tag from "In attesa di pagamento" to "Pagamento confermato", which triggers Mailchimp automation to send membership card email.

- **GET `/api/membership-card?name=...&plan=...&until=...&id=...`** — Generates HTML membership card with embedded hero image (base64 to avoid CORS). Includes client-side PDF download via html2canvas + jsPDF (loaded from jsdelivr CDN).

### Mailchimp Integration
- Server: us22, List ID: 3c40495624
- Env vars: `MAILCHIMP_API_KEY`, `MAILCHIMP_LIST_ID` (both need `.trim()` due to trailing `\n` in Vercel env)
- Merge fields: FNAME, LNAME, PHONE, BIRTHPLACE, MMERGE7 (signup date), MMERGE8 (expiry date), PIANO (plan), MEMNUMBER (card number), CONFTOKEN (payment confirmation token), COMPANY, UKRESIDENT
- Two Customer Journey automations:
  - **id=32** "Dai il benvenuto" — triggered on subscribe, If/Else on tag `lang-en` for bilingual welcome emails with bank transfer details
  - **id=33** "Invio tessera dopo pagamento" — triggered on tag `Pagamento confermato`, If/Else on tag `lang-en` for bilingual card emails
- Templates: 161 (welcome IT), 162 (tessera IT), 163 (welcome EN), 164 (tessera EN)

### Layout & Styling
- Single layout: `src/layouts/BaseLayout.astro`
- Global CSS: `src/styles/global.css`
- Design tokens: `--color-primary: #1a5632`, `--color-gold: #d4a843`, `--color-accent: #c8102e`, `--color-cream: #faf8f0`
- Fonts: Playfair Display (headings), Lato (body) via Google Fonts

### Events
- Event data in `src/content/events/` (JSON)
- Dynamic routes: `/eventi/[slug]` and `/en/events/[slug]`
- Sub-events for festivals: `/eventi/puglian-italian-fest/[event]`

## Key Gotchas
- Contacts permanently deleted from Mailchimp cannot be re-imported via API — always archive, never permanently delete
- Email addresses with `+` get decoded as spaces in URL query params — confirm-payment uses token-only lookup to avoid this
- Mailchimp's Classic Builder is required for custom HTML email templates in automations
- Hero image in membership card must be embedded as base64 (server-side) for html2canvas PDF generation to work
- Member number auto-increments by counting existing PNMUK-prefixed MEMNUMBER values in the list
