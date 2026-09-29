"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConversationList } from "@/features/history/components/conversation-list";
import { TranscriptView } from "@/features/history/components/transcript-view";

export function HistoryExplorer() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <>
      <ScrollArea className="h-full min-h-0 rounded-2xl border border-border/60 bg-card/40">
        <div className="p-3">
          <ConversationList selectedId={selectedId} onSelect={(c) => setSelectedId(c.id)} />
        </div>
      </ScrollArea>
      <div className="min-h-0 overflow-hidden rounded-2xl border border-border/60 bg-background/40">
        <TranscriptView conversationId={selectedId} />
      </div>
    </>
  );
}
