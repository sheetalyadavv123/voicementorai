import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { backendJson } from "@/lib/backend";

export interface ConversationOut {
  id: string;
  title: string;
  mode: string;
  language: string;
  is_active: boolean;
  started_at: string;
  ended_at: string | null;
  message_count: number;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversations = await backendJson<ConversationOut[]>(
    `/api/v1/conversations?user_id=${session.user.id}`
  );
  return NextResponse.json(conversations);
}
