"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        {children}
        <Toaster
          richColors
          position="top-right"
          toastOptions={{
            className: "border border-border bg-surface text-foreground",
          }}
        />
      </ThemeProvider>
    </SessionProvider>
  );
}
