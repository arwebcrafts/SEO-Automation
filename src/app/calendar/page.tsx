"use client";

import React, { useState, useEffect } from "react";
import { Calendar, momentLocalizer, Views, View } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Filter,
  Calendar as CalendarIcon
} from "lucide-react";

const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: string;
  type: string;
}

export default function ContentCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>(Views.MONTH);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchEvents();
  }, [currentDate, view]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/posts/update");
      const data = await response.json();
      
      const calendarEvents = (data.posts || []).map((post: any) => ({
        id: post.id,
        title: post.title || "Untitled",
        start: new Date(post.scheduledFor),
        end: new Date(new Date(post.scheduledFor).getTime() + 60 * 60 * 1000), // 1 hour duration
        status: post.status,
        type: post.postType || "post",
      }));

      setEvents(calendarEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((event) => {
    if (statusFilter === "all") return true;
    return event.status === statusFilter;
  });

  const eventStyleGetter = (event: CalendarEvent) => {
    const backgroundColor = {
      PUBLISHED: "#22c55e",
      PUBLISHING: "#3b82f6",
      READY: "#a855f7",
      GENERATING: "#eab308",
      FAILED: "#ef4444",
      PENDING: "#64748b",
    }[event.status] || "#64748b";

    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.9,
        border: "none",
      },
    };
  };

  const handleNavigate = (action: "PREV" | "NEXT" | "TODAY") => {
    if (action === "PREV") {
      setCurrentDate(moment(currentDate).subtract(1, view === Views.MONTH ? "month" : "week").toDate());
    } else if (action === "NEXT") {
      setCurrentDate(moment(currentDate).add(1, view === Views.MONTH ? "month" : "week").toDate());
    } else {
      setCurrentDate(new Date());
    }
  };

  const CustomToolbar = () => (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleNavigate("TODAY")}
          className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          Today
        </button>
        <button
          onClick={() => handleNavigate("PREV")}
          className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleNavigate("NEXT")}
          className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {moment(currentDate).format("MMMM YYYY")}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="PUBLISHED">Published</option>
            <option value="PUBLISHING">Publishing</option>
            <option value="READY">Ready</option>
            <option value="GENERATING">Generating</option>
            <option value="FAILED">Failed</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2" />

        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          {["month", "week", "day"].map((v) => (
            <button
              key={v}
              onClick={() => setView(v as any)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                view === v
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Content Calendar
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Schedule and manage your content publishing
            </p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            Schedule Content
          </button>
        </div>

        {/* Legend */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm text-slate-600 dark:text-slate-400">Published</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm text-slate-600 dark:text-slate-400">Publishing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-sm text-slate-600 dark:text-slate-400">Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-sm text-slate-600 dark:text-slate-400">Generating</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm text-slate-600 dark:text-slate-400">Failed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-500" />
              <span className="text-sm text-slate-600 dark:text-slate-400">Pending</span>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <CalendarIcon className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">Loading calendar...</p>
              </div>
            </div>
          ) : (
            <div className="min-h-[600px]">
              <CustomToolbar />
              <Calendar
                localizer={localizer}
                events={filteredEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 600 }}
                eventPropGetter={eventStyleGetter}
                views={[Views.MONTH, Views.WEEK, Views.DAY]}
                view={view as any}
                date={currentDate}
                onNavigate={(newDate) => setCurrentDate(newDate as Date)}
                onView={(newView) => setView(newView as View)}
                components={{
                  event: ({ event }: { event: CalendarEvent }) => (
                    <div className="text-xs font-medium text-white p-1 truncate">
                      {event.title}
                    </div>
                  ),
                }}
              />
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Total</span>
              <CalendarIcon className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {events.length}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Published</span>
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {events.filter((e) => e.status === "PUBLISHED").length}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Ready</span>
              <div className="w-3 h-3 rounded-full bg-purple-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {events.filter((e) => e.status === "READY").length}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600 dark:text-slate-400">Pending</span>
              <div className="w-3 h-3 rounded-full bg-slate-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {events.filter((e) => e.status === "PENDING").length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
