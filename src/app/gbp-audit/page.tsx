"use client";

import { useState } from "react";
import SidebarLayout from "@/components/layout/SidebarLayout";
import { GBPReportHeader } from "@/components/gbp-audit/gbp-report-header";
import { GBPCategorySection } from "@/components/gbp-audit/gbp-category-section";
import { GBPRecommendations } from "@/components/gbp-audit/gbp-recommendations";
import { Loader2, ClipboardList, CheckCircle2, XCircle, Link2, Sparkles } from "lucide-react";

interface CheckItem {
  id: string;
  name: string;
  status: "pass" | "fail";
  message: string;
  value?: string;
  workHours?: Record<string, string>;
}

interface ManualFormData {
  businessName: string;
  address: string;
  googleMapsUrl: string;
  website: string;
  phone: string;
  hasWorkHours: boolean;
  workHours: string;
  primaryCategory: string;
  additionalCategories: string;
  photoCount: string;
  isClaimed: boolean;
  rating: string;
  reviewCount: string;
  hasRecentReviews: boolean;
  respondsToReviews: boolean;
}

interface AuditResult {
  score: number;
  profileCompleteness: CheckItem[];
  reviewChecks: CheckItem[];
  recommendations: string[];
}

const initialFormData: ManualFormData = {
  businessName: "",
  address: "",
  googleMapsUrl: "",
  website: "",
  phone: "",
  hasWorkHours: false,
  workHours: "",
  primaryCategory: "",
  additionalCategories: "",
  photoCount: "0",
  isClaimed: false,
  rating: "",
  reviewCount: "0",
  hasRecentReviews: false,
  respondsToReviews: false,
};

