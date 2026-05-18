import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/auth";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { 
      selectedService, 
      locations, 
      existingContent, 
      brandTone, 
      targetAudience,
      aboutSummary,
      count,
      userKeywords
    } = body;

    // Use count from request or default to 30
    const topicCount = count || 30;

    if (!selectedService) {
      return NextResponse.json(
        { error: "Selected service is required" },
        { status: 400 }
      );
    }

    console.log("[AI Topics] Generating", topicCount, "topics for service:", selectedService);

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Include user keywords in the prompt if provided
    const userKeywordsText = userKeywords?.length > 0 
      ? `\n- User Target Keywords: ${userKeywords.join(', ')}` 
      : '';

    // Create comprehensive prompt for topic generation
    const prompt = `You are a content strategy expert for a technology company. 

Company Context:
- Service: ${selectedService}
- About: ${aboutSummary}
- Brand Tone: ${brandTone}
- Target Audience: ${targetAudience}
- Existing Content: ${existingContent?.map((p: any) => p.title).join(', ') || 'None'}
- Target Locations: ${locations?.join(', ') || 'Not specified'}${userKeywordsText}

Generate EXACTLY ${topicCount} high-quality blog post and landing page topics that will:
1. Target the ${targetAudience} audience
2. Incorporate the ${selectedService} service
3. Have SEO potential with specific keywords
4. Be location-specific where relevant (use the target locations provided)
5. Fill gaps in existing content
6. Match the ${brandTone} brand tone
${userKeywordsText ? '7. Incorporate the user target keywords naturally into topics' : ''}

IMPORTANT: You MUST generate exactly ${topicCount} topics, no more, no less.

For each topic, provide:
- A compelling title (60-70 characters max)
- Primary keywords (3-5) - MUST be multi-word phrases (2+ words each)
- Secondary keywords (5-8) - MUST be multi-word phrases (2+ words each)
- Target locations (if applicable)
- Content type (blog post or landing page)
- Brief description (1-2 sentences)
- Search intent (informational, commercial, local)

IMPORTANT KEYWORD REQUIREMENTS:
- ALL keywords must be 2+ words (no single words like "AI", "data", "2024")
- Examples of good keywords: "cybersecurity trends", "business automation", "machine learning"
- Examples of bad keywords: "AI", "data", "trends", "2024", "startups"
- Focus on phrase-based keywords for better SEO targeting

Return ONLY a valid JSON object with this structure:
{
  "topics": [
    {
      "title": "Topic Title",
      "primaryKeywords": ["keyword1", "keyword2", "keyword3"],
      "secondaryKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
      "targetLocations": ["Location1", "Location2"],
      "contentType": "blog post",
      "description": "Brief description of the topic",
      "searchIntent": "informational",
      "estimatedWordCount": 1200,
      "difficulty": "medium"
    }
  ]
}`;

    // Calculate max tokens based on topic count (approximately 150 tokens per topic)
    const maxTokens = Math.min(16000, Math.max(2000, topicCount * 200));
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Faster model for topic generation
      messages: [
        {
          role: "system",
          content: `You are a content strategy expert. Always respond with valid JSON only. You MUST generate exactly ${topicCount} topics - no more, no less. Be creative and diverse in your topics.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8, // Slightly higher for more diverse topics
      max_tokens: maxTokens, // Dynamic tokens based on topic count
      response_format: { type: "json_object" }, // Force JSON response
    });

    const result = response.choices[0]?.message?.content;
    if (!result) {
      throw new Error("No response from OpenAI");
    }

    console.log("[AI Topics] Generated response length:", result.length);

    // Parse the JSON response
    let topicsData;
    try {
      topicsData = JSON.parse(result);
    } catch (parseError) {
      console.error("[AI Topics] JSON parse error:", parseError);
      console.log("[AI Topics] Raw response:", result);
      throw new Error("Failed to parse AI response as JSON");
    }

    if (!topicsData.topics || !Array.isArray(topicsData.topics)) {
      throw new Error("Invalid response structure from AI");
    }

    console.log("[AI Topics] Generated", topicsData.topics.length, "topics");

    // Validate and filter keywords to ensure they are multi-word
    const validatedTopics = topicsData.topics.map((topic: any) => {
      const filterMultiWordKeywords = (keywords: string[]) => {
        return keywords.filter(keyword => {
          const wordCount = keyword.trim().split(' ').length;
          const isValid = wordCount >= 2;
          if (!isValid) {
            console.log("[AI Topics] Filtered out single-word keyword:", keyword);
          }
          return isValid;
        });
      };

      return {
        ...topic,
        primaryKeywords: filterMultiWordKeywords(topic.primaryKeywords || []),
        secondaryKeywords: filterMultiWordKeywords(topic.secondaryKeywords || []),
      };
    });

    console.log("[AI Topics] Validated topics with multi-word keywords only");

    return NextResponse.json({
      success: true,
      topics: validatedTopics,
      service: selectedService,
    });
  } catch (error: unknown) {
    console.error("[AI Topics] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate topics", details: String(error) },
      { status: 500 }
    );
  }
}
