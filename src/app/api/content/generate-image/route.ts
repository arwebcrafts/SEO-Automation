import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { 
      title,
      service,
      location,
      brandTone,
      contentType = "blog post"
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    console.log("[Image Generation] Generating image for:", title);

    // Create DALL-E prompt based on content type and brand tone
    const prompt = createImagePrompt(title, service, location, brandTone, contentType);

    // Call OpenAI DALL-E 3 API
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        style: 'vivid',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[Image Generation] OpenAI API error:', error);
      throw new Error('Failed to generate image');
    }

    const data = await response.json();
    const imageUrl = data.data[0].url;

    console.log('[Image Generation] Image generated successfully');

    return NextResponse.json({
      success: true,
      imageUrl,
      prompt,
      title,
    });
  } catch (error: unknown) {
    console.error('[Image Generation] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image', details: String(error) },
      { status: 500 }
    );
  }
}

function createImagePrompt(title: string, service: string, location: string, brandTone: string, contentType: string): string {
  const basePrompt = `Create a professional, modern image for a ${contentType} about "${title}"`;
  
  const serviceContext = service ? `related to ${service} services` : '';
  const locationContext = location ? `targeting ${location}` : '';
  const toneContext = getToneDescription(brandTone);
  
  return `${basePrompt} ${serviceContext} ${locationContext}. ${toneContext}. The image should be suitable for a technology company website, clean and professional, with good visual hierarchy and modern design aesthetics. Avoid text overlays - focus on visual representation of the concept.`;
}

function getToneDescription(tone: string): string {
  const toneMap: Record<string, string> = {
    'professional': 'Use corporate colors, clean lines, and business imagery',
    'innovative': 'Use modern, tech-forward visuals with dynamic elements',
    'friendly': 'Use warm colors and approachable imagery',
    'technical': 'Use precise, detailed imagery with technology focus',
    'creative': 'Use artistic, visually striking elements',
  };
  
  return toneMap[tone.toLowerCase()] || 'Use professional, clean imagery';
}
