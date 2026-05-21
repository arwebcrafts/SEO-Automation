"use client";

import { useState, useEffect } from "react";
import {
  Wand2,
  Globe,
  MapPin,
  FileText,
  ChevronRight,
  CheckCircle2,
  Loader2,
  Search,
  Target,
  Settings,
  Eye,
  Zap,
  Sparkles,
  RefreshCw,
  Copy,
  Download,
  Image as ImageIcon,
  Calendar,
  User,
  Tag,
  ExternalLink,
  X,
  Check,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Plug,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import SearchResultPreview from "./SearchResultPreview";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

interface DiscoveryData {
  services: string[];
  locations: string[];
  aboutSummary: string;
  targetAudience: string;
  brandTone: string;
  contactInfo: {
    email: string;
    phone: string;
    address: string;
  };
  existingPages: Array<{
    url: string;
    type: string;
    title: string;
  }>;
}

interface Topic {
  title: string;
  primaryKeywords: string[];
  secondaryKeywords: string[];
  targetLocations: string[];
  contentType: "blog post" | "landing page";
  description: string;
  searchIntent: "informational" | "commercial" | "local";
  estimatedWordCount?: number;
  difficulty?: "easy" | "medium" | "hard";
}

interface GeneratedContent {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  status: "generating" | "completed" | "failed";
  featuredImage?: string;
  imageUrl?: string;
  imagePrompt?: string;
  metadata?: {
    keywords: string[];
    targetLocation: string;
    tone: string;
    contentType: string;
  };
}

export default function AutoContentEngineSplit() {
  const [discoveryData, setDiscoveryData] = useState<DiscoveryData | null>(null);
  const [selectedService, setSelectedService] = useState<string>("");
  const [selectedTone, setSelectedTone] = useState<string>("professional");
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState<string>("");
  const [customKeywords, setCustomKeywords] = useState<string>("");
  const [generatedKeywords, setGeneratedKeywords] = useState<string[]>([]);
  const [selectedGeneratedKeywords, setSelectedGeneratedKeywords] = useState<string[]>([]);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingKeywords, setIsGeneratingKeywords] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"skeleton" | "outline" | "content">("skeleton");
  const [useBackendGeneration, setUseBackendGeneration] = useState(false);
  
  // Auto/Manual mode toggle
  const [writerMode, setWriterMode] = useState<"auto" | "manual">("auto");
  const [autoStep, setAutoStep] = useState<"brand" | "topics" | "keywords" | "review">("brand");
  const [generatedTopics, setGeneratedTopics] = useState<Topic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>([]);
  const [isGeneratingTopics, setIsGeneratingTopics] = useState(false);
  const [topicKeywords, setTopicKeywords] = useState<{ primary: string[]; secondary: string[] }>({ primary: [], secondary: [] });
  const [selectedPrimaryKeywords, setSelectedPrimaryKeywords] = useState<string[]>([]);
  const [selectedSecondaryKeywords, setSelectedSecondaryKeywords] = useState<string[]>([]);
  const [customKeywordInput, setCustomKeywordInput] = useState("");
  const [isRegeneratingKeywords, setIsRegeneratingKeywords] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [scrapedContent, setScrapedContent] = useState("");
  const [showPromptTemplates, setShowPromptTemplates] = useState(false);
  
  // Pre-written prompt templates
  const promptTemplates = [
    { id: 1, name: "SEO-Optimized Blog Post", prompt: "Write a comprehensive, SEO-optimized blog post that includes relevant statistics, expert insights, and actionable tips. Structure with clear headings, bullet points, and a compelling call-to-action." },
    { id: 2, name: "Local Business Focus", prompt: "Create content that emphasizes local expertise and community involvement. Include location-specific details, local landmarks references, and address common local customer pain points." },
    { id: 3, name: "Technical Authority", prompt: "Write in-depth technical content that demonstrates industry expertise. Include technical specifications, detailed explanations, and cite authoritative sources to build E-E-A-T." },
    { id: 4, name: "Problem-Solution Format", prompt: "Structure the content around identifying customer problems and presenting clear solutions. Use real-world examples and case studies to illustrate effectiveness." },
    { id: 5, name: "Comparison Guide", prompt: "Create a detailed comparison guide that helps readers make informed decisions. Include pros and cons, feature comparisons, and clear recommendations." },
    { id: 6, name: "How-To Tutorial", prompt: "Write a step-by-step tutorial with numbered instructions, helpful tips, common mistakes to avoid, and visual descriptions for each step." },
  ];
  
  // WordPress connection modal state
  const [showWpConnectModal, setShowWpConnectModal] = useState(false);
  const [wpConnectMode, setWpConnectMode] = useState<"auto" | "manual">("auto");
  const [wpUrl, setWpUrl] = useState("");
  const [wpApiKey, setWpApiKey] = useState("");
  const [isConnectingWp, setIsConnectingWp] = useState(false);
  const [wpConnectError, setWpConnectError] = useState("");
  const [handshakeStatus, setHandshakeStatus] = useState<"idle" | "pending" | "approved" | "error">("idle");
  const [connectToken, setConnectToken] = useState("");

  // Poll for handshake approval
  useEffect(() => {
    if (handshakeStatus !== "pending" || !connectToken || !wpUrl) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/wordpress?action=handshake_status&site_url=${encodeURIComponent(wpUrl)}&connect_token=${connectToken}`
        );
        const data = await response.json();

        if (data.status === "approved") {
          setHandshakeStatus("approved");
          
          let apiKey = data.api_key || data.apiKey;
          let siteName = data.site_name || data.siteName;
          let returnedSiteUrl = data.site_url || data.siteUrl || wpUrl;
          
          if (!apiKey) {
            const completeResponse = await fetch("/api/wordpress", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                site_url: wpUrl,
                action: "handshake_complete",
                options: { connect_token: connectToken },
              }),
            });
            const completeData = await completeResponse.json();
            apiKey = completeData.api_key || completeData.apiKey || completeData.key;
            siteName = completeData.site_name || completeData.siteName || completeData.name || siteName;
            returnedSiteUrl = completeData.site_url || completeData.siteUrl || returnedSiteUrl;
          }
          
          if (apiKey && apiKey.length >= 20) {
            const conn = {
              siteUrl: returnedSiteUrl,
              apiKey: apiKey,
              connected: true,
              siteName: siteName || returnedSiteUrl,
            };
            localStorage.setItem('wp_connection_global', JSON.stringify(conn));
            setShowWpConnectModal(false);
            setHandshakeStatus("idle");
            window.location.reload();
          } else {
            setHandshakeStatus("error");
            setWpConnectError("Connection approved but failed to retrieve API key. Please use Manual Setup.");
          }
        }
      } catch {
        // Continue polling
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [handshakeStatus, connectToken, wpUrl]);

  const handleAutoConnect = async () => {
    if (!wpUrl) {
      setWpConnectError("Please enter your WordPress site URL");
      return;
    }

    setIsConnectingWp(true);
    setWpConnectError("");

    try {
      const response = await fetch("/api/wordpress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site_url: wpUrl,
          action: "handshake_init",
        }),
      });
      const data = await response.json();

      const authUrlFromResponse = data.auth_url || data.approval_url;
      const tokenFromResponse = data.connect_token || data.token;
      
      if (data.success && authUrlFromResponse) {
        setConnectToken(tokenFromResponse);
        setHandshakeStatus("pending");
        window.open(authUrlFromResponse, "_blank");
      } else {
        const errorMsg = data.error || "Failed to initiate connection";
        setWpConnectError(`${errorMsg}. Make sure SEO AutoFix Pro plugin is installed and activated.`);
      }
    } catch (err) {
      setWpConnectError(`Connection failed: ${err instanceof Error ? err.message : "Please check your WordPress URL."}`);
    } finally {
      setIsConnectingWp(false);
    }
  };

  const toneOptions = [
    { value: "professional", label: "Professional", desc: "Formal and business-focused" },
    { value: "conversational", label: "Conversational", desc: "Friendly and approachable" },
    { value: "authoritative", label: "Authoritative", desc: "Expert and confident" },
    { value: "educational", label: "Educational", desc: "Informative and helpful" },
  ];

  useEffect(() => {
    loadDiscoveryData();
  }, []);

  // Initialize selected keywords when topicKeywords changes
  useEffect(() => {
    setSelectedPrimaryKeywords(topicKeywords.primary);
    setSelectedSecondaryKeywords(topicKeywords.secondary);
  }, [topicKeywords]);

  const handleTogglePrimaryKeyword = (keyword: string) => {
    setSelectedPrimaryKeywords(prev => 
      prev.includes(keyword) ? prev.filter(k => k !== keyword) : [...prev, keyword]
    );
  };

  const handleToggleSecondaryKeyword = (keyword: string) => {
    setSelectedSecondaryKeywords(prev => 
      prev.includes(keyword) ? prev.filter(k => k !== keyword) : [...prev, keyword]
    );
  };

  const handleAddCustomKeyword = (type: "primary" | "secondary") => {
    if (!customKeywordInput.trim()) return;
    const keyword = customKeywordInput.trim();
    if (type === "primary") {
      if (!topicKeywords.primary.includes(keyword)) {
        setTopicKeywords(prev => ({ ...prev, primary: [...prev.primary, keyword] }));
        setSelectedPrimaryKeywords(prev => [...prev, keyword]);
      }
    } else {
      if (!topicKeywords.secondary.includes(keyword)) {
        setTopicKeywords(prev => ({ ...prev, secondary: [...prev.secondary, keyword] }));
        setSelectedSecondaryKeywords(prev => [...prev, keyword]);
      }
    }
    setCustomKeywordInput("");
  };

  const handleRegenerateKeywords = async () => {
    setIsRegeneratingKeywords(true);
    try {
      // Use AI to generate new keywords based on selected topics
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Generate SEO keywords for the following topic: "${selectedTopics[0]?.title || customTopic || selectedService}".
          
Service: ${selectedService || "General"}
Target Audience: ${discoveryData?.targetAudience || "Business professionals"}

Return a JSON object with exactly this format:
{
  "primary": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "secondary": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}

Primary keywords should be main target keywords (2-4 words each).
Secondary keywords should be supporting long-tail keywords (3-5 words each).
Return ONLY the JSON object, no other text.`,
          maxTokens: 500,
        }),
      });
      const data = await response.json();
      if (data.success && data.content) {
        try {
          // Parse the AI response as JSON
          const jsonMatch = data.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const keywords = JSON.parse(jsonMatch[0]);
            setTopicKeywords({
              primary: keywords.primary || [],
              secondary: keywords.secondary || [],
            });
          }
        } catch (parseError) {
          console.error("Error parsing keywords JSON:", parseError);
        }
      }
    } catch (error) {
      console.error("Error regenerating keywords:", error);
    } finally {
      setIsRegeneratingKeywords(false);
    }
  };

  const handleAddLocation = () => {
    if (locationInput.trim() && !selectedLocations.includes(locationInput.trim())) {
      setSelectedLocations([...selectedLocations, locationInput.trim()]);
      setLocationInput("");
    }
  };

  const handleRemoveLocation = (location: string) => {
    setSelectedLocations(selectedLocations.filter(l => l !== location));
  };

  const loadDiscoveryData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/content/auto-discovery?crawlRequestId=latest");
      const data = await response.json();

      if (data.success) {
        setDiscoveryData(data.data);
        if (data.data.brandTone) {
          setSelectedTone(data.data.brandTone.toLowerCase());
        }
        
        // Use scraped content from the API response (fetched from database)
        if (data.data.scrapedContent) {
          setScrapedContent(data.data.scrapedContent);
          console.log("[Auto Writer] Scraped content loaded, length:", data.data.scrapedContent.length);
        }
      } else {
        throw new Error(data.error || "Failed to load discovery data");
      }
    } catch (error) {
      console.error("Error loading discovery data:", error);
      setError("Failed to load discovery data. Please run a crawl first.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKeywords = async () => {
    if (!customTopic && !selectedService) {
      setError("Please enter a topic or select a service first");
      return;
    }

    setIsGeneratingKeywords(true);
    setError(null);

    try {
      const response = await fetch("/api/content/ai-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedService: customTopic || selectedService,
          locations: selectedLocations.length > 0 ? selectedLocations : [discoveryData?.locations?.[0] || "Pakistan"],
          brandTone: selectedTone,
          targetAudience: discoveryData?.targetAudience || "Business professionals",
          aboutSummary: discoveryData?.aboutSummary || "Professional services",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate keywords");
      }

      const result = await response.json();
      
      if (result.success && result.topics && result.topics.length > 0) {
        const keywords = result.topics.flatMap((topic: any) => [
          ...topic.primaryKeywords,
          ...topic.secondaryKeywords,
        ]).filter((k: string, i: number, a: string[]) => a.indexOf(k) === i).slice(0, 10);
        
        setGeneratedKeywords(keywords);
        setSelectedGeneratedKeywords(keywords); // Auto-select all
        setCustomKeywords(keywords.join(", "));
      } else {
        throw new Error(result.error || "No keywords generated");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate keywords");
    } finally {
      setIsGeneratingKeywords(false);
    }
  };

  const handleToggleKeyword = (keyword: string) => {
    setSelectedGeneratedKeywords(prev =>
      prev.includes(keyword)
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    );
    setCustomKeywords(
      selectedGeneratedKeywords.includes(keyword)
        ? selectedGeneratedKeywords.filter(k => k !== keyword).join(", ")
        : [...selectedGeneratedKeywords, keyword].join(", ")
    );
  };

  const handleSelectAllKeywords = () => {
    setSelectedGeneratedKeywords(generatedKeywords);
    setCustomKeywords(generatedKeywords.join(", "));
  };

  const handleDeselectAllKeywords = () => {
    setSelectedGeneratedKeywords([]);
    setCustomKeywords("");
  };

  const handleGenerate = async () => {
    if (!customTopic && !selectedService) {
      setError("Please enter a topic or select a service");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setPreviewMode("outline");
    setGeneratedContent(null);

    try {
      if (useBackendGeneration) {
        // Use Trigger.dev backend generation
        await handleBackendGenerate();
      } else {
        // Use frontend generation
        await handleFrontendGenerate();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate content");
      setPreviewMode("skeleton");
      setGeneratedContent(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFrontendGenerate = async () => {
    setPreviewMode("content");
    setGeneratedContent({
      id: `content_${Date.now()}`,
      title: customTopic || `${selectedService} Services`,
      content: "Generating content...",
      wordCount: 0,
      status: "generating",
      featuredImage: undefined,
      imageUrl: undefined,
      imagePrompt: undefined,
      metadata: {
        keywords: customKeywords.split(",").map(k => k.trim()).filter(Boolean),
        targetLocation: selectedLocations[0] || discoveryData?.locations?.[0] || "Australia",
        tone: selectedTone,
        contentType: "blog post"
      }
    });

    const response = await fetch("/api/content/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "generate_full_content",
        keyword: customTopic || selectedService,
        businessType: discoveryData?.services?.[0] || "Technology Consulting",
        businessName: "DataTech Consultants",
        services: discoveryData?.services || [selectedService],
        location: selectedLocations[0] || "Australia",
        tone: selectedTone,
        targetWordCount: 1500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to start content generation");
    }

    const result = await response.json();
    
    if (result.success && result.data) {
      setGeneratedContent({
        id: `content_${Date.now()}`,
        title: result.data.title || customTopic || `${selectedService} Services`,
        content: result.data.content || "Content generated successfully",
        wordCount: result.data.wordCount || 0,
        status: "completed",
        featuredImage: result.data.featuredImage || result.data.imageUrl || `https://picsum.photos/1200/600?random=${Math.random()}`,
        imageUrl: result.data.imageUrl || `https://picsum.photos/800/600?random=${Math.random()}`,
        imagePrompt: result.data.imagePrompt || `AI-generated image for ${result.data.title}`,
        metadata: {
          keywords: result.data.keywords || customKeywords.split(",").map(k => k.trim()).filter(Boolean),
          targetLocation: selectedLocations[0] || discoveryData?.locations?.[0] || "Australia",
          tone: selectedTone,
          contentType: result.data.contentType || "blog post"
        }
      });
    } else {
      throw new Error(result.error || "Failed to generate content");
    }
  };

  const handleBackendGenerate = async () => {
    setPreviewMode("content");
    setGeneratedContent({
      id: `content_${Date.now()}`,
      title: customTopic || `${selectedService} Services`,
      content: "Generating content via Trigger.dev...",
      wordCount: 0,
      status: "generating",
      featuredImage: undefined,
      imageUrl: undefined,
      imagePrompt: undefined,
      metadata: {
        keywords: customKeywords.split(",").map(k => k.trim()).filter(Boolean),
        targetLocation: selectedLocations[0] || discoveryData?.locations?.[0] || "Australia",
        tone: selectedTone,
        contentType: "blog post"
      }
    });

    const response = await fetch("/api/content/bulk-generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selectedTopics: [{
          title: customTopic || selectedService,
          primaryKeywords: customKeywords.split(",").map(k => k.trim()).filter(Boolean),
          secondaryKeywords: [],
          contentType: "blog post",
          description: customTopic || `Content about ${selectedService}`,
          searchIntent: "informational",
        }],
        selectedLocations: selectedLocations.length > 0 ? selectedLocations : [discoveryData?.locations?.[0] || "Pakistan"],
        service: selectedService || customTopic,
        brandTone: selectedTone,
        targetAudience: discoveryData?.targetAudience || "Business professionals",
        aboutSummary: discoveryData?.aboutSummary || "Professional services",
        generateImages: true,
        singlePage: true,
        customPrompt: customPrompt,
        scrapedContent: scrapedContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to start content generation");
    }

    const result = await response.json();
    const taskId = result.taskId;

    // Poll for task completion
    await pollForTaskCompletion(taskId);
  };

  const pollForTaskCompletion = async (taskId: string) => {
    const maxAttempts = 60;
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
      
      try {
        const response = await fetch(`/api/content/bulk-generate?taskId=${taskId}`);
        const data = await response.json();
        
        if (data.success && data.results && data.results.length > 0) {
          const content = data.results[0];
          setGeneratedContent({
            id: content.id,
            title: content.title,
            content: content.content,
            wordCount: content.wordCount || 0,
            status: "completed",
            featuredImage: content.imageUrl,
            imageUrl: content.imageUrl,
            imagePrompt: undefined,
            metadata: {
              keywords: content.keywords || customKeywords.split(",").map(k => k.trim()).filter(Boolean),
              targetLocation: content.location || selectedLocations[0] || discoveryData?.locations?.[0] || "Australia",
              tone: selectedTone,
              contentType: content.contentType || "blog post"
            }
          });
          return;
        } else if (data.status === "FAILED" || data.status === "CRASHED") {
          throw new Error(data.error || "Content generation failed");
        }
      } catch (error) {
        if (attempts === maxAttempts) {
          throw new Error("Content generation timed out");
        }
      }
    }
  };

  const handleCopy = () => {
    if (generatedContent?.content) {
      navigator.clipboard.writeText(generatedContent.content);
    }
  };

  const handleReset = () => {
    setGeneratedContent(null);
    setPreviewMode("skeleton");
    setCustomTopic("");
    setCustomKeywords("");
    setPublishStatus(null);
  };

  const handlePublishToWordPress = async () => {
    if (!generatedContent) {
      setError("No content to publish");
      return;
    }

    // Get WordPress connection from localStorage (set by WordPress plugin connection)
    const wpConnection = localStorage.getItem('wp_connection_global');
    if (!wpConnection) {
      setPublishStatus("WordPress not connected. Please connect WordPress from the Audit Report page first.");
      return;
    }

    const { siteUrl, apiKey } = JSON.parse(wpConnection);
    if (!siteUrl || !apiKey) {
      setPublishStatus("WordPress connection incomplete. Please reconnect from the Audit Report page.");
      return;
    }

    setIsPublishing(true);
    setPublishStatus(null);

    try {
      // Use WordPress plugin API directly
      const response = await fetch(`${siteUrl}/wp-json/seo-autofix/v1/content/publish`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-SEO-AutoFix-Key": apiKey,
        },
        body: JSON.stringify({
          title: generatedContent.title,
          content: generatedContent.content,
          location: generatedContent.metadata?.targetLocation || "Pakistan",
          contentType: generatedContent.metadata?.contentType || "blog post",
          imageUrl: generatedContent.imageUrl || generatedContent.featuredImage,
          featured_image: generatedContent.imageUrl || generatedContent.featuredImage,
          primaryKeywords: generatedContent.metadata?.keywords || [],
          status: "draft",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to publish to WordPress (${response.status})`);
      }

      const result = await response.json();
      const postId = result.post?.id || result.postId;
      const postUrl = result.post?.link || result.url;
      setPublishStatus(`✅ Content published successfully! Post ID: ${postId}${postUrl ? ` - View: ${postUrl}` : ''}`);
    } catch (err) {
      console.error("[WordPress Publish] Error:", err);
      setPublishStatus(err instanceof Error ? err.message : "Failed to publish to WordPress");
    } finally {
      setIsPublishing(false);
    }
  };

  const canGenerate = (customTopic || selectedService) && !isGenerating;

  // Auto mode functions
  const handleGenerateTopics = async () => {
    if (!selectedService && !discoveryData?.services?.[0]) {
      setError("Please select a service first");
      return;
    }

    setIsGeneratingTopics(true);
    setError(null);

    try {
      const response = await fetch("/api/content/ai-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedService: selectedService || discoveryData?.services?.[0],
          locations: selectedLocations.length > 0 ? selectedLocations : discoveryData?.locations?.slice(0, 3) || ["Pakistan"],
          existingContent: discoveryData?.existingPages || [],
          brandTone: discoveryData?.brandTone || selectedTone,
          targetAudience: discoveryData?.targetAudience || "Business professionals",
          aboutSummary: discoveryData?.aboutSummary || "Professional services",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate topics");
      }

      const result = await response.json();
      
      if (result.success && result.topics) {
        setGeneratedTopics(result.topics);
        setSelectedTopics([]);
        setAutoStep("topics");
      } else {
        throw new Error(result.error || "No topics generated");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate topics");
    } finally {
      setIsGeneratingTopics(false);
    }
  };

  const handleToggleTopic = (topic: Topic) => {
    setSelectedTopics(prev => {
      const exists = prev.find(t => t.title === topic.title);
      if (exists) {
        return prev.filter(t => t.title !== topic.title);
      }
      return [...prev, topic];
    });
  };

  const handleProceedToKeywords = () => {
    if (selectedTopics.length === 0) {
      setError("Please select at least one topic");
      return;
    }
    
    // Extract keywords from selected topics
    const primary = selectedTopics.flatMap(t => t.primaryKeywords);
    const secondary = selectedTopics.flatMap(t => t.secondaryKeywords);
    setTopicKeywords({ primary, secondary });
    setAutoStep("keywords");
  };

  const handleAutoGenerate = async () => {
    if (selectedTopics.length === 0) {
      setError("Please select at least one topic");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setAutoStep("review");

    try {
      const response = await fetch("/api/content/bulk-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedTopics: selectedTopics.slice(0, 1), // Generate one at a time
          selectedLocations: selectedLocations.length > 0 ? selectedLocations : [discoveryData?.locations?.[0] || "Pakistan"],
          service: selectedService || selectedTopics[0]?.title,
          brandTone: discoveryData?.brandTone || selectedTone,
          targetAudience: discoveryData?.targetAudience || "Business professionals",
          aboutSummary: discoveryData?.aboutSummary || "Professional services",
          generateImages: true,
          singlePage: true,
          customPrompt: customPrompt,
          scrapedContent: scrapedContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate content");
      }

      const result = await response.json();
      const taskId = result.taskId;

      // Poll for task completion
      await pollForTaskCompletion(taskId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate content");
      setAutoStep("keywords");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResetAuto = () => {
    setAutoStep("brand");
    setGeneratedTopics([]);
    setSelectedTopics([]);
    setTopicKeywords({ primary: [], secondary: [] });
    setGeneratedContent(null);
    setPreviewMode("skeleton");
  };

  // Check WordPress connection status
  const isWordPressConnected = () => {
    if (typeof window === 'undefined') return false;
    const wpConnection = localStorage.getItem('wp_connection_global');
    if (!wpConnection) return false;
    try {
      const { siteUrl, apiKey } = JSON.parse(wpConnection);
      return !!(siteUrl && apiKey);
    } catch {
      return false;
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)]">
      {/* WordPress Connection Warning */}
      {!isWordPressConnected() && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-amber-800 dark:text-amber-200">WordPress Not Connected</h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Connect your WordPress site to publish content directly. Download the SEO AutoFix plugin and connect.
              </p>
              <div className="flex items-center gap-3 mt-3">
                <a
                  href="/downloads/seo-auto-fix.zip"
                  download
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  Download Plugin
                </a>
                <button
                  onClick={() => setShowWpConnectModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors text-sm font-medium"
                >
                  <Plug className="w-4 h-4" />
                  Connect WordPress
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WordPress Connection Modal */}
      {showWpConnectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Connect WordPress Site</h3>
              <button onClick={() => setShowWpConnectModal(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><X className="w-5 h-5" /></button>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setWpConnectMode("auto")}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${wpConnectMode === "auto" ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}
              >
                🚀 Auto Connect
              </button>
              <button
                onClick={() => setWpConnectMode("manual")}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${wpConnectMode === "manual" ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}
              >
                🔧 Manual Setup
              </button>
            </div>

            {wpConnectError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300">{wpConnectError}</p>
              </div>
            )}

            {handshakeStatus === "pending" && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">Waiting for approval in WordPress admin... Please approve the connection in the opened tab.</p>
                </div>
              </div>
            )}

            {wpConnectMode === "auto" ? (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">One-Click Connection</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Enter your WordPress URL and click connect. You'll be redirected to approve the connection in your WordPress admin.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">WordPress Site URL</label>
                  <input
                    type="url"
                    value={wpUrl}
                    onChange={(e) => setWpUrl(e.target.value)}
                    placeholder="https://yoursite.com"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                  />
                </div>
                <button
                  onClick={handleAutoConnect}
                  disabled={!wpUrl || isConnectingWp || handshakeStatus === "pending"}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isConnectingWp ? "Initiating..." : handshakeStatus === "pending" ? "Waiting for approval..." : "Connect Automatically"}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">Manual Connection</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Enter your WordPress URL and API key from the SEO AutoFix plugin settings.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">WordPress Site URL</label>
                  <input
                    type="url"
                    value={wpUrl}
                    onChange={(e) => setWpUrl(e.target.value)}
                    placeholder="https://yoursite.com"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">API Key</label>
                  <input
                    type="text"
                    value={wpApiKey}
                    onChange={(e) => setWpApiKey(e.target.value)}
                    placeholder="Enter API key from plugin settings"
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                  />
                </div>
                <button
                  onClick={() => {
                    if (wpUrl && wpApiKey) {
                      localStorage.setItem('wp_connection_global', JSON.stringify({ siteUrl: wpUrl.replace(/\/$/, ''), apiKey: wpApiKey }));
                      setShowWpConnectModal(false);
                      window.location.reload();
                    }
                  }}
                  disabled={!wpUrl || !wpApiKey}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Save Connection
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        {/* Left Side - Configuration */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Content Configuration
              </h2>
            </div>
            
            {/* Auto/Manual Toggle */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
              <button
                onClick={() => { setWriterMode("auto"); handleResetAuto(); }}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  writerMode === "auto"
                    ? "bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Wand2 className="w-4 h-4 inline mr-1.5" />
                Auto
              </button>
              <button
                onClick={() => setWriterMode("manual")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  writerMode === "manual"
                    ? "bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <FileText className="w-4 h-4 inline mr-1.5" />
                Manual
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : writerMode === "auto" ? (
            /* AUTO MODE - Left Side */
            <div className="space-y-6">
              {/* Service Selection for Auto Mode */}
              {discoveryData?.services && discoveryData.services.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Select Service to Generate Topics
                  </label>
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
                  >
                    <option value="">Select a service...</option>
                    {discoveryData.services.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Location Selection for Auto Mode */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-purple-600" />
                  <h3 className="font-medium text-slate-900 dark:text-slate-100">Target Locations</h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Add cities or regions to target in your content.</p>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddLocation()}
                    placeholder="Type a location (e.g., New York, London)"
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100 text-sm"
                  />
                  <button onClick={handleAddLocation} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm">Add</button>
                </div>
                {selectedLocations.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedLocations.map((location, index) => (
                      <span key={index} className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                        <MapPin className="w-3 h-3" />
                        {location}
                        <button onClick={() => handleRemoveLocation(location)} className="ml-1 hover:text-purple-900 dark:hover:text-purple-100"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">No locations added. Content will be generated without location targeting.</p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              {/* Auto Step Actions */}
              {autoStep === "brand" && (
                <button
                  onClick={handleGenerateTopics}
                  disabled={isGeneratingTopics || (!selectedService && !discoveryData?.services?.[0])}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-400 dark:disabled:from-slate-600 dark:disabled:to-slate-700 disabled:cursor-not-allowed transition-all font-medium text-lg shadow-lg"
                >
                  {isGeneratingTopics ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating Topics...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate AI Topics
                    </>
                  )}
                </button>
              )}

              {autoStep === "topics" && (
                <button
                  onClick={handleProceedToKeywords}
                  disabled={selectedTopics.length === 0}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors font-medium text-lg"
                >
                  <ChevronRight className="w-5 h-5" />
                  Continue to Keywords ({selectedTopics.length} selected)
                </button>
              )}

              {autoStep === "keywords" && (
                <button
                  onClick={handleAutoGenerate}
                  disabled={isGenerating || selectedTopics.length === 0}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed transition-all font-medium text-lg shadow-lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating Content...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Generate Content
                    </>
                  )}
                </button>
              )}

              {autoStep === "review" && generatedContent && (
                <div className="space-y-3">
                  <button
                    onClick={handlePublishToWordPress}
                    disabled={isPublishing}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors font-medium text-lg"
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-5 h-5" />
                        Publish to WordPress
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleResetAuto}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Start Over
                  </button>
                </div>
              )}

              {/* Publish Status */}
              {publishStatus && (
                <div className={`p-3 rounded-lg border ${
                  publishStatus.includes("successfully") 
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                    : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300"
                }`}>
                  <p className="text-sm">{publishStatus}</p>
                </div>
              )}
            </div>
          ) : (
            /* MANUAL MODE - Left Side */
            <div className="space-y-6">
              {/* Topic Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Topic / Title
                </label>
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="e.g., Ultimate Guide to Digital Marketing"
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
                />
              </div>

              {/* Service Selection */}
              {discoveryData?.services && discoveryData.services.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Related Service (Optional)
                  </label>
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
                  >
                    <option value="">Select a service...</option>
                    {discoveryData.services.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Tone Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Writing Tone
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {toneOptions.map((tone) => (
                    <button
                      key={tone.value}
                      onClick={() => setSelectedTone(tone.value)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        selectedTone === tone.value
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                      }`}
                    >
                      <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                        {tone.label}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {tone.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Keywords */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Target Keywords (comma separated)
                  </label>
                  <button
                    onClick={handleGenerateKeywords}
                    disabled={isGeneratingKeywords || (!customTopic && !selectedService)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isGeneratingKeywords ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3 h-3" />
                        Generate AI Keywords
                      </>
                    )}
                  </button>
                </div>
                <input
                  type="text"
                  value={customKeywords}
                  onChange={(e) => setCustomKeywords(e.target.value)}
                  placeholder="e.g., SEO, digital marketing, content strategy"
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-slate-100"
                />
                
                {/* Generated Keywords Selection */}
                {generatedKeywords.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSelectAllKeywords}
                        className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300 dark:text-slate-600">|</span>
                      <button
                        onClick={handleDeselectAllKeywords}
                        className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Deselect All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {generatedKeywords.map((keyword) => (
                        <button
                          key={keyword}
                          onClick={() => handleToggleKeyword(keyword)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
                            selectedGeneratedKeywords.includes(keyword)
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                          }`}
                        >
                          {selectedGeneratedKeywords.includes(keyword) ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <X className="w-3 h-3 opacity-0" />
                          )}
                          {keyword}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Location Selection */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-purple-600" />
                  <h3 className="font-medium text-slate-900 dark:text-slate-100">Target Locations</h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Add cities or regions to target in your content.</p>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddLocation()}
                    placeholder="Type a location (e.g., New York, London)"
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100 text-sm"
                  />
                  <button onClick={handleAddLocation} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm">Add</button>
                </div>
                {selectedLocations.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedLocations.map((location, index) => (
                      <span key={index} className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                        <MapPin className="w-3 h-3" />
                        {location}
                        <button onClick={() => handleRemoveLocation(location)} className="ml-1 hover:text-purple-900 dark:hover:text-purple-100"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">No locations added. Content will be generated without location targeting.</p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              {/* Generation Method Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Generation Method
                  </span>
                </div>
                <button
                  onClick={() => setUseBackendGeneration(!useBackendGeneration)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  {useBackendGeneration ? (
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <ToggleRight className="w-5 h-5" />
                      <span>Backend (Trigger.dev)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <ToggleLeft className="w-5 h-5" />
                      <span>Frontend</span>
                    </div>
                  )}
                </button>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors font-medium text-lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {useBackendGeneration ? "Generating via Trigger.dev..." : "Generating Content..."}
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    {useBackendGeneration ? "Generate via Backend" : "Generate Content"}
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right Side - Preview */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 overflow-y-auto">
          {/* AUTO MODE - Right Side Panels */}
          {writerMode === "auto" ? (
            <>
              {/* Brand Context - Initial Auto Step */}
              {autoStep === "brand" && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-5 h-5 text-purple-600" />
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Brand Context
                    </h2>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-5 border border-purple-200 dark:border-purple-800">
                      <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider mb-2">Target Audience</h3>
                      <p className="text-slate-900 dark:text-slate-100">
                        {discoveryData?.targetAudience || "Business professionals seeking digital solutions"}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
                      <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-2">Brand Tone</h3>
                      <p className="text-slate-900 dark:text-slate-100">
                        {discoveryData?.brandTone || "Professional, innovative, and technically sophisticated"}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-5 border border-green-200 dark:border-green-800">
                      <h3 className="text-sm font-semibold text-green-700 dark:text-green-300 uppercase tracking-wider mb-2">About</h3>
                      <p className="text-slate-900 dark:text-slate-100">
                        {discoveryData?.aboutSummary || "Leading provider of professional services and solutions"}
                      </p>
                    </div>

                    {discoveryData?.services && discoveryData.services.length > 0 && (
                      <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">Services Found</h3>
                        <div className="flex flex-wrap gap-2">
                          {discoveryData.services.slice(0, 6).map((service, i) => (
                            <span key={i} className="px-3 py-1 bg-white dark:bg-slate-600 rounded-full text-sm text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                              {service}
                            </span>
                          ))}
                          {discoveryData.services.length > 6 && (
                            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full text-sm text-blue-700 dark:text-blue-300">
                              +{discoveryData.services.length - 6} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* AI Topics Selection */}
              {autoStep === "topics" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-600" />
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        AI-Generated Topics
                      </h2>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                        {generatedTopics.length} Available
                      </span>
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                        {selectedTopics.length} Selected
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Review and select topics for content generation
                  </p>

                  {selectedTopics.length === 0 && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-4">
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        Please select at least one topic to continue to the keywords selection step.
                      </p>
                    </div>
                  )}

                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {generatedTopics.map((topic, index) => {
                      const isSelected = selectedTopics.find(t => t.title === topic.title);
                      return (
                        <div
                          key={index}
                          onClick={() => handleToggleTopic(topic)}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                              : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-medium text-slate-900 dark:text-slate-100 pr-4">
                              {topic.title}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              topic.contentType === "landing page"
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            }`}>
                              {topic.contentType}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                            {topic.description}
                          </p>
                          <div className="flex flex-wrap gap-1 mb-2">
                            <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">Primary:</span>
                            {topic.primaryKeywords.map((kw, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">
                                {kw}
                              </span>
                            ))}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Intent: {topic.searchIntent}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* AI Keywords Selection */}
              {autoStep === "keywords" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Tag className="w-5 h-5 text-green-600" />
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        AI Keywords Selection
                      </h2>
                    </div>
                    <button
                      onClick={handleRegenerateKeywords}
                      disabled={isRegeneratingKeywords}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
                    >
                      {isRegeneratingKeywords ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      Regenerate
                    </button>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Select keywords to include in content generation. Click to toggle selection.
                  </p>

                  {/* Add Custom Keyword */}
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={customKeywordInput}
                      onChange={(e) => setCustomKeywordInput(e.target.value)}
                      placeholder="Add custom keyword..."
                      className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100 text-sm"
                    />
                    <button
                      onClick={() => handleAddCustomKeyword("primary")}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      + Primary
                    </button>
                    <button
                      onClick={() => handleAddCustomKeyword("secondary")}
                      className="px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm"
                    >
                      + Secondary
                    </button>
                  </div>

                  {/* Primary Keywords */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                        Primary Keywords ({selectedPrimaryKeywords.length}/{topicKeywords.primary.length} selected)
                      </h3>
                      <button
                        onClick={() => setSelectedPrimaryKeywords(selectedPrimaryKeywords.length === topicKeywords.primary.length ? [] : [...topicKeywords.primary])}
                        className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        {selectedPrimaryKeywords.length === topicKeywords.primary.length ? "Deselect All" : "Select All"}
                      </button>
                    </div>
                    <div className="space-y-2">
                      {topicKeywords.primary.map((kw, i) => (
                        <div
                          key={i}
                          onClick={() => handleTogglePrimaryKeyword(kw)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                            selectedPrimaryKeywords.includes(kw)
                              ? "bg-white dark:bg-slate-700 border-2 border-blue-500"
                              : "bg-white/50 dark:bg-slate-700/50 border-2 border-transparent opacity-60"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                              selectedPrimaryKeywords.includes(kw) ? "bg-blue-600 border-blue-600" : "border-slate-300 dark:border-slate-500"
                            }`}>
                              {selectedPrimaryKeywords.includes(kw) && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="text-sm text-slate-900 dark:text-slate-100">{kw}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded">
                              {kw.split(" ").length} words
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Secondary Keywords */}
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Secondary Keywords ({selectedSecondaryKeywords.length}/{topicKeywords.secondary.length} selected)
                      </h3>
                      <button
                        onClick={() => setSelectedSecondaryKeywords(selectedSecondaryKeywords.length === topicKeywords.secondary.length ? [] : [...topicKeywords.secondary])}
                        className="text-xs text-slate-600 hover:text-slate-800 dark:text-slate-400"
                      >
                        {selectedSecondaryKeywords.length === topicKeywords.secondary.length ? "Deselect All" : "Select All"}
                      </button>
                    </div>
                    <div className="space-y-2">
                      {topicKeywords.secondary.map((kw, i) => (
                        <div
                          key={i}
                          onClick={() => handleToggleSecondaryKeyword(kw)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                            selectedSecondaryKeywords.includes(kw)
                              ? "bg-white dark:bg-slate-600 border-2 border-amber-500"
                              : "bg-white/50 dark:bg-slate-600/50 border-2 border-transparent opacity-60"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                              selectedSecondaryKeywords.includes(kw) ? "bg-amber-600 border-amber-600" : "border-slate-300 dark:border-slate-500"
                            }`}>
                              {selectedSecondaryKeywords.includes(kw) && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className="text-sm text-slate-900 dark:text-slate-100">{kw}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-500 text-slate-700 dark:text-slate-200 rounded">
                              {kw.split(" ").length} words
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SEO Analysis Summary */}
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="bg-white dark:bg-slate-700 rounded-lg p-3 text-center border border-slate-200 dark:border-slate-600">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{selectedTopics.length}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Topics</p>
                    </div>
                    <div className="bg-white dark:bg-slate-700 rounded-lg p-3 text-center border border-slate-200 dark:border-slate-600">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">{topicKeywords.primary.length + topicKeywords.secondary.length}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Keywords</p>
                    </div>
                    <div className="bg-white dark:bg-slate-700 rounded-lg p-3 text-center border border-slate-200 dark:border-slate-600">
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{selectedLocations.length || 1}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">Locations</p>
                    </div>
                  </div>

                  {/* Selected Topics Summary */}
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Selected Topics:</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedTopics.map((topic, i) => (
                        <span key={i} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                          {topic.title.length > 40 ? topic.title.substring(0, 40) + "..." : topic.title}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Custom Prompt Section */}
                  <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Custom Writing Instructions (Optional)</h4>
                      <button
                        onClick={() => setShowPromptTemplates(!showPromptTemplates)}
                        className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        {showPromptTemplates ? "Hide Templates" : "Choose Template"}
                      </button>
                    </div>
                    
                    {showPromptTemplates && (
                      <div className="mb-4 grid grid-cols-2 gap-2">
                        {promptTemplates.map((template) => (
                          <button
                            key={template.id}
                            onClick={() => {
                              setCustomPrompt(template.prompt);
                              setShowPromptTemplates(false);
                            }}
                            className="p-3 text-left bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                          >
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{template.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{template.prompt.substring(0, 80)}...</p>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    <textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="Add specific instructions for content generation (e.g., 'Include statistics about industry trends', 'Focus on beginner-friendly explanations', 'Add comparison tables')..."
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100 text-sm resize-none"
                      rows={3}
                    />
                    {customPrompt && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">✓ Custom instructions will be included in content generation</p>
                    )}
                  </div>
                </div>
              )}

              {/* Review & Publish */}
              {autoStep === "review" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Eye className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                      Review & Publish
                    </h2>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Review your generated content and publish to WordPress
                  </p>

                  {isGenerating ? (
                    <div className="space-y-4 py-8">
                      <div className="flex items-center justify-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                      </div>
                      <p className="text-center text-slate-600 dark:text-slate-400">
                        Generating your content...
                      </p>
                      <div className="h-4 bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{ width: "60%" }} />
                      </div>
                    </div>
                  ) : generatedContent ? (
                    <div className="space-y-4">
                      {/* Content Card */}
                      <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-700/30 rounded-xl p-5 border border-slate-200 dark:border-slate-600">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-lg">
                            {generatedContent.title}
                          </h3>
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-medium">
                            completed
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400 mb-4">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {generatedContent.metadata?.targetLocation || "Pakistan"}
                          </span>
                          <span>•</span>
                          <span>{generatedContent.wordCount.toLocaleString()} words</span>
                          <span>•</span>
                          <span>{generatedContent.metadata?.contentType || "blog post"}</span>
                        </div>

                        {/* Featured Image */}
                        {(generatedContent.featuredImage || generatedContent.imageUrl) && (
                          <div className="relative h-40 rounded-lg overflow-hidden mb-4">
                            <img 
                              src={generatedContent.featuredImage || generatedContent.imageUrl} 
                              alt={generatedContent.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = `https://picsum.photos/800/400?random=${Date.now()}`;
                              }}
                            />
                          </div>
                        )}

                        {/* Full Content Preview */}
                        <div className="bg-white dark:bg-slate-600 rounded-lg p-4 max-h-[400px] overflow-y-auto prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>
                            {generatedContent.content}
                          </ReactMarkdown>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                          <button
                            onClick={handleCopy}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
                          >
                            <Copy className="w-4 h-4" />
                            Copy
                          </button>
                          <button
                            onClick={handlePublishToWordPress}
                            disabled={isPublishing}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                          >
                            {isPublishing ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Publishing...
                              </>
                            ) : (
                              <>
                                <ExternalLink className="w-4 h-4" />
                                Publish to WordPress
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Sparkles className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-500 dark:text-slate-400">
                        Content will appear here after generation
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* MANUAL MODE - Right Side (Search Result Preview) */
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Content Preview
                  </h2>
                </div>
                {generatedContent && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      title="Copy content"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handlePublishToWordPress}
                      disabled={isPublishing}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                      title="Publish to WordPress"
                    >
                      {isPublishing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-4 h-4" />
                          Publish to WordPress
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleReset}
                      className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      title="Reset"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Publish Status */}
              {publishStatus && (
                <div className={`mb-4 p-3 rounded-lg border ${
                  publishStatus.includes("successfully") 
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                    : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300"
                }`}>
                  <p className="text-sm">{publishStatus}</p>
                </div>
              )}

              {/* Skeleton State with Search Result Preview */}
              {previewMode === "skeleton" && !isGenerating && (
                <div className="space-y-6">
                  {/* Live Search Result Preview */}
                  <SearchResultPreview
                    title={customTopic}
                    url={discoveryData?.existingPages?.[0]?.url || "https://example.com"}
                    keywords={customKeywords.split(",").map((k) => k.trim()).filter(Boolean)}
                  />

                  {/* Placeholder skeleton */}
                  {!customTopic && (
                    <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-3/4 animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-100 dark:bg-slate-700/50 rounded w-full animate-pulse" />
                        <div className="h-4 bg-slate-100 dark:bg-slate-700/50 rounded w-5/6 animate-pulse" />
                        <div className="h-4 bg-slate-100 dark:bg-slate-700/50 rounded w-4/6 animate-pulse" />
                      </div>
                      <div className="text-center py-6">
                        <Sparkles className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          Enter a topic to see your search preview
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Loading State */}
          {isGenerating && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <p className="text-slate-700 dark:text-slate-300">
                  Generating your content...
                </p>
              </div>
              <div className="h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg w-3/4 animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 bg-blue-50 dark:bg-blue-900/20 rounded w-full animate-pulse" />
                <div className="h-4 bg-blue-50 dark:bg-blue-900/20 rounded w-5/6 animate-pulse" />
                <div className="h-4 bg-blue-50 dark:bg-blue-900/20 rounded w-4/6 animate-pulse" />
              </div>
            </div>
          )}

          {/* Content Preview */}
          {previewMode === "content" && generatedContent && (
            <div className="space-y-6">
              {/* Content Header with Featured Image */}
              <div className="relative">
                {generatedContent.featuredImage || generatedContent.imageUrl ? (
                  <div className="relative h-64 rounded-xl overflow-hidden mb-6">
                    <img 
                      src={generatedContent.featuredImage || generatedContent.imageUrl} 
                      alt={generatedContent.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to a reliable placeholder image
                        e.currentTarget.src = `https://picsum.photos/1200/600?random=${Date.now()}`;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h1 className="text-2xl font-bold text-white mb-2">
                        {generatedContent.title}
                      </h1>
                      <div className="flex items-center gap-3 text-white/90 text-sm">
                        {generatedContent.metadata?.targetLocation && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {generatedContent.metadata.targetLocation}
                          </div>
                        )}
                        {generatedContent.metadata?.contentType && (
                          <div className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {generatedContent.metadata.contentType}
                          </div>
                        )}
                        {generatedContent.wordCount > 0 && (
                          <div className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {generatedContent.wordCount.toLocaleString()} words
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center mx-auto mb-4">
                      <ImageIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                      {generatedContent.title}
                    </h1>
                    <div className="flex items-center justify-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                      {generatedContent.metadata?.targetLocation && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {generatedContent.metadata.targetLocation}
                        </div>
                      )}
                      {generatedContent.metadata?.contentType && (
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {generatedContent.metadata.contentType}
                        </div>
                      )}
                      {generatedContent.wordCount > 0 && (
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {generatedContent.wordCount.toLocaleString()} words
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Content Metadata */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {generatedContent.metadata?.keywords?.slice(0, 5).map((keyword, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                    >
                      <Tag className="w-3 h-3" />
                      {keyword}
                    </span>
                  ))}
                </div>

                {/* Content Stats */}
                <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Content generated successfully</span>
                  </div>
                  {generatedContent.metadata?.tone && (
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>Tone: {generatedContent.metadata.tone}</span>
                    </div>
                  )}
                  {generatedContent.imagePrompt && (
                    <div className="flex items-center gap-1">
                      <ImageIcon className="w-4 h-4" />
                      <span>AI Image Generated</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Content Body */}
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-6">
                  <ReactMarkdown>{generatedContent.content}</ReactMarkdown>
                </div>
              </div>

              {/* Image Prompt Display */}
              {generatedContent.imagePrompt && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ImageIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <h4 className="font-medium text-amber-900 dark:text-amber-100">AI Image Prompt</h4>
                  </div>
                  <p className="text-sm text-amber-800 dark:text-amber-200 italic">
                    "{generatedContent.imagePrompt}"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
