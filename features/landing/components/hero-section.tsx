"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Symmetric peak-in-the-middle heights so the bars read as a centered,
// balanced voice waveform rather than an arbitrary jagged line.
const WAVE_BARS = [0.3, 0.45, 0.65, 0.85, 1, 0.85, 0.65, 0.45, 0.3];

export function HeroSection() {
  const { data: session } = useSession();

  return (
    <section className="relative overflow-hidden px-6 pt-20 pb-24 sm:pt-28 sm:pb-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,color-mix(in_oklch,var(--brand),transparent_88%),transparent)]"
      />
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand/60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand" />
          </span>
          Voice-first AI tutoring
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl"
        >
          Learn out loud, with a mentor that actually <span className="text-brand">listens</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-5 max-w-xl text-lg text-muted-foreground text-balance"
        >
          A natural, spoken conversation with an AI tutor that teaches, quizzes, remembers you, and
          answers from your own notes — in English, Hindi, or Hinglish.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-8 flex flex-col gap-3 sm:flex-row"
        >
          <Link
            href={session ? "/dashboard" : "/signup"}
            className={cn(
              buttonVariants({ size: "lg" }),
              "rounded-full bg-brand px-8 text-brand-foreground hover:bg-brand/90"
            )}
          >
            {session ? "Go to dashboard" : "Start learning free"}
          </Link>
          <a
            href="#how-it-works"
            className={buttonVariants({ size: "lg", variant: "outline", className: "rounded-full px-8" })}
          >
            See how it works
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 flex h-14 items-end justify-center gap-1.5"
        >
          {WAVE_BARS.map((height, index) => (
            <motion.span
              key={index}
              className="w-1.5 origin-bottom rounded-full bg-brand/80"
              style={{ height: `${height * 56}px` }}
              animate={{ scaleY: [0.4, 1, 0.4] }}
              transition={{
                duration: 1.2 + (index % 3) * 0.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.08,
              }}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
