"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useConversationMessages } from "@/features/history/hooks/use-conversations";
import { cn } from "@/lib/utils";

export function TranscriptView({ conversationId }: { conversationId: string | null }) {
  const { data: messages, isLoading } = useConversationMessages(conversationId);

  if (!conversationId) {
    return (
      <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Select a conversation to view its transcript.
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-3/4" />
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-3 p-4">
        {messages?.map((message) => (
          <div
            key={message.id}
            className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "border border-border/60 bg-card/70"
              )}
            >
              {message.content}
              {message.citations && message.citations.length > 0 && (
                <p className="mt-1.5 text-xs opacity-70">
                  Source: {message.citations.map((c) => c.document).join(", ")}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
