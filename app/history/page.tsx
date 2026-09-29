import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppHeader } from "@/features/navigation/components/app-header";
import { HistoryExplorer } from "@/features/history/components/history-explorer";

export const metadata = { title: "History — Voice Mentor AI" };

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/history");

  return (
    <div className="flex h-svh flex-col">
      <AppHeader userName={session.user.name ?? ""} />
      <main className="mx-auto grid min-h-0 w-full max-w-5xl flex-1 grid-cols-1 gap-6 overflow-hidden px-6 py-6 md:grid-cols-[320px_1fr]">
        <HistoryExplorer />
      </main>
    </div>
  );
}
