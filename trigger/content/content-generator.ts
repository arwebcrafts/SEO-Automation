import { task, logger } from "@trigger.dev/sdk";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ContentCombination {
  topic: {
    title: string;
    primaryKeywords: string[];
    secondaryKeywords: string[];
    contentType: "blog post" | "landing page";
    description: string;
    searchIntent: "informational" | "commercial" | "local";
  };
  location: string;
  service: string;
  brandTone: string;
  targetAudience: string;
  aboutSummary: string;
  generateImages: boolean;
  customPrompt?: string;
  scrapedContent?: string;
  imageStyle?: "vivid" | "natural" | "watercolor";
  includeYouTube?: boolean;
}

interface GeneratedContent {
  id: string;
  title: string;
  location: string;
  contentType: string;
  content: string;
  htmlContent: string;
  imageUrl?: string;
  youtubeVideo?: {
    videoId: string;
    title: string;
    thumbnail: string;
    embedUrl: string;
  };
  wordCount: number;
  keywords: string[];
  status: "completed" | "failed";
}

export const contentGeneratorTask = task({
  id: "content-generator",
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 30000,
  },
  run: async (payload: {
    combinations: ContentCombination[];
    userId: string;
    generateImages: boolean;
    singlePage?: boolean;
    imageStyle?: "vivid" | "natural" | "watercolor";
    includeYouTube?: boolean;
  }) => {
    const mode = payload.singlePage ? "Single Page" : "Bulk";
    logger.log(`Starting ${mode.toLowerCase()} content generation for ${payload.combinations.length} combination${payload.combinations.length === 1 ? '' : 's'}`);
    
    const results: GeneratedContent[] = [];
    
    // Process combinations in parallel for better performance (but limit concurrency)
    const concurrencyLimit = payload.singlePage ? 1 : 3; // Single page: sequential, Bulk: parallel with limit
    const chunks = [];
    
    for (let i = 0; i < payload.combinations.length; i += concurrencyLimit) {
      chunks.push(payload.combinations.slice(i, i + concurrencyLimit));
    }
    
    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (combination, index) => {
        const globalIndex = payload.combinations.indexOf(combination);
        
        // Apply payload-level settings to combination
        const enhancedCombination = {
          ...combination,
          imageStyle: combination.imageStyle || payload.imageStyle || "watercolor",
          includeYouTube: combination.includeYouTube ?? payload.includeYouTube ?? true,
        };
        
        logger.log(`Processing combination ${globalIndex + 1}/${payload.combinations.length}: ${combination.topic.title} for ${combination.location}`);
        
        try {
          // Generate content, image, and YouTube search in parallel
          const [content, imageUrl, youtubeVideo] = await Promise.all([
            generateContentForCombination(enhancedCombination),
            payload.generateImages ? generateImageForContent(enhancedCombination) : Promise.resolve(undefined),
            enhancedCombination.includeYouTube ? searchYouTubeVideo(combination.topic.title, combination.topic.primaryKeywords) : Promise.resolve(undefined)
          ]);
          
          // Convert content to proper HTML with featured image and YouTube embed
          const htmlContent = formatContentAsHTML(
            content, 
            combination.topic.title, 
            imageUrl, 
            youtubeVideo,
            combination.topic.primaryKeywords
          );
          
          const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
          
          const generatedContent: GeneratedContent = {
            id: `content_${Date.now()}_${globalIndex}`,
            title: combination.topic.title,
            location: combination.location,
            contentType: combination.topic.contentType,
            content: content,
            htmlContent: htmlContent,
            imageUrl: imageUrl,
            youtubeVideo: youtubeVideo,
            wordCount: wordCount,
            keywords: [...combination.topic.primaryKeywords, ...combination.topic.secondaryKeywords],
            status: "completed"
          };
          
          logger.log(`Successfully generated content for: ${combination.topic.title} (${combination.location}) - ${wordCount} words`);
          return generatedContent;
          
        } catch (error) {
          logger.error(`Failed to generate content for ${combination.topic.title} (${combination.location}):`, { error: String(error) });
          
          return {
            id: `content_${Date.now()}_${globalIndex}`,
            title: combination.topic.title,
            location: combination.location,
            contentType: combination.topic.contentType,
            content: "",
            htmlContent: "",
            wordCount: 0,
            keywords: [],
            status: "failed" as const
          };
        }
      });
      
      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }
    
    const completed = results.filter(r => r.status === "completed").length;
    const failed = results.filter(r => r.status === "failed").length;
    
    logger.log(`${mode} content generation completed. ${completed}/${results.length} successful, ${failed} failed`);
    
    return {
      success: true,
      results,
      summary: {
        total: results.length,
        completed,
        failed,
      }
    };
  },
});

