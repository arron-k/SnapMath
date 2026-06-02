"use client";

import { motion } from "framer-motion";

export function LoadingDots({ label }: { label?: string }) {
  return (
    <span
      className="inline-flex items-center gap-2"
      role="status"
      aria-live="polite"
    >
      <span className="inline-flex items-end gap-1" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block h-2.5 w-2.5 rounded-full bg-brand"
            animate={{ y: [0, -7, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.15,
            }}
          />
        ))}
      </span>
      {label && <span className="text-ink-soft">{label}</span>}
    </span>
  );
}
