"use client";

import { useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocalParticipant, useTranscriptions } from "@livekit/components-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface TranscriptItem {
  id: string;
  text: string;
  role: "user" | "assistant";
  timestamp: number;
}

export function TranscriptPanel() {
  const transcriptions = useTranscriptions();
  const { localParticipant } = useLocalParticipant();
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  const items = useMemo<TranscriptItem[]>(() => {
    return [...transcriptions]
      .sort((a, b) => a.streamInfo.timestamp - b.streamInfo.timestamp)
      .map((t) => ({
        id: t.streamInfo.id,
        text: t.text,
        role: t.participantInfo.identity === localParticipant.identity ? "user" : "assistant",
        timestamp: t.streamInfo.timestamp,
      }));
  }, [transcriptions, localParticipant.identity]);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [items]);

  return (
    <ScrollArea className="h-full w-full">
      <div className="flex flex-col gap-3 p-4">
        {items.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Your conversation will appear here as you speak.
          </p>
        )}
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cn("flex", item.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  item.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border/60 bg-card/70 backdrop-blur"
                )}
              >
                {item.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={scrollAnchorRef} />
      </div>
    </ScrollArea>
  );
}