async function generateContentForCombination(combination: ContentCombination): Promise<string> {
  const prompt = createContentPrompt(combination);
  const systemPrompt = createSystemPrompt(combination);
  
  // Debug logs for OpenAI prompts
  console.log("\n========== OPENAI CONTENT GENERATION DEBUG ==========");
  console.log("[OpenAI Content] Topic:", combination.topic.title);
  console.log("[OpenAI Content] Location:", combination.location);
  console.log("[OpenAI Content] Service:", combination.service);
  console.log("[OpenAI Content] Brand Tone:", combination.brandTone);
  console.log("[OpenAI Content] Target Audience:", combination.targetAudience);
  console.log("[OpenAI Content] Content Type:", combination.topic.contentType);
  console.log("[OpenAI Content] Primary Keywords:", combination.topic.primaryKeywords.join(", "));
  console.log("[OpenAI Content] Secondary Keywords:", combination.topic.secondaryKeywords.join(", "));
  console.log("\n[OpenAI Content] SYSTEM PROMPT:");
  console.log(systemPrompt);
  console.log("\n[OpenAI Content] USER PROMPT:");
  console.log(prompt);
  console.log("======================================================\n");
  
  logger.log(`[OpenAI Debug] Sending content prompt for: ${combination.topic.title}`, {
    systemPrompt: systemPrompt.substring(0, 200),
    userPrompt: prompt.substring(0, 500) + "...",
    model: "gpt-4o",
    temperature: 0.7,
    maxTokens: 4000
  });
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 4000,
  });

  if (!response.choices[0]?.message.content) {
    throw new Error("Failed to generate content");
  }
  
  console.log("[OpenAI Content] Response received, word count:", response.choices[0].message.content.split(/\s+/).length);

  return response.choices[0].message.content;
}

function createSystemPrompt(combination: ContentCombination): string {
  return `You are a world-class content writer who creates publication-ready articles. Your content reads like it was written by an expert human, not AI.

WRITING PRINCIPLES:
- Write in a ${combination.brandTone} tone for ${combination.targetAudience}
- Every sentence must provide value - no filler
- Be specific and concrete, never vague
- Use real examples, numbers, and actionable advice
- Write like you're explaining to a smart friend

STRUCTURE RULES:
- Start with a hook that immediately addresses the reader's problem or goal
- Use ## for main sections (H2) and ### for subsections (H3) - NEVER use #### 
- Keep paragraphs to 2-3 sentences maximum
- Use bullet points sparingly and only for actual lists
- Each section should flow naturally to the next

ABSOLUTELY FORBIDDEN:
- "In today's [world/landscape/era]..." or any variation
- "In this article, we will..." or similar meta-references  
- "It's important to note that..." or "It's worth mentioning..."
- "In conclusion..." or "To sum up..."
- Generic examples like "Consider a restaurant chain" - use specific, believable scenarios
- Overusing "leverage", "utilize", "crucial", "vital", "robust", "seamless"
- Numbered lists inside other numbered lists
- Headers with numbers (like "#### 1. Something") - just use the header text

KEYWORD INTEGRATION:
- Weave keywords naturally into the text
- Don't force keywords where they don't fit
- Vary keyword placement - some in headings, some in body text
- Never stuff keywords unnaturally`;
}