function calculateAudit(data: ManualFormData): AuditResult {
  const checks = {
    profileCompleteness: [] as CheckItem[],
    reviewChecks: [] as CheckItem[],
    recommendations: [] as string[],
  };

  let totalChecks = 0;
  let passedChecks = 0;

  // Business Name
  totalChecks++;
  if (data.businessName.trim()) {
    passedChecks++;
    checks.profileCompleteness.push({
      id: "business-name",
      name: "Business Name",
      status: "pass",
      message: "Your business has a name set.",
      value: data.businessName,
    });
  } else {
    checks.profileCompleteness.push({
      id: "business-name",
      name: "Business Name",
      status: "fail",
      message: "Business name is required.",
    });
    checks.recommendations.push("Add your business name to your profile.");
  }

  // Primary Category
  totalChecks++;
  if (data.primaryCategory.trim()) {
    passedChecks++;
    checks.profileCompleteness.push({
      id: "primary-category",
      name: "Primary Category",
      status: "pass",
      message: "Your business has a Primary Category assigned.",
      value: data.primaryCategory,
    });
  } else {
    checks.profileCompleteness.push({
      id: "primary-category",
      name: "Primary Category",
      status: "fail",
      message: "Your business does not have a Primary Category assigned.",
    });
    checks.recommendations.push("Assign a Primary Category to your Business Profile.");
  }

  // Additional Categories
  totalChecks++;
  if (data.additionalCategories.trim()) {
    passedChecks++;
    checks.profileCompleteness.push({
      id: "additional-categories",
      name: "Additional Categories",
      status: "pass",
      message: "Your business has Additional Categories assigned.",
      value: data.additionalCategories,
    });
  } else {
    checks.profileCompleteness.push({
      id: "additional-categories",
      name: "Additional Categories",
      status: "fail",
      message: "Your business does not have Additional Categories assigned.",
    });
    checks.recommendations.push("Assign Additional Categories to improve discoverability.");
  }

  // Address
  totalChecks++;
  if (data.address.trim()) {
    passedChecks++;
    checks.profileCompleteness.push({
      id: "address",
      name: "Address",
      status: "pass",
      message: "Your business has a full address provided.",
      value: data.address,
    });
  } else {
    checks.profileCompleteness.push({
      id: "address",
      name: "Address",
      status: "fail",
      message: "Your business does not have an address provided.",
    });
    checks.recommendations.push("Add a complete address to your Business Profile.");
  }

  // Website
  totalChecks++;
  if (data.website.trim()) {
    passedChecks++;
    checks.profileCompleteness.push({
      id: "website",
      name: "Website",
      status: "pass",
      message: "Your business has a website URL provided.",
      value: data.website,
    });
  } else {
    checks.profileCompleteness.push({
      id: "website",
      name: "Website",
      status: "fail",
      message: "Your business does not have a website URL provided.",
    });
    checks.recommendations.push("Add a business website to your Business Profile.");
  }

  // Phone Number
  totalChecks++;
  if (data.phone.trim()) {
    passedChecks++;
    checks.profileCompleteness.push({
      id: "phone",
      name: "Phone Number",
      status: "pass",
      message: "Your business has a phone number provided.",
      value: data.phone,
    });
  } else {
    checks.profileCompleteness.push({
      id: "phone",
      name: "Phone Number",
      status: "fail",
      message: "Your business does not have a phone number provided.",
    });
    checks.recommendations.push("Add a phone number to your Business Profile.");
  }

  // Work Hours
  totalChecks++;
  if (data.hasWorkHours) {
    passedChecks++;
    checks.profileCompleteness.push({
      id: "work-hours",
      name: "Work Hours",
      status: "pass",
      message: "Your business has work hours provided.",
      value: data.workHours || "Hours set",
    });
  } else {
    checks.profileCompleteness.push({
      id: "work-hours",
      name: "Work Hours",
      status: "fail",
      message: "Your business does not have work hours provided.",
    });
    checks.recommendations.push("Add business hours to help customers know when you're open.");
  }

  // Photos
  totalChecks++;
  const photoCount = parseInt(data.photoCount) || 0;
  if (photoCount >= 5) {
    passedChecks++;
    checks.profileCompleteness.push({
      id: "photos",
      name: "Photos",
      status: "pass",
      message: "Your business has a sufficient number of photos.",
      value: `${photoCount} photos`,
    });
  } else {
    checks.profileCompleteness.push({
      id: "photos",
      name: "Photos",
      status: "fail",
      message: photoCount > 0
        ? `Your business has only ${photoCount} photos. We recommend at least 5.`
        : "Your business does not have any photos.",
    });
    checks.recommendations.push("Add more photos to your Business Profile (at least 5 recommended).");
  }

  // Profile Claimed
  totalChecks++;
  if (data.isClaimed) {
    passedChecks++;
    checks.profileCompleteness.push({
      id: "claimed",
      name: "Profile Claimed",
      status: "pass",
      message: "Your Business Profile has been claimed and verified.",
    });
  } else {
    checks.profileCompleteness.push({
      id: "claimed",
      name: "Profile Claimed",
      status: "fail",
      message: "Your Business Profile has not been claimed.",
    });
    checks.recommendations.push("Claim your Google Business Profile to manage it.");
  }

  // Review Score
  totalChecks++;
  const rating = parseFloat(data.rating) || 0;
  if (rating >= 4.0) {
    passedChecks++;
    checks.reviewChecks.push({
      id: "review-score",
      name: "Review Score",
      status: "pass",
      message: "Your business has a good review score.",
      value: `${rating} stars`,
    });
  } else if (rating > 0) {
    checks.reviewChecks.push({
      id: "review-score",
      name: "Review Score",
      status: "fail",
      message: "Your business's review score could be improved.",
      value: `${rating} stars`,
    });
    checks.recommendations.push("Improve your review score by providing excellent customer service.");
  } else {
    checks.reviewChecks.push({
      id: "review-score",
      name: "Review Score",
      status: "fail",
      message: "Your business does not have any reviews yet.",
    });
    checks.recommendations.push("Encourage customers to leave reviews on your Business Profile.");
  }

  // Number of Reviews
  totalChecks++;
  const reviewCount = parseInt(data.reviewCount) || 0;
  if (reviewCount >= 10) {
    passedChecks++;
    checks.reviewChecks.push({
      id: "num-reviews",
      name: "Number of Reviews",
      status: "pass",
      message: "Your business has a good number of reviews.",
      value: `${reviewCount} reviews`,
    });
  } else {
    checks.reviewChecks.push({
      id: "num-reviews",
      name: "Number of Reviews",
      status: "fail",
      message: reviewCount > 0
        ? `Your business has only ${reviewCount} reviews.`
        : "Your business does not have any reviews.",
      value: `${reviewCount} reviews`,
    });
    checks.recommendations.push("Encourage more customers to leave reviews for your business.");
  }

  // Review Frequency
  totalChecks++;
  if (data.hasRecentReviews) {
    passedChecks++;
    checks.reviewChecks.push({
      id: "review-frequency",
      name: "Review Frequency",
      status: "pass",
      message: "Your business receives reviews regularly.",
    });
  } else {
    checks.reviewChecks.push({
      id: "review-frequency",
      name: "Review Frequency",
      status: "fail",
      message: "Your business does not receive reviews frequently.",
    });
    checks.recommendations.push("Encourage consistent review generation from customers.");
  }

  // Owner Response
  totalChecks++;
  if (data.respondsToReviews) {
    passedChecks++;
    checks.reviewChecks.push({
      id: "owner-response",
      name: "Owner Review Response",
      status: "pass",
      message: "You respond to customer reviews.",
    });
  } else {
    checks.reviewChecks.push({
      id: "owner-response",
      name: "Owner Review Response",
      status: "fail",
      message: "You should respond to customer reviews.",
    });
    checks.recommendations.push("Respond to all reviews, especially negative ones.");
  }

  const score = Math.round((passedChecks / totalChecks) * 100);

  return {
    score,
    profileCompleteness: checks.profileCompleteness,
    reviewChecks: checks.reviewChecks,
    recommendations: checks.recommendations,
  };
}

