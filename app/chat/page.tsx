import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { VoiceChatRoom } from "@/features/voice-chat/components/voice-chat-room";

export const metadata = {
  title: "Voice Chat — Voice Mentor AI",
};

export default async function ChatPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/chat");
  }

  return (
    <div className="flex h-svh flex-col">
      <header className="flex items-center justify-between border-b border-border/60 px-6 py-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
        <span className="text-sm font-medium">Voice Mentor AI</span>
        <span className="w-20" />
      </header>
      <main className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col px-4 py-6">
        <VoiceChatRoom studentName={session.user.name?.split(" ")[0] ?? "there"} />
      </main>
    </div>
  );
}
