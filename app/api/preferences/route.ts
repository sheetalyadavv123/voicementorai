import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const preferencesSchema = z.object({
  preferredLanguage: z.enum(["en", "hi", "hinglish"]).optional(),
  difficultyLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  voiceId: z.string().optional(),
  responseLength: z.enum(["concise", "balanced", "detailed"]).optional(),
});

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = preferencesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: parsed.data,
    select: {
      preferredLanguage: true,
      difficultyLevel: true,
      voiceId: true,
      responseLength: true,
    },
  });

  return NextResponse.json(user);
}
