"use client";

import SidebarLayout from "@/components/layout/SidebarLayout";
import { useAuth } from "@clerk/nextjs";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingHomeContent } from "@/components/marketing/MarketingHomeContent";
import { AppCommandCenter } from "@/components/app/AppCommandCenter";

export function HomeClient() {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return (
      <SidebarLayout>
        <AppCommandCenter />
      </SidebarLayout>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <MarketingNav />
      <MarketingHomeContent />
      <MarketingFooter />
    </div>
  );
}
