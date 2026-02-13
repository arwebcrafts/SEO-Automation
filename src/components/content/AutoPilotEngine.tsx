"use client";

import { useState, useEffect } from "react";
import {
  Rocket, Calendar, Clock, MapPin, Tag, FileText, ChevronRight, ChevronLeft,
  CheckCircle2, Loader2, Sparkles, RefreshCw, Eye, Check, X, Upload, Target,
  Zap, Settings, Play, ExternalLink, Save, Globe, BarChart3, Image as ImageIcon,
  Download, AlertCircle, Plug, XCircle,
} from "lucide-react";
import LocationSelector from "./LocationSelector";

interface AnalysisData {
  services: string[];
  locations: string[];
  aboutSummary: string;
  targetAudience: string;
  brandTone: string;
  dominantKeywords: Array<{ term: string; count: number }>;
  pages: Array<{ url: string; type: string; title: string; wordCount: number }>;
}

interface GeneratedTopic {
  id: string;
  title: string;
  primaryKeywords: string[];
  secondaryKeywords: string[];
  userKeywords: string[];
  scheduledDate: Date;
  scheduledTime: string;
  selected: boolean;
  contentType: "blog post" | "landing page";
  description: string;
}

interface GeneratedContent {
  id: string;
  topicId: string;
  title: string;
  content: string;
  wordCount: number;
  imageUrl?: string;
  status: "pending" | "generating" | "completed" | "failed" | "approved" | "published";
  error?: string;
  scheduledDate: Date;
  scheduledTime: string;
  keywords: string[];
  publishedUrl?: string;
  wordpressPostId?: number;
}

const STEPS = [
  { id: 1, title: "Schedule Setup", description: "Configure posting frequency" },
  { id: 2, title: "Keywords & Locations", description: "Add your target keywords" },
  { id: 3, title: "Topic Planning", description: "Review AI-generated topics" },
  { id: 4, title: "Keyword Assignment", description: "AI keywords for each topic" },
  { id: 5, title: "Content Generation", description: "Generate all content" },
  { id: 6, title: "Review & Approve", description: "Approve and schedule" },
];

