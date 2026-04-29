import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import {
  consumePlatformAiCall,
  AiGateDeniedError,
  getOpenAiClientForUser,
} from "@/lib/ai-gatekeeper";
// Per-request client (BYOK / platform) set at start of POST
let requestOpenAi: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (requestOpenAi) {
    return requestOpenAi;
  }
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not configured");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// ==================== OUTPUT SCHEMAS ====================

const KeywordResearchSchema = z.object({
  keywords: z.array(z.object({
    keyword: z.string(),
    searchVolume: z.number(),
    difficulty: z.number().min(1).max(100),
    intent: z.enum(["informational", "transactional", "navigational", "commercial"]),
    relevanceScore: z.number().min(1).max(10),
    suggestedContentType: z.enum(["blog", "service-page", "location-page", "faq", "how-to"]),
  })),
  clusterGroups: z.array(z.object({
    name: z.string(),
    mainKeyword: z.string(),
    relatedKeywords: z.array(z.string()),
  })),
});

const ContentOutlineSchema = z.object({
  title: z.string(),
  slug: z.string(),
  metaDescription: z.string().max(160),
  focusKeyword: z.string(),
  secondaryKeywords: z.array(z.string()),
  outline: z.array(z.object({
    heading: z.string(),
    headingLevel: z.enum(["h2", "h3", "h4"]),
    keyPoints: z.array(z.string()),
    targetWordCount: z.number(),
  })),
  estimatedWordCount: z.number(),
  contentType: z.string(),
  targetAudience: z.string(),
  callToAction: z.string(),
});

const FullContentSchema = z.object({
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  excerpt: z.string().max(300),
  metaDescription: z.string().max(160),
  focusKeyword: z.string(),
  secondaryKeywords: z.array(z.string()),
  suggestedCategories: z.array(z.string()),
  suggestedTags: z.array(z.string()),
  seoScore: z.number().min(0).max(100),
  readabilityScore: z.number().min(0).max(100),
  wordCount: z.number(),
  keywordDensity: z.number(),
  internalLinkSuggestions: z.array(z.string()),
  faqSection: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).optional(),
});

const MonthlyContentPlanSchema = z.object({
  month: z.number(),
  year: z.number(),
  totalPosts: z.number(),
  contentCalendar: z.array(z.object({
    week: z.number(),
    posts: z.array(z.object({
      dayOfWeek: z.string(),
      suggestedDate: z.string(),
      title: z.string(),
      focusKeyword: z.string(),
      contentType: z.string(),
      estimatedWordCount: z.number(),
      priority: z.enum(["high", "medium", "low"]),
    })),
  })),
  keywordDistribution: z.record(z.number()),
  contentMix: z.object({
    blogs: z.number(),
    servicePages: z.number(),
    locationPages: z.number(),
    faqs: z.number(),
  }),
});

// ==================== AI AGENTS ====================

// Agent 1: Keyword Research Specialist
async function keywordResearchAgent(params: {
  businessType: string;
  services: string[];
  location: string;
  competitors?: string[];
  existingKeywords?: string[];
}) {
  const systemPrompt = `You are an expert Local SEO Keyword Research Specialist. Your job is to identify high-value, rankable keywords for local businesses.

EXPERTISE:
- Local search intent analysis
- Long-tail keyword discovery
- Keyword difficulty assessment
- Search volume estimation
- Competitor keyword gap analysis
- Semantic keyword clustering

GUIDELINES:
1. Focus on keywords with local intent (e.g., "[service] in [city]", "[service] near me")
2. Include service-specific long-tail keywords
3. Consider seasonal trends for local businesses
4. Prioritize keywords with commercial/transactional intent
5. Group keywords into logical clusters for content planning
6. Estimate realistic search volumes for local markets
7. Assess difficulty based on local competition

IMPORTANT: You must respond with valid JSON only.`;

  const userPrompt = `Research keywords for the following local business:

Business Type: ${params.businessType}
Services: ${params.services.join(", ")}
Location: ${params.location}
${params.competitors ? `Competitors: ${params.competitors.join(", ")}` : ""}
${params.existingKeywords?.length ? `Already targeting: ${params.existingKeywords.join(", ")}` : ""}

Generate 20-30 high-value local SEO keywords that can help this business rank on Google. Include a mix of:
- High-volume head terms
- Medium-competition body keywords  
- Low-competition long-tail keywords
- Location-specific variations
- Service + location combinations
- Question-based keywords (for FAQ content)

Group them into semantic clusters for content planning.`;

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const content = response.choices[0].message.content;
  return JSON.parse(content || "{}");
}

