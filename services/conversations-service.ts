import type { ConversationOut } from "@/app/api/conversations/route";
import type { MessageOut } from "@/app/api/conversations/[id]/messages/route";

export type { ConversationOut, MessageOut };

export async function fetchConversations(): Promise<ConversationOut[]> {
  const response = await fetch("/api/conversations");
  if (!response.ok) throw new Error("Failed to load conversation history");
  return response.json();
}

export async function fetchConversationMessages(conversationId: string): Promise<MessageOut[]> {
  const response = await fetch(`/api/conversations/${conversationId}/messages`);
  if (!response.ok) throw new Error("Failed to load conversation");
  return response.json();
}
