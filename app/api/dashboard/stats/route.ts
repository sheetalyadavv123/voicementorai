import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { backendJson } from "@/lib/backend";

export interface DashboardStats {
  total_conversations: number;
  total_messages: number;
  total_documents: number;
  total_input_tokens: number;
  total_output_tokens: number;
  estimated_cost_usd: number;
  avg_latency_ms: number | null;
  ai_provider: string;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await backendJson<DashboardStats>(`/api/v1/dashboard/stats?user_id=${session.user.id}`);
  return NextResponse.json(stats);
}
