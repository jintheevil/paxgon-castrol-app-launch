# Castrol WSMS Launch — Interactive Activation

Real-time, multi-screen launch experience for the WSMS app reveal at the Castrol Auto Service conference. Guests scan a QR on the stage LED, "pour oil" by tapping their phones, and collectively fill a giant progress meter that breaks through 99 → 100% on the MC's cue, revealing the F6 app icon.

## Three views, one synchronized state

| Route    | Where it runs              | Purpose                                                 |
| -------- | -------------------------- | ------------------------------------------------------- |
| `/stage` | Main LED screen on stage   | QR code → collective progress meter → F6 reveal         |
| `/`      | Guests' phones (microsite) | Standby → tap the bottle → keep tapping → thank-you     |
| `/mc`    | MC / presenter's device    | Start activation, monitor live, trigger 100% reveal     |

**Firebase Realtime Database** holds the source of truth: current phase, total taps, reveal timestamp, and a presence list. Every tap from every phone flows into the same meter.

## Architecture

Real-time sync runs through **Firebase Realtime Database** — a managed WebSocket service. One write fans out to every connected client, so there's no polling and no custom server. The Next.js frontend is fully static/serverless and deploys to **Vercel** (or anywhere); Firebase handles the live layer.

- **State** lives at the RTDB `/launch` node: `{ phase, taps, revealAt }`.
- **Clients subscribe** with `onValue` — pushed instantly on any change.
- **Taps** are batched client-side and flushed every ~300ms as one atomic
  `update(taps, increment(n))` (one write for many taps → cheap + scales).
- **MC actions** `set`/`update` `/launch` directly (reveal stamps `serverTimestamp()`).
- **Progress** is derived **client-side** by `computeState()` from the raw
  values, with a local ~80ms ticker so the 99→100 reveal animates smoothly
  between pushes.
- **Guest count** uses the canonical RTDB presence pattern: each client writes
  `/presence/$cid` and registers an `onDisconnect().remove()`.

The client hook [lib/socket.ts](lib/socket.ts) keeps the same `useLaunchSocket()` API it had under Socket.IO, so the page components are unchanged.

> **Why this scales to 600+.** RTDB is connection-based broadcast, not request-based. 600 phones = 600 long-lived connections receiving one shared update — not 600×N polls/sec. The only Firebase **Spark (free) limit that matters is 100 simultaneous connections**, so for the 600-person event the project must be on the **Blaze (pay-as-you-go) plan** (connections aren't billed; this activation's data volume is a few MB, well under the free quotas — effectively ~$0, but Blaze requires a billing account).

## One-time Firebase setup

1. **Create the Realtime Database**: Firebase console → **Build → Realtime Database → Create Database**. Pick a region near the venue (e.g. Singapore `asia-southeast1`). Copy the database URL it shows.
2. **Publish the security rules** in [database.rules.json](database.rules.json) (console → Realtime Database → Rules → paste → Publish). These allow read/write to `/launch` and `/presence` only — fine for an ephemeral event with no sensitive data.
3. **For the 600-person event**, upgrade the project to **Blaze** (Spark caps at 100 connections).

## Run it locally

Requires **Node ≥ 18** (Next 14). If your default `node` is older, switch via `nvm` first:

```bash
nvm use 24   # or any 18+ version
npm install
```

Set the database URL (the one value not baked into [lib/firebase.ts](lib/firebase.ts)):

```bash
echo 'NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://<your-db>.firebasedatabase.app' > .env.local
npm run dev
```

Then open:

- **Stage LED** → http://localhost:3000/stage  (fullscreen this on the projector)
- **Guest phone** → http://localhost:3000/  (or scan the QR shown on `/stage`)
- **MC console** → http://localhost:3000/mc

All three talk to the same Firebase DB, so they sync across machines/phones immediately — no shared local server needed. The QR on `/stage` uses whatever origin the stage view loaded from.

## Deploy to Vercel

1. Set the Firebase env vars in the Vercel project (at minimum `NEXT_PUBLIC_FIREBASE_DATABASE_URL`; see [.env.example](.env.example)).
2. Deploy — `git push` to a Vercel-connected repo, or `vercel --prod`. Standard Next.js build, no custom server.

That's it — there's no backend to host; Firebase is the realtime backend.

## Run order at the event

1. **Pre-show.** `/stage` is up showing the QR. Guests scan and land on **standby** (the "launch will begin shortly" screen).
2. **MC cues activation.** Press **Start activation** on `/mc`. All phones flip to the tap-the-bottle screen; the LED swaps to the collective progress meter at 0%.
3. **Pour.** Every guest tap on every phone increments the global meter. Phones show "TAP THE BOTTLE TO POUR THE OIL" with a tilt + pour animation per tap.
4. **Auto-hold at 99%.** Phones automatically switch to "KEEP TAPPING THE BOTTLE TO POUR THE OIL". MC builds suspense.
5. **The big moment.** MC presses **Reveal 100%**. Progress animates 99 → 100, and both `/stage` and `/` smash-cut to the F6 logo reveal: *"Introducing WSMS (Workshop Management System) developed by F6."*
6. **Reset** any time from `/mc` to return to the QR screen.

## Tuning

In [lib/launchLogic.ts](lib/launchLogic.ts):

- `HOLD_AT` — the % to auto-cap at before MC reveal (default `99`).
- `TAPS_PER_PERCENT` — aggregate taps to move the meter 1%. Set **without a code change** via `NEXT_PUBLIC_TAPS_PER_PERCENT` (default `0.5` ≈ 50 taps to fill, for testing; **~1100 for 600 people** over ~45s).
- `REVEAL_DURATION_MS` — how long the 99 → 100 break-through takes (default `1400`).

Tap-flush and local recompute cadence live in [lib/socket.ts](lib/socket.ts) (`FLUSH_MS`, `TICK_MS`).

## Stack

- Next.js 14 (App Router) + TypeScript — standard build, deploys to Vercel
- Firebase Realtime Database for live sync (managed WebSocket broadcast)
- Progress derived client-side; no backend server, no polling
- Tailwind CSS + Framer Motion
- `qrcode.react` for the stage QR

## Files of note

- [lib/firebase.ts](lib/firebase.ts) — Firebase app + RTDB init (env-overridable config)
- [lib/socket.ts](lib/socket.ts) — `useLaunchSocket` hook (RTDB subscribe, presence, batched tap increments)
- [lib/launchLogic.ts](lib/launchLogic.ts) — constants + `computeState` (pure progress/phase projection)
- [database.rules.json](database.rules.json) — RTDB security rules for `/launch` + `/presence`
- [lib/fonts.ts](lib/fonts.ts) — Source Sans (Source Sans 3) via `next/font/google`
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
