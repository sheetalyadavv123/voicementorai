"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingNav() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-20 border-b border-border/40 bg-background/70 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <span className="font-semibold tracking-tight">
          Voice Mentor <span className="text-brand">AI</span>
        </span>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground sm:flex">
          <a href="#features" className="hover:text-foreground">
            Features
          </a>
          <a href="#architecture" className="hover:text-foreground">
            Architecture
          </a>
          <a href="#how-it-works" className="hover:text-foreground">
            How it works
          </a>
        </nav>
        <div className="flex items-center gap-3">
          {session ? (
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ size: "sm" }),
                "rounded-full bg-brand text-brand-foreground hover:bg-brand/90"
              )}
            >
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
                Sign in
              </Link>
              <Link
                href="/signup"
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "rounded-full bg-brand text-brand-foreground hover:bg-brand/90"
                )}
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
