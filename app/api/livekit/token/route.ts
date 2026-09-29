import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { backendJson } from "@/lib/backend";
import { prisma } from "@/lib/prisma";

interface TokenResponse {
  token: string;
  url: string;
  room_name: string;
}

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Read preferences fresh from the DB rather than the session JWT — the
  // JWT is only refreshed on login, so a language/voice change made in
  // Settings wouldn't otherwise take effect until the next sign-in.
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { name: true, preferredLanguage: true, difficultyLevel: true, voiceId: true, responseLength: true },
  });

  const data = await backendJson<TokenResponse>("/api/v1/livekit/token", {
    method: "POST",
    body: JSON.stringify({
      user_id: session.user.id,
      name: user.name,
      preferred_language: user.preferredLanguage,
      difficulty_level: user.difficultyLevel,
      voice_id: user.voiceId,
      response_length: user.responseLength,
    }),
  });

  return NextResponse.json(data);
}
