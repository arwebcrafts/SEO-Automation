import { task, metadata, runs } from "@trigger.dev/sdk";
import OpenAI from "openai";

interface ContentAnalysisPayload {
  baseUrl: string;
  targetAudience?: string;
  extractionRunId?: string; // Optional: if provided, wait for extraction to complete
  extractedPages?: Array<{
    url: string;
    type: string;
    title?: string;
    content: string;
    wordCount: number;
  }>;
  analysisId?: string;
  userId?: string;
}

interface PageAnalysis {
  url: string;
  type: string;
  title?: string;
  content: string;
  wordCount: number;
  mainTopic?: string;
  summary?: string;
  keywords?: string[];
  // New fields for writing style analysis
  writingStyle: {
    tone: string;
    perspective: "First Person" | "Second Person" | "Third Person";
    formality: "Formal" | "Informal" | "Semi-Formal";
    sentenceStructure: string;
    averageSentenceLength: number;
    readabilityLevel: string;
    voice: "Active" | "Passive" | "Mixed";
  };
  contentStructure: {
    hasHeadings: boolean;
    hasSubheadings: boolean;
    usesLists: boolean;
    hasCallToAction: boolean;
    paragraphCount: number;
    averageParagraphLength: number;
  };
  seoElements: {
    metaDescription?: string;
    headingStructure: string[];
    internalLinks: string[];
    externalLinks: string[];
  };
  brandVoice: {
    keyPhrases: string[];
    terminology: string[];
    valuePropositions: string[];
    differentiators: string[];
  };
}

interface ContentAnalysisOutput {
  baseUrl: string;
  contentContext: {
    dominantKeywords: Array<{
      term: string;
      density: "High" | "Medium" | "Low";
      pages: number;
    }>;
    contentGaps: string[];
    audiencePersona: string;
    tone: string;
    // New aggregated insights
    overallWritingStyle: {
      dominantTone: string;
      averageFormality: string;
      commonPerspective: string;
      brandVoiceSummary: string;
    };
    contentPatterns: {
      preferredContentTypes: string[];
      averagePostLength: string;
      commonStructures: string[];
      ctaPatterns: string[];
    };
  };
  aiSuggestions: Array<{
    type: "Blog Post" | "Whitepaper" | "Case Study" | "Guide" | "Infographic";
    title: string;
    reason: string;
    targetKeywords: string[];
    relatedServiceUrl?: string;
    // New fields for better content generation
    contentOutline: string[];
    suggestedTone: string;
    targetLength: number;
    keyMessagePoints: string[];
  }>;
  pages: PageAnalysis[];
  extractionData?: {
    baseUrl: string;
    pagesProcessed: number;
    extractedPages: Array<{
      url: string;
      type: "service" | "blog" | "product" | "other";
      title?: string;
      content: string;
      wordCount: number;
      mainTopic?: string;
      summary?: string;
    }>;
    aggregatedContent: {
      services: string[];
      blogs: string[];
      products: string[];
    };
    totalWordCount: number;
  };
}

