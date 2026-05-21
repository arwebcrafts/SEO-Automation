"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Temporary redirect page for route migration.
 * This will be replaced with the actual Content Strategy Dashboard component
 * after Dev 4 completes the content strategy view migration.
 * 
 * Old route: /content-strategy?view=dashboard
 * New route: /content/dashboard
 */
export default function ContentDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Temporary redirect to old route during migration
    router.replace("/content-strategy?view=dashboard");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
}
