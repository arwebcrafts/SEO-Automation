"use client";

import { useAuth } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const PUBLIC_PATHS = [
  "/",
  "/sign-in",
  "/sign-up",
  "/sso-callback",
  "/onboarding",
  "/about",
  "/contact",
  "/services",
  "/pricing",
  "/privacy",
  "/terms",
  "/plugin",
];

function isPublicPath(pathname: string) {
  return (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/sign-in/") ||
    pathname.startsWith("/sign-up/")
  );
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (isPublicPath(pathname)) return;

    if (!isSignedIn) {
      router.replace("/sign-in");
    }
  }, [isLoaded, isSignedIn, pathname, router]);

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn && !isPublicPath(pathname)) {
    return null;
  }

  return <>{children}</>;
}