// Agent 2: Content Strategy Planner
async function contentStrategyAgent(params: {
  businessType: string;
  services: string[];
  location: string;
  keywords: string[];
  month: number;
  year: number;
  postsPerWeek: number;
}) {
  const systemPrompt = `You are an expert Content Strategy Planner specializing in Local SEO content calendars. Your job is to create strategic monthly content plans that maximize organic search visibility.

EXPERTISE:
- Content calendar optimization
- Keyword-to-content mapping
- Content type selection (blogs, service pages, location pages, FAQs)
- Publishing frequency optimization
- Seasonal content planning
- Internal linking strategy

GUIDELINES:
1. Distribute keywords strategically across the month
2. Mix content types for variety and comprehensive coverage
3. Schedule high-priority content earlier in the month
4. Consider local events/seasons in timing
5. Ensure proper keyword density across content pieces
6. Plan internal linking opportunities
7. Balance evergreen and timely content

IMPORTANT: You must respond with valid JSON only.`;

  const userPrompt = `Create a monthly content plan for:

Business: ${params.businessType}
Services: ${params.services.join(", ")}
Location: ${params.location}
Target Month: ${params.month}/${params.year}
Posts Per Week: ${params.postsPerWeek}

Keywords to target:
${params.keywords.map((k, i) => `${i + 1}. ${k}`).join("\n")}

Create a detailed content calendar that:
1. Assigns specific keywords to specific posts
2. Suggests optimal publishing dates
3. Recommends content types for each keyword
4. Prioritizes high-value keywords
5. Ensures keyword diversity throughout the month`;

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const content = response.choices[0].message.content;
  return JSON.parse(content || "{}");
}

// Agent 3: Content Outline Creator
async function contentOutlineAgent(params: {
  keyword: string;
  businessType: string;
  services: string[];
  location: string;
  contentType: string;
  competitorInsights?: string;
}) {
  const systemPrompt = `You are an expert SEO Content Outline Creator. Your job is to create comprehensive, SEO-optimized content outlines that will rank on Google.

EXPERTISE:
- Search intent analysis
- SERP feature targeting
- Content structure optimization
- Heading hierarchy (H1, H2, H3)
- Featured snippet optimization
- People Also Ask targeting
- E-E-A-T signals incorporation

GUIDELINES:
1. Analyze search intent for the keyword
2. Structure content to match top-ranking results
3. Include LSI keywords naturally in headings
4. Plan for featured snippet capture
5. Add FAQ sections targeting PAA questions
6. Include local trust signals
7. Plan call-to-action placement
8. Optimize meta description for CTR

IMPORTANT: You must respond with valid JSON only.`;

  const userPrompt = `Create a detailed content outline for:

Target Keyword: "${params.keyword}"
Business Type: ${params.businessType}
Services: ${params.services.join(", ")}
Location: ${params.location}
Content Type: ${params.contentType}
${params.competitorInsights ? `\nCompetitor Insights: ${params.competitorInsights}` : ""}

Create an SEO-optimized outline that includes:
1. Compelling title with keyword
2. Meta description (max 160 chars)
3. Complete heading structure (H2s, H3s)
4. Key points to cover under each heading
5. Target word count for each section
6. Secondary keywords to include
7. FAQ questions to answer
8. Call-to-action recommendation`;

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const content = response.choices[0].message.content;
  return JSON.parse(content || "{}");
}

// Agent 4: Content Writer
async function contentWriterAgent(params: {
  outline: any;
  keyword: string;
  businessType: string;
  businessName: string;
  services: string[];
  location: string;
  tone?: string;
  targetWordCount?: number;
}) {
  const systemPrompt = `You are an expert SEO Content Writer specializing in local business content. Your job is to write high-quality, engaging, SEO-optimized content that ranks on Google and converts readers into customers.

EXPERTISE:
- SEO copywriting
- Local business content
- Conversion optimization
- E-E-A-T content principles
- Natural keyword integration
- Engaging storytelling
- Technical accuracy

WRITING GUIDELINES:
1. Write in a ${params.tone || "professional yet friendly"} tone
2. Include the focus keyword in first 100 words
3. Use keywords naturally (1-2% density)
4. Write scannable content with short paragraphs
5. Include local references and landmarks
6. Add trust signals (years in business, certifications, etc.)
7. Use power words for engagement
8. Include clear calls-to-action
9. Write compelling meta description
10. Format with proper HTML headings

LOCAL SEO SPECIFICS:
- Mention the city/location naturally throughout
- Include "near me" and location variations
- Reference local landmarks or areas served
- Include local phone number format
- Mention service area coverage

IMPORTANT: You must respond with valid JSON only using the specified schemas.`;

  const userPrompt = `Write a complete blog post based on this outline:

${JSON.stringify(params.outline, null, 2)}

Business Details:
- Name: ${params.businessName}
- Type: ${params.businessType}
- Services: ${params.services.join(", ")}
- Location: ${params.location}
- Focus Keyword: "${params.keyword}"
- Target Word Count: ${params.targetWordCount || 1500}

Write the full content in HTML format with proper heading tags. Make it:
1. Highly informative and valuable
2. Optimized for the focus keyword
3. Engaging and easy to read
4. Locally relevant
5. Conversion-focused with clear CTAs
6. Include an FAQ section at the end`;

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.8,
    max_tokens: 4000,
  });

  const content = response.choices[0].message.content;
  return JSON.parse(content || "{}");
}

