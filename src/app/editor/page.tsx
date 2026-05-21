"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useCompletion } from "@ai-sdk/react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Undo,
  Redo,
  Save,
  Calendar,
  ExternalLink,
  Download,
  Play,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";

function ArticleEditorContent() {
  const searchParams = useSearchParams();
  const draftId = searchParams.get("id");
  
  const [title, setTitle] = useState("");
  const [outline, setOutline] = useState("");
  const [draftData, setDraftData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [hasGenerated, setHasGenerated] = useState(false);

  // AI streaming completion hook
  const { completion, complete, isLoading, error } = useCompletion({
    api: "/api/generate/article",
    onFinish: () => {
      console.log("[Editor] Article generation completed");
      setHasGenerated(true);
    },
    onError: (error) => {
      console.error("[Editor] Generation error:", error);
      alert(`Failed to generate article: ${error.message}`);
    },
  });

  const editor = useEditor({
    extensions: [StarterKit],
    content: completion || "",
    onUpdate: ({ editor }) => {
      // Don't update during streaming to avoid conflicts
      if (!isLoading) {
        // Content is managed by completion during generation
      }
    },
    editable: !isLoading, // Disable editing during generation
    immediatelyRender: false,
  });

  // Load draft data on mount
  useEffect(() => {
    if (draftId) {
      loadDraftData(draftId);
    }
  }, [draftId]);

  const loadDraftData = async (id: string) => {
    try {
      const response = await fetch(`/api/posts/update?id=${id}`);
      const data = await response.json();
      if (data.posts && data.posts.length > 0) {
        const draft = data.posts[0];
        setDraftData(draft);
        setTitle(draft.title || "");
        setOutline(draft.outline || "");
        if (draft.content) {
          setHasGenerated(true);
          if (editor) {
            editor.commands.setContent(draft.content);
          }
        }
      }
    } catch (error) {
      console.error("[Editor] Error loading draft:", error);
    }
  };

  const handleStartGeneration = async () => {
    if (!title || !outline) {
      alert("Please provide a title and outline first");
      return;
    }

    console.log("[Editor] Starting article generation...");
    setHasGenerated(false);
    
    // Build prompt string from parameters
    const prompt = `You are writing a professional B2B blog post.
Title: "${title}"
${draftData?.tone ? `Tone: ${draftData.tone}` : ''}
${draftData?.keywords && draftData.keywords.length > 0 ? `Target Keywords: ${draftData.keywords.join(", ")}` : ''}
${draftData?.targetServiceUrl ? `Context Link: ${draftData.targetServiceUrl}` : ''}

Structure the article exactly according to this outline:
${outline}

CRITICAL RULES:
1. Write in HTML format (use <h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>).
2. Write at least 1,500-2,000 words total.
3. Each H2 section should be substantial (200-300 words).
4. Use bullet points and numbered lists where appropriate.
5. Include real-world examples and data points.
6. ${draftData?.targetServiceUrl ? `In the "Solution", "Implementation", or "Conclusion" section, naturally link to: ${draftData.targetServiceUrl}` : ''}
7. Make the content actionable and practical.
8. Use a professional, authoritative voice.
9. Include a compelling introduction that hooks the reader.
10. End with a strong conclusion with a call to action.
${draftData?.tone ? `11. Maintain a ${draftData.tone} tone throughout the article.` : ''}

Return ONLY the HTML content, no markdown formatting, no intro/outro text.`;
    
    await complete(prompt);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const content = editor?.getHTML() || "";
      const response = await fetch("/api/posts/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: draftId,
          content,
          status: hasGenerated ? "READY" : "DRAFT",
        }),
      });

      if (!response.ok) throw new Error("Failed to save");

      alert("Draft saved successfully!");
    } catch (error) {
      console.error("Error saving:", error);
      alert("Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSchedule = async () => {
    if (!scheduledDate) return;

    try {
      const content = editor?.getHTML() || "";
      const response = await fetch("/api/posts/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: draftId,
          content,
          status: "SCHEDULED",
          scheduledAt: new Date(scheduledDate),
        }),
      });

      if (!response.ok) throw new Error("Failed to schedule");

      alert(`Article scheduled for ${new Date(scheduledDate).toLocaleDateString()}`);
      setShowScheduleModal(false);
    } catch (error) {
      console.error("Error scheduling:", error);
      alert("Failed to schedule article");
    }
  };

  const handlePublishNow = async () => {
    try {
      const content = editor?.getHTML() || "";
      const response = await fetch("/api/posts/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: draftId,
          content,
          status: "PUBLISHING",
        }),
      });

      if (!response.ok) throw new Error("Failed to publish");

      alert("Article publishing started!");
    } catch (error) {
      console.error("Error publishing:", error);
      alert("Failed to publish article");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Article Editor
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {isLoading ? "AI is writing your article..." : "Edit and publish your AI-generated content"}
          </p>
        </div>

        {/* Title Input */}
        <div className="mb-6">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Article Title..."
            className="w-full px-4 py-3 text-2xl font-semibold border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
        </div>

        {/* Outline Display */}
        {outline && !hasGenerated && (
          <div className="mb-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Article Outline
            </h3>
            <textarea
              value={outline}
              onChange={(e) => setOutline(e.target.value)}
              className="w-full min-h-[150px] p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm font-mono resize-none"
              disabled={isLoading}
            />
          </div>
        )}

        {/* Generation Button */}
        {!hasGenerated && (
          <div className="mb-6">
            <button
              onClick={handleStartGeneration}
              disabled={isLoading || !title || !outline}
              className="inline-flex items-center gap-2 px-6 py-3 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Writing Article...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Start AI Writer
                </>
              )}
            </button>
            {error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                Error: {error.message}
              </p>
            )}
          </div>
        )}

        {/* Toolbar */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-2 mb-4 flex flex-wrap gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().toggleBold().run()}
            disabled={isLoading}
            className={editor?.isActive("bold") ? "bg-slate-100 dark:bg-slate-700" : ""}
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            disabled={isLoading}
            className={editor?.isActive("italic") ? "bg-slate-100 dark:bg-slate-700" : ""}
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            disabled={isLoading}
            className={editor?.isActive("heading", { level: 1 }) ? "bg-slate-100 dark:bg-slate-700" : ""}
          >
            <Heading1 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            disabled={isLoading}
            className={editor?.isActive("heading", { level: 2 }) ? "bg-slate-100 dark:bg-slate-700" : ""}
          >
            <Heading2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            disabled={isLoading}
            className={editor?.isActive("bulletList") ? "bg-slate-100 dark:bg-slate-700" : ""}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            disabled={isLoading}
            className={editor?.isActive("orderedList") ? "bg-slate-100 dark:bg-slate-700" : ""}
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().undo().run()}
            disabled={isLoading}
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor?.chain().focus().redo().run()}
            disabled={isLoading}
          >
            <Redo className="w-4 h-4" />
          </Button>
        </div>

        {/* Editor */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6 min-h-[500px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full py-12">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  AI is writing your article...
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Watch the content appear in real-time
                </p>
              </div>
            </div>
          ) : (
            <EditorContent 
              editor={editor} 
              className="prose prose-sm max-w-none dark:prose-invert focus:outline-none"
            />
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Draft"}
          </Button>
          <Button
            onClick={() => setShowScheduleModal(true)}
            variant="outline"
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Schedule
          </Button>
          <Button
            onClick={handlePublishNow}
            variant="primary"
            disabled={isLoading}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <ExternalLink className="w-4 h-4" />
            Publish Now
          </Button>
          <Button
            onClick={() => {
              const content = editor?.getHTML() || "";
              const blob = new Blob([content], { type: "text/html" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${title || "article"}.html`;
              a.click();
            }}
            variant="outline"
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export HTML
          </Button>
        </div>

        {/* Schedule Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Schedule Article
              </h3>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 mb-4"
              />
              <div className="flex gap-3 justify-end">
                <Button
                  onClick={() => setShowScheduleModal(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button onClick={handleSchedule}>
                  Schedule
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ArticleEditor() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading editor...</p>
        </div>
      </div>
    }>
      <ArticleEditorContent />
    </Suspense>
  );
}
