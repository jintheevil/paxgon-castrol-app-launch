# Castrol WSMS Launch — Interactive Activation

Real-time, multi-screen launch experience for the WSMS app reveal at the Castrol Auto Service conference. Guests scan a QR on the stage LED, "pour oil" by tapping their phones, and collectively fill a giant progress meter that breaks through 99 → 100% on the MC's cue, revealing the F6 app icon.

## Three views, one synchronized state

| Route    | Where it runs              | Purpose                                                 |
| -------- | -------------------------- | ------------------------------------------------------- |
| `/stage` | Main LED screen on stage   | QR code → collective progress meter → F6 reveal         |
| `/`      | Guests' phones (microsite) | Standby → tap the bottle → keep tapping → thank-you     |
| `/mc`    | MC / presenter's device    | Start activation, monitor live, trigger 100% reveal     |

The Socket.IO server holds the source of truth: current phase, total taps, live progress (capped at 99%), guest count. Every tap from every phone flows into the same progress meter.

## Run it

Requires **Node ≥ 18** (Next 14). If your default `node` is older, switch via `nvm` first:

```bash
nvm use 24   # or any 18+ version
cd /Users/golinkadmin/castrol-launch
npm install
npm run dev
```

Then open:

- **Stage LED** → http://localhost:3000/stage  (fullscreen this on the projector)
- **Guest phone** → http://localhost:3000/  (or scan the QR shown on `/stage`)
- **MC console** → http://localhost:3000/mc

For a real event, run on a server that all phones can reach (local Wi-Fi + LAN IP, or a deployed URL). The QR shown on `/stage` automatically uses the URL the stage view itself loaded from, so phones land on the same host.

## Run order at the event

1. **Pre-show.** `/stage` is up showing the QR. Guests scan and land on **standby** (the "launch will begin shortly" screen).
2. **MC cues activation.** Press **Start activation** on `/mc`. All phones flip to the tap-the-bottle screen; the LED swaps to the collective progress meter at 0%.
3. **Pour.** Every guest tap on every phone increments the global meter. Phones show "TAP THE BOTTLE TO POUR THE OIL" with a tilt + pour animation per tap.
4. **Auto-hold at 99%.** Phones automatically switch to "KEEP TAPPING THE BOTTLE TO POUR THE OIL". MC builds suspense.
5. **The big moment.** MC presses **Reveal 100%**. Progress animates 99 → 100, and both `/stage` and `/` smash-cut to the F6 logo reveal: *"Introducing WSMS (Workshop Management System) developed by F6."*
6. **Reset** any time from `/mc` to return to the QR screen.

## Tuning

Open [lib/state.ts](lib/state.ts):

- `HOLD_AT` — the % to auto-cap at before MC reveal (default `99`).
- `TAPS_PER_PERCENT` — how many aggregate taps move the meter by 1% (default `4`). Scale up for larger crowds.
- `REVEAL_DURATION_MS` — how long the 99 → 100 burst takes (default `1400`).

## Stack

- Next.js 14 (App Router) + TypeScript
- Custom Node HTTP server + Socket.IO (see [server.ts](server.ts))
- Tailwind CSS + Framer Motion
- `qrcode.react` for the stage QR
- In-memory state — no DB, no persistence. Single-event activation.

## Files of note

- [server.ts](server.ts) — Next + Socket.IO server, broadcast loop
- [lib/state.ts](lib/state.ts) — phase state machine and progress logic
- [lib/socket.ts](lib/socket.ts) — `useLaunchSocket` client hook
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
# paxgon-castrol-app-launch
