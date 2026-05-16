import React from "react";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export const metadata = { title: "Terms of Service - SEO Hub", description: "SEO Hub terms of service." };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <MarketingNav />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto prose dark:prose-invert">
          <h1>Terms of Service</h1>
          <p className="lead">Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
          <h2>1. Acceptance of Terms</h2>
          <p>By using SEO Hub, you agree to these terms. If you do not agree, do not use our services.</p>
          <h2>2. Account Registration</h2>
          <p>You must provide accurate information when creating an account. You are responsible for maintaining the security of your account.</p>
          <h2>3. Acceptable Use</h2>
          <p>You agree not to use our services for any unlawful purpose or to violate the rights of others. Automated scraping without authorization is prohibited.</p>
          <h2>4. Subscription & Billing</h2>
          <p>Paid plans are billed monthly or annually. You may cancel at any time, and your subscription will remain active until the end of the billing period.</p>
          <h2>5. Intellectual Property</h2>
          <p>Content generated through our AI tools belongs to you. Our platform, branding, and code remain our intellectual property.</p>
          <h2>6. Limitation of Liability</h2>
          <p>SEO Hub is provided "as is" without warranties. We are not liable for indirect or consequential damages.</p>
          <h2>7. Termination</h2>
          <p>We reserve the right to suspend or terminate accounts that violate these terms.</p>
          <h2>8. Contact</h2>
          <p>For questions about these terms, contact legal@seoaudit.app.</p>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
