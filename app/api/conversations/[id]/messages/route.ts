import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { backendJson } from "@/lib/backend";

export interface MessageOut {
  id: string;
  role: string;
  content: string;
  citations: { document: string; page: number | null }[] | null;
  latency_ms: number | null;
  created_at: string;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const messages = await backendJson<MessageOut[]>(`/api/v1/conversations/${id}/messages`);
  return NextResponse.json(messages);
}
