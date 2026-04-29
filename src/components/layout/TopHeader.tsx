"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserButton, useAuth } from "@clerk/nextjs";
import {
  Building2,
  ChevronDown,
  Users,
  Shield,
  Check,
  Globe,
  Plus,
} from "lucide-react";

interface Client {
  id: string;
  name: string;
  company?: string;
  website?: string;
  logo?: string;
}

interface UserContext {
  user: {
    id: string;
    email: string;
    name?: string;
    accountType: string;
  };
  isAgency: boolean;
  isAdmin: boolean;
  agency?: {
    id: string;
    name: string;
    slug: string;
  };
  clients: Client[];
  activeClient?: Client;
}

export function TopHeader() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [context, setContext] = useState<UserContext | null>(null);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setLoading(false);
      return;
    }

    const fetchContext = async () => {
      try {
        const response = await fetch("/api/user/context");
        if (response.ok) {
          const data = await response.json();
          setContext(data);
        }
      } catch (error) {
        console.error("Failed to fetch user context:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContext();
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsClientDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSwitchClient = async (clientId: string) => {
    try {
      const response = await fetch("/api/user/switch-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });

      if (response.ok) {
        const data = await response.json();
        setContext((prev) =>
          prev ? { ...prev, activeClient: data.activeClient } : null
        );
        setIsClientDropdownOpen(false);
        // Optionally refresh the page to reload data for new client
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to switch client:", error);
    }
  };

  if (!isLoaded || loading) {
    return (
      <header className="h-14 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-end px-4 gap-4">
        <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
      </header>
    );
  }

  if (!isSignedIn) {
    return (
      <header className="h-14 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Globe className="w-6 h-6 text-blue-600" />
          <span className="font-bold text-lg">SeoRise</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Get Started
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="h-14 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4">
      {/* Left side - Navigation tabs */}
      <div className="flex items-center gap-1">
        {/* Agency Tab - Only shown for agency users */}
        {context?.isAgency && (
          <Link
            href="/agency"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
          >
            <Building2 className="w-4 h-4" />
            <span>Agency</span>
          </Link>
        )}

        {/* Admin Tab - Only shown for admin user */}
        {context?.isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg transition-colors"
          >
            <Shield className="w-4 h-4" />
            <span>Admin</span>
          </Link>
        )}
      </div>

      {/* Right side - Client switcher & User menu */}
      <div className="flex items-center gap-4">
        {/* Client Switcher - Only shown for agency users with clients */}
        {context?.isAgency && context.clients.length > 0 && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
            >
              <Users className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 max-w-[150px] truncate">
                {context.activeClient?.name || "Select Client"}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 transition-transform ${
                  isClientDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isClientDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50">
                <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Switch Client
                  </p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {context.clients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => handleSwitchClient(client.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                        context.activeClient?.id === client.id
                          ? "bg-blue-50 dark:bg-blue-900/20"
                          : ""
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {client.name}
                        </p>
                        {client.company && (
                          <p className="text-xs text-slate-500 truncate">
                            {client.company}
                          </p>
                        )}
                      </div>
                      {context.activeClient?.id === client.id && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 mt-2 pt-2 px-2">
                  <Link
                    href="/agency?tab=clients"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    onClick={() => setIsClientDropdownOpen(false)}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Client</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Agency badge */}
        {context?.agency && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {context.agency.name}
            </span>
          </div>
        )}

        {/* User Button */}
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              avatarBox: "w-9 h-9",
            },
          }}
        />
      </div>
    </header>
  );
}
