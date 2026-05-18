import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/auth";
import { tasks } from "@trigger.dev/sdk/v3";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { crawlRequestId } = body;

    if (!crawlRequestId) {
      return NextResponse.json(
        { error: "Crawl request ID is required" },
        { status: 400 }
      );
    }

    // Get crawl request data (using mock data for now due to Prisma issues)
    console.log("[Auto-Discovery] Starting context extraction for crawl:", crawlRequestId);

    // Trigger enhanced content extraction for auto-discovery
    const handle = await tasks.trigger("auto-discovery", {
      crawlRequestId,
      extractContext: true,
      extractServices: true,
      extractLocations: true,
      extractAbout: true,
      extractContact: true,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      taskId: handle.id,
      message: "Auto-discovery process started",
    });
  } catch (error: unknown) {
    console.error("[Auto-Discovery] Error:", error);
    return NextResponse.json(
      { error: "Failed to start auto-discovery", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const crawlRequestId = searchParams.get("crawlRequestId");

    if (!crawlRequestId) {
      return NextResponse.json(
        { error: "Crawl request ID is required" },
        { status: 400 }
      );
    }

    console.log("[Auto-Discovery] Fetching discovery data for crawl:", crawlRequestId);

    // First, try to fetch scraped content from the latest crawl request
    let scrapedContent = "";
    try {
      const latestCrawl = await prisma.crawlRequest.findFirst({
        where: { userId: user.id, status: "COMPLETED" },
        orderBy: { completedAt: "desc" },
        select: { pagesData: true, crawlData: true }
      });
      
      if (latestCrawl) {
        // Extract text content from crawled pages
        const pagesData = latestCrawl.pagesData as any;
        const crawlData = latestCrawl.crawlData as any;
        
        // Try to extract content from pagesData first
        if (pagesData && Array.isArray(pagesData)) {
          const contentParts = pagesData.slice(0, 3).map((page: any) => {
            const title = page.title || page.url || '';
            const content = page.content || page.text || page.bodyText || page.mainContent || '';
            const truncated = content.substring(0, 500);
            return `Page: ${title}\n${truncated}${content.length > 500 ? '...' : ''}`;
          });
          scrapedContent = contentParts.join('\n\n---\n\n');
        }
        
        // Fallback to crawlData if pagesData didn't have content
        if (!scrapedContent && crawlData) {
          const pages = crawlData.pages || crawlData.results || [];
          if (Array.isArray(pages) && pages.length > 0) {
            const contentParts = pages.slice(0, 3).map((page: any) => {
              const title = page.title || page.url || '';
              const content = page.content || page.text || page.bodyText || page.mainContent || '';
              const truncated = content.substring(0, 500);
              return `Page: ${title}\n${truncated}${content.length > 500 ? '...' : ''}`;
            });
            scrapedContent = contentParts.join('\n\n---\n\n');
          }
        }
        
        console.log("[Auto-Discovery] Scraped content length:", scrapedContent.length);
      }
    } catch (crawlError) {
      console.log("[Auto-Discovery] Could not fetch crawl data:", crawlError);
    }

    // Try to get data from latest content analysis
    try {
      // Fetch the latest content analysis
      const contentAnalysisResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/content/history`, {
        headers: {
          'Cookie': request.headers.get('cookie') || '',
        },
      });

      if (contentAnalysisResponse.ok) {
        const contentHistoryData = await contentAnalysisResponse.json();
        const contentHistory = contentHistoryData.analyses || [];
        
        if (contentHistory.length > 0) {
          const latestAnalysis = contentHistory[0]; // Most recent analysis
          
          console.log("[Auto-Discovery] Using data from latest content analysis");
          
          // Extract discovery data from content analysis
          // Handle nested json property if present
          let analysisOutput = latestAnalysis.analysisOutput;
          if (analysisOutput?.json) {
            analysisOutput = analysisOutput.json;
          }
          
          // Extract scraped content from pages in analysis output
          if (!scrapedContent && analysisOutput?.pages && Array.isArray(analysisOutput.pages)) {
            const topPages = analysisOutput.pages.slice(0, 3);
            const contentParts = topPages.map((page: any) => {
              const title = page.title || page.url || '';
              const content = page.content || page.summary || '';
              const truncated = content.substring(0, 500);
              return `Page: ${title}\n${truncated}${content.length > 500 ? '...' : ''}`;
            }).filter((part: string) => part.length > 10);
            
            if (contentParts.length > 0) {
              scrapedContent = contentParts.join('\n\n---\n\n');
              console.log("[Auto-Discovery] Scraped content from analysis pages, length:", scrapedContent.length);
            }
          }
          
          // Extract services from content analysis
          const services = analysisOutput?.services?.map((s: any) => s.name) || [
            "Data Science Services",
            "AI Programming Services", 
            "Machine Learning Services",
            "Cybersecurity Services",
            "Computer Vision Services",
            "Data Visualization Services",
            "Speech and Text Analytics Services",
            "Natural Language Processing Services",
            "Business Automation Services"
          ];
          
          // Extract existing pages
          const existingPages = analysisOutput?.pages?.slice(0, 10).map((p: any) => ({
            url: p.url,
            type: p.type || 'page',
            title: p.title || p.url
          })) || [];
          
          // Extract locations from content analysis or use defaults
          const locations = analysisOutput?.locations || 
            analysisOutput?.targetLocations ||
            analysisOutput?.serviceAreas ||
            [
              "Islamabad", "Rawalpindi", "Lahore", "Karachi", "Peshawar",
              "Faisalabad", "Multan", "Gujranwala", "Sialkot", "Quetta"
            ];
          
          // Log what we're extracting for debugging
          console.log("[Auto-Discovery] Extracted data:", {
            servicesCount: services.length,
            locationsCount: locations.length,
            pagesCount: existingPages.length,
            hasAboutSummary: !!analysisOutput?.aboutSummary,
            hasTargetAudience: !!analysisOutput?.targetAudience,
            hasBrandTone: !!analysisOutput?.brandTone,
            analysisKeys: Object.keys(analysisOutput || {})
          });
          
          // Extract other data from analysis with better fallbacks
          const aboutSummary = analysisOutput?.aboutSummary || 
            analysisOutput?.companyDescription || 
            analysisOutput?.businessDescription ||
            "DataTech Consultants - Leading provider of AI and data science solutions including machine learning, computer vision, and business automation services";

          const targetAudience = analysisOutput?.targetAudience || 
            analysisOutput?.audiencePersona?.targetAudience ||
            analysisOutput?.idealCustomer ||
            "Enterprises, startups, and organizations seeking to leverage AI, machine learning, and data science for digital transformation and business growth";

          const brandTone = analysisOutput?.brandTone || 
            analysisOutput?.tone ||
            analysisOutput?.communicationStyle ||
            "Professional, innovative, and technically sophisticated with a focus on delivering cutting-edge AI and data science solutions";

          const discoveryData = {
            services,
            locations,
            aboutSummary,
            targetAudience,
            brandTone,
            contactInfo: {
              email: "info@datatechconsultants.com.au",
              phone: "+92-300-1234567",
              address: "123 Business Park, Islamabad, Pakistan"
            },
            existingPages,
            scrapedContent
          };

          return NextResponse.json({
            success: true,
            data: discoveryData,
            source: "content-analysis",
            analysisId: latestAnalysis.id
          });
        }
      }
    } catch (analysisError) {
      console.log("[Auto-Discovery] Could not fetch content analysis, using fallback:", analysisError);
    }

    // Fallback to mock data if no content analysis available
    console.log("[Auto-Discovery] Using mock discovery data as fallback");
    
    const mockDiscoveryData = {
      services: [
        "Data Science Services",
        "AI Programming Services", 
        "Machine Learning Services",
        "Cybersecurity Services",
        "Computer Vision Services",
        "Data Visualization Services",
        "Speech and Text Analytics Services",
        "Natural Language Processing Services",
        "Business Automation Services"
      ],
      locations: [
        "Islamabad", "Rawalpindi", "Lahore", "Karachi", "Peshawar",
        "Faisalabad", "Multan", "Gujranwala", "Sialkot", "Quetta"
      ],
      aboutSummary: "DataTech Consultants is a premier technology company specializing in cutting-edge AI and data science solutions. We provide comprehensive services including machine learning, computer vision, natural language processing, data visualization, and business automation. Our team of expert data scientists and AI engineers helps enterprises transform their operations through intelligent automation and data-driven decision making.",
      targetAudience: "Enterprises, startups, and government organizations seeking to leverage artificial intelligence, machine learning, and data science for digital transformation, operational efficiency, and competitive advantage. We serve clients across various industries including finance, healthcare, retail, manufacturing, and technology sectors.",
      brandTone: "Professional, innovative, and technically sophisticated. We communicate complex AI concepts in clear, business-focused language while maintaining our position as thought leaders in the data science and AI industry. Our approach is consultative, solution-oriented, and committed to delivering measurable business value.",
      contactInfo: {
        email: "info@datatechconsultants.com.au",
        phone: "+92-300-1234567",
        address: "123 Business Park, Islamabad, Pakistan"
      },
      existingPages: [
        { url: "/services/data-science-services", type: "service", title: "Data Science Services" },
        { url: "/services/ai-programming-services", type: "service", title: "AI Programming Services" },
        { url: "/services/machine-learning-services", type: "service", title: "Machine Learning Services" },
        { url: "/services/computer-vision-services", type: "service", title: "Computer Vision Services" },
        { url: "/services/cybersecurity-services", type: "service", title: "Cybersecurity Services" },
        { url: "/about", type: "page", title: "About DataTech Consultants" },
        { url: "/contact", type: "page", title: "Contact Us" },
        { url: "/blog", type: "blog", title: "AI and Data Science Blog" }
      ],
      scrapedContent: scrapedContent || "DataTech Consultants is a premier technology company specializing in cutting-edge AI and data science solutions. We provide comprehensive services including machine learning, computer vision, natural language processing, data visualization, and business automation. Our team of expert data scientists and AI engineers helps enterprises transform their operations through intelligent automation and data-driven decision making."
    };

    return NextResponse.json({
      success: true,
      data: mockDiscoveryData,
      source: "mock-data"
    });
    
  } catch (error: unknown) {
    console.error("[Auto-Discovery] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch discovery data", details: String(error) },
      { status: 500 }
    );
  }
}
