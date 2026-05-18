"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider } from "@clerk/nextjs";
import { useState, type ReactNode } from "react";
import { AuthGate } from "@/components/auth-gate";
import { ContentStrategyProvider } from "@/contexts/ContentStrategyContext";
import { ToastProvider } from "@/components/ui/Toast";
import { OnboardingCheck } from "@/components/auth/OnboardingCheck";

// Clerk requires a publishable key even during build-time SSG.
// If the real key is not set, use a properly-formatted placeholder so the build doesn't crash.
// The base64 decodes to "placeholder.clerk.accounts.dev$" — Clerk's expected FAPI format.
// At runtime with a real key, everything works normally.
const clerkPubKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  "pk_test_cGxhY2Vob2xkZXIuY2xlcmsuYWNjb3VudHMuZGV2JA==";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <QueryClientProvider client={queryClient}>
        <ContentStrategyProvider>
          <ToastProvider>
            <AuthGate>
              <OnboardingCheck>{children}</OnboardingCheck>
            </AuthGate>
          </ToastProvider>
        </ContentStrategyProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

