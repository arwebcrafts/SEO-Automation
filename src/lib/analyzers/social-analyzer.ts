import * as cheerio from "cheerio";
import type { Check, CategoryResult, PageData } from "./types";
import { calculateGrade } from "../utils";

export function analyzeSocial(data: PageData): CategoryResult {
  const $ = cheerio.load(data.html);
  const checks: Check[] = [];

  // 1. Open Graph Title
  const ogTitle = $('meta[property="og:title"]').attr("content") || "";
  checks.push({
    id: "ogTitle",
    name: "Open Graph Title",
    status: ogTitle ? "pass" : "warning",
    score: ogTitle ? 100 : 30,
    weight: 15,
    value: { ogTitle },
    message: ogTitle
      ? `OG Title: "${ogTitle}"`
      : "No Open Graph title found",
    recommendation: !ogTitle
      ? "Add an og:title meta tag for better social sharing"
      : undefined,
  });

  // 2. Open Graph Description
  const ogDescription = $('meta[property="og:description"]').attr("content") || "";
  checks.push({
    id: "ogDescription",
    name: "Open Graph Description",
    status: ogDescription ? "pass" : "warning",
    score: ogDescription ? 100 : 30,
    weight: 12,
    value: { ogDescription },
    message: ogDescription
      ? `OG Description: "${ogDescription.slice(0, 100)}${ogDescription.length > 100 ? "..." : ""}"`
      : "No Open Graph description found",
    recommendation: !ogDescription
      ? "Add an og:description meta tag"
      : undefined,
  });

  // 3. Open Graph Image
  const ogImage = $('meta[property="og:image"]').attr("content") || "";
  checks.push({
    id: "ogImage",
    name: "Open Graph Image",
    status: ogImage ? "pass" : "warning",
    score: ogImage ? 100 : 30,
    weight: 15,
    value: { ogImage },
    message: ogImage
      ? `OG Image found: ${ogImage.slice(0, 60)}...`
      : "No Open Graph image found",
    recommendation: !ogImage
      ? "Add an og:image meta tag (recommended size: 1200x630px)"
      : undefined,
  });

  // 4. Open Graph URL
  const ogUrl = $('meta[property="og:url"]').attr("content") || "";
  checks.push({
    id: "ogUrl",
    name: "Open Graph URL",
    status: ogUrl ? "pass" : "info",
    score: ogUrl ? 100 : 70,
    weight: 5,
    value: { ogUrl },
    message: ogUrl
      ? `OG URL: ${ogUrl}`
      : "No og:url tag found",
  });

  // 5. Open Graph Type
  const ogType = $('meta[property="og:type"]').attr("content") || "";
  checks.push({
    id: "ogType",
    name: "Open Graph Type",
    status: ogType ? "pass" : "info",
    score: ogType ? 100 : 70,
    weight: 3,
    value: { ogType },
    message: ogType
      ? `OG Type: ${ogType}`
      : "No og:type tag found (defaults to 'website')",
  });

  // 6. Twitter Card
  const twitterCard = $('meta[name="twitter:card"]').attr("content") || "";
  checks.push({
    id: "twitterCard",
    name: "Twitter Card",
    status: twitterCard ? "pass" : "warning",
    score: twitterCard ? 100 : 40,
    weight: 10,
    value: { cardType: twitterCard },
    message: twitterCard
      ? `Twitter Card: ${twitterCard}`
      : "No Twitter Card meta tag found",
    recommendation: !twitterCard
      ? "Add a twitter:card meta tag"
      : undefined,
  });

  // 7. Twitter Title
  const twitterTitle = $('meta[name="twitter:title"]').attr("content") || "";
  checks.push({
    id: "twitterTitle",
    name: "Twitter Title",
    status: twitterTitle || ogTitle ? "pass" : "warning",
    score: twitterTitle ? 100 : ogTitle ? 80 : 40,
    weight: 5,
    value: { twitterTitle },
    message: twitterTitle
      ? `Twitter Title: "${twitterTitle}"`
      : ogTitle
      ? "Falls back to OG title"
      : "No Twitter title found",
  });

  // 8. Twitter Image
  const twitterImage = $('meta[name="twitter:image"]').attr("content") || "";
  checks.push({
    id: "twitterImage",
    name: "Twitter Image",
    status: twitterImage || ogImage ? "pass" : "warning",
    score: twitterImage ? 100 : ogImage ? 80 : 40,
    weight: 5,
    value: { twitterImage },
    message: twitterImage
      ? "Twitter-specific image found"
      : ogImage
      ? "Falls back to OG image"
      : "No Twitter image found",
  });

  // Check for any social links first (to determine if we should warn or just recommend)
  const hasFacebookLink = data.html.includes("facebook.com/") && !data.html.includes("facebook.com/sharer");
  const hasTwitterLink = data.html.includes("twitter.com/") || data.html.includes("x.com/");
  const hasInstagramLink = data.html.includes("instagram.com/");
  const hasLinkedInLink = data.html.includes("linkedin.com/");
  const hasYouTubeLink = data.html.includes("youtube.com/") || data.html.includes("youtu.be/");
  
  // If at least one social link exists, don't show warnings for missing ones - just recommendations
  const hasAnySocialLink = hasFacebookLink || hasTwitterLink || hasInstagramLink || hasLinkedInLink || hasYouTubeLink;

  // 9. Facebook Link
  const facebookLink = $('a[href*="facebook.com/"]:not([href*="sharer"])').attr("href") || "";
  checks.push({
    id: "hasFacebook",
    name: "Facebook Page Link",
    status: hasFacebookLink ? "pass" : (hasAnySocialLink ? "info" : "warning"),
    score: hasFacebookLink ? 100 : (hasAnySocialLink ? 70 : 40),
    weight: 8,
    value: { url: facebookLink, found: hasFacebookLink },
    message: hasFacebookLink
      ? `Facebook page linked: ${facebookLink.slice(0, 50)}`
      : "No Facebook page link found",
    recommendation: !hasFacebookLink
      ? "Consider adding a Facebook Page link"
      : undefined,
  });

  // 10. Twitter/X Link
  const twitterLink = $('a[href*="twitter.com/"], a[href*="x.com/"]').not('[href*="intent"]').attr("href") || "";
  checks.push({
    id: "hasTwitter",
    name: "X (Twitter) Profile Link",
    status: hasTwitterLink ? "pass" : (hasAnySocialLink ? "info" : "warning"),
    score: hasTwitterLink ? 100 : (hasAnySocialLink ? 70 : 40),
    weight: 8,
    value: { url: twitterLink, found: hasTwitterLink },
    message: hasTwitterLink
      ? `X profile linked: ${twitterLink.slice(0, 50)}`
      : "No X (Twitter) profile link found",
    recommendation: !hasTwitterLink
      ? "Consider adding an X Profile link"
      : undefined,
  });

  // 11. Instagram Link
  const instagramLink = $('a[href*="instagram.com/"]').attr("href") || "";
  checks.push({
    id: "hasInstagram",
    name: "Instagram Profile Link",
    status: hasInstagramLink ? "pass" : "info",
    score: hasInstagramLink ? 100 : 60,
    weight: 5,
    value: { url: instagramLink, found: hasInstagramLink },
    message: hasInstagramLink
      ? `Instagram linked: ${instagramLink.slice(0, 50)}`
      : "No Instagram profile link found",
    recommendation: !hasInstagramLink
      ? "Create and link an associated Instagram Profile"
      : undefined,
  });

  // 12. LinkedIn Link
  const linkedinLink = $('a[href*="linkedin.com/"]').attr("href") || "";
  checks.push({
    id: "hasLinkedIn",
    name: "LinkedIn Profile Link",
    status: hasLinkedInLink ? "pass" : "info",
    score: hasLinkedInLink ? 100 : 60,
    weight: 5,
    value: { url: linkedinLink, found: hasLinkedInLink },
    message: hasLinkedInLink
      ? `LinkedIn linked: ${linkedinLink.slice(0, 50)}`
      : "No LinkedIn profile link found",
    recommendation: !hasLinkedInLink
      ? "Create and link an associated LinkedIn Profile"
      : undefined,
  });

  // 13. YouTube Link
  const youtubeLink = $('a[href*="youtube.com/"], a[href*="youtu.be/"]').attr("href") || "";
  checks.push({
    id: "hasYoutube",
    name: "YouTube Channel Link",
    status: hasYouTubeLink ? "pass" : "info",
    score: hasYouTubeLink ? 100 : 60,
    weight: 3,
    value: { url: youtubeLink, found: hasYouTubeLink },
    message: hasYouTubeLink
      ? `YouTube linked: ${youtubeLink.slice(0, 50)}`
      : "No YouTube channel link found",
    recommendation: !hasYouTubeLink
      ? "Create and link an associated YouTube Channel"
      : undefined,
  });

  // 14. Facebook Pixel
  const hasFacebookPixel = data.html.includes("fbq(") || data.html.includes("facebook.com/tr");
  checks.push({
    id: "facebookPixel",
    name: "Facebook Pixel",
    status: hasFacebookPixel ? "pass" : "info",
    score: hasFacebookPixel ? 100 : 70,
    weight: 3,
    value: { hasPixel: hasFacebookPixel },
    message: hasFacebookPixel
      ? "Facebook Pixel detected"
      : "No Facebook Pixel detected",
  });

  // Calculate category score
  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  const weightedScore = checks.reduce((sum, c) => sum + c.score * c.weight, 0);
  const score = totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;
  const grade = calculateGrade(score);

  return {
    score,
    grade,
    message: score >= 80
      ? "Your social media integration is good!"
      : score >= 60
      ? "Your social media presence could be improved"
      : "Your social media integration needs work",
    checks,
  };
}
