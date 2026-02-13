import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { seedKeywords, count = 40, locations } = body;

    if (!seedKeywords || seedKeywords.length === 0) {
      return NextResponse.json(
        { error: "Seed keywords are required" },
        { status: 400 }
      );
    }

    console.log("[LSI Keywords] Generating LSI keywords for:", seedKeywords);

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const locationsText = locations?.length > 0 
      ? `Include location-specific variations for: ${locations.join(', ')}` 
      : '';

    const prompt = `You are an SEO keyword research expert. Given these seed keywords: ${seedKeywords.join(', ')}

Generate ${count} LSI (Latent Semantic Indexing) keywords that are:
1. Semantically related to the seed keywords
2. Long-tail keywords (2-5 words each)
3. Mix of informational, commercial, and transactional intent
4. Diverse and covering different aspects of the topics
5. Suitable for blog posts and landing pages
${locationsText}

IMPORTANT REQUIREMENTS:
- ALL keywords MUST be 2+ words (no single words)
- Include variations like "how to", "best", "guide", "tips", "services", "solutions"
- Include question-based keywords
- Include comparison keywords
- Make sure keywords are unique and not repetitive

Return ONLY a valid JSON object with this structure:
{
  "keywords": ["keyword phrase 1", "keyword phrase 2", ...]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an SEO keyword research expert. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const result = response.choices[0]?.message?.content;
    if (!result) {
      throw new Error("No response from OpenAI");
    }

    let keywordsData;
    try {
      keywordsData = JSON.parse(result);
    } catch (parseError) {
      console.error("[LSI Keywords] JSON parse error:", parseError);
      throw new Error("Failed to parse AI response as JSON");
    }

    if (!keywordsData.keywords || !Array.isArray(keywordsData.keywords)) {
      throw new Error("Invalid response structure from AI");
    }

    // Filter to ensure all keywords are multi-word
    const validKeywords = keywordsData.keywords.filter((keyword: string) => {
      const wordCount = keyword.trim().split(' ').length;
      return wordCount >= 2;
    });

    console.log("[LSI Keywords] Generated", validKeywords.length, "valid LSI keywords");

    return NextResponse.json({
      success: true,
      keywords: validKeywords,
      seedKeywords,
    });
  } catch (error) {
    console.error("[LSI Keywords] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate LSI keywords", details: String(error) },
      { status: 500 }
    );
  }
}
