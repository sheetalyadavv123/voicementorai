import { useQuery } from "@tanstack/react-query";
import { fetchConversationMessages, fetchConversations } from "@/services/conversations-service";

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
  });
}

export function useConversationMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["conversation-messages", conversationId],
    queryFn: () => fetchConversationMessages(conversationId as string),
    enabled: Boolean(conversationId),
  });
}
