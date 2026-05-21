"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Temporary redirect page for route migration.
 * This will be replaced with the actual Drafts component
 * after Dev 4 completes the content strategy view migration.
 * 
 * Old route: /content-strategy?view=drafts
 * New route: /content/drafts
 */
export default function ContentDraftsPage() {
  const router = useRouter();

  useEffect(() => {
    // Temporary redirect to old route during migration
    router.replace("/content-strategy?view=drafts");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
}
