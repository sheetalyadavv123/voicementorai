"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CtaSection() {
  const { data: session } = useSession();

  return (
    <section className="relative overflow-hidden border-t border-border/40 px-6 py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[320px] bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,color-mix(in_oklch,var(--brand),transparent_90%),transparent)]"
      />
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Your next study session starts with &quot;Hi&quot;
        </h2>
        <p className="mt-3 text-muted-foreground">
          Free to start. No credit card. Just talk.
        </p>
        <Link
          href={session ? "/dashboard" : "/signup"}
          className={cn(
            buttonVariants({ size: "lg" }),
            "mt-8 rounded-full bg-brand px-8 text-brand-foreground hover:bg-brand/90"
          )}
        >
          {session ? "Go to dashboard" : "Start learning free"}
        </Link>
      </div>
    </section>
  );
}
