"use client";

import { useState } from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1 },
        },
      })
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <SessionProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            {children}
            <Toaster richColors position="top-center" />
          </TooltipProvider>
        </QueryClientProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
