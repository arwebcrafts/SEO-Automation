"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

// Pages that don't require onboarding check
const PUBLIC_PATHS = [
  "/",
  "/scan",
  "/sign-in",
  "/sign-up",
  "/onboarding",
  "/sso-callback",
  "/about",
  "/contact",
  "/services",
  "/pricing",
];
const EXCLUDED_PATHS = ["/api", "/_next", "/favicon", "/downloads"];

interface OnboardingStatus {
  onboardingCompleted: boolean;
  accountType: string;
  agency: unknown | null;
}

export function OnboardingCheck({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(false);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const hasChecked = useRef(false);

  useEffect(() => {
    // Reset check when user signs in/out
    if (!isSignedIn) {
      hasChecked.current = false;
      setOnboardingStatus(null);
    }
  }, [isSignedIn]);

  useEffect(() => {
    // Skip check for excluded paths
    const isExcluded = EXCLUDED_PATHS.some((path) => pathname.startsWith(path));
    if (isExcluded) return;

    // Skip if already on onboarding page
    if (pathname === "/onboarding") return;

    // Only check if user is signed in
    if (!isLoaded || !isSignedIn) return;

    // Skip if already checked and completed
    if (hasChecked.current && onboardingStatus?.onboardingCompleted) return;

    // Check onboarding status
    const checkOnboarding = async () => {
      setIsChecking(true);
      try {
        const response = await fetch("/api/onboarding");
        if (response.ok) {
          const data: OnboardingStatus = await response.json();
          setOnboardingStatus(data);
          hasChecked.current = true;
          
          // Redirect to onboarding if not completed
          if (!data.onboardingCompleted) {
            router.replace("/onboarding");
          }
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkOnboarding();
  }, [isLoaded, isSignedIn, pathname, router, onboardingStatus?.onboardingCompleted]);

  // Show loading while checking onboarding for signed in users on protected routes
  const isPublic = PUBLIC_PATHS.includes(pathname);
  if (isLoaded && isSignedIn && !isPublic && isChecking && !onboardingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