// Helper to extract top keywords from text using frequency analysis
function extractTopKeywords(text: string, limit: number = 5): string[] {
  if (!text) return [];
  
  // Extract words (4+ characters, alphanumeric)
  const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  
  // Common stop words to exclude
  const stopWords = new Set([
    'that', 'with', 'have', 'this', 'will', 'your', 'from', 'they', 'know',
    'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come',
    'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take',
    'than', 'them', 'well', 'were', 'been', 'call', 'away', 'back', 'come',
    'could', 'does', 'dont', 'down', 'even', 'every', 'find', 'first', 'give',
    'going', 'happened', 'hear', 'here', 'keep', 'last', 'leave', 'made',
    'many', 'might', 'more', 'most', 'never', 'only', 'other', 'see', 'such',
    'tell', 'their', 'there', 'these', 'think', 'those', 'under', 'upon',
    'used', 'want', 'way', 'were', 'what', 'where', 'which', 'while', 'who',
    'would', 'write', 'year', 'you', 'your', 'about', 'above', 'after',
    'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t',
    'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below',
    'between', 'both', 'but', 'by', 'can\'t', 'cannot', 'could', 'couldn\'t',
    'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down',
    'during', 'each', 'few', 'for', 'from', 'further', 'had', 'hadn\'t',
    'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll',
    'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself',
    'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if',
    'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s',
    'me', 'more', 'most', 'mustn\'t', 'my', 'myself', 'no', 'nor', 'not',
    'of', 'off', 'on', 'once', 'or', 'other', 'ought', 'our', 'ours',
    'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d',
    'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such', 'than',
    'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves',
    'then', 'there', 'there\'s', 'these', 'they', 'they\'d', 'they\'ll',
    'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too', 'under',
    'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll',
    'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s', 'when',
    'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s',
    'whom', 'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t', 'you',
    'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours', 'yourself',
    'yourselves'
  ]);
  
  // Filter out stop words and count frequency
  const wordFreq: { [key: string]: number } = {};
  words.forEach(word => {
    if (!stopWords.has(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });
  
  // Sort by frequency and return top results
  return Object.entries(wordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([word]) => word);
}

// Helper to analyze writing style
function analyzeWritingStyle(content: string): PageAnalysis['writingStyle'] {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const averageSentenceLength = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length;
  
  // Determine perspective
  const firstPerson = (content.match(/\b(I|we|my|our|us)\b/gi) || []).length;
  const secondPerson = (content.match(/\b(you|your)\b/gi) || []).length;
  const thirdPerson = (content.match(/\b(he|she|it|they|them|his|her|its|their)\b/gi) || []).length;
  
  let perspective: "First Person" | "Second Person" | "Third Person" = "Third Person";
  if (firstPerson > secondPerson && firstPerson > thirdPerson) perspective = "First Person";
  else if (secondPerson > firstPerson && secondPerson > thirdPerson) perspective = "Second Person";
  
  // Determine formality
  const formalWords = /\b(furthermore|consequently|nevertheless|nonetheless|therefore|thus|hence|however|moreover|additionally)\b/gi;
  const informalWords = /\b(gonna|wanna|kinda|sorta|yeah|nah|hey|hi|bye|awesome|cool|stuff)\b/gi;
  
  let formality: "Formal" | "Informal" | "Semi-Formal" = "Semi-Formal";
  if ((content.match(formalWords) || []).length > 2) formality = "Formal";
  else if ((content.match(informalWords) || []).length > 2) formality = "Informal";
  
  // Determine voice (active vs passive)
  const passiveIndicators = /\b(is|are|was|were|be|been|being)\s+\w+ed\b/gi;
  const passiveCount = (content.match(passiveIndicators) || []).length;
  const voice: "Active" | "Passive" | "Mixed" = passiveCount > sentences.length * 0.3 ? "Passive" : "Active";
  
  // Determine readability based on sentence length
  let readabilityLevel = "Medium";
  if (averageSentenceLength < 15) readabilityLevel = "Easy";
  else if (averageSentenceLength > 25) readabilityLevel = "Difficult";
  
  return {
    tone: "Professional", // This will be determined by AI
    perspective,
    formality,
    sentenceStructure: sentences.length > 10 ? "Complex" : "Simple",
    averageSentenceLength: Math.round(averageSentenceLength),
    readabilityLevel,
    voice
  };
}

// Helper to analyze content structure
function analyzeContentStructure(content: string): PageAnalysis['contentStructure'] {
  const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
  const hasHeadings = /<h[1-6]|^#{1,6}\s/m.test(content);
  const hasSubheadings = /<h[2-6]|^#{2,6}\s/m.test(content);
  const usesLists = /<ul|<ol|^\s*[-*+]\s/m.test(content);
  const hasCallToAction = /\b(contact|call|email|reach out|get in touch|learn more|click here|sign up)\b/gi.test(content);
  
  const averageParagraphLength = paragraphs.reduce((sum, p) => sum + p.split(' ').length, 0) / paragraphs.length;
  
  return {
    hasHeadings,
    hasSubheadings,
    usesLists,
    hasCallToAction,
    paragraphCount: paragraphs.length,
    averageParagraphLength: Math.round(averageParagraphLength)
  };
}

// Helper to extract SEO elements
function extractSEOElements(content: string, url: string): PageAnalysis['seoElements'] {
  const headings = content.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/g) || [];
  const internalLinks = (content.match(/href="\/[^"]*"/g) || []).map(link => link.slice(6, -1));
  const externalLinks = (content.match(/href="https?:\/\/[^"]*"/g) || []).map(link => link.slice(6, -1));
  
  return {
    headingStructure: headings,
    internalLinks,
    externalLinks
  };
}

// Helper to analyze brand voice
function analyzeBrandVoice(content: string): PageAnalysis['brandVoice'] {
  // Extract key phrases that appear frequently
  const phrases = content.match(/\b([A-Z][a-z]+\s+[A-Z][a-z]+|[A-Z]{2,})\b/g) || [];
  const keyPhrases = [...new Set(phrases)].slice(0, 10);
  
  // Extract technical terms
  const technicalTerms = content.match(/\b\w+(?:\s+\w+)?\s+(?:solution|service|technology|platform|system|analytics|intelligence)\b/gi) || [];
  const terminology = [...new Set(technicalTerms)].slice(0, 10);
  
  // Extract value propositions
  const valueProps = content.match(/\b(improve|enhance|optimize|transform|streamline|increase|reduce|save|boost|maximize)\s+\w+/gi) || [];
  const valuePropositions = [...new Set(valueProps)].slice(0, 5);
  
  // Extract differentiators
  const differentiators = content.match(/\b(uniquely|exclusively|proprietary|patented|certified|award-winning|industry-leading)\b/gi) || [];
  
  return {
    keyPhrases,
    terminology: [...new Set(terminology)],
    valuePropositions: [...new Set(valuePropositions)],
    differentiators: [...new Set(differentiators)]
  };
}

// Compress content to reduce tokens while preserving structure
function compressContent(pages: any[]): string {
  return pages.map((page, index) => {
    const content = page.content || '';
    const truncated = content.length > 500 ? content.substring(0, 500) + "..." : content;
    
    return `
Page ${index + 1}: ${page.title || 'Untitled'}
URL: ${page.url}
Type: ${page.type}
Words: ${page.wordCount || 0}
Content: ${truncated}
---
    `.trim();
  }).join('\n');
}

export const contentAnalyzerTask = task({
  id: "content-analyzer",
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 60000,
  },
  run: async (payload: ContentAnalysisPayload): Promise<ContentAnalysisOutput> => {
    const { baseUrl, targetAudience = "General audience", extractedPages = [], extractionRunId } = payload;

    try {
      metadata.set("status", {
        progress: 0,
        label: "Starting AI content analysis...",
      } as any);

      // If extractionRunId is provided, wait for extraction to complete
      let finalExtractedPages = extractedPages;
      if (extractionRunId && (!extractedPages || extractedPages.length === 0)) {
        metadata.set("status", {
          progress: 5,
          label: "Waiting for content extraction to complete...",
        } as any);

        let retries = 0;
        const maxRetries = 60; // Wait up to 2 minutes

        while (retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000));

          try {
            const extractionRun = await runs.retrieve(extractionRunId as string);
            if (extractionRun.status === "COMPLETED") {
              const extractionOutput = extractionRun.output as any;
              if (extractionOutput?.extractedPages) {
                finalExtractedPages = extractionOutput.extractedPages;
                break;
              }
            } else if (extractionRun.status === "FAILED" || extractionRun.status === "CANCELED") {
              throw new Error(`Extraction failed with status: ${extractionRun.status}`);
            }
          } catch (error) {
            console.error("Error checking extraction status:", error);
          }

          retries++;
        }

        if (!finalExtractedPages || finalExtractedPages.length === 0) {
          throw new Error("Extraction timed out or failed");
        }
      }

      // If no extracted pages provided, return mock data for testing
      if (!finalExtractedPages || finalExtractedPages.length === 0) {
        metadata.set("status", {
          progress: 100,
          label: "No pages provided, returning mock data",
        } as any);

        return {
          baseUrl,
          contentContext: {
            dominantKeywords: [
              { term: "AI Automation", density: "High", pages: 12 },
              { term: "Healthcare Data", density: "Medium", pages: 5 },
              { term: "Computer Vision", density: "Medium", pages: 4 },
            ],
            contentGaps: [
              "No case studies mentioned for 'Cybersecurity' service.",
              "Lack of 'Implementation Guide' style content for Power BI.",
              "Missing comparison articles (e.g., 'Custom CRM vs Salesforce').",
            ],
            audiencePersona: "Technical Decision Makers & Healthcare Administrators",
            tone: "Professional, Technical, Authority-focused",
            overallWritingStyle: {
              dominantTone: "Professional",
              averageFormality: "Formal",
              commonPerspective: "Third Person",
              brandVoiceSummary: "Technical expertise with focus on solutions"
            },
            contentPatterns: {
              preferredContentTypes: ["Service Pages", "Blog Posts"],
              averagePostLength: "500-800 words",
              commonStructures: ["Introduction", "Problem", "Solution", "CTA"],
              ctaPatterns: ["Contact Us", "Learn More"]
            }
          },
          aiSuggestions: [
            {
              type: "Blog Post",
              title: "5 Risks of Ignoring AI Cybersecurity in Supply Chains",
              reason: "You have a Supply Chain service page but no blog content addressing its security risks.",
              targetKeywords: ["AI Cybersecurity", "Supply Chain Risk", "DataTech Security"],
              contentOutline: ["Introduction", "Risk Analysis", "Case Studies", "Solutions", "Conclusion"],
              suggestedTone: "Professional",
              targetLength: 800,
              keyMessagePoints: ["Security importance", "Risk mitigation", "Expert solutions"]
            },
          ],
          pages: [],
        };
      }

      // Analyze each page in detail
      metadata.set("status", {
        progress: 20,
        label: "Analyzing individual pages for writing style and structure...",
      } as any);

      const analyzedPages: PageAnalysis[] = finalExtractedPages.map(page => ({
        url: page.url,
        type: page.type,
        title: page.title,
        content: page.content,
        wordCount: page.wordCount,
        mainTopic: page.title,
        summary: page.content.substring(0, 200),
        keywords: extractTopKeywords(page.content, 5),
        writingStyle: analyzeWritingStyle(page.content),
        contentStructure: analyzeContentStructure(page.content),
        seoElements: extractSEOElements(page.content, page.url),
        brandVoice: analyzeBrandVoice(page.content)
      }));

      // Compress content for AI analysis
      metadata.set("status", {
        progress: 40,
        label: "Analyzing content patterns with AI...",
      } as any);

      const compressedContext = compressContent(finalExtractedPages);

      // Separate service pages and blog pages for gap analysis
      const servicePages = finalExtractedPages.filter(p => p.type === 'service');
      const blogPages = finalExtractedPages.filter(p => p.type === 'blog');

      const serviceSummary = servicePages.length > 0 
        ? compressContent(servicePages.slice(0, 10)) // Limit to 10 service pages
        : "No service pages found";

      const blogSummary = blogPages.length > 0
        ? compressContent(blogPages.slice(0, 10)) // Limit to 10 blog posts
        : "No blog posts found";

      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Enhanced prompt for better analysis
      const prompt = `
You are an expert SEO Content Strategist and Brand Analyst. Analyze this website content in detail.

TARGET AUDIENCE: ${targetAudience}

SERVICE PAGES (What they sell):
${serviceSummary}

BLOG POSTS (What they write about):
${blogSummary}

DETAILED ANALYSIS REQUIREMENTS:
1. Extract the top 5 semantic keywords (excluding brand names).
2. Identify the "Audience Persona" based on tone, language, and complexity.
3. Find the "Content Gap": What services they offer but don't write about.
4. Analyze the overall writing style and brand voice across all content.
5. Identify content patterns (preferred structures, average length, CTAs).
6. Suggest 5 content pieces that match their established writing style and brand voice.

For each suggestion, include:
- A title that matches their naming conventions
- Detailed content outline following their structure
- Appropriate tone based on their brand voice
- Target word count based on their averages
- Key message points aligned with their value propositions

Return ONLY valid JSON in this exact format:
{
  "dominantKeywords": [
    {"term": "AI Automation", "density": "High", "pages": 12},
    {"term": "Healthcare Data", "density": "Medium", "pages": 5}
  ],
  "contentGaps": [
    "No case studies mentioned for 'Cybersecurity' service.",
    "Lack of 'Implementation Guide' style content for Power BI."
  ],
  "audiencePersona": "Technical Decision Makers & Healthcare Administrators",
  "tone": "Professional, Technical, Authority-focused",
  "overallWritingStyle": {
    "dominantTone": "Professional and authoritative",
    "averageFormality": "Formal",
    "commonPerspective": "Third person",
    "brandVoiceSummary": "Expert-focused with emphasis on practical solutions"
  },
  "contentPatterns": {
    "preferredContentTypes": ["Service descriptions", "Technical blog posts"],
    "averagePostLength": "600-1000 words",
    "commonStructures": ["Problem-solution framework", "Technical explanations"],
    "ctaPatterns": ["Contact for consultation", "Learn more about services"]
  },
  "aiSuggestions": [
    {
      "type": "Blog Post",
      "title": "Implementing AI Automation: A Technical Guide",
      "reason": "Matches their technical expertise and problem-solution format",
      "targetKeywords": ["AI Automation", "Implementation Guide", "Technical Solutions"],
      "contentOutline": ["Introduction to the challenge", "Technical requirements", "Step-by-step implementation", "Case study examples", "Best practices", "Conclusion with CTA"],
      "suggestedTone": "Professional and educational",
      "targetLength": 800,
      "keyMessagePoints": ["Technical expertise", "Practical solutions", "Proven results"]
    }
  ]
}
`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert SEO Content Strategist and Brand Analyst. Always respond with valid JSON only, no markdown formatting.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: "json_object" },
      });

      metadata.set("status", {
        progress: 80,
        label: "Processing AI analysis results...",
      } as any);

      const aiResponse = completion.choices[0]?.message?.content;
      
      if (!aiResponse) {
        throw new Error("No response from OpenAI");
      }

      const analysisResult = JSON.parse(aiResponse);

      metadata.set("status", {
        progress: 100,
        label: "AI content analysis complete!",
      } as any);

      console.log(`[Content Analyzer] Returning ${analyzedPages.length} analyzed pages`);

      return {
        baseUrl,
        contentContext: {
          dominantKeywords: analysisResult.dominantKeywords || [],
          contentGaps: analysisResult.contentGaps || [],
          audiencePersona: analysisResult.audiencePersona || "Unknown",
          tone: analysisResult.tone || "Unknown",
          overallWritingStyle: analysisResult.overallWritingStyle || {
            dominantTone: "Professional",
            averageFormality: "Semi-Formal",
            commonPerspective: "Third Person",
            brandVoiceSummary: "Technical and solution-focused"
          },
          contentPatterns: analysisResult.contentPatterns || {
            preferredContentTypes: ["Blog Posts", "Service Pages"],
            averagePostLength: "500-800 words",
            commonStructures: ["Introduction", "Body", "Conclusion"],
            ctaPatterns: ["Contact Us", "Learn More"]
          }
        },
        aiSuggestions: (analysisResult.aiSuggestions || []).map((suggestion: any) => ({
          ...suggestion,
          contentOutline: suggestion.contentOutline || [],
          suggestedTone: suggestion.suggestedTone || "Professional",
          targetLength: suggestion.targetLength || 600,
          keyMessagePoints: suggestion.keyMessagePoints || []
        })),
        pages: analyzedPages,
        extractionData: {
          baseUrl,
          pagesProcessed: finalExtractedPages.length,
          extractedPages: finalExtractedPages.map(page => ({
            ...page,
            type: page.type as "service" | "blog" | "product" | "other",
            mainTopic: page.title,
            summary: page.content.substring(0, 200),
          })),
          aggregatedContent: {
            services: finalExtractedPages.filter(p => p.type === 'service').map(p => p.title || p.url),
            blogs: finalExtractedPages.filter(p => p.type === 'blog').map(p => p.title || p.url),
            products: finalExtractedPages.filter(p => p.type === 'product').map(p => p.title || p.url),
          },
          totalWordCount: finalExtractedPages.reduce((sum, page) => sum + (page.wordCount || 0), 0),
        },
      };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      console.error("Content analyzer fatal error:", error);
      metadata.set("status", {
        progress: 0,
        label: `Fatal error: ${errorMsg}`,
        error: errorMsg,
      } as any);
      throw error;
    }
  },
});
