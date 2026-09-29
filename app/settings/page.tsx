import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/features/navigation/components/app-header";
import { SettingsForm } from "@/features/settings/components/settings-form";

export const metadata = { title: "Settings — Voice Mentor AI" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/settings");

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { preferredLanguage: true, difficultyLevel: true, voiceId: true, responseLength: true },
  });

  return (
    <div className="min-h-svh">
      <AppHeader userName={session.user.name ?? ""} />
      <main className="mx-auto max-w-2xl space-y-6 px-6 py-8">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Changes apply from your next voice conversation.
          </p>
        </div>
        <SettingsForm
          initialLanguage={user.preferredLanguage as "en" | "hi" | "hinglish"}
          initialDifficultyLevel={user.difficultyLevel as "beginner" | "intermediate" | "advanced"}
          initialVoiceId={user.voiceId ?? "EXAVITQu4vr4xnSDxMaL"}
          initialResponseLength={user.responseLength as "concise" | "balanced" | "detailed"}
        />
      </main>
    </div>
  );
}
