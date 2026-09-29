import Link from "next/link";
import { redirect } from "next/navigation";
import { Mic } from "lucide-react";
import { auth } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { AppHeader } from "@/features/navigation/components/app-header";
import { StatsGrid } from "@/features/dashboard/components/stats-grid";
import { NotesPanel } from "@/features/notes/components/notes-panel";
import { ConversationList } from "@/features/history/components/conversation-list";

export const metadata = { title: "Dashboard — Voice Mentor AI" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dashboard");

  const firstName = session.user.name?.split(" ")[0] ?? "there";

  return (
    <div className="min-h-svh">
      <AppHeader userName={session.user.name ?? ""} />
      <main className="mx-auto max-w-5xl space-y-8 px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Welcome back, {firstName}</h1>
            <p className="text-sm text-muted-foreground">Here&apos;s how your learning is going.</p>
          </div>
          <Link href="/chat" className={buttonVariants({ size: "lg", className: "rounded-full" })}>
            <Mic className="mr-2 h-4 w-4" />
            Start voice chat
          </Link>
        </div>

        <StatsGrid />

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground">Recent conversations</h2>
              <Link href="/history" className="text-sm text-primary hover:underline">
                View all
              </Link>
            </div>
            <ConversationList limit={5} />
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">Study material</h2>
            <NotesPanel />
          </section>
        </div>
      </main>
    </div>
  );
}
