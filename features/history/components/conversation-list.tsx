"use client";

import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useConversations } from "@/features/history/hooks/use-conversations";
import { cn } from "@/lib/utils";
import type { ConversationOut } from "@/services/conversations-service";

const MODE_LABEL: Record<string, string> = { chat: "Chat", teaching: "Teaching", quiz: "Quiz" };

interface ConversationListProps {
  limit?: number;
  selectedId?: string | null;
  onSelect?: (conversation: ConversationOut) => void;
}

export function ConversationList({ limit, selectedId, onSelect }: ConversationListProps) {
  const { data, isLoading } = useConversations();
  const conversations = limit ? data?.slice(0, limit) : data;

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No conversations yet — start a voice chat to see your history here.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation, index) => (
        <motion.button
          key={conversation.id}
          type="button"
          onClick={() => onSelect?.(conversation)}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: index * 0.03 }}
          className={cn(
            "flex w-full items-center justify-between rounded-lg border border-border/50 px-4 py-3 text-left text-sm transition-colors hover:bg-accent",
            selectedId === conversation.id && "border-primary/60 bg-accent"
          )}
        >
          <div className="flex items-center gap-3">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">{conversation.title}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(conversation.started_at).toLocaleString()} · {conversation.message_count}{" "}
                messages
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {MODE_LABEL[conversation.mode] ?? conversation.mode}
          </Badge>
        </motion.button>
      ))}
    </div>
  );
}
