"use client";

import { motion } from "framer-motion";

export function AuthBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-50" />
      <div className="absolute inset-0 gradient-radial" />

      <motion.div
        aria-hidden
        className="absolute -top-32 left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-brand/15 blur-3xl"
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.5, 0.75, 0.5],
        }}
        transition={{ duration: 9, ease: "easeInOut", repeat: Infinity }}
      />
      <motion.div
        aria-hidden
        className="absolute bottom-[-180px] right-[-120px] h-[480px] w-[480px] rounded-full bg-brand/10 blur-3xl"
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
          opacity: [0.35, 0.55, 0.35],
        }}
        transition={{ duration: 12, ease: "easeInOut", repeat: Infinity }}
      />
      <motion.div
        aria-hidden
        className="absolute bottom-[-220px] left-[-140px] h-[420px] w-[420px] rounded-full bg-accent/10 blur-3xl"
        animate={{
          x: [0, -20, 0],
          y: [0, 18, 0],
          opacity: [0.25, 0.45, 0.25],
        }}
        transition={{ duration: 11, ease: "easeInOut", repeat: Infinity }}
      />

      <div className="noise" />
    </div>
  );
}
