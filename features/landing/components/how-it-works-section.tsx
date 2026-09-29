"use client";

import { motion } from "framer-motion";

const STEPS = [
  {
    number: "01",
    title: "Sign up in seconds",
    description: "Create an account and tell it your name — no setup, no configuration.",
  },
  {
    number: "02",
    title: "Start a voice chat",
    description: "Hit start, allow your mic, and just talk — like calling a tutor.",
  },
  {
    number: "03",
    title: "Learn your way",
    description:
      "Ask questions, say \"teach me photosynthesis,\" or \"quiz me on the Mughal Empire.\"",
  },
  {
    number: "04",
    title: "Track your progress",
    description: "Every conversation, quiz score, and uploaded note lives in your dashboard.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">How it works</h2>
        <p className="mt-3 text-muted-foreground">From sign-up to your first quiz in under a minute.</p>
      </div>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <motion.div
            key={step.number}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
          >
            <span className="text-sm font-mono text-brand">{step.number}</span>
            <h3 className="mt-2 font-semibold">{step.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{step.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