export default function AutoPilotEngine() {
  const [currentStep, setCurrentStep] = useState(1);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(true);
  
  const [postsPerDay, setPostsPerDay] = useState(1);
  const [postingTimes, setPostingTimes] = useState(["09:00"]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState("");
  const [totalPosts, setTotalPosts] = useState(30);
  const [pastDateMode, setPastDateMode] = useState<"instant" | "delayed" | "normal">("normal");
  const [delayInterval, setDelayInterval] = useState(1);
  const [delayUnit, setDelayUnit] = useState<"hours" | "days">("hours");
  
  const [userKeywords, setUserKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [isGeneratingLSI, setIsGeneratingLSI] = useState(false);
  const [generatedLSIKeywords, setGeneratedLSIKeywords] = useState<string[]>([]);
  
  const [generatedTopics, setGeneratedTopics] = useState<GeneratedTopic[]>([]);
  const [isGeneratingTopics, setIsGeneratingTopics] = useState(false);
  const [topicsError, setTopicsError] = useState<string | null>(null);
  
  const [isGeneratingKeywords, setIsGeneratingKeywords] = useState(false);
  const [currentKeywordTopicIndex, setCurrentKeywordTopicIndex] = useState(0);
  
  const [expandedContent, setExpandedContent] = useState<string | null>(null);
  const [viewingContent, setViewingContent] = useState<any>(null);
  
  const [generatedContents, setGeneratedContents] = useState<GeneratedContent[]>([]);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showWpConnectModal, setShowWpConnectModal] = useState(false);
  const [wpConnectMode, setWpConnectMode] = useState<"auto" | "manual">("auto");
  const [wpUrl, setWpUrl] = useState("");
  const [wpApiKey, setWpApiKey] = useState("");
  const [isConnectingWp, setIsConnectingWp] = useState(false);
  const [wpConnectError, setWpConnectError] = useState("");
  const [handshakeStatus, setHandshakeStatus] = useState<"idle" | "pending" | "approved" | "error">("idle");
  const [connectToken, setConnectToken] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [scrapedContent, setScrapedContent] = useState("");
  const [showPromptTemplates, setShowPromptTemplates] = useState(false);
  
  // Enhanced prompt templates
  const promptTemplates = [
    { 
      id: 1, 
      name: "SEO-Optimized Blog Post", 
      prompt: "Write a comprehensive, SEO-optimized blog post that includes relevant statistics, expert insights, and actionable tips. Structure with clear headings (H1, H2, H3), bullet points, and a compelling call-to-action. Include meta description and focus on readability.",
      category: "SEO",
      icon: "🔍"
    },
    { 
      id: 2, 
      name: "Local Business Focus", 
      prompt: "Create content that emphasizes local expertise and community involvement. Include location-specific details, local landmarks references, and address common local customer pain points. Focus on building trust with local audience.",
      category: "Local",
      icon: "📍"
    },
    { 
      id: 3, 
      name: "Technical Authority", 
      prompt: "Write in-depth technical content that demonstrates industry expertise. Include technical specifications, detailed explanations, code examples, and cite authoritative sources to build E-E-A-T. Use professional terminology.",
      category: "Technical",
      icon: "⚙️"
    },
    { 
      id: 4, 
      name: "Problem-Solution Format", 
      prompt: "Structure the content around identifying customer problems and presenting clear solutions. Use real-world examples, case studies, and step-by-step guidance to illustrate effectiveness. Include before/after scenarios.",
      category: "Solution",
      icon: "💡"
    },
    { 
      id: 5, 
      name: "Comparison Guide", 
      prompt: "Create a detailed comparison guide that helps readers make informed decisions. Include pros and cons, feature comparisons, pricing tables, and clear recommendations. Use comparison charts and visual elements.",
      category: "Comparison",
      icon: "⚖️"
    },
    { 
      id: 6, 
      name: "How-To Tutorial", 
      prompt: "Write a step-by-step tutorial with numbered instructions, helpful tips, common mistakes to avoid, and visual descriptions for each step. Include prerequisites, tools needed, and expected outcomes.",
      category: "Tutorial",
      icon: "📝"
    },
    { 
      id: 7, 
      name: "Industry News Analysis", 
      prompt: "Analyze recent industry trends and news. Provide expert commentary, implications for businesses, and future predictions. Include data points and credible sources.",
      category: "News",
      icon: "📰"
    },
    { 
      id: 8, 
      name: "Case Study", 
      prompt: "Write a detailed case study with client background, challenges faced, solutions implemented, and measurable results. Include testimonials and key performance indicators.",
      category: "Case Study",
      icon: "📊"
    }
  ];

  useEffect(() => {
    loadAnalysisData();
  }, []);

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

  const handleAddLocation = () => {
    if (locationInput.trim() && !selectedLocations.includes(locationInput.trim())) {
      setSelectedLocations([...selectedLocations, locationInput.trim()]);
      setLocationInput("");
    }
  };

  const handleRemoveLocation = (location: string) => {
    setSelectedLocations(selectedLocations.filter(l => l !== location));
  };

  const handleAddPostingTime = () => {
    if (postingTimes.length < 5) {
      setPostingTimes([...postingTimes, "12:00"]);
    }
  };

  const handleRemovePostingTime = (index: number) => {
    if (postingTimes.length > 1) {
      setPostingTimes(postingTimes.filter((_, i) => i !== index));
    }
  };

  const handleUpdatePostingTime = (index: number, time: string) => {
    const newTimes = [...postingTimes];
    newTimes[index] = time;
    setPostingTimes(newTimes);
  };

  const checkPastDate = () => {
    const start = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    
    if (start < today) {
      setPastDateMode("delayed");
      return true;
    }
    setPastDateMode("normal");
    return false;
  };

  useEffect(() => {
    checkPastDate();
  }, [startDate]);

  // Auto-generate topics when entering step 3
  useEffect(() => {
    if (currentStep === 3 && generatedTopics.length === 0 && !isGeneratingTopics && !isLoadingAnalysis) {
      handleGenerateTopics();
    }
  }, [currentStep, isLoadingAnalysis]);

  // Auto-generate LSI keywords when user adds keywords
  const generateLSIKeywords = async (seedKeywords: string[]) => {
    if (seedKeywords.length === 0 || isGeneratingLSI) return;
    
    setIsGeneratingLSI(true);
    try {
      const response = await fetch("/api/content/generate-lsi-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seedKeywords,
          count: Math.max(totalPosts + 10, 40), // Generate more than post count
          locations: selectedLocations,
        }),
      });
      
      const result = await response.json();
      if (result.success && result.keywords) {
        setGeneratedLSIKeywords(result.keywords);
        // Add LSI keywords to userKeywords (excluding duplicates)
        const newKeywords = result.keywords.filter((k: string) => 
          !userKeywords.includes(k) && !seedKeywords.includes(k)
        );
        setUserKeywords(prev => [...prev, ...newKeywords]);
      }
    } catch (err) {
      console.error("Failed to generate LSI keywords:", err);
    } finally {
      setIsGeneratingLSI(false);
    }
  };

  const loadAnalysisData = async () => {
    setIsLoadingAnalysis(true);
    try {
      const response = await fetch("/api/content/auto-discovery?crawlRequestId=latest");
      const data = await response.json();
      if (data.success && data.data) {
        setAnalysisData(data.data);
        // Don't auto-select default locations - let user add their own
        // if (data.data.locations?.length > 0) {
        //   setSelectedLocations(data.data.locations.slice(0, 3));
        // }
        
        // Use scraped content from the API response (fetched from database)
        if (data.data.scrapedContent) {
          setScrapedContent(data.data.scrapedContent);
          console.log("[Auto Pilot] Scraped content loaded, length:", data.data.scrapedContent.length);
        }
      }
      
      const historyResponse = await fetch("/api/content/history?limit=1");
      const historyData = await historyResponse.json();
      if (historyData.analyses?.[0]?.analysisOutput) {
        let outputData = historyData.analyses[0].analysisOutput;
        if (outputData.json) outputData = outputData.json;
        const contentContext = outputData.contentContext || {};
        setAnalysisData(prev => ({
          ...prev,
          services: prev?.services || [],
          locations: prev?.locations || [],
          aboutSummary: contentContext.businessSummary || prev?.aboutSummary || "",
          targetAudience: contentContext.audiencePersona || prev?.targetAudience || "",
          brandTone: contentContext.tone || prev?.brandTone || "professional",
          dominantKeywords: contentContext.dominantKeywords || [],
          pages: outputData.pages || [],
        }));
      }
    } catch (err) {
      console.error("Failed to load analysis data:", err);
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !userKeywords.includes(keywordInput.trim())) {
      const newKeyword = keywordInput.trim();
      const updatedKeywords = [...userKeywords, newKeyword];
      setUserKeywords(updatedKeywords);
      setKeywordInput("");
      
      // Auto-generate LSI keywords after adding a keyword
      // Only generate if we have at least 1 keyword and haven't generated yet
      if (updatedKeywords.length >= 1 && generatedLSIKeywords.length === 0) {
        generateLSIKeywords(updatedKeywords);
      }
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setUserKeywords(userKeywords.filter(k => k !== keyword));
  };

  const handleKeywordFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const keywords = text.split(/[\n,]/).map(k => k.trim()).filter(k => k.length > 0);
        setUserKeywords(prev => [...new Set([...prev, ...keywords])]);
      };
      reader.readAsText(file);
    }
  };

  const generateScheduledDates = (count: number): Date[] => {
    const dates: Date[] = [];
    let currentDate = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    let postsThisDay = 0;
    let timeIndex = 0;
    
    // Calculate maximum possible posts based on date range and posts per day
    let maxPossiblePosts = count;
    if (end) {
      const daysInRange = Math.ceil((end.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      maxPossiblePosts = Math.min(count, daysInRange * postsPerDay);
    }
    
    for (let i = 0; i < maxPossiblePosts; i++) {
      // If we have an end date and we've passed it, stop generating
      if (end && currentDate > end) {
        break;
      }
      
      dates.push(new Date(currentDate));
      postsThisDay++;
      
      // Move to next posting time or next day
      if (postsThisDay >= postsPerDay) {
        postsThisDay = 0;
        timeIndex = 0;
        currentDate.setDate(currentDate.getDate() + 1);
      } else {
        // Use posting times in round-robin if available, otherwise use same time
        timeIndex = postingTimes.length > 0 ? (timeIndex + 1) % postingTimes.length : 0;
      }
    }
    
    return dates;
  };

  const handleGenerateTopics = async () => {
    setIsGeneratingTopics(true);
    setTopicsError(null);
    try {
      // Generate exactly the number of topics user requested (no limit of 30)
      const selectedTopicsCount = totalPosts;
      const scheduledDates = generateScheduledDates(selectedTopicsCount);
      
      const response = await fetch("/api/content/ai-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedService: analysisData?.services?.[0] || "Technology Services",
          locations: selectedLocations,
          brandTone: analysisData?.brandTone || "professional",
          targetAudience: analysisData?.targetAudience || "Business professionals",
          aboutSummary: analysisData?.aboutSummary || "",
          count: selectedTopicsCount,
          userKeywords: userKeywords,
        }),
      });

      const result = await response.json();
      if (result.success && result.topics) {
        const topics: GeneratedTopic[] = result.topics.map((topic: any, index: number) => {
          const timeIndex = index % postingTimes.length;
          return {
            id: `topic_${Date.now()}_${index}`,
            title: topic.title,
            primaryKeywords: topic.primaryKeywords || [],
            secondaryKeywords: topic.secondaryKeywords || [],
            userKeywords: userKeywords.slice(0, 3),
            scheduledDate: scheduledDates[index] || new Date(),
            scheduledTime: postingTimes[timeIndex],
            selected: index < totalPosts,
            contentType: topic.contentType || "blog post",
            description: topic.description || "",
          };
        });
        setGeneratedTopics(topics);
      } else {
        throw new Error(result.error || "No topics generated");
      }
    } catch (err) {
      setTopicsError(err instanceof Error ? err.message : "Failed to generate topics");
    } finally {
      setIsGeneratingTopics(false);
    }
  };

  const handleToggleTopic = (topicId: string) => {
    setGeneratedTopics(prev => prev.map(t => t.id === topicId ? { ...t, selected: !t.selected } : t));
  };

  const handleGenerateKeywordsForTopics = async () => {
    setIsGeneratingKeywords(true);
    const selectedTopics = generatedTopics.filter(t => t.selected);
    
    for (let i = 0; i < selectedTopics.length; i++) {
      setCurrentKeywordTopicIndex(i);
      try {
        const response = await fetch("/api/content/ai-topics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            selectedService: selectedTopics[i].title,
            locations: selectedLocations,
            brandTone: analysisData?.brandTone || "professional",
            count: 1,
          }),
        });
        const result = await response.json();
        if (result.success && result.topics?.[0]) {
          const topicKeywords = result.topics[0];
          setGeneratedTopics(prev => prev.map(t => {
            if (t.id === selectedTopics[i].id) {
              return {
                ...t,
                primaryKeywords: [...topicKeywords.primaryKeywords.filter((k: string) => k.split(' ').length >= 2), ...t.userKeywords].slice(0, 5),
                secondaryKeywords: topicKeywords.secondaryKeywords.filter((k: string) => k.split(' ').length >= 2).slice(0, 5),
              };
            }
            return t;
          }));
        }
      } catch (err) {
        console.error(`Failed to generate keywords for topic ${i}:`, err);
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    setIsGeneratingKeywords(false);
  };

  const handleGenerateAllContent = async () => {
    setIsGeneratingContent(true);
    const selectedTopics = generatedTopics.filter(t => t.selected);
    
    const initialContents: GeneratedContent[] = selectedTopics.map(topic => ({
      id: `content_${topic.id}`,
      topicId: topic.id,
      title: topic.title,
      content: "",
      wordCount: 0,
      status: "pending",
      scheduledDate: topic.scheduledDate,
      scheduledTime: topic.scheduledTime,
      keywords: [...topic.primaryKeywords, ...topic.userKeywords],
    }));
    setGeneratedContents(initialContents);
    
    for (let i = 0; i < selectedTopics.length; i++) {
      setCurrentContentIndex(i);
      const topic = selectedTopics[i];
      setGeneratedContents(prev => prev.map(c => c.topicId === topic.id ? { ...c, status: "generating" } : c));
      
      try {
        const response = await fetch("/api/content/bulk-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            selectedTopics: [{ title: topic.title, primaryKeywords: topic.primaryKeywords, secondaryKeywords: topic.secondaryKeywords, contentType: topic.contentType, description: topic.description, searchIntent: "informational" }],
            selectedLocations: selectedLocations,
            service: analysisData?.services?.[0] || topic.title,
            brandTone: analysisData?.brandTone || "professional",
            targetAudience: analysisData?.targetAudience || "Business professionals",
            aboutSummary: analysisData?.aboutSummary || "",
            generateImages: true,
            singlePage: true,
            customPrompt: customPrompt,
            scrapedContent: scrapedContent,
          }),
        });
        const result = await response.json();
        const taskId = result.taskId;
        
        let attempts = 0;
        while (attempts < 60) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          attempts++;
          const pollResponse = await fetch(`/api/content/bulk-generate?taskId=${taskId}`);
          const pollData = await pollResponse.json();
          if (pollData.success && pollData.results?.[0]) {
            const content = pollData.results[0];
            setGeneratedContents(prev => prev.map(c => c.topicId === topic.id ? { ...c, title: content.title || topic.title, content: content.content, wordCount: content.wordCount || 0, imageUrl: content.imageUrl, status: "completed" } : c));
            break;
          } else if (pollData.status === "FAILED" || pollData.status === "CRASHED") {
            throw new Error(pollData.error || "Generation failed");
          }
        }
      } catch (err) {
        setGeneratedContents(prev => prev.map(c => c.topicId === topic.id ? { ...c, status: "failed", error: err instanceof Error ? err.message : "Failed to generate" } : c));
      }
    }
    setIsGeneratingContent(false);
  };

  const handleApproveContent = (contentId: string) => {
    setGeneratedContents(prev => prev.map(c => c.id === contentId ? { ...c, status: "approved" } : c));
  };

  const handlePublishNow = async (contentId: string) => {
    const content = generatedContents.find(c => c.id === contentId);
    if (!content) return;
    
    // Get WordPress connection from localStorage
    const wpConnection = localStorage.getItem('wp_connection_global');
    if (!wpConnection) {
      alert('WordPress not connected. Please connect WordPress from the Audit Report page first.');
      return;
    }

    const { siteUrl, apiKey } = JSON.parse(wpConnection);
    if (!siteUrl || !apiKey) {
      alert('WordPress connection incomplete. Please reconnect from the Audit Report page.');
      return;
    }
    
    try {
      // Auto-detect category based on content keywords and title
      const detectedCategory = detectCategory(content.title, content.keywords);
      
      // Prepare content with proper formatting
      const formattedContent = formatContentForWordPress(content.content);
      
      // Use our Next.js API route with WordPress connection details
      const response = await fetch("/api/wordpress/publish", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          title: content.title.replace(/^Title:\s*["']?|["']?$/g, '').trim(), // Clean up title formatting
          content: formattedContent,
          location: selectedLocations[0] || "Pakistan", 
          contentType: "blog post", 
          imageUrl: content.imageUrl,
          primaryKeywords: content.keywords, 
          status: "publish",
          wordpressConnection: { siteUrl, apiKey }, // Pass connection details
        }),
      });
      
      const data = await response.json();
      
      if (data.success && data.postId) {
        // Get the post URL from response
        const postUrl = data.post?.link || data.url || '';
        const editUrl = data.post?.edit_url || data.editUrl || '';
        
        // Update content state with published URL
        setGeneratedContents(prev => prev.map(c => c.id === contentId ? { 
          ...c, 
          status: "published",
          publishedUrl: postUrl,
          wordpressPostId: data.postId
        } : c));
        
        // Show detailed success message including image status and link
        const imageStatus = data.imageStatus;
        console.log("[WordPress Publish] Image status from API:", imageStatus);
        
        let message = `✅ Published successfully!\n\n📄 Post ID: ${data.postId}`;
        
        if (postUrl) {
          message += `\n🔗 View Post: ${postUrl}`;
        }
        
        if (imageStatus) {
          if (imageStatus.setAsFeatured && imageStatus.featuredMediaId > 0) {
            message += `\n🖼️ Featured image set successfully! (ID: ${imageStatus.featuredMediaId})`;
          } else if (imageStatus.sent) {
            message += `\n⚠️ Image sent but not set as featured`;
            // Log detailed error info
            console.warn("[WordPress Publish] Image not set. Details:", imageStatus);
          }
        }
        
        // Open post in new tab option
        const openPost = window.confirm(message + '\n\nWould you like to view the published post?');
        if (openPost && postUrl) {
          window.open(postUrl, '_blank');
        }
      } else {
        alert(`Failed to publish: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("[WordPress Publish] Error:", err);
      alert('Failed to publish to WordPress. Check your connection.');
    }
  };

  // Helper function to detect category based on content
  const detectCategory = (title: string, keywords: string[]): string => {
    const titleLower = title.toLowerCase();
    const keywordsLower = keywords.map(k => k.toLowerCase());
    
    // Category mapping based on common patterns
    const categoryMap: Record<string, string[]> = {
      'Technology': ['technology', 'tech', 'software', 'ai', 'machine learning', 'data', 'cybersecurity', 'programming'],
      'Business': ['business', 'marketing', 'sales', 'strategy', 'management', 'entrepreneur'],
      'Marketing': ['marketing', 'seo', 'content', 'social media', 'advertising', 'brand'],
      'Design': ['design', 'ui', 'ux', 'graphic', 'web design', 'creative'],
      'Development': ['development', 'coding', 'programming', 'web development', 'app'],
      'Consulting': ['consulting', 'advisory', 'solutions', 'expertise', 'professional'],
    };
    
    for (const [category, terms] of Object.entries(categoryMap)) {
      if (terms.some(term => titleLower.includes(term) || keywordsLower.some(k => k.includes(term)))) {
        return category;
      }
    }
    
    return 'Uncategorized';
  };

  // Helper function to format content for WordPress
  const formatContentForWordPress = (content: string): string => {
    // Clean up title formatting in content
    let formatted = content.replace(/^Title:\s*["']?|["']?$/gm, '');
    
    // Ensure proper heading formatting
    formatted = formatted.replace(/^(#+)/gm, '$1 ');
    
    // Add proper paragraph breaks
    formatted = formatted.replace(/\n\n/g, '</p>\n<p>');
    formatted = '<p>' + formatted + '</p>';
    
    // Convert markdown-style bold to HTML
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    return formatted;
  };

  // Helper function to generate excerpt
  const generateExcerpt = (content: string, maxLength: number = 150): string => {
    // Remove HTML tags and get plain text
    const plainText = content.replace(/<[^>]*>/g, '').replace(/^Title:\s*["']?|["']?$/gm, '');
    
    // Get first meaningful sentence or truncate
    const sentences = plainText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length > 0) {
      let excerpt = sentences[0].trim();
      if (excerpt.length > maxLength) {
        excerpt = excerpt.substring(0, maxLength).replace(/\s+\w*$/, '') + '...';
      }
      return excerpt;
    }
    
    return plainText.substring(0, maxLength).replace(/\s+\w*$/, '') + '...';
  };

  // Check WordPress connection status
  const isWordPressConnected = () => {
    const wpConnection = localStorage.getItem('wp_connection_global');
    if (!wpConnection) return false;
    const { siteUrl, apiKey } = JSON.parse(wpConnection);
    return !!(siteUrl && apiKey);
  };

  const handleSaveAllScheduled = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const approvedContent = generatedContents.filter(c => c.status === "approved" || c.status === "completed");
      const response = await fetch("/api/scheduled-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          posts: approvedContent.map(c => ({ title: c.title, content: c.content, wordCount: c.wordCount, featuredImageUrl: c.imageUrl, scheduledFor: new Date(c.scheduledDate).toISOString(), scheduledTime: c.scheduledTime, focusKeyword: c.keywords[0] || "", secondaryKeywords: c.keywords.slice(1), postStatus: "scheduled" })),
        }),
      });
      if (!response.ok) throw new Error("Failed to save scheduled posts");
      setGeneratedContents(prev => prev.map(c => (c.status === "approved" || c.status === "completed") ? { ...c, status: "approved" } : c));
      alert(`Successfully saved ${approvedContent.length} posts to schedule!`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: 
        return postsPerDay > 0 && totalPosts > 0 && startDate && postingTimes.length > 0 && 
               (!endDate || new Date(endDate) >= new Date(startDate));
      case 2: return selectedLocations.length > 0;
      case 3: return generatedTopics.filter(t => t.selected).length > 0;
      case 4: return generatedTopics.filter(t => t.selected && t.primaryKeywords.length > 0).length > 0;
      case 5: return generatedContents.filter(c => c.status === "completed" || c.status === "approved").length > 0;
      default: return true;
    }
  };

  if (isLoadingAnalysis) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading website context...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* WordPress Connection Warning */}
      {!isWordPressConnected() && (
        <div className="max-w-4xl mx-auto mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
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

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-medium transition-all ${currentStep > step.id ? "bg-green-600 text-white" : currentStep === step.id ? "bg-blue-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"}`}>
                {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
              </div>
              {index < STEPS.length - 1 && <div className={`w-12 md:w-20 h-1 mx-2 rounded transition-colors ${currentStep > step.id ? "bg-green-600" : "bg-slate-200 dark:bg-slate-700"}`} />}
            </div>
          ))}
        </div>
        <div className="text-center mt-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{STEPS[currentStep - 1].title}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">{STEPS[currentStep - 1].description}</p>
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-4xl mx-auto">
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center"><Calendar className="w-5 h-5 text-white" /></div>
                <div><h3 className="font-semibold text-slate-900 dark:text-slate-100">Schedule Configuration</h3><p className="text-sm text-slate-600 dark:text-slate-400">Set up your monthly content schedule</p></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Posts Per Day</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="5" 
                    value={postsPerDay} 
                    onChange={(e) => setPostsPerDay(parseInt(e.target.value) || 1)} 
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Total Posts for Month</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="60" 
                    value={totalPosts} 
                    onChange={(e) => setTotalPosts(parseInt(e.target.value) || 30)} 
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Start Date</label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)} 
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">End Date (Optional)</label>
                  <input 
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)} 
                    min={startDate}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100" 
                  />
                </div>
              </div>
              
              {/* Posting Times Section */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Posting Times</label>
                  {postingTimes.length < 5 && (
                    <button
                      onClick={handleAddPostingTime}
                      className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                    >
                      + Add Time
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {postingTimes.map((time, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => handleUpdatePostingTime(index, e.target.value)}
                        className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                      />
                      {postingTimes.length > 1 && (
                        <button
                          onClick={() => handleRemovePostingTime(index)}
                          className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Past Date Handling */}
              {pastDateMode !== "normal" && (
                <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <h4 className="font-medium text-amber-800 dark:text-amber-200">Past Date Detected</h4>
                  </div>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
                    Your start date is in the past. How would you like to handle the missed posts?
                  </p>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        value="instant"
                        checked={pastDateMode === "instant"}
                        onChange={(e) => setPastDateMode(e.target.value as "instant" | "delayed" | "normal")}
                        className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Publish Instantly</p>
                        <p className="text-xs text-amber-600 dark:text-amber-400">Publish all past posts immediately</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        value="delayed"
                        checked={pastDateMode === "delayed"}
                        onChange={(e) => setPastDateMode(e.target.value as "instant" | "delayed" | "normal")}
                        className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Publish with Delay</p>
                        <p className="text-xs text-amber-600 dark:text-amber-400">Space out past posts with a delay</p>
                      </div>
                    </label>
                  </div>
                  
                  {pastDateMode === "delayed" && (
                    <div className="mt-4 flex items-center gap-3">
                      <label className="text-sm font-medium text-amber-700 dark:text-amber-300">Delay Interval:</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={delayInterval}
                        onChange={(e) => setDelayInterval(parseInt(e.target.value) || 1)}
                        className="w-20 px-3 py-1 border border-amber-300 dark:border-amber-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-amber-900/30 dark:text-amber-100"
                      />
                      <select
                        value={delayUnit}
                        onChange={(e) => setDelayUnit(e.target.value as "hours" | "days")}
                        className="px-3 py-1 border border-amber-300 dark:border-amber-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-amber-900/30 dark:text-amber-100"
                      >
                        <option value="hours">Hours</option>
                        <option value="days">Days</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
              
              <div className="mt-6 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <BarChart3 className="w-4 h-4" />
                  <span>
                    {(() => {
                      const actualPosts = endDate ? 
                        Math.min(totalPosts, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24) + 1) * postsPerDay) :
                        totalPosts;
                      const daysNeeded = Math.ceil(actualPosts / postsPerDay);
                      return `${actualPosts} posts over ${daysNeeded} days, starting ${new Date(startDate).toLocaleDateString()}${endDate ? ` ending ${new Date(endDate).toLocaleDateString()}` : ''}`;
                    })()}
                  </span>
                </div>
              </div>
            </div>
            {analysisData && (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="flex items-center gap-2 mb-4"><Globe className="w-5 h-5 text-blue-600" /><h3 className="font-semibold text-slate-900 dark:text-slate-100">Website Context (Auto-loaded)</h3></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"><p className="text-xs text-slate-500 dark:text-slate-400">Pages Analyzed</p><p className="text-xl font-bold text-slate-900 dark:text-slate-100">{analysisData.pages?.length || 0}</p></div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"><p className="text-xs text-slate-500 dark:text-slate-400">Services</p><p className="text-xl font-bold text-slate-900 dark:text-slate-100">{analysisData.services?.length || 0}</p></div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"><p className="text-xs text-slate-500 dark:text-slate-400">Brand Tone</p><p className="text-sm font-medium text-slate-900 dark:text-slate-100 capitalize">{analysisData.brandTone || "Professional"}</p></div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"><p className="text-xs text-slate-500 dark:text-slate-400">Keywords</p><p className="text-xl font-bold text-slate-900 dark:text-slate-100">{analysisData.dominantKeywords?.length || 0}</p></div>
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-2 mb-4"><Tag className="w-5 h-5 text-blue-600" /><h3 className="font-semibold text-slate-900 dark:text-slate-100">Your Target Keywords</h3></div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Add your own keywords to rank on Google.</p>
              <div className="flex gap-2 mb-4">
                <input type="text" value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()} placeholder="Enter keyword (e.g., AI consulting services)" className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100" />
                <button onClick={handleAddKeyword} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Add</button>
              </div>
              <label className="flex items-center gap-2 px-4 py-2 mb-4 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors w-fit">
                <Upload className="w-4 h-4 text-slate-500" /><span className="text-sm text-slate-600 dark:text-slate-400">Upload Keywords File (.txt, .csv)</span>
                <input type="file" accept=".txt,.csv" onChange={handleKeywordFileUpload} className="hidden" />
              </label>
              {isGeneratingLSI && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-sm text-blue-700 dark:text-blue-300">Generating related LSI keywords for better SEO...</span>
                  </div>
                </div>
              )}
              {userKeywords.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {generatedLSIKeywords.length > 0 
                        ? `${userKeywords.length} keywords (including ${generatedLSIKeywords.length} AI-generated LSI keywords)`
                        : `${userKeywords.length} keywords`
                      }
                    </p>
                    {generatedLSIKeywords.length === 0 && userKeywords.length > 0 && !isGeneratingLSI && (
                      <button 
                        onClick={() => generateLSIKeywords(userKeywords)}
                        className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        Generate more related keywords
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                    {userKeywords.map((keyword, index) => {
                      const isLSI = generatedLSIKeywords.includes(keyword);
                      return (
                        <span 
                          key={index} 
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm ${
                            isLSI 
                              ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" 
                              : "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                          }`}
                        >
                          {keyword}
                          <button onClick={() => handleRemoveKeyword(keyword)} className="ml-1 hover:opacity-70"><X className="w-3 h-3" /></button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-2 mb-4"><MapPin className="w-5 h-5 text-blue-600" /><h3 className="font-semibold text-slate-900 dark:text-slate-100">Target Locations</h3></div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Add cities or regions where you want to target your content.</p>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddLocation()}
                  placeholder="Enter location (e.g., New York, London)"
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100"
                />
                <button onClick={handleAddLocation} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Add</button>
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
                <p className="text-sm text-slate-500 dark:text-slate-400 italic">No locations added yet. Content will be generated without location targeting.</p>
              )}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div><h3 className="font-semibold text-slate-900 dark:text-slate-100">AI-Generated Topics</h3><p className="text-sm text-slate-600 dark:text-slate-400">Review and select topics for your monthly content plan</p></div>
              {generatedTopics.length > 0 && (
                <button onClick={handleGenerateTopics} disabled={isGeneratingTopics} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {isGeneratingTopics ? <><Loader2 className="w-4 h-4 animate-spin" />Regenerating...</> : <><RefreshCw className="w-4 h-4" />Regenerate Topics</>}
                </button>
              )}
            </div>
            {topicsError && <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"><p className="text-sm text-red-700 dark:text-red-300">{topicsError}</p></div>}
            {isGeneratingTopics ? (
              <div className="text-center py-16 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                <div className="max-w-md mx-auto">
                  <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Generating {totalPosts} Topics...</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">AI is creating your personalized content plan based on your keywords and locations.</p>
                  <div className="w-full h-2 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 animate-pulse" style={{ width: '60%' }} />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">This may take a moment for {totalPosts} topics...</p>
                </div>
              </div>
            ) : generatedTopics.length > 0 ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {generatedTopics.map((topic, index) => (
                  <div key={topic.id} className={`p-4 rounded-xl border-2 transition-all ${topic.selected ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 opacity-60"}`}>
                    <div className="flex items-start gap-3">
                      <button onClick={() => handleToggleTopic(topic.id)} className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${topic.selected ? "bg-blue-600 border-blue-600" : "border-slate-300 dark:border-slate-600"}`}>{topic.selected && <Check className="w-3 h-3 text-white" />}</button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1"><span className="text-xs font-medium text-blue-600 dark:text-blue-400">#{index + 1}</span><span className="text-xs text-slate-500 dark:text-slate-400">{topic.scheduledDate.toLocaleDateString()} at {topic.scheduledTime}</span></div>
                        <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-1">{topic.title}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{topic.description}</p>
                        <div className="flex flex-wrap gap-1">{topic.primaryKeywords.slice(0, 3).map((kw, i) => (<span key={i} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs">{kw}</span>))}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700"><Sparkles className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" /><p className="text-slate-600 dark:text-slate-400">Topics will be generated automatically...</p></div>
            )}
            {generatedTopics.length > 0 && (
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <span className="text-sm text-slate-600 dark:text-slate-400">{generatedTopics.filter(t => t.selected).length} of {generatedTopics.length} topics selected</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setGeneratedTopics(prev => prev.map(t => ({ ...t, selected: true })))} className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400">Select All</button>
                  <span className="text-slate-300 dark:text-slate-600">|</span>
                  <button onClick={() => setGeneratedTopics(prev => prev.map(t => ({ ...t, selected: false })))} className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400">Deselect All</button>
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div><h3 className="font-semibold text-slate-900 dark:text-slate-100">AI Keyword Assignment</h3><p className="text-sm text-slate-600 dark:text-slate-400">Generating optimized keywords for each topic (2+ words for better SEO)</p></div>
              {!isGeneratingKeywords && <button onClick={handleGenerateKeywordsForTopics} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"><Zap className="w-4 h-4" />Generate Keywords</button>}
            </div>
            {isGeneratingKeywords && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-3"><Loader2 className="w-5 h-5 animate-spin text-blue-600" /><span className="text-sm text-blue-700 dark:text-blue-300">Generating keywords for topic {currentKeywordTopicIndex + 1} of {generatedTopics.filter(t => t.selected).length}...</span></div>
                <div className="mt-2 h-2 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden"><div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${((currentKeywordTopicIndex + 1) / generatedTopics.filter(t => t.selected).length) * 100}%` }} /></div>
              </div>
            )}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {generatedTopics.filter(t => t.selected).map((topic, index) => (
                <div key={topic.id} className={`p-4 rounded-xl border transition-all ${index < currentKeywordTopicIndex || (topic.primaryKeywords.length > 0 && !isGeneratingKeywords) ? "border-green-500 bg-green-50 dark:bg-green-900/20" : index === currentKeywordTopicIndex && isGeneratingKeywords ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 animate-pulse" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {index < currentKeywordTopicIndex || (topic.primaryKeywords.length > 0 && !isGeneratingKeywords) ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : index === currentKeywordTopicIndex && isGeneratingKeywords ? <Loader2 className="w-5 h-5 text-blue-600 animate-spin" /> : <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600" />}
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">{topic.title}</h4>
                  </div>
                  <div className="ml-7 space-y-2">
                    {topic.primaryKeywords.length > 0 && (<div><p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Primary Keywords:</p><div className="flex flex-wrap gap-1">{topic.primaryKeywords.map((kw, i) => (<span key={i} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">{kw}</span>))}</div></div>)}
                    {topic.userKeywords.length > 0 && (<div><p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Your Keywords:</p><div className="flex flex-wrap gap-1">{topic.userKeywords.map((kw, i) => (<span key={i} className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs">{kw}</span>))}</div></div>)}
                  </div>
                </div>
              ))}
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
                <div className="mb-4">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Categories:</span>
                    <div className="flex flex-wrap gap-1">
                      {[...new Set(promptTemplates.map(t => t.category))].map(category => (
                        <span key={category} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs">
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {promptTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => {
                          setCustomPrompt(template.prompt);
                          setShowPromptTemplates(false);
                        }}
                        className="p-4 text-left bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{template.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                              {template.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-3">
                              {template.prompt.substring(0, 120)}...
                            </p>
                            <span className="inline-block mt-2 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                              {template.category}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
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

        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center">
                    <Play className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">Content Generation</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Generating full content with featured images</p>
                  </div>
                </div>
                {!isGeneratingContent && generatedContents.length === 0 && (
                  <button 
                    onClick={handleGenerateAllContent} 
                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium shadow-lg hover:shadow-xl"
                  >
                    <Sparkles className="w-5 h-5" />
                    Start Generation
                  </button>
                )}
              </div>
              
              {isGeneratingContent && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-green-600" />
                        <span className="text-sm font-medium text-green-800 dark:text-green-200">
                          Generating content {currentContentIndex + 1} of {generatedTopics.filter(t => t.selected).length}
                        </span>
                      </div>
                      <span className="text-sm text-green-600 dark:text-green-400">
                        {Math.round(((currentContentIndex + 1) / generatedTopics.filter(t => t.selected).length) * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-green-200 dark:bg-green-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-600 transition-all duration-500 ease-out"
                        style={{ width: `${((currentContentIndex + 1) / generatedTopics.filter(t => t.selected).length) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                      Creating high-quality content with AI-powered writing and image generation...
                    </p>
                  </div>
                </div>
              )}
              
              {generatedContents.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Generated Content ({generatedContents.filter(c => c.status === "completed" || c.status === "approved").length}/{generatedContents.length})
                    </h4>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setGeneratedContents(prev => prev.map(c => ({ ...c, status: "approved" })))}
                        className="text-sm text-green-600 hover:text-green-700 dark:text-green-400"
                      >
                        Approve All
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {generatedContents.map((content, index) => (
                      <div 
                        key={content.id} 
                        className={`group relative bg-white dark:bg-slate-800 rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${
                          content.status === "completed" || content.status === "approved" 
                            ? "border-green-500 hover:shadow-lg" 
                            : content.status === "generating"
                            ? "border-blue-500 animate-pulse"
                            : content.status === "failed"
                            ? "border-red-500"
                            : "border-slate-200 dark:border-slate-700"
                        }`}
                        onClick={() => expandedContent === content.id ? setExpandedContent(null) : setExpandedContent(content.id)}
                      >
                        {/* Featured Image Header */}
                        <div className="relative h-48 bg-slate-100 dark:bg-slate-700">
                          {content.status === "generating" ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                                <p className="text-sm text-slate-600 dark:text-slate-400">Generating...</p>
                              </div>
                            </div>
                          ) : content.status === "pending" ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                <p className="text-sm text-slate-500">Waiting...</p>
                              </div>
                            </div>
                          ) : content.imageUrl ? (
                            <img 
                              src={content.imageUrl} 
                              alt={content.title} 
                              className="w-full h-full object-cover"
                              onError={(e) => { 
                                e.currentTarget.src = `https://picsum.photos/400/200?random=${index}`; 
                              }}
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 text-slate-400" />
                            </div>
                          )}
                          
                          {/* Status Badge */}
                          <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium ${
                            content.status === "completed" ? "bg-green-600 text-white" : 
                            content.status === "approved" ? "bg-blue-600 text-white" : 
                            content.status === "published" ? "bg-purple-600 text-white" : 
                            content.status === "generating" ? "bg-amber-600 text-white" : 
                            content.status === "failed" ? "bg-red-600 text-white" : 
                            "bg-slate-600 text-white"
                          }`}>
                            {content.status.charAt(0).toUpperCase() + content.status.slice(1)}
                          </div>
                        </div>
                        
                        {/* Content Details */}
                        <div className="p-5">
                          <h4 className="font-semibold text-lg text-slate-900 dark:text-slate-100 mb-3 line-clamp-2">
                            {content.title}
                          </h4>
                          
                          <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-4">
                            <span className="flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              {content.wordCount.toLocaleString()} words
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {content.scheduledDate.toLocaleDateString()}
                            </span>
                          </div>
                          
                          {/* Expandable Content Preview */}
                          {expandedContent === content.id && (
                            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                                  {content.content}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Action Buttons */}
                          <div className="flex items-center gap-3 mt-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                expandedContent === content.id ? setExpandedContent(null) : setExpandedContent(content.id);
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-medium"
                            >
                              <Eye className="w-4 h-4" />
                              {expandedContent === content.id ? "Hide" : "View"}
                            </button>
                            
                            {content.status === "completed" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApproveContent(content.id);
                                }}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                              >
                                Approve
                              </button>
                            )}
                            
                            {content.status === "approved" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePublishNow(content.id);
                                }}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                              >
                                Publish Now
                              </button>
                            )}
                            
                            {content.error && (
                              <span className="text-xs text-red-600 dark:text-red-400">
                                {content.error}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 6 && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-white" /></div><div><h3 className="font-semibold text-slate-900 dark:text-slate-100">Review & Save</h3><p className="text-sm text-slate-600 dark:text-slate-400">Save all approved content to your schedule</p></div></div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg text-center"><p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{generatedContents.length}</p><p className="text-xs text-slate-500">Total</p></div>
                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg text-center"><p className="text-2xl font-bold text-green-600">{generatedContents.filter(c => c.status === "completed" || c.status === "approved").length}</p><p className="text-xs text-slate-500">Ready</p></div>
                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg text-center"><p className="text-2xl font-bold text-purple-600">{generatedContents.filter(c => c.status === "published").length}</p><p className="text-xs text-slate-500">Published</p></div>
              </div>
              <button onClick={handleSaveAllScheduled} disabled={isSaving || generatedContents.filter(c => c.status === "completed" || c.status === "approved").length === 0} className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium">{isSaving ? <><Loader2 className="w-5 h-5 animate-spin" />Saving...</> : <><Save className="w-5 h-5" />Save All to Schedule ({generatedContents.filter(c => c.status === "completed" || c.status === "approved").length} posts)</>}</button>
              {saveError && <p className="text-sm text-red-600 dark:text-red-400 mt-2">{saveError}</p>}
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-4">Scheduled Posts Summary</h4>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {generatedContents.map((content, index) => (
                  <div key={content.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400 w-8">#{index + 1}</span>
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{content.title}</p><p className="text-xs text-slate-500 dark:text-slate-400">{content.scheduledDate.toLocaleDateString()} at {content.scheduledTime}</p></div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${content.status === "approved" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : content.status === "published" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" : content.status === "completed" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-300"}`}>{content.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="max-w-4xl mx-auto mt-8 flex items-center justify-between">
        <button onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))} disabled={currentStep === 1} className="inline-flex items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronLeft className="w-4 h-4" />Back</button>
        <button onClick={() => setCurrentStep(prev => Math.min(6, prev + 1))} disabled={!canProceed() || currentStep === 6} className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium">Continue<ChevronRight className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
