"use client";

import { useLaunchSocket } from "@/lib/socket";
import { CastrolLogo } from "@/components/CastrolLogo";

const PHASE_LABELS: Record<string, { label: string; color: string }> = {
  idle: { label: "IDLE", color: "bg-zinc-700" },
  standby: { label: "STANDBY — QR ON STAGE", color: "bg-blue-700" },
  tapping: { label: "TAPPING — POURING OIL", color: "bg-amber-600" },
  holding: { label: "HOLDING @ 99% — SUSPENSE", color: "bg-red-600 animate-pulse" },
  revealed: { label: "REVEALED — F6 LIVE", color: "bg-emerald-600" },
};

export default function McPage() {
  const { state, connected, mcStart, mcReveal, mcReset } = useLaunchSocket();
  const phase = PHASE_LABELS[state.phase] ?? PHASE_LABELS.idle;

  return (
    <main className="relative min-h-screen bg-zinc-950 px-6 py-8 text-white">
      <header className="mx-auto flex max-w-3xl items-center justify-between">
        <CastrolLogo className="h-10" />
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-zinc-400">
          <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-400" : "bg-red-500"}`} />
          MC Console
        </div>
      </header>

      <section className="mx-auto mt-10 max-w-3xl space-y-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Current phase</p>
          <div className={`mt-2 inline-flex rounded-md px-3 py-1.5 text-sm font-bold ${phase.color}`}>
            {phase.label}
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            <Stat label="Guests" value={state.guests} />
            <Stat label="Taps" value={state.totalTaps} />
            <Stat label="Progress" value={`${state.progress.toFixed(1)}%`} />
          </div>

          <div className="mt-6 h-3 w-full overflow-hidden rounded-full bg-black ring-1 ring-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 transition-all"
              style={{ width: `${state.progress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ActionButton
            label="Start activation"
            description="Begin tapping phase"
            color="bg-amber-600 hover:bg-amber-500"
            disabled={state.phase === "tapping" || state.phase === "holding"}
            onClick={mcStart}
          />
          <ActionButton
            label="Reveal 100%"
            description="Break through to F6 logo"
            color="bg-emerald-600 hover:bg-emerald-500"
            disabled={state.phase !== "tapping" && state.phase !== "holding"}
            onClick={mcReveal}
          />
          <ActionButton
            label="Reset to standby"
            description="Back to QR screen"
            color="bg-zinc-700 hover:bg-zinc-600"
            onClick={mcReset}
          />
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-300">
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-zinc-500">Run order</p>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Open <code className="text-amber-300">/stage</code> on the main LED — shows the QR code.</li>
            <li>Guests scan and land on the standby screen.</li>
            <li>Hit <strong>Start activation</strong> — bottle appears on phones, progress meter on LED.</li>
            <li>Progress auto-caps at <strong>99%</strong>; build suspense.</li>
            <li>On the final unified tap, hit <strong>Reveal 100%</strong> — F6 icon dramatically appears.</li>
          </ol>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-black/50 p-4 ring-1 ring-zinc-800">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{label}</p>
      <p className="mt-1 font-mono text-2xl font-bold text-amber-200">{value}</p>
    </div>
  );
}

function ActionButton({
  label,
  description,
  color,
  disabled,
  onClick,
}: {
  label: string;
  description: string;
  color: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group flex flex-col items-start rounded-2xl p-5 text-left transition ${color} disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500`}
    >
      <span className="text-base font-bold">{label}</span>
      <span className="mt-1 text-xs opacity-80">{description}</span>
    </button>
  );
}
