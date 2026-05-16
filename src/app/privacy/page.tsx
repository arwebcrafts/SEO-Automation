import React from "react";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export const metadata = { title: "Privacy Policy - SEO Hub", description: "SEO Hub privacy policy." };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <MarketingNav />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto prose dark:prose-invert">
          <h1>Privacy Policy</h1>
          <p className="lead">Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
          <h2>1. Information We Collect</h2>
          <p>We collect information you provide directly, such as your name, email, and website URLs. We also collect usage data automatically when you use our services.</p>
          <h2>2. How We Use Your Information</h2>
          <p>We use your information to provide, maintain, and improve our services, send you notifications, and communicate about new features.</p>
          <h2>3. Data Storage</h2>
          <p>Your data is stored securely on encrypted servers. We use industry-standard security measures to protect your information.</p>
          <h2>4. Third-Party Services</h2>
          <p>We use third-party services such as Clerk (authentication), Stripe (payments), and Resend (emails). These services have their own privacy policies.</p>
          <h2>5. Your Rights</h2>
          <p>You have the right to access, correct, or delete your personal data. Contact us at privacy@seoaudit.app for any privacy-related requests.</p>
          <h2>6. Cookies</h2>
          <p>We use essential cookies for authentication and analytics cookies to improve our services.</p>
          <h2>7. Contact</h2>
          <p>For privacy questions, contact us at privacy@seoaudit.app.</p>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
