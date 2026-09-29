import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { backendJson } from "@/lib/backend";

export interface DocumentOut {
  id: string;
  filename: string;
  status: "processing" | "ready" | "failed";
  page_count: number | null;
  error_message: string | null;
  created_at: string;
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const documents = await backendJson<DocumentOut[]>(
    `/api/v1/documents?user_id=${session.user.id}`
  );
  return NextResponse.json(documents);
}
