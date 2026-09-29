"use client";

import { motion } from "framer-motion";
import type { AgentState } from "@livekit/components-react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<AgentState, { label: string; dotClass: string; pulse: boolean }> = {
  disconnected: { label: "Disconnected", dotClass: "bg-muted-foreground", pulse: false },
  connecting: { label: "Connecting…", dotClass: "bg-amber-500", pulse: true },
  "pre-connect-buffering": { label: "Connecting…", dotClass: "bg-amber-500", pulse: true },
  initializing: { label: "Getting ready…", dotClass: "bg-amber-500", pulse: true },
  failed: { label: "Connection failed", dotClass: "bg-destructive", pulse: false },
  idle: { label: "Idle", dotClass: "bg-muted-foreground", pulse: false },
  listening: { label: "Listening", dotClass: "bg-blue-500", pulse: true },
  thinking: { label: "Thinking…", dotClass: "bg-amber-500", pulse: true },
  speaking: { label: "Speaking", dotClass: "bg-emerald-500", pulse: true },
};

export function AgentStatusBadge({ state }: { state: AgentState }) {
  const config = STATUS_CONFIG[state] ?? STATUS_CONFIG.idle;

  return (
    <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-3 py-1.5 text-sm backdrop-blur">
      <span className="relative flex h-2 w-2">
        {config.pulse && (
          <motion.span
            className={cn("absolute inline-flex h-full w-full rounded-full opacity-75", config.dotClass)}
            animate={{ scale: [1, 2.2], opacity: [0.7, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <span className={cn("relative inline-flex h-2 w-2 rounded-full", config.dotClass)} />
      </span>
      <span className="text-muted-foreground">{config.label}</span>
    </div>
  );
}
