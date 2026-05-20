"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider } from "@clerk/nextjs";
import { useState, type ReactNode } from "react";
import { AuthGate } from "@/components/auth-gate";
import { ContentStrategyProvider } from "@/contexts/ContentStrategyContext";
import { ToastProvider } from "@/components/ui/Toast";
import { OnboardingCheck } from "@/components/auth/OnboardingCheck";

// Clerk requires a publishable key even during build-time SSG.
// Use the actual keyless development key from Clerk's local configuration
// If the env var is set to the placeholder, use the fallback
const envKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const clerkPubKey =
  (envKey && envKey !== "pk_test_REPLACE_WITH_YOUR_KEY" ? envKey : null) ||
  "pk_test_aGVscGVkLXRhaHItMy5jbGVyay5hY2NvdW50cy5kZXYk";

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

