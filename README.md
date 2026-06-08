# Castrol WSMS Launch — Interactive Activation

Real-time, multi-screen launch experience for the WSMS app reveal at the Castrol Auto Service conference. Guests scan a QR on the stage LED, "pour oil" by tapping their phones, and collectively fill a giant progress meter that breaks through 99 → 100% on the MC's cue, revealing the F6 app icon.

## Three views, one synchronized state

| Route    | Where it runs              | Purpose                                                 |
| -------- | -------------------------- | ------------------------------------------------------- |
| `/stage` | Main LED screen on stage   | QR code → collective progress meter → F6 reveal         |
| `/`      | Guests' phones (microsite) | Standby → tap the bottle → keep tapping → thank-you     |
| `/mc`    | MC / presenter's device    | Start activation, monitor live, trigger 100% reveal     |

A shared store holds the source of truth: current phase, total taps, live progress (capped at 99%), guest count. Every tap from every phone flows into the same progress meter.

## Architecture

The activation is **Vercel-native** — no persistent WebSocket server (Vercel's serverless/edge functions are stateless and can't hold open connections). Instead:

- **State lives in a shared store.** Upstash Redis in production; an in-memory fallback for local `next dev`.
- **Clients poll** `GET /api/state` every ~300ms for authoritative state.
- **Taps are batched** client-side and flushed as `POST /api/tap {count}` every ~250ms → one atomic Redis `INCRBY` instead of a request per tap (scales to large crowds).
- **MC actions** are `POST /api/mc {action}`.
- **Guest count** uses a presence sorted set; the `cid` on each state poll doubles as a heartbeat (no extra request).

The client hook [lib/socket.ts](lib/socket.ts) keeps the same `useLaunchSocket()` API it had under Socket.IO, so the page components are unchanged.

## Run it locally

Requires **Node ≥ 18** (Next 14). If your default `node` is older, switch via `nvm` first:

```bash
nvm use 24   # or any 18+ version
npm install
npm run dev
```

No Upstash credentials are needed for local dev — it uses the in-memory store automatically (single process, so all three views stay in sync).

Then open:

- **Stage LED** → http://localhost:3000/stage  (fullscreen this on the projector)
- **Guest phone** → http://localhost:3000/  (or scan the QR shown on `/stage`)
- **MC console** → http://localhost:3000/mc

The QR shown on `/stage` uses whatever origin the stage view loaded from, so phones land on the same host.

## Deploy to Vercel

1. **Create a free Upstash Redis DB** at <https://console.upstash.com/> → Redis. Copy the **REST API** URL and token.
2. **Set env vars** in the Vercel project (and locally in `.env.local`, see [.env.example](.env.example)):
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. **Deploy** — `git push` to a Vercel-connected repo, or `vercel --prod`. The standard Next.js build is used (no custom server), so it deploys with zero extra config.

> Without the Upstash env vars in production the app falls back to the in-memory store, which is **per-instance** and will not sync devices. Always set them for the live event.

### A note on scale & cost

Upstash's free tier has a monthly command limit. For a big crowd (hundreds of phones polling), you may exceed it — Upstash's pay-as-you-go is pennies per 100k commands. To reduce load you can raise `POLL_MS` in [lib/socket.ts](lib/socket.ts) (phones don't need 300ms smoothness; the stage screen does).

## Run order at the event

1. **Pre-show.** `/stage` is up showing the QR. Guests scan and land on **standby** (the "launch will begin shortly" screen).
2. **MC cues activation.** Press **Start activation** on `/mc`. All phones flip to the tap-the-bottle screen; the LED swaps to the collective progress meter at 0%.
3. **Pour.** Every guest tap on every phone increments the global meter. Phones show "TAP THE BOTTLE TO POUR THE OIL" with a tilt + pour animation per tap.
4. **Auto-hold at 99%.** Phones automatically switch to "KEEP TAPPING THE BOTTLE TO POUR THE OIL". MC builds suspense.
5. **The big moment.** MC presses **Reveal 100%**. Progress animates 99 → 100, and both `/stage` and `/` smash-cut to the F6 logo reveal: *"Introducing WSMS (Workshop Management System) developed by F6."*
6. **Reset** any time from `/mc` to return to the QR screen.

## Tuning

Open [lib/launchLogic.ts](lib/launchLogic.ts):

- `HOLD_AT` — the % to auto-cap at before MC reveal (default `99`).
- `TAPS_PER_PERCENT` — how many aggregate taps move the meter by 1% (default `4`). Scale up for larger crowds.
- `REVEAL_DURATION_MS` — how long the 99 → 100 burst takes (default `1400`).

Polling/flush cadence lives in [lib/socket.ts](lib/socket.ts) (`POLL_MS`, `FLUSH_MS`).

## Stack

- Next.js 14 (App Router) + TypeScript — standard build, deploys to Vercel
- Upstash Redis (REST) for shared state; in-memory fallback for local dev
- HTTP polling + batched POSTs (no WebSockets)
- Tailwind CSS + Framer Motion
- `qrcode.react` for the stage QR

## Files of note

- [lib/launchLogic.ts](lib/launchLogic.ts) — constants + `computeState` (pure progress/phase projection)
- [lib/store.ts](lib/store.ts) — dual-backend store (memory + Upstash Redis)
- [app/api/state/route.ts](app/api/state/route.ts) — state poll + presence heartbeat
- [app/api/tap/route.ts](app/api/tap/route.ts) — batched tap ingest
- [app/api/mc/route.ts](app/api/mc/route.ts) — MC start/reveal/reset
- [lib/socket.ts](lib/socket.ts) — `useLaunchSocket` client hook (polling)
- [lib/fonts.ts](lib/fonts.ts) — Source Sans Pro registration via `next/font/local`
- [app/stage/page.tsx](app/stage/page.tsx) — LED screen view
- [app/page.tsx](app/page.tsx) — guest mobile microsite
- [app/mc/page.tsx](app/mc/page.tsx) — MC control panel

## Assets

| Component                                                  | Asset                                       |
| ---------------------------------------------------------- | ------------------------------------------- |
| [CastrolLogo](components/CastrolLogo.tsx)                  | `public/assets/CAS-logo.png`                |
| [OilBottle](components/OilBottle.tsx) (idle)               | `public/assets/CAST-EDGE-closed.png`        |
| [OilBottle](components/OilBottle.tsx) (tilted on tap)      | `public/assets/CAST-EDGE-opened.png`        |
| [F6Logo](components/F6Logo.tsx)                            | `public/assets/WSMS.png`                    |
| [GoldBackdrop](components/GoldBackdrop.tsx) (standby/tap)  | `public/assets/Standby-BG.png`              |
| [Sparkles](components/Sparkles.tsx) (reveal)               | `public/assets/Launch-BG.png`               |
| [LoadingSpinner](components/LoadingSpinner.tsx) (standby)  | `public/assets/Loading.png`                 |
| [TapIcon](components/TapIcon.tsx) (mobile CTA)             | `public/assets/Tap-Icon.png`                |
| Fonts                                                      | `app/assets/Fonts/SourceSansPro-*.ttf`      |

Static images live in `public/assets/` because that is what Next.js serves at `/assets/…`. The `app/` directory is the App Router root and only routes are served from there. Fonts can stay under `app/assets/Fonts/` because `next/font/local` reads them at build time via the relative path in [lib/fonts.ts](lib/fonts.ts).
