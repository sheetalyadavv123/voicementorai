"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  AudioLines,
  Brain,
  Database,
  Mic,
  Speaker,
  Sparkles,
  Waypoints,
  Wrench,
} from "lucide-react";

const PIPELINE = [
  { icon: Mic, label: "Microphone" },
  { icon: Waypoints, label: "LiveKit" },
  { icon: AudioLines, label: "Deepgram STT" },
  { icon: Brain, label: "LangGraph Agent" },
  { icon: Database, label: "RAG" },
  { icon: Wrench, label: "Tools" },
  { icon: Sparkles, label: "GPT-5.4 Mini" },
  { icon: Speaker, label: "ElevenLabs TTS" },
];

export function ArchitectureSection() {
  return (
    <section id="architecture" className="border-t border-border/40 bg-card/20 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            One voice loop, end to end
          </h2>
          <p className="mt-3 text-muted-foreground">
            Every step is streaming — audio starts playing before the whole response is even
            generated.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-x-2 gap-y-4"
        >
          {PIPELINE.map((step, index) => (
            <div key={step.label} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-card/70 px-4 py-3 text-center backdrop-blur transition-colors hover:border-brand/40">
                <step.icon className="h-5 w-5 text-brand" />
                <span className="text-xs text-muted-foreground">{step.label}</span>
              </div>
              {index < PIPELINE.length - 1 && (
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
              )}
            </div>
          ))}
        </motion.div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-muted-foreground">
          RAG and tool calls are optional per turn — the agent only reaches for your notes or a
          tool (quiz, memory, translation) when the conversation actually calls for it.
        </p>
      </div>
    </section>
  );
}
