"use client";

import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer, Views, View } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Zap,
  Edit3,
  X,
  Save,
  Play,
  Loader2,
  Clock,
  FileText,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompletion } from "@ai-sdk/react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  useSortable,
  sortableKeyboardCoordinates,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: "PLANNED" | "GENERATING" | "READY" | "PUBLISHED" | "FAILED";
  content?: string;
  outline?: string;
  tone?: string;
  keywords?: string[];
  targetService?: string;
  targetServiceUrl?: string;
}

interface AISuggestion {
  id: string;
  type: "Blog Post" | "Whitepaper" | "Case Study" | "Guide" | "Infographic";
  title: string;
  reason: string;
  targetKeywords: string[];
  relatedServiceUrl?: string;
}

interface ContentContext {
  contentGaps: string[];
  dominantKeywords: Array<{
    term: string;
    density: "High" | "Medium" | "Low";
    pages: number;
  }>;
  audiencePersona: string;
  tone: string;
}

interface DraggableItem {
  id: string;
  type: "gap" | "suggestion";
  title: string;
  keywords?: string[];
  suggestionType?: string;
  reason?: string;
}

export default function ContentCommandCenter() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>(Views.MONTH);
  const [isAutoPlanning, setIsAutoPlanning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [editorTitle, setEditorTitle] = useState("");
  const [editorOutline, setEditorOutline] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [editorTone, setEditorTone] = useState("professional");
  const [isGenerating, setIsGenerating] = useState(false);

  // Content analysis data
  const [contentGaps, setContentGaps] = useState<string[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [contentContext, setContentContext] = useState<ContentContext | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);

  // Editor additional state
  const [editorKeywords, setEditorKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [featuredImage, setFeaturedImage] = useState<{ url: string; alt: string } | null>(null);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isRegeneratingSection, setIsRegeneratingSection] = useState(false);

  // Drag and drop state
  const [draggableItems, setDraggableItems] = useState<DraggableItem[]>([]);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Auto-Plan Wizard state
  const [isAutoPlanWizardOpen, setIsAutoPlanWizardOpen] = useState(false);
  const [autoPlanConfig, setAutoPlanConfig] = useState({
    frequency: 2, // posts per week
    days: [2, 4], // Tue (2), Thu (4) - 0=Sun, 1=Mon, etc.
    tone: "professional",
    focus: "mixed", // "mixed" or specific cluster
  });

  const { completion, complete } = useCompletion({
    api: "/api/generate/article",
    onFinish: () => {
      setIsGenerating(false);
    },
    onError: (error) => {
      console.error("Generation error:", error);
      setIsGenerating(false);
      alert(`Failed to generate article: ${error.message}`);
    },
  });

  const editor = useEditor({
    extensions: [StarterKit],
    content: editorContent || completion || "",
    onUpdate: ({ editor }) => {
      setEditorContent(editor.getHTML());
    },
    editable: !isGenerating,
    immediatelyRender: false,
  });

  const handleRegenerateSection = async () => {
    if (!editor) return;
    
    const { from, to, empty } = editor.state.selection;
    if (empty) return;

    const selectedText = editor.state.doc.textBetween(from, to);
    if (!selectedText) return;

    setIsRegeneratingSection(true);
    try {
      const response = await fetch("/api/regenerate/section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: selectedText,
          tone: editorTone,
          context: editorTitle,
        }),
      });

      if (!response.ok) throw new Error("Failed to regenerate section");

      const data = await response.json();
      if (data.rewrittenText) {
        editor.chain().focus().deleteSelection().insertContent(data.rewrittenText).run();
      }
    } catch (error) {
      console.error("Error regenerating section:", error);
      alert("Failed to regenerate section");
    } finally {
      setIsRegeneratingSection(false);
    }
  };

  useEffect(() => {
    loadEvents();
    loadContentAnalysis();
  }, [currentDate, view]);

  const loadContentAnalysis = async () => {
    setIsLoadingAnalysis(true);
    try {
      // Check if there's a recent analysis in localStorage
      const storedAnalysis = localStorage.getItem('contentAnalysis');
      if (storedAnalysis) {
        const data = JSON.parse(storedAnalysis);
        if (data.analysisOutput?.contentContext) {
          setContentContext(data.analysisOutput.contentContext);
          setContentGaps(data.analysisOutput.contentContext.contentGaps || []);
          setAiSuggestions(data.analysisOutput.aiSuggestions || []);

          // Create draggable items from content gaps and AI suggestions
          const gaps: DraggableItem[] = (data.analysisOutput.contentContext.contentGaps || []).map((gap: string, i: number) => ({
            id: `gap-${Date.now()}-${i}`,
            type: "gap",
            title: gap,
          }));

          const suggestions: DraggableItem[] = (data.analysisOutput.aiSuggestions || []).map((s: any, i: number) => ({
            id: `suggestion-${Date.now()}-${i}`,
            type: "suggestion",
            title: s.title,
            keywords: s.targetKeywords || [],
            suggestionType: s.type,
            reason: s.reason,
          }));

          setDraggableItems([...gaps, ...suggestions]);
        }
      }
    } catch (error) {
      console.error("Error loading content analysis:", error);
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    // Check if dropped on a calendar day
    if (over.id.toString().startsWith("day-")) {
      const dateStr = over.id.toString().replace("day-", "");
      const droppedDate = new Date(dateStr);
      
      // Find the dragged item
      const item = draggableItems.find((i) => i.id === active.id);
      if (!item) return;

      // Create a new calendar event with full context
      const newEvent: CalendarEvent = {
        id: `scheduled-${Date.now()}`,
        title: item.title,
        start: droppedDate,
        end: new Date(droppedDate.getTime() + 2 * 60 * 60 * 1000),
        status: "PLANNED",
        keywords: item.keywords || [],
        outline: "",
        tone: "professional",
      };

      // Add to events
      setEvents([...events, newEvent]);

      // Remove from draggable items
      setDraggableItems(draggableItems.filter((i) => i.id !== active.id));

      // Save to database with full context
      try {
        await fetch("/api/posts/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: newEvent.id,
            title: newEvent.title,
            status: "PLANNED",
            scheduledFor: droppedDate.toISOString(),
            keywords: newEvent.keywords,
            targetService: item.type === "suggestion" ? item.suggestionType : null,
            targetServiceUrl: item.type === "suggestion" ? item.reason : null,
            tone: newEvent.tone,
            approvalStatus: "PENDING",
          }),
        });
      } catch (error) {
        console.error("Error saving scheduled content:", error);
      }
    }
  };

  const loadEvents = async () => {
    try {
      const response = await fetch("/api/posts/update");
      const data = await response.json();
      if (data.posts && data.posts.length > 0) {
        const calendarEvents: CalendarEvent[] = data.posts.map((post: any) => ({
          id: post.id,
          title: post.title,
          start: new Date(post.scheduledFor),
          end: new Date(new Date(post.scheduledFor).getTime() + 2 * 60 * 60 * 1000),
          status: post.status,
          content: post.content,
          outline: post.outline,
          tone: post.tone,
          keywords: post.keywords,
          targetService: post.targetService,
          targetServiceUrl: post.targetServiceUrl,
        }));
        setEvents(calendarEvents);
      }
    } catch (error) {
      console.error("Error loading events:", error);
    }
  };

  const handleAutoPlanMonth = () => {
    setIsAutoPlanWizardOpen(true);
  };

  const handleGenerateAutoPlan = async () => {
    setIsAutoPlanning(true);
    setIsAutoPlanWizardOpen(false);
    
    try {
      const response = await fetch("/api/monthly-plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          services: [],
          contentGaps: contentGaps,
          postsPerWeek: autoPlanConfig.frequency,
          tone: autoPlanConfig.tone,
          preferredDays: autoPlanConfig.days,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate plan");

      const data = await response.json();
      
      // Create draft events from the plan, scheduling them on preferred days
      const newEvents: CalendarEvent[] = [];
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      
      let dayIndex = 0;
      let weekCount = 0;
      
      // Find the first preferred day in the current month
      let currentDate = new Date(year, month, 1);
      while (!autoPlanConfig.days.includes(currentDate.getDay())) {
        currentDate.setDate(currentDate.getDate() + 1);
      }

      data.plan.forEach((item: any, index: number) => {
        // Schedule on preferred days
        const startDate = new Date(currentDate);
        startDate.setHours(10, 0, 0, 0);

        newEvents.push({
          id: `planned-${Date.now()}-${index}`,
          title: item.title,
          start: startDate,
          end: new Date(startDate.getTime() + 2 * 60 * 60 * 1000),
          status: "PLANNED",
          outline: item.outline,
          tone: autoPlanConfig.tone,
          keywords: item.keywords || [],
        });

        // Move to next preferred day
        dayIndex = (dayIndex + 1) % autoPlanConfig.days.length;
        if (dayIndex === 0) weekCount++;
        
        currentDate.setDate(currentDate.getDate() + 1);
        while (!autoPlanConfig.days.includes(currentDate.getDay())) {
          currentDate.setDate(currentDate.getDate() + 1);
        }
      });

      setEvents([...events, ...newEvents]);
    } catch (error) {
      console.error("Error auto-planning:", error);
      alert("Failed to auto-plan month. Please try again.");
    } finally {
      setIsAutoPlanning(false);
    }
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setEditorTitle(event.title);
    setEditorOutline(event.outline || "");
    setEditorContent(event.content || "");
    setEditorTone(event.tone || "professional");
    setEditorKeywords(event.keywords || []);
    setApprovalStatus("PENDING");
    setIsEditorOpen(true);
  };

  const handleSubmitForReview = async () => {
    if (!selectedEvent) return;
    setIsSubmittingReview(true);
    try {
      const content = editor?.getHTML() || completion || "";
      await fetch("/api/posts/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedEvent.id,
          content,
          status: "READY",
          approvalStatus: "PENDING",
        }),
      });
      setApprovalStatus("PENDING");
      alert("Submitted for review!");
      loadEvents();
    } catch (error) {
      console.error("Error submitting for review:", error);
      alert("Failed to submit for review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleApproveAndSchedule = async () => {
    if (!selectedEvent) return;
    setIsSubmittingReview(true);
    try {
      await fetch("/api/posts/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedEvent.id,
          approvalStatus: "APPROVED",
        }),
      });
      setApprovalStatus("APPROVED");
      alert("Approved and ready to publish!");
      loadEvents();
    } catch (error) {
      console.error("Error approving:", error);
      alert("Failed to approve");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !editorKeywords.includes(newKeyword.trim())) {
      setEditorKeywords([...editorKeywords, newKeyword.trim()]);
      setNewKeyword("");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setEditorKeywords(editorKeywords.filter(k => k !== keyword));
  };

  const handleGenerateOutline = async () => {
    if (!editorTitle) {
      alert("Please enter a title first");
      return;
    }

    setIsGeneratingOutline(true);
    try {
      const response = await fetch("/api/content/generate-outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editorTitle,
          aiKeywords: editorKeywords,
          userKeywords: [],
          promotedService: "",
          serviceContext: "",
          tone: editorTone,
        }),
      });

      const data = await response.json();
      if (data.outline) {
        setEditorOutline(data.outline);
      }
    } catch (error) {
      console.error("Error generating outline:", error);
      alert("Failed to generate outline");
    } finally {
      setIsGeneratingOutline(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!editorTitle) {
      alert("Please enter a title first");
      return;
    }

    setIsGeneratingImage(true);
    try {
      const response = await fetch("/api/generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editorTitle,
          keyword: editorKeywords[0] || "",
          businessType: "",
          style: "professional",
        }),
      });

      const data = await response.json();
      if (data.imageUrl) {
        setFeaturedImage({ url: data.imageUrl, alt: editorTitle });
      }
    } catch (error) {
      console.error("Error generating image:", error);
      alert("Failed to generate image");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handlePublishToWordPress = async () => {
    if (!selectedEvent) return;

    setIsPublishing(true);
    try {
      const content = editor?.getHTML() || completion || "";
      const response = await fetch("/api/content/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wordpressSiteId: "default",
          title: editorTitle,
          slug: editorTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          content,
          excerpt: editorContent.substring(0, 150),
          metaDescription: `Article about ${editorTitle}`,
          focusKeyword: editorKeywords[0] || "",
          secondaryKeywords: editorKeywords.slice(1),
          featuredImageUrl: featuredImage?.url,
          featuredImageAlt: featuredImage?.alt,
          isAiGeneratedImage: !!featuredImage,
          categories: [],
          tags: editorKeywords,
          scheduledFor: new Date().toISOString(),
          seoScore: 85,
          readabilityScore: 80,
        }),
      });

      if (!response.ok) throw new Error("Failed to publish");

      const data = await response.json();
      const postLink = data.viewLink || data.postLink || "#";
      
      alert(`✅ Published to WordPress successfully!\n\nView your post: ${postLink}`);
      loadEvents();
      setIsEditorOpen(false);
    } catch (error) {
      console.error("Error publishing:", error);
      alert("Failed to publish to WordPress");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleGenerateArticle = async () => {
    if (!editorTitle || !editorOutline) {
      alert("Please provide a title and outline first");
      return;
    }

    setIsGenerating(true);
    
    const prompt = `You are writing a professional B2B blog post.
Title: "${editorTitle}"
Tone: ${editorTone}
${selectedEvent?.keywords && selectedEvent.keywords.length > 0 ? `Target Keywords: ${selectedEvent.keywords.join(", ")}` : ''}

Structure the article exactly according to this outline:
${editorOutline}

CRITICAL RULES:
1. Write in HTML format (use <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>).
2. Write at least 1,500-2,000 words total.
3. Each H2 section should be substantial (200-300 words).
4. Use bullet points and numbered lists where appropriate.
5. Include real-world examples and data points.
6. Make the content actionable and practical.
7. Use a professional, authoritative voice.
8. Include a compelling introduction that hooks the reader.
9. End with a strong conclusion with a call to action.

Return ONLY the HTML content, no markdown formatting, no intro/outro text.`;

    await complete(prompt);
  };

  const handleSaveDraft = async () => {
    try {
      const content = editor?.getHTML() || completion || "";
      const response = await fetch("/api/posts/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedEvent?.id,
          content,
          status: "READY",
        }),
      });

      if (!response.ok) throw new Error("Failed to save");

      alert("Draft saved successfully!");
      loadEvents();
    } catch (error) {
      console.error("Error saving:", error);
      alert("Failed to save draft");
    }
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const colors = {
      PLANNED: { bg: "bg-gray-100 dark:bg-gray-800", border: "border-gray-400 dark:border-gray-600", text: "text-gray-700 dark:text-gray-300" },
      GENERATING: { bg: "bg-yellow-100 dark:bg-yellow-900/30", border: "border-yellow-400 dark:border-yellow-600", text: "text-yellow-700 dark:text-yellow-300" },
      READY: { bg: "bg-blue-100 dark:bg-blue-900/30", border: "border-blue-400 dark:border-blue-600", text: "text-blue-700 dark:text-blue-300" },
      PUBLISHED: { bg: "bg-green-100 dark:bg-green-900/30", border: "border-green-400 dark:border-green-600", text: "text-green-700 dark:text-green-300" },
      FAILED: { bg: "bg-red-100 dark:bg-red-900/30", border: "border-red-400 dark:border-red-600", text: "text-red-700 dark:text-red-300" },
    };

    const style = colors[event.status] || colors.PLANNED;
    return {
      className: `${style.bg} ${style.border} ${style.text} border rounded-md p-1`,
    };
  };

  // Draggable Item Component
  function DraggableItem({ item }: { item: DraggableItem }) {
    return (
      <div className="p-2 bg-white dark:bg-slate-600 rounded border border-slate-200 dark:border-slate-500 text-sm cursor-move hover:shadow-md transition-shadow flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          {item.type === "gap" ? (
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span className="truncate">{item.title}</span>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
                    {item.title}
                  </div>
                  {item.suggestionType && (
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {item.suggestionType}
                    </div>
                  )}
                  {item.keywords && item.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.keywords.slice(0, 2).map((kw, ki) => (
                        <span key={ki} className="text-xs px-1.5 py-0.5 bg-slate-200 dark:bg-slate-500 rounded text-slate-700 dark:text-slate-300">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Droppable Day Component
  function DroppableDay({ date, children }: { date: Date; children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({
      id: `day-${date.toISOString()}`,
    });

    return (
      <div
        ref={setNodeRef}
        className={`h-full transition-colors ${isOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
      >
        {children}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
        {/* Mobile Header */}
        {isMobile && (
          <div className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <FileText className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Content Calendar
            </h1>
            <Button
              onClick={handleAutoPlanMonth}
              disabled={isAutoPlanning}
              size="sm"
            >
              <Zap className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Sidebar - Hidden on mobile unless toggled */}
        <aside 
          className={`fixed lg:relative inset-y-0 left-0 z-40 w-80 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 overflow-y-auto transition-transform duration-300 ${isMobile ? (isSidebarOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}`}
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Strategy
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Drag ideas to calendar
              </p>
            </div>
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>

        <div className="space-y-3">
          {draggableItems.length === 0 && !isLoadingAnalysis ? (
            <div className="p-6 bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 text-center">
              <FileText className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
              <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                No data yet
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                Go to Strategy to analyze your site and generate content ideas
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = "/content-strategy"}
                className="w-full"
              >
                <FileText className="w-4 h-4 mr-2" />
                Run Analysis
              </Button>
            </div>
          ) : (
            <>
              <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
                <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                  Content Gaps
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                  Drag to calendar to schedule
                </p>
                {isLoadingAnalysis ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                  </div>
                ) : draggableItems.filter(item => item.type === "gap").length > 0 ? (
                  <div className="space-y-2">
                    {draggableItems.filter(item => item.type === "gap").map((item) => (
                      <DraggableItem key={item.id} item={item} />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 py-2">
                    No content gaps found.
                  </p>
                )}
              </div>

              <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
                <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                  AI Suggestions
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                  Drag to calendar to schedule
                </p>
                {isLoadingAnalysis ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                  </div>
                ) : draggableItems.filter(item => item.type === "suggestion").length > 0 ? (
                  <div className="space-y-2">
                    {draggableItems.filter(item => item.type === "suggestion").map((item) => (
                      <DraggableItem key={item.id} item={item} />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 py-2">
                    No AI suggestions found.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Content Calendar
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Plan, create, and schedule your content
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => window.location.href = "/content-strategy"}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Run Analysis
            </Button>
            <Button
              onClick={handleAutoPlanMonth}
              disabled={isAutoPlanning}
              className="flex items-center gap-2"
            >
              {isAutoPlanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Planning...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Auto-Plan Month
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded border border-gray-400 dark:border-gray-600" />
            <span className="text-slate-600 dark:text-slate-400">Planned</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-200 dark:bg-yellow-900/30 rounded border border-yellow-400 dark:border-yellow-600" />
            <span className="text-slate-600 dark:text-slate-400">Generating</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-200 dark:bg-blue-900/30 rounded border border-blue-400 dark:border-blue-600" />
            <span className="text-slate-600 dark:text-slate-400">Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-200 dark:bg-green-900/30 rounded border border-green-400 dark:border-green-600" />
            <span className="text-slate-600 dark:text-slate-400">Published</span>
          </div>
        </div>

        <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 overflow-hidden">
          {events.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <CalendarIcon className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Your schedule is clear
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 max-w-md">
                Drag ideas from the Strategy sidebar or click <strong>Auto-Plan Month</strong> to generate your content schedule.
              </p>
              <Button
                onClick={handleAutoPlanMonth}
                disabled={isAutoPlanning}
                className="flex items-center gap-2"
              >
                {isAutoPlanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Planning...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Auto-Plan Month
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: "100%" }}
              eventPropGetter={eventStyleGetter}
              view={isMobile ? Views.AGENDA : (view as any)}
              date={currentDate}
              onNavigate={(newDate) => setCurrentDate(newDate as Date)}
              onView={(newView) => setView(newView as View)}
              onSelectEvent={(event) => handleSelectEvent(event as CalendarEvent)}
              views={isMobile ? [Views.AGENDA] : [Views.MONTH, Views.WEEK, Views.DAY]}
              components={{
                toolbar: () => (
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {moment(currentDate).format("MMMM YYYY")}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                    {!isMobile && (
                      <div className="flex gap-2">
                        {([Views.MONTH, Views.WEEK, Views.DAY] as View[]).map((v) => (
                          <Button
                            key={v}
                            variant={view === v ? "primary" : "outline"}
                            size="sm"
                            onClick={() => setView(v)}
                          >
                            {v.charAt(0) + v.slice(1).toLowerCase()}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ),
                dateCellWrapper: ({ children, value }: any) => (
                  <DroppableDay date={value}>
                    {children}
                  </DroppableDay>
                ),
              }}
            />
          )}
        </div>
      </main>

      {isEditorOpen && (
        <div className="fixed inset-y-0 right-0 w-[600px] bg-white dark:bg-slate-800 shadow-2xl border-l border-slate-200 dark:border-slate-700 flex flex-col z-50">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Article Editor
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setIsEditorOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Title
              </label>
              <input
                type="text"
                value={editorTitle}
                onChange={(e) => setEditorTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                disabled={isGenerating}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Outline
              </label>
              <textarea
                value={editorOutline}
                onChange={(e) => setEditorOutline(e.target.value)}
                className="w-full min-h-[150px] px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm font-mono resize-none"
                disabled={isGenerating}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Keywords
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddKeyword())}
                  placeholder="Add keyword..."
                  className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm"
                  disabled={isGenerating}
                />
                <Button
                  onClick={handleAddKeyword}
                  disabled={isGenerating || !newKeyword.trim()}
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {editorKeywords.map((keyword, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-sm"
                  >
                    {keyword}
                    <button
                      onClick={() => handleRemoveKeyword(keyword)}
                      className="hover:text-blue-900 dark:hover:text-blue-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleGenerateOutline}
                disabled={isGeneratingOutline || isGenerating || !editorTitle}
                variant="outline"
                className="flex-1"
              >
                {isGeneratingOutline ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Outlining...
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4 mr-2" />
                    Generate Outline
                  </>
                )}
              </Button>
              <Button
                onClick={handleGenerateImage}
                disabled={isGeneratingImage || isGenerating || !editorTitle}
                variant="outline"
                className="flex-1"
              >
                {isGeneratingImage ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Imaging...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Generate Image
                  </>
                )}
              </Button>
            </div>

            {featuredImage && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Featured Image
                </label>
                <img
                  src={featuredImage.url}
                  alt={featuredImage.alt}
                  className="w-full h-40 object-cover rounded-lg border border-slate-300 dark:border-slate-600"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Tone
              </label>
              <select
                value={editorTone}
                onChange={(e) => setEditorTone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                disabled={isGenerating}
              >
                <option value="professional">Professional</option>
                <option value="educational">Educational</option>
                <option value="conversational">Conversational</option>
                <option value="urgent">Urgent</option>
                <option value="authoritative">Authoritative</option>
                <option value="friendly">Friendly</option>
              </select>
            </div>

            <div>
              <Button
                onClick={handleGenerateArticle}
                disabled={isGenerating || !editorTitle || !editorOutline}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Write Full Article
                  </>
                )}
              </Button>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Content
              </label>
              <div className="border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 p-3 min-h-[300px]">
                {isGenerating ? (
                  <div className="flex items-center justify-center h-full py-12">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        AI is writing...
                      </p>
                    </div>
                  </div>
                ) : (
                  <EditorContent editor={editor} className="prose prose-sm max-w-none dark:prose-invert focus:outline-none" />
                )}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
            {/* Approval Status Badge */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Approval Status:
              </span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                approvalStatus === "PENDING"
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                  : approvalStatus === "APPROVED"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
              }`}>
                {approvalStatus}
              </span>
            </div>

            {/* Approval Workflow Buttons */}
            {approvalStatus === "PENDING" && (
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmitForReview}
                  disabled={isSubmittingReview || isGenerating}
                  className="flex-1"
                >
                  {isSubmittingReview ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Submit for Review
                    </>
                  )}
                </Button>
              </div>
            )}

            {approvalStatus === "PENDING" && (
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveDraft}
                  disabled={isGenerating}
                  variant="outline"
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </Button>
              </div>
            )}

            {approvalStatus === "PENDING" && (
              <div className="flex gap-2">
                <Button
                  onClick={handleApproveAndSchedule}
                  disabled={isSubmittingReview || isGenerating}
                  variant="outline"
                  className="flex-1"
                >
                  {isSubmittingReview ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Approve & Schedule
                    </>
                  )}
                </Button>
              </div>
            )}

            {approvalStatus === "APPROVED" && (
              <Button
                onClick={handlePublishToWordPress}
                disabled={isPublishing || isGenerating}
                className="w-full"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Publish to WordPress
                  </>
                )}
              </Button>
            )}

            <Button variant="outline" onClick={() => setIsEditorOpen(false)} className="w-full">
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Auto-Plan Wizard Modal */}
      {isAutoPlanWizardOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Auto-Plan Month
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Configure your content schedule for the month
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Posts Per Week
                </label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={autoPlanConfig.frequency}
                  onChange={(e) => setAutoPlanConfig({ ...autoPlanConfig, frequency: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Posting Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
                    <button
                      key={day}
                      onClick={() => {
                        const newDays = autoPlanConfig.days.includes(i)
                          ? autoPlanConfig.days.filter(d => d !== i)
                          : [...autoPlanConfig.days, i];
                        setAutoPlanConfig({ ...autoPlanConfig, days: newDays });
                      }}
                      className={`px-3 py-1.5 rounded text-sm ${
                        autoPlanConfig.days.includes(i)
                          ? "bg-blue-600 text-white"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Tone
                </label>
                <select
                  value={autoPlanConfig.tone}
                  onChange={(e) => setAutoPlanConfig({ ...autoPlanConfig, tone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="professional">Professional</option>
                  <option value="educational">Educational</option>
                  <option value="conversational">Conversational</option>
                  <option value="authoritative">Authoritative</option>
                  <option value="friendly">Friendly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Focus
                </label>
                <select
                  value={autoPlanConfig.focus}
                  onChange={(e) => setAutoPlanConfig({ ...autoPlanConfig, focus: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="mixed">Mixed Topics</option>
                  {contentContext?.dominantKeywords.map((kw) => (
                    <option key={kw.term} value={kw.term}>
                      {kw.term}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                onClick={handleGenerateAutoPlan}
                disabled={isAutoPlanning || autoPlanConfig.days.length === 0}
                className="flex-1"
              >
                {isAutoPlanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Generate Plan
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsAutoPlanWizardOpen(false)}
                disabled={isAutoPlanning}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
    </DndContext>
  );
}