// Agent 5: SEO Quality Reviewer
async function seoReviewerAgent(params: {
  content: string;
  focusKeyword: string;
  metaDescription: string;
  title: string;
}) {
  const systemPrompt = `You are an expert SEO Content Reviewer. Your job is to analyze content for SEO quality and provide actionable improvements.

ANALYSIS CRITERIA:
1. Keyword optimization (density, placement, variations)
2. Title tag effectiveness
3. Meta description quality
4. Heading structure
5. Content readability (Flesch-Kincaid)
6. Internal linking opportunities
7. E-E-A-T signals
8. Local SEO elements
9. Call-to-action effectiveness
10. Featured snippet potential

Provide scores from 0-100 for:
- SEO Score: Overall optimization
- Readability Score: Content clarity and flow

IMPORTANT: You must respond with valid JSON only.`;

  const userPrompt = `Review this content for SEO quality:

Title: ${params.title}
Meta Description: ${params.metaDescription}
Focus Keyword: "${params.focusKeyword}"

Content:
${params.content.substring(0, 8000)}

Analyze and provide:
1. SEO Score (0-100)
2. Readability Score (0-100)
3. Keyword density percentage
4. Word count
5. Top 3 improvements needed
6. Internal linking suggestions`;

  const response = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const content = response.choices[0].message.content;
  return JSON.parse(content || "{}");
}

// ==================== MAIN API HANDLER ====================

export async function POST(request: NextRequest) {
  console.log("[Content Generate] Starting request");
  
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      await consumePlatformAiCall(user);
    } catch (gateErr) {
      if (gateErr instanceof AiGateDeniedError) {
        return NextResponse.json({ error: gateErr.message }, { status: 402 });
      }
      throw gateErr;
    }
    requestOpenAi = getOpenAiClientForUser(user);

    console.log("[Content Generate] parsing request body");
    
    const body = await request.json();
    console.log("[Content Generate] Request body received");
    console.log("[Content Generate] Action:", body.action);
    
    const { action, ...params } = body;

    let result;

    switch (action) {
      case "research_keywords":
        console.log("[Content Generate] Calling keywordResearchAgent with params:", JSON.stringify(params));
        result = await keywordResearchAgent(params);
        console.log("[Content Generate] keywordResearchAgent completed successfully");
        break;

      case "create_content_plan":
        console.log("[Content Generate] Calling contentStrategyAgent with params:", JSON.stringify(params));
        result = await contentStrategyAgent(params);
        console.log("[Content Generate] contentStrategyAgent completed successfully");
        break;

      case "create_outline":
        console.log("[Content Generate] Calling contentOutlineAgent with params:", JSON.stringify(params));
        result = await contentOutlineAgent(params);
        console.log("[Content Generate] contentOutlineAgent completed successfully");
        break;

      case "write_content":
        console.log("[Content Generate] Calling contentWriterAgent with params:", JSON.stringify(params));
        result = await contentWriterAgent(params);
        console.log("[Content Generate] contentWriterAgent completed successfully");
        break;

      case "review_seo":
        console.log("[Content Generate] Calling seoReviewerAgent with params:", JSON.stringify(params));
        result = await seoReviewerAgent(params);
        console.log("[Content Generate] seoReviewerAgent completed successfully");
        break;

      case "generate_full_content":
        // Pipeline: Outline -> Write -> Review
        const outline = await contentOutlineAgent({
          keyword: params.keyword,
          businessType: params.businessType,
          services: params.services,
          location: params.location,
          contentType: params.contentType || "blog",
        });

        const written = await contentWriterAgent({
          outline,
          keyword: params.keyword,
          businessType: params.businessType,
          businessName: params.businessName,
          services: params.services,
          location: params.location,
          tone: params.tone,
          targetWordCount: params.targetWordCount,
        });

        const review = await seoReviewerAgent({
          content: written.content || "",
          focusKeyword: params.keyword,
          metaDescription: written.metaDescription || "",
          title: written.title || "",
        });

        result = {
          ...written,
          outline,
          seoScore: review.seoScore || review.SEOScore || 75,
          readabilityScore: review.readabilityScore || review.ReadabilityScore || 80,
          improvements: review.improvements || [],
        };
        break;

      case "generate_monthly_content":
        // Full pipeline for monthly content generation
        const keywords = await keywordResearchAgent({
          businessType: params.businessType,
          services: params.services,
          location: params.location,
          existingKeywords: params.existingKeywords,
        });

        const plan = await contentStrategyAgent({
          businessType: params.businessType,
          services: params.services,
          location: params.location,
          keywords: keywords.keywords?.map((k: any) => k.keyword) || [],
          month: params.month,
          year: params.year,
          postsPerWeek: params.postsPerWeek || 3,
        });

        result = {
          keywords: keywords.keywords || [],
          clusters: keywords.clusterGroups || [],
          contentPlan: plan,
        };
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Content generation error:", error);
    console.error("Content generation error stack:", error instanceof Error ? error.stack : "No stack");
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stackTrace = error instanceof Error ? error.stack : "No stack";
    
    // Return detailed error in response body so browser can show it
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage, 
        details: String(error),
        // Stack trace for debugging
        debug: {
          message: errorMessage,
          stack: stackTrace,
          type: error instanceof Error ? error.constructor.name : typeof error
        }
      },
      { status: 500 }
    );
  } finally {
    requestOpenAi = null;
  }
}
