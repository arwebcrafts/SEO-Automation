"use client";

import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer, Views, View } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
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
  Plus,
  Target,
  Users,
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
import { useContentStrategy } from "@/contexts/ContentStrategyContext";

const localizer = momentLocalizer(moment);

const STORAGE_KEY_EVENTS = "seo_calendar_events";

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
  sourceSuggestionId?: string;
  analysisRunId?: string;
}

interface DraggableItem {
  id: string;
  type: "gap" | "suggestion";
  title: string;
  keywords?: string[];
  suggestionType?: string;
  reason?: string;
}

interface PlannerViewProps {
  contentGaps: string[];
  aiSuggestions: Array<{
    title: string;
    targetKeywords: string[];
    relatedServiceUrl?: string;
    type?: string;
    reason?: string;
  }>;
  contentContext?: {
    tone: string;
    audiencePersona: string;
  };
  analysisRunId?: string;
}

export default function PlannerView({
  contentGaps,
  aiSuggestions,
  contentContext,
  analysisRunId,
}: PlannerViewProps) {
  const { events: contextEvents, setEvents: setContextEvents, analysisData, aiSuggestions: contextSuggestions } = useContentStrategy();
  const [events, setEventsLocal] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Sync events with context and localStorage
  const setEvents = (newEvents: CalendarEvent[] | ((prev: CalendarEvent[]) => CalendarEvent[])) => {
    setEventsLocal(prev => {
      const updated = typeof newEvents === 'function' ? newEvents(prev) : newEvents;
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(updated));
      }
      // Update context
      setContextEvents(updated);
      return updated;
    });
  };
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>(Views.MONTH);
  const [isAutoPlanning, setIsAutoPlanning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [editorTitle, setEditorTitle] = useState("");
  const [editorOutline, setEditorOutline] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [editorTone, setEditorTone] = useState("professional");
  const [isGenerating, setIsGenerating] = useState(false);

  const [editorKeywords, setEditorKeywords] = useState<string[]>([]);
  const [featuredImage, setFeaturedImage] = useState<{ url: string; alt: string } | null>(null);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

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

  const [isAutoPlanWizardOpen, setIsAutoPlanWizardOpen] = useState(false);
  const [autoPlanConfig, setAutoPlanConfig] = useState({
    frequency: 2,
    days: [2, 4],
    tone: "professional",
    focus: "mixed",
  });

  const completion = useCompletion({
    api: "/api/generate/article",
    onFinish: (prompt, completion) => {
      setIsGenerating(false);
      setEditorContent(completion);
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

  useEffect(() => {
    const gaps: DraggableItem[] = (contentGaps || []).map((gap, i) => ({
      id: `gap-${Date.now()}-${i}`,
      type: "gap",
      title: gap,
    }));

    const suggestions: DraggableItem[] = (aiSuggestions || []).map((s, i) => ({
      id: `suggestion-${Date.now()}-${i}`,
      type: "suggestion",
      title: s.title,
      keywords: s.targetKeywords,
      suggestionType: s.type,
      reason: s.reason,
    }));

    setDraggableItems([...gaps, ...suggestions]);
  }, [contentGaps, aiSuggestions]);

  // Load events from localStorage on mount
  useEffect(() => {
    const loadStoredEvents = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_EVENTS);
        if (stored) {
          const parsedEvents = JSON.parse(stored).map((e: any) => ({
            ...e,
            start: new Date(e.start),
            end: new Date(e.end),
          }));
          setEventsLocal(parsedEvents);
          return;
        }
      } catch (e) {
        console.error('Failed to load stored events:', e);
      }

      // Fallback: load from context if available
      if (contextEvents && contextEvents.length > 0) {
        setEventsLocal(contextEvents.map(e => ({
          ...e,
          start: new Date(e.start),
          end: new Date(e.end),
        })));
      }
    };

    loadStoredEvents();
  }, []);

  // Fetch latest analysis data if props are empty but context has data
  useEffect(() => {
    if ((!contentGaps || contentGaps.length === 0) && analysisData?.contentGaps) {
      const gaps: DraggableItem[] = analysisData.contentGaps.map((gap, i) => ({
        id: `gap-ctx-${Date.now()}-${i}`,
        type: "gap",
        title: gap,
      }));
      setDraggableItems(prev => [...gaps, ...prev.filter(p => p.type === 'suggestion')]);
    }

    if ((!aiSuggestions || aiSuggestions.length === 0) && contextSuggestions && contextSuggestions.length > 0) {
      const suggestions: DraggableItem[] = contextSuggestions.map((s, i) => ({
        id: `suggestion-ctx-${Date.now()}-${i}`,
        type: "suggestion",
        title: s.title,
        keywords: s.targetKeywords,
        suggestionType: s.type,
        reason: s.reason,
      }));
      setDraggableItems(prev => [...prev.filter(p => p.type === 'gap'), ...suggestions]);
    }
  }, [analysisData, contextSuggestions, contentGaps, aiSuggestions]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const loadContentAnalysis = async () => {
    const storedAnalysis = localStorage.getItem('contentAnalysis');
    if (storedAnalysis) {
      const data = JSON.parse(storedAnalysis);
      if (data.analysisOutput?.contentContext) {
        const gaps: DraggableItem[] = (data.analysisOutput.contentContext.contentGaps || []).map((gap: string, i: number) => ({
          id: `gap-${Date.now()}-${i}`,
          type: "gap",
          title: gap,
        }));

        const suggestions: DraggableItem[] = (data.analysisOutput.aiSuggestions || []).map((s: any, i: number) => ({
          id: `suggestion-${Date.now()}-${i}`,
          type: "suggestion",
          title: s.title,
          keywords: s.targetKeywords,
          suggestionType: s.type,
          reason: s.reason,
        }));

        setDraggableItems([...gaps, ...suggestions]);
      }
    }
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const backgroundColor =
      event.status === "PLANNED"
        ? "rgb(229 231 235)"
        : event.status === "GENERATING"
        ? "rgb(253 230 138)"
        : event.status === "READY"
        ? "rgb(191 219 254)"
        : event.status === "PUBLISHED"
        ? "rgb(187 247 208)"
        : "rgb(254 178 178)";
    const borderColor =
      event.status === "PLANNED"
        ? "rgb(156 163 175)"
        : event.status === "GENERATING"
        ? "rgb(234 179 8)"
        : event.status === "READY"
        ? "rgb(59 130 246)"
        : event.status === "PUBLISHED"
        ? "rgb(34 197 94)"
        : "rgb(239 68 68)";
    return {
      style: {
        backgroundColor,
        borderColor,
        borderRadius: "4px",
      },
    };
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    // Debug logging
    console.log("Drag end:", { active: active.id, over: over?.id });
    
    if (!over) {
      console.log("No drop target");
      return;
    }

    // Check if dropped on a calendar day
    if (!over.id.toString().startsWith("day-")) {
      console.log("Not dropped on a calendar day");
      return;
    }

    const item = draggableItems.find((i) => i.id === active.id);
    if (!item) {
      console.log("Item not found:", active.id);
      return;
    }

    const dateStr = over.id.toString().replace("day-", "");
    const dropDate = new Date(dateStr);
    
    // Validate date
    if (isNaN(dropDate.getTime())) {
      console.error("Invalid date:", dateStr);
      return;
    }

    console.log("Creating event:", { item, dropDate });

    try {
      // Create event locally without API call
      const newEvent: CalendarEvent = {
        id: `event-${Date.now()}-${Math.random()}`,
        title: item.title,
        start: dropDate,
        end: new Date(dropDate.getTime() + 2 * 60 * 60 * 1000), // 2 hours duration
        status: "PLANNED",
        tone: contentContext?.tone || "professional",
        keywords: item.keywords || [],
        sourceSuggestionId: item.type === "suggestion" ? item.id : undefined,
        analysisRunId,
      };

      // Add event to calendar
      setEvents((prev) => [...prev, newEvent]);
      
      // Remove from draggable items
      setDraggableItems((prev) => prev.filter((i) => i.id !== active.id));
      
      console.log("Event created successfully:", newEvent);
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Failed to create event");
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

  const handleGenerateOutline = async () => {
    if (!editorTitle) return;

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

  const handleGenerateArticle = async () => {
    if (!editorTitle || !editorOutline) {
      alert("Please provide a title and outline first");
      return;
    }

    setIsGenerating(true);
    const prompt = `Title: ${editorTitle}\n\nOutline:\n${editorOutline}\n\nTone: ${editorTone}\n\nKeywords: ${editorKeywords.join(", ")}`;
    completion.complete(prompt);
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

      alert("Published to WordPress successfully!");
      loadEvents();
      setIsEditorOpen(false);
    } catch (error) {
      console.error("Error publishing:", error);
      alert("Failed to publish to WordPress");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleAutoPlanMonth = () => {
    setIsAutoPlanWizardOpen(true);
  };

  const handleGenerateAutoPlan = async () => {
    setIsAutoPlanning(true);
    try {
      const response = await fetch("/api/monthly-plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frequency: autoPlanConfig.frequency,
          days: autoPlanConfig.days,
          tone: autoPlanConfig.tone,
          focus: autoPlanConfig.focus,
          contentGaps,
          dominantKeywords: [],
        }),
      });

      if (!response.ok) throw new Error("Failed to generate auto-plan");

      const data = await response.json();
      if (data.events) {
        const newEvents: CalendarEvent[] = data.events.map((evt: any) => ({
          id: `event-${Date.now()}-${Math.random()}`,
          title: evt.title,
          start: new Date(evt.date),
          end: new Date(new Date(evt.date).getTime() + 2 * 60 * 60 * 1000),
          status: "PLANNED",
          tone: autoPlanConfig.tone,
          keywords: evt.keywords || [],
        }));
        setEvents((prev) => [...prev, ...newEvents]);
      }

      setIsAutoPlanWizardOpen(false);
      loadEvents();
    } catch (error) {
      console.error("Error generating auto-plan:", error);
      // Show a more user-friendly error message
      if (error instanceof Error && error.message.includes("Failed to generate auto-plan")) {
        alert("Unable to generate auto-plan at the moment. Please try dragging content items manually to the calendar.");
      } else {
        alert("An error occurred while generating the auto-plan. Please try again.");
      }
    } finally {
      setIsAutoPlanning(false);
    }
  };

  const handleApproveAndSchedule = async () => {
    if (!selectedEvent) return;

    const scheduledDate = new Date(selectedEvent.start);
    const now = new Date();
    const isFuture = scheduledDate > now;

    setIsSubmittingReview(true);
    try {
      const response = await fetch("/api/posts/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedEvent.id,
          status: "READY",
          approvalStatus: "APPROVED",
        }),
      });

      if (!response.ok) throw new Error("Failed to approve and schedule");

      if (isFuture) {
        // Queue for Cron Job
        alert(`Post approved and scheduled for ${scheduledDate.toLocaleDateString()}. Cron job will publish at scheduled time.`);
      } else {
        // Publish immediately
        await handlePublishToWordPress();
      }

      loadEvents();
      setIsEditorOpen(false);
    } catch (error) {
      console.error("Error approving and scheduling:", error);
      alert("Failed to approve and schedule");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  function DraggableItem({ item }: { item: DraggableItem }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
      id: item.id,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="p-3 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm hover:shadow-md transition-shadow cursor-move"
      >
        <div className="flex items-start gap-2">
          <GripVertical className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
              {item.title}
            </div>
            {item.suggestionType && (
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  item.type === 'gap' 
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                    : item.suggestionType === 'Blog Post'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : item.suggestionType === 'Whitepaper'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                    : item.suggestionType === 'Case Study'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : item.suggestionType === 'Guide'
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                    : 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300'
                }`}>
                  {item.type === 'gap' ? 'Gap' : item.suggestionType}
                </span>
                {item.type === 'suggestion' && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    AI Suggestion
                  </span>
                )}
              </div>
            )}
            {item.reason && (
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                {item.reason}
              </div>
            )}
            {item.keywords && item.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {item.keywords.slice(0, 3).map((kw, ki) => (
                  <span key={ki} className="text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-600 rounded text-slate-600 dark:text-slate-300">
                    {kw}
                  </span>
                ))}
                {item.keywords.length > 3 && (
                  <span className="text-xs px-1.5 py-0.5 text-slate-500 dark:text-slate-400">
                    +{item.keywords.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function DroppableDay({ date, children }: { date: Date; children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({
      id: `day-${date.toISOString()}`,
    });

    return (
      <div
        ref={setNodeRef}
        className={`h-full transition-all relative ${isOver 
          ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-400 ring-inset' 
          : events.length === 0 
          ? 'hover:bg-slate-50 dark:hover:bg-slate-700/50' 
          : ''
        }`}
        style={{ minHeight: '80px' }}
      >
        {children}
        {isOver && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-blue-50 dark:bg-blue-900/20">
            <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded shadow-lg">
              Drop here
            </div>
          </div>
        )}
        {/* Debug indicator */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute top-0 right-0 text-[8px] text-slate-400 p-1">
            {date.getDate()}
          </div>
        )}
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
                Content Tray
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Drag to calendar
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
            <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
              <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                Content Gaps
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                Drag to calendar
              </p>
              {draggableItems.filter(item => item.type === "gap").length > 0 ? (
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
                Drag to calendar
              </p>
              {draggableItems.filter(item => item.type === "suggestion").length > 0 ? (
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
          </div>
        </aside>

        {/* Main Calendar Area */}
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

          <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 overflow-hidden relative" style={{ minHeight: '500px' }}>
            {/* Calendar is always visible */}
            <div className={events.length === 0 ? "opacity-40" : ""} style={{ height: '450px' }}>
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: "100%", minHeight: "400px" }}
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
                        <div className="flex gap-1">
                          {[Views.MONTH, Views.WEEK, Views.DAY].map((v) => (
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
            </div>
            
            {/* Overlay message only when no events */}
            {events.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <CalendarIcon className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Your schedule is clear
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Start planning your content with {draggableItems.length} available ideas
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center mb-4">
                    <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-sm">
                      {contentGaps?.length || 0} Content Gaps
                    </span>
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                      {aiSuggestions?.length || 0} AI Suggestions
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    💡 Drag items from the tray to any date on the calendar
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Editor Drawer */}
        {isEditorOpen && (
          <div className="fixed inset-y-0 right-0 w-[600px] bg-white dark:bg-slate-800 shadow-2xl border-l border-slate-200 dark:border-slate-700 flex flex-col z-50">
            {/* Context Header */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Article Editor
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setIsEditorOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Target className="w-4 h-4" />
                  <span className="font-medium">Target Keyword:</span>
                  <span className="text-slate-900 dark:text-slate-100">{editorKeywords[0] || 'Not set'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Users className="w-4 h-4" />
                  <span className="font-medium">Persona:</span>
                  <span className="text-slate-900 dark:text-slate-100">{contentContext?.audiencePersona || 'Not set'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Zap className="w-4 h-4" />
                  <span className="font-medium">Goal:</span>
                  <span className="text-slate-900 dark:text-slate-100">{contentContext?.tone || 'Not set'} tone</span>
                </div>
              </div>
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
                  placeholder="Article title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Outline
                </label>
                <textarea
                  value={editorOutline}
                  onChange={(e) => setEditorOutline(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 min-h-[100px]"
                  placeholder="Article outline"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleGenerateOutline}
                  disabled={isGeneratingOutline || !editorTitle}
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
              <Button
                onClick={handlePublishToWordPress}
                disabled={isPublishing}
                variant="outline"
                className="w-full"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Publish to WordPress
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Auto-Plan Wizard Modal */}
        {isAutoPlanWizardOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                Auto-Plan Month
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Posts per week
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={autoPlanConfig.frequency}
                    onChange={(e) => setAutoPlanConfig({ ...autoPlanConfig, frequency: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  />
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
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button
                  onClick={() => setIsAutoPlanWizardOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerateAutoPlan}
                  disabled={isAutoPlanning}
                  className="flex-1"
                >
                  {isAutoPlanning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Planning...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DndContext>
  );
}
