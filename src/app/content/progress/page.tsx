"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Temporary redirect page for route migration.
 * This will be replaced with the actual Progress component
 * after Dev 4 completes the content strategy view migration.
 * 
 * Old route: /content-strategy?view=progress
 * New route: /content/progress
 */
export default function ContentProgressPage() {
  const router = useRouter();

  useEffect(() => {
    // Temporary redirect to old route during migration
    router.replace("/content-strategy?view=progress");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
}