export default function GBPAuditPage() {
  const [formData, setFormData] = useState<ManualFormData>(initialFormData);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scrapeError, setScrapeError] = useState("");

  const handleInputChange = (field: keyof ManualFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleScrapeUrl = async () => {
    if (!scrapeUrl.trim()) return;

    setIsScraping(true);
    setScrapeError("");

    try {
      const response = await fetch("/api/gbp/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scrapeUrl }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to scrape");
      }

      if (result.data) {
        setFormData((prev) => ({
          ...prev,
          businessName: result.data.businessName || prev.businessName,
          address: result.data.address || prev.address,
          phone: result.data.phone || prev.phone,
          website: result.data.website || prev.website,
          rating: result.data.rating || prev.rating,
          reviewCount: result.data.reviewCount || prev.reviewCount,
          primaryCategory: result.data.primaryCategory || prev.primaryCategory,
          additionalCategories: result.data.additionalCategories || prev.additionalCategories,
          photoCount: result.data.photoCount || prev.photoCount,
          hasWorkHours: result.data.hasWorkHours || prev.hasWorkHours,
          workHours: result.data.workHours || prev.workHours,
          isClaimed: result.data.isClaimed || prev.isClaimed,
          googleMapsUrl: scrapeUrl,
        }));
      }
    } catch (error) {
      setScrapeError(error instanceof Error ? error.message : "Failed to fetch business data");
    } finally {
      setIsScraping(false);
    }
  };

  const handleAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.businessName.trim()) return;

    setIsAuditing(true);
    setTimeout(() => {
      const result = calculateAudit(formData);
      setAuditResult(result);
      setIsAuditing(false);
    }, 500);
  };

  const handleNewAudit = () => {
    setAuditResult(null);
    setFormData(initialFormData);
    setScrapeUrl("");
    setScrapeError("");
  };

  return (
    <SidebarLayout>
      <main className="py-8">
        <div className={`container mx-auto px-4 ${auditResult ? "max-w-5xl" : "max-w-3xl"}`}>
          
          {!auditResult && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-4">Google Business Profile Audit Tool</h1>
                <p className="text-muted-foreground text-lg">
                  Paste your Google Maps listing URL to auto-fill details, or enter manually.
                </p>
              </div>

              {/* URL Scraper Section */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6 mb-6">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Auto-Fill from Google Maps URL
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Paste your Google Maps business listing URL and we&apos;ll automatically extract the details.
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="url"
                      value={scrapeUrl}
                      onChange={(e) => setScrapeUrl(e.target.value)}
                      placeholder="https://www.google.com/maps/place/..."
                      className="w-full pl-10 pr-4 py-3 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleScrapeUrl}
                    disabled={isScraping || !scrapeUrl.trim()}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                  >
                    {isScraping ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Fetching...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        Auto-Fill
                      </>
                    )}
                  </button>
                </div>
                {scrapeError && (
                  <p className="mt-2 text-sm text-red-500">{scrapeError}</p>
                )}
                <p className="mt-3 text-xs text-muted-foreground">
                  Tip: Go to Google Maps, search for your business, click on it, then copy the URL from your browser.
                </p>
              </div>

              <form onSubmit={handleAudit} className="space-y-6">
                <div className="bg-card border rounded-xl p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <ClipboardList className="w-5 h-5" />
                    Basic Information
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Business Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.businessName}
                        onChange={(e) => handleInputChange("businessName", e.target.value)}
                        placeholder="e.g., Culinary Charms"
                        className="w-full px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Primary Category</label>
                      <input
                        type="text"
                        value={formData.primaryCategory}
                        onChange={(e) => handleInputChange("primaryCategory", e.target.value)}
                        placeholder="e.g., Restaurant, Bakery, Plumber"
                        className="w-full px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Additional Categories</label>
                      <input
                        type="text"
                        value={formData.additionalCategories}
                        onChange={(e) => handleInputChange("additionalCategories", e.target.value)}
                        placeholder="e.g., Asian Restaurant, Takeaway"
                        className="w-full px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Full Address</label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        placeholder="e.g., 123 Main St, City, Country"
                        className="w-full px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Website URL</label>
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => handleInputChange("website", e.target.value)}
                        placeholder="https://example.com"
                        className="w-full px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        placeholder="+1 234 567 8900"
                        className="w-full px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Google Maps URL</label>
                      <input
                        type="url"
                        value={formData.googleMapsUrl}
                        onChange={(e) => handleInputChange("googleMapsUrl", e.target.value)}
                        placeholder="https://maps.google.com/..."
                        className="w-full px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Number of Photos</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.photoCount}
                        onChange={(e) => handleInputChange("photoCount", e.target.value)}
                        placeholder="0"
                        className="w-full px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.hasWorkHours}
                        onChange={(e) => handleInputChange("hasWorkHours", e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300"
                      />
                      <span>Business hours are set</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isClaimed}
                        onChange={(e) => handleInputChange("isClaimed", e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300"
                      />
                      <span>Profile is claimed/verified</span>
                    </label>
                  </div>
                </div>

                <div className="bg-card border rounded-xl p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Reviews Information
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Average Rating (1-5)</label>
                      <input
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={formData.rating}
                        onChange={(e) => handleInputChange("rating", e.target.value)}
                        placeholder="e.g., 4.5"
                        className="w-full px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Total Number of Reviews</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.reviewCount}
                        onChange={(e) => handleInputChange("reviewCount", e.target.value)}
                        placeholder="0"
                        className="w-full px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.hasRecentReviews}
                        onChange={(e) => handleInputChange("hasRecentReviews", e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300"
                      />
                      <span>Received reviews in the last 30 days</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.respondsToReviews}
                        onChange={(e) => handleInputChange("respondsToReviews", e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300"
                      />
                      <span>I respond to customer reviews</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAuditing || !formData.businessName.trim()}
                  className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isAuditing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <ClipboardList className="h-5 w-5" />
                      Run GBP Audit
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {isAuditing && (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <p className="mt-4 text-lg">Analyzing your business profile...</p>
            </div>
          )}

          {auditResult && !isAuditing && (
            <>
              <div className="mb-4">
                <button
                  onClick={handleNewAudit}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <XCircle className="w-4 h-4" />
                  Start New Audit
                </button>
              </div>

              <GBPReportHeader
                businessName={formData.businessName}
                address={formData.address}
                score={auditResult.score}
                keyword={formData.primaryCategory}
                recommendationsCount={auditResult.recommendations.length}
                generatedAt={new Date().toLocaleString()}
                googleUrl={formData.googleMapsUrl || undefined}
                website={formData.website || null}
                phone={formData.phone || null}
              />

              <GBPCategorySection
                id="profile-completeness"
                title="Profile Completeness"
                checks={auditResult.profileCompleteness}
              />

              <GBPCategorySection
                id="reviews"
                title="Reviews"
                checks={auditResult.reviewChecks}
              />

              {auditResult.recommendations.length > 0 && (
                <GBPRecommendations
                  id="recommendations"
                  recommendations={auditResult.recommendations}
                />
              )}
            </>
          )}
        </div>
      </main>
    </SidebarLayout>
  );
}
