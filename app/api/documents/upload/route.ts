import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { backendFetch } from "@/lib/backend";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const incomingForm = await request.formData();
  const file = incomingForm.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const forwardForm = new FormData();
  forwardForm.set("file", file, file.name);

  const response = await backendFetch(`/api/v1/documents/upload?user_id=${session.user.id}`, {
    method: "POST",
    body: forwardForm,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: "Upload failed" }));
    return NextResponse.json({ error: body.detail ?? "Upload failed" }, { status: response.status });
  }

  return NextResponse.json(await response.json(), { status: 201 });
}