async function generateImageForContent(combination: ContentCombination): Promise<string> {
  const imageStyle = combination.imageStyle || "watercolor";
  const prompt = createImagePrompt(combination, imageStyle);
  
  // Debug logs for OpenAI image generation
  console.log("\n========== OPENAI IMAGE GENERATION DEBUG ==========");
  console.log("[OpenAI Image] Topic:", combination.topic.title);
  console.log("[OpenAI Image] Location:", combination.location);
  console.log("[OpenAI Image] Style:", imageStyle);
  console.log("[OpenAI Image] Model: dall-e-3");
  console.log("\n[OpenAI Image] IMAGE PROMPT:");
  console.log(prompt);
  console.log("====================================================\n");
  
  logger.log(`[OpenAI Debug] Sending image prompt for: ${combination.topic.title}`, {
    prompt: prompt.substring(0, 300) + "...",
    model: "dall-e-3",
    size: "1792x1024",
    style: imageStyle
  });
  
  // Use natural style for watercolor, vivid for others
  const dalleStyle = imageStyle === "watercolor" ? "natural" : "vivid";
  
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: prompt,
    n: 1,
    size: "1792x1024", // Wide format for featured images
    quality: "hd",
    style: dalleStyle,
  });

  if (!response.data?.[0]?.url) {
    throw new Error("Failed to generate image");
  }
  
  console.log("[OpenAI Image] Image generated successfully:", response.data[0].url.substring(0, 100) + "...");

  return response.data[0].url;
}

async function searchYouTubeVideo(title: string, keywords: string[]): Promise<{ videoId: string; title: string; thumbnail: string; embedUrl: string } | undefined> {
  const youtubeApiKey = process.env.YOUTUBE_API_KEY;
  
  if (!youtubeApiKey) {
    logger.log("[YouTube] No API key configured, skipping YouTube search");
    return undefined;
  }
  
  try {
    // Create search query from title and primary keywords
    const searchQuery = `${title} ${keywords.slice(0, 2).join(' ')}`.substring(0, 100);
    
    console.log("[YouTube] Searching for:", searchQuery);
    
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=1&` +
      `relevanceLanguage=en&videoEmbeddable=true&key=${youtubeApiKey}`
    );
    
    if (!response.ok) {
      logger.log("[YouTube] API request failed:", { status: response.status });
      return undefined;
    }
    
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const video = data.items[0];
      const videoId = video.id.videoId;
      
      console.log("[YouTube] Found video:", video.snippet.title);
      
      return {
        videoId: videoId,
        title: video.snippet.title,
        thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium?.url,
        embedUrl: `https://www.youtube.com/embed/${videoId}`
      };
    }
    
    logger.log("[YouTube] No videos found for query");
    return undefined;
    
  } catch (error) {
    logger.error("[YouTube] Search error:", { error: String(error) });
    return undefined;
  }
}

