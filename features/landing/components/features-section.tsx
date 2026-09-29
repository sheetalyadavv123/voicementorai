"use client";

import { motion } from "framer-motion";
import {
  BookOpenCheck,
  Brain,
  Languages,
  MessageCircleQuestion,
  Sparkles,
  Zap,
} from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const FEATURES = [
  {
    icon: MessageCircleQuestion,
    title: "Real conversations",
    description:
      "Interrupt it mid-sentence, ask follow-ups, change topics — it flows like talking to a person, not a chatbot.",
  },
  {
    icon: BookOpenCheck,
    title: "Teaches and quizzes",
    description:
      "Explains concepts gradually in small chunks, checks you understand, then quizzes you and scores your answers.",
  },
  {
    icon: Brain,
    title: "Remembers you",
    description:
      "Your name, past topics, difficulty level, and language preference carry over across every session.",
  },
  {
    icon: Sparkles,
    title: "Learns from your notes",
    description:
      "Upload PDFs — notes, textbooks, slides — and it answers from them directly, with citations.",
  },
  {
    icon: Languages,
    title: "English, Hindi, Hinglish",
    description: "Switch language mid-conversation, any time, without losing context.",
  },
  {
    icon: Zap,
    title: "Built for low latency",
    description:
      "Streaming speech-to-text, streaming responses, streaming text-to-speech — built to feel instant.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24">
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Everything a real mentor does
        </h2>
        <p className="mt-3 text-muted-foreground">
          Not a Q&amp;A bot — a tutor that teaches, checks in, and adapts to you.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, delay: (index % 3) * 0.08 }}
          >
            <Card className="h-full border-border/60 bg-card/60 backdrop-blur transition-colors hover:border-brand/30 hover:bg-card/90">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
                  <feature.icon className="h-5 w-5 text-brand" />
                </div>
                <CardTitle className="text-base">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
