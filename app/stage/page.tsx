"use client";

import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { useLaunchSocket } from "@/lib/socket";
import { CastrolLogo } from "@/components/CastrolLogo";
import { F6Logo } from "@/components/F6Logo";
import { GoldBackdrop } from "@/components/GoldBackdrop";
import { Sparkles } from "@/components/Sparkles";
import { DuneWave } from "@/components/DuneWave";

export default function StagePage() {
  const { state, connected } = useLaunchSocket();
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const qrUrl = useMemo(() => origin || "http://localhost:3000", [origin]);
  const showQr = state.phase === "idle" || state.phase === "standby";
  const showTapping = state.phase === "tapping" || state.phase === "holding";
  const showReveal = state.phase === "revealed";

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      {!showReveal && <GoldBackdrop />}

      <header className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between px-12 py-8">
        <CastrolLogo className="h-16" />
        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-gold-300/70">
          <span className={`h-2 w-2 rounded-full ${connected ? "bg-green-400" : "bg-red-500"}`} />
          <span>{state.guests} connected</span>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {showQr && (
          <motion.section
            key="qr"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 grid place-items-center"
          >
            <div className="flex flex-col items-center gap-8">
              <h1 className="text-5xl font-light tracking-[0.4em] text-gold-200">SCAN TO LAUNCH</h1>
              <div className="rounded-3xl bg-white p-8 shadow-[0_0_120px_rgba(212,160,23,0.6)]">
                <QRCodeSVG value={qrUrl} size={360} bgColor="#ffffff" fgColor="#0a0a0a" level="H" />
              </div>
              <p className="mt-2 text-2xl font-light text-gold-100">
                Point your phone camera at the code to join
              </p>
            </div>
          </motion.section>
        )}

        {showTapping && (
          <motion.section
            key="tapping"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10"
          >
            {/* Rising oil/dune wave from the bottom */}
            <DuneWave progress={state.progress} />

            {/* F6 logo floats at top centre */}
            <div className="absolute inset-x-0 top-[18%] z-20 flex justify-center">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6 }}
              >
                <F6Logo className="h-64 w-64 drop-shadow-[0_10px_30px_rgba(0,0,0,0.6)]" />
              </motion.div>
            </div>

            {/* Loading text — overlaid centrally near the wave's crest */}
            <div className="absolute inset-x-0 bottom-[18%] z-20 flex flex-col items-center gap-3">
              <motion.div
                key={state.phase}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-baseline gap-4 text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]"
              >
                <span className="text-5xl font-light tracking-[0.2em]">Loading</span>
                <span className="font-mono text-7xl font-bold tabular-nums">
                  {state.progress.toFixed(0).padStart(2, "0")}
                  <span className="text-4xl text-gold-100">%</span>
                </span>
              </motion.div>
              <p className="text-lg uppercase tracking-[0.4em] text-white/80">
                {state.phase === "holding"
                  ? "One final push — tap together"
                  : "Tap your phone to pour the oil"}
              </p>
            </div>
          </motion.section>
        )}

        {showReveal && (
          <motion.section
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10"
          >
            <Sparkles />
            <div className="absolute inset-0 grid place-items-center px-12">
              <div className="flex flex-col items-center gap-8 text-center">
                <motion.h2
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="text-4xl font-light uppercase tracking-[0.4em] text-white drop-shadow"
                >
                  Introducing WSMS
                </motion.h2>
                <motion.div
                  initial={{ scale: 0.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", damping: 14, stiffness: 120 }}
                >
                  <F6Logo className="h-[460px] w-[460px]" />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9, duration: 0.6 }}
                  className="flex flex-col items-center gap-2"
                >
                  <p className="text-3xl font-light text-white">
                    (Workshop Management System)
                  </p>
                  <p className="text-xl uppercase tracking-[0.4em] text-white">
                    developed by F6
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}