function formatContentAsHTML(
  content: string, 
  title: string, 
  imageUrl?: string, 
  youtubeVideo?: { videoId: string; title: string; thumbnail: string; embedUrl: string },
  keywords?: string[]
): string {
  // Start with the article wrapper
  let html = `<article class="seo-content-article">\n`;
  
  // Add featured image at the top if available
  if (imageUrl) {
    const altText = title.replace(/['"]/g, '');
    html += `
<!-- Featured Image -->
<figure class="featured-image">
  <img src="${imageUrl}" alt="${altText}" class="wp-post-image" loading="eager" />
</figure>

`;
  }
  
  // Process the content - convert markdown-style to HTML
  let processedContent = content;
  
  // Convert markdown headings to HTML
  processedContent = processedContent.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  processedContent = processedContent.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  processedContent = processedContent.replace(/^# (.+)$/gm, '<h2>$1</h2>'); // Convert H1 to H2 since title is H1
  
  // Convert bold and italic
  processedContent = processedContent.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  processedContent = processedContent.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  processedContent = processedContent.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Convert bullet points
  processedContent = processedContent.replace(/^[-•] (.+)$/gm, '<li>$1</li>');
  processedContent = processedContent.replace(/(<li>.*<\/li>\n?)+/g, '<ul>\n$&</ul>\n');
  
  // Convert numbered lists
  processedContent = processedContent.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  
  // Wrap paragraphs
  const lines = processedContent.split('\n');
  let inList = false;
  const processedLines: string[] = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine === '') {
      processedLines.push('');
      continue;
    }
    
    // Skip if already wrapped in HTML tags
    if (trimmedLine.startsWith('<h') || trimmedLine.startsWith('<ul') || 
        trimmedLine.startsWith('<ol') || trimmedLine.startsWith('<li') ||
        trimmedLine.startsWith('</') || trimmedLine.startsWith('<figure') ||
        trimmedLine.startsWith('<div') || trimmedLine.startsWith('<!--')) {
      processedLines.push(trimmedLine);
      continue;
    }
    
    // Wrap plain text in paragraph tags
    processedLines.push(`<p>${trimmedLine}</p>`);
  }
  
  html += processedLines.join('\n');
  
  // Add YouTube video embed at the end if available
  if (youtubeVideo) {
    html += `

<!-- Related Video -->
<div class="related-video-section">
  <h3>Related Video</h3>
  <div class="video-embed-container" style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%;">
    <iframe 
      src="${youtubeVideo.embedUrl}?rel=0" 
      title="${youtubeVideo.title.replace(/['"]/g, '')}"
      frameborder="0" 
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
      allowfullscreen
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"
      loading="lazy">
    </iframe>
  </div>
  <p class="video-caption"><em>Watch: ${youtubeVideo.title}</em></p>
</div>
`;
  }
  
  // Add keywords as tags at the bottom
  if (keywords && keywords.length > 0) {
    html += `

<!-- SEO Keywords -->
<div class="post-tags" style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #eee;">
  <strong>Topics:</strong> ${keywords.slice(0, 5).map(k => `<span class="tag">${k}</span>`).join(', ')}
</div>
`;
  }
  
  // Add placeholder for WordPress uploaded image at the end
  // The WordPress plugin will replace {{WORDPRESS_IMAGE_URL}} with the actual uploaded image URL
  const altText = title.replace(/['"]/g, '');
  html += `

<!-- WordPress Featured Image (will be replaced by plugin with permanent URL) -->
<div class="wordpress-featured-image" style="margin-top: 2rem; text-align: center;">
  <figure style="margin: 0;">
    <img src="{{WORDPRESS_IMAGE_URL}}" alt="${altText}" style="max-width: 100%; height: auto; border-radius: 8px;" />
    <figcaption style="font-size: 0.875rem; color: #666; margin-top: 0.5rem;"><em>Featured: ${altText}</em></figcaption>
  </figure>
</div>
`;
  
  html += `\n</article>`;
  
  return html;
}

function createContentPrompt(combination: ContentCombination): string {
  // Build location context - only include if location is provided
  const locationContext = combination.location 
    ? `for businesses and readers in ${combination.location}` 
    : '';
  const locationRequirement = combination.location 
    ? `- Mention ${combination.location} naturally 2-3 times throughout the content
   - Include local context and relevance where appropriate` 
    : '- Keep content general and applicable to a broad audience';

  // Build scraped content reference section if available
  const scrapedContentSection = combination.scrapedContent 
    ? `\n\nReference Content from Website (use for style, terminology, and context - do not copy):\n${combination.scrapedContent.substring(0, 2000)}\n` 
    : '';

  // Build custom prompt section if available
  const customPromptSection = combination.customPrompt 
    ? `\n\nSPECIAL INSTRUCTIONS (must follow):\n${combination.customPrompt}\n` 
    : '';

  const contentTypeInstructions = combination.topic.contentType === "landing page" 
    ? `Structure as a landing page:
   - Strong headline and subheadline
   - Clear value proposition
   - Benefits-focused sections
   - Social proof / credibility elements
   - Multiple CTAs throughout
   - FAQ section at the end`
    : `Structure as a blog post:
   - Hook the reader in the first paragraph
   - Use ## for main sections (H2)
   - Use ### for subsections (H3)
   - Include practical examples and tips
   - Add a "Key Takeaways" section
   - End with actionable next steps`;

  return `Write a comprehensive, SEO-optimized ${combination.topic.contentType} about:

**Topic:** ${combination.topic.title}
${locationContext ? `**Location Focus:** ${locationContext}` : ''}

**CONTEXT:**
- Service/Industry: ${combination.service}
- Company Background: ${combination.aboutSummary || 'Technology and digital services company'}
- Target Audience: ${combination.targetAudience}
- Search Intent: ${combination.topic.searchIntent}
- Topic Description: ${combination.topic.description}
${scrapedContentSection}
**PRIMARY KEYWORDS (use these 3-4 times each, naturally):**
${combination.topic.primaryKeywords.map(k => `- "${k}"`).join('\n')}

**SECONDARY KEYWORDS (use these 1-2 times each where relevant):**
${combination.topic.secondaryKeywords.map(k => `- "${k}"`).join('\n')}

**CONTENT REQUIREMENTS:**
1. Length: 1200-1800 words (comprehensive coverage)
2. ${contentTypeInstructions}
3. ${locationRequirement}
4. Include:
   - An attention-grabbing introduction (no generic openings)
   - Practical, actionable advice
   - Relevant statistics or data points (you can cite general industry knowledge)
   - Real-world examples or scenarios
   - A clear call-to-action at the end
5. Tone: ${combination.brandTone}
6. Format with proper markdown:
   - ## for H2 headings
   - ### for H3 headings
   - **bold** for emphasis
   - Bullet points for lists
   - Short paragraphs (2-4 sentences)
${customPromptSection}
**CRITICAL RULES - FOLLOW EXACTLY:**
1. First sentence must hook the reader with a specific benefit, question, or bold statement
2. NEVER start with "In today's...", "In the rapidly evolving...", or any variation
3. NEVER use #### headers - only ## and ### are allowed
4. NEVER put numbers before headers like "#### 1. Something" - just use "### Something"
5. Use specific, believable examples - NOT generic ones like "a restaurant chain"
6. Include at least one specific statistic or data point (cite industry knowledge)
7. Every paragraph must provide actionable value
8. End with a specific, compelling call-to-action (not generic "contact us")

Begin writing the ${combination.topic.contentType} now - remember, start with an engaging hook, not a generic intro:`;
}

function createImagePrompt(combination: ContentCombination, imageStyle: string = "watercolor"): string {
  const topic = combination.topic.title;
  const service = combination.service || 'technology';
  
  // Style-specific prompts
  const stylePrompts: Record<string, string> = {
    'watercolor': `Create a beautiful watercolor illustration representing "${topic}". 
      Style: Soft, flowing watercolor painting with gentle color transitions, artistic brush strokes, and dreamy aesthetics.
      Colors: Use a harmonious palette with soft blues, purples, teals, and warm accents.
      Elements: Abstract shapes flowing into recognizable forms related to ${service}.
      Mood: Professional yet artistic, modern and sophisticated.
      Composition: Clean with plenty of white space, suitable for a blog header.
      NO text, NO words, NO letters. Pure visual art only.`,
      
    'vivid': `Create a vibrant, modern digital illustration for "${topic}".
      Style: Bold colors, clean geometric shapes, contemporary digital art aesthetic.
      Elements: Visual metaphors representing ${service} and technology.
      Mood: Energetic, innovative, forward-thinking.
      Composition: Dynamic layout with strong visual hierarchy.
      NO text, NO words, NO letters.`,
      
    'natural': `Create a professional photograph-style image for "${topic}".
      Style: Realistic, high-quality, like a premium stock photo.
      Elements: Modern workspace, technology, business professionals, or relevant objects.
      Mood: Trustworthy, authentic, professional.
      Lighting: Natural, soft lighting with depth.
      NO text, NO words, NO letters.`
  };
  
  const selectedStyle = stylePrompts[imageStyle] || stylePrompts['watercolor'];
  
  // Add brand tone context
  const toneContext = getToneDescription(combination.brandTone);
  
  // Add location context if available
  const locationHint = combination.location 
    ? `Subtle visual elements that might suggest ${combination.location} or its characteristics.` 
    : '';
  
  return `${selectedStyle}
${toneContext}
${locationHint}

Technical requirements:
- Horizontal/landscape orientation (16:9 aspect ratio ideal)
- High resolution, crisp details
- Suitable as a featured image for a professional blog/website
- ABSOLUTELY NO TEXT OR WORDS IN THE IMAGE`;
}

function getToneDescription(tone: string): string {
  const toneMap: Record<string, string> = {
    'professional': 'Color palette: Navy blue, white, silver accents. Convey trust and expertise.',
    'innovative': 'Color palette: Electric blue, purple, cyan gradients. Convey cutting-edge technology.',
    'friendly': 'Color palette: Warm oranges, soft greens, friendly yellows. Convey approachability.',
    'technical': 'Color palette: Dark blues, greens, circuit-board patterns. Convey precision and expertise.',
    'creative': 'Color palette: Bold magentas, teals, unexpected color combinations. Convey originality.',
    'corporate': 'Color palette: Classic blues, grays, gold accents. Convey stability and professionalism.',
  };
  
  return toneMap[tone.toLowerCase()] || 'Color palette: Professional blues and whites. Convey trustworthiness.';
}
