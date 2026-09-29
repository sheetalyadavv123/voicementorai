"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, PhoneOff } from "lucide-react";
import {
  BarVisualizer,
  DisconnectButton,
  TrackToggle,
  useIsSpeaking,
  useLocalParticipant,
  useVoiceAssistant,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import type { AgentState } from "@livekit/components-react";
import { AgentStatusBadge } from "@/features/voice-chat/components/agent-status-badge";
import { TranscriptPanel } from "@/features/voice-chat/components/transcript-panel";
import { cn } from "@/lib/utils";

export function VoiceChatPanel({ onDisconnect }: { onDisconnect: () => void }) {
  const { state, audioTrack } = useVoiceAssistant();
  const { localParticipant } = useLocalParticipant();
  const isUserSpeaking = useIsSpeaking(localParticipant);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const lastTransitionRef = useRef<{ state: AgentState; at: number }>({
    state,
    at: Date.now(),
  });

  useEffect(() => {
    const previous = lastTransitionRef.current;
    const now = Date.now();
    if (previous.state === "thinking" && state === "speaking") {
      setLatencyMs(now - previous.at);
    }
    lastTransitionRef.current = { state, at: now };
  }, [state]);

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <AgentStatusBadge state={state} />
        {latencyMs !== null && (
          <span className="rounded-full border border-border/60 bg-card/70 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur">
            Response time: {latencyMs}ms
          </span>
        )}
      </div>

      <div className="flex items-center justify-center rounded-2xl border border-border/60 bg-card/40 py-8 backdrop-blur">
        <BarVisualizer
          state={state}
          barCount={7}
          trackRef={audioTrack}
          className="h-16 w-48"
          options={{ minHeight: 20, maxHeight: 100 }}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-border/60 bg-background/40">
        <TranscriptPanel />
      </div>

      <div className="flex items-center justify-center gap-4">
        <TrackToggle
          source={Track.Source.Microphone}
          showIcon={false}
          className={cn(
            "relative flex h-14 w-14 items-center justify-center rounded-full border transition-colors",
            "border-border/60 bg-card hover:bg-accent data-[lk-enabled=true]:bg-primary data-[lk-enabled=true]:text-primary-foreground"
          )}
        >
          {isUserSpeaking && (
            <motion.span
              className="absolute inset-0 rounded-full bg-primary/40"
              animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeOut" }}
            />
          )}
          <MicIcon />
        </TrackToggle>

        <DisconnectButton
          onClick={onDisconnect}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive text-destructive-foreground transition-transform hover:scale-105"
        >
          <PhoneOff className="h-5 w-5" />
        </DisconnectButton>
      </div>
    </div>
  );
}

function MicIcon() {
  const { isMicrophoneEnabled } = useLocalParticipant();
  return isMicrophoneEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />;
}
