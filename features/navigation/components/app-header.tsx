"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/chat", label: "Voice Chat" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Settings" },
];

export function AppHeader({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-background/80 px-6 py-3 backdrop-blur">
      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="font-semibold">
          Voice Mentor AI
        </Link>
        <nav className="hidden gap-1 sm:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
                pathname?.startsWith(link.href) && "bg-accent text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-muted-foreground sm:inline">{userName}</span>
        <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
          Sign out
        </Button>
      </div>
    </header>
  );
}
