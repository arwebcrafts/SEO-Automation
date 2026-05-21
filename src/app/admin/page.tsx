"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import SidebarLayout from "@/components/layout/SidebarLayout";
import {
  Users,
  Building2,
  BarChart3,
  Activity,
  Search,
  Filter,
  ChevronDown,
  Eye,
  Loader2,
  Shield,
  TrendingUp,
  FileText,
  Calendar,
  RefreshCw,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string | null;
  accountType: string;
  role: string;
  plan: string;
  onboardingCompleted: boolean;
  createdAt: string;
  stats: {
    audits: number;
    contentAnalyses: number;
    scheduledContent: number;
    activities: number;
  };
  agency: {
    id: string;
    name: string;
    clients: number;
    members: number;
  } | null;
}

interface Summary {
  totalUsers: number;
  totalAgencies: number;
  totalIndividuals: number;
  totalAudits: number;
  totalContent: number;
  recentActivities: number;
}

interface Activity {
  id: string;
  action: string;
  entityType: string | null;
  description: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    accountType: string;
  };
}

export default function AdminPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"users" | "activities">("users");

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Activities state
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityPeriod, setActivityPeriod] = useState("7d");
  const [activityStats, setActivityStats] = useState<any>(null);

  // Selected user for detail view
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);

  useEffect(() => {
    if (isSignedIn) {
      if (activeTab === "users") {
        fetchUsers();
      } else {
        fetchActivities();
      }
    }
  }, [isSignedIn, activeTab, currentPage, searchTerm, accountTypeFilter, activityPeriod]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
      });
      if (searchTerm) params.append("search", searchTerm);
      if (accountTypeFilter) params.append("accountType", accountTypeFilter);

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) {
        if (response.status === 403) {
          setError("Access denied. Admin privileges required.");
          return;
        }
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.users);
      setSummary(data.summary);
      setTotalPages(data.pagination.totalPages);
      setError(null);
    } catch (err) {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "50",
        period: activityPeriod,
      });

      const response = await fetch(`/api/admin/activities?${params}`);
      if (!response.ok) {
        if (response.status === 403) {
          setError("Access denied. Admin privileges required.");
          return;
        }
        throw new Error("Failed to fetch activities");
      }

      const data = await response.json();
      setActivities(data.activities);
      setActivityStats(data.stats);
      setError(null);
    } catch (err) {
      setError("Failed to load activities");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetail = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/user/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedUser(data);
        setShowUserDetail(true);
      }
    } catch (err) {
      console.error("Failed to fetch user details:", err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      audit_created: "Created Audit",
      audit_completed: "Completed Audit",
      content_generated: "Generated Content",
      content_published: "Published Content",
      client_added: "Added Client",
      client_switched: "Switched Client",
      onboarding_completed: "Completed Onboarding",
      login: "Logged In",
    };
    return labels[action] || action.replace(/_/g, " ");
  };

  if (!isLoaded || loading) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Loading admin panel...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (error) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
          <div className="text-center max-w-md">
            <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Access Denied
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Admin Dashboard
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Manage users, view activities, and monitor platform usage
              </p>
            </div>
          </div>

          {/* Summary Stats */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-xs text-blue-600 font-medium">Total Users</span>
                </div>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {summary.totalUsers}
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-4 h-4 text-purple-600" />
                  <span className="text-xs text-purple-600 font-medium">Agencies</span>
                </div>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {summary.totalAgencies}
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">Individuals</span>
                </div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {summary.totalIndividuals}
                </p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="w-4 h-4 text-amber-600" />
                  <span className="text-xs text-amber-600 font-medium">Total Audits</span>
                </div>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                  {summary.totalAudits}
                </p>
              </div>
              <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="w-4 h-4 text-cyan-600" />
                  <span className="text-xs text-cyan-600 font-medium">Content Analyses</span>
                </div>
                <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">
                  {summary.totalContent}
                </p>
              </div>
              <div className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-rose-600" />
                  <span className="text-xs text-rose-600 font-medium">24h Activities</span>
                </div>
                <p className="text-2xl font-bold text-rose-700 dark:text-rose-300">
                  {summary.recentActivities}
                </p>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "users"
                ? "bg-purple-600 text-white"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            <Users className="w-4 h-4 inline-block mr-2" />
            Users
          </button>
          <button
            onClick={() => setActiveTab("activities")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "activities"
                ? "bg-purple-600 text-white"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            <Activity className="w-4 h-4 inline-block mr-2" />
            Activities
          </button>
          <button
            onClick={() => activeTab === "users" ? fetchUsers() : fetchActivities()}
            className="ml-auto px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === "users" && (
          <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search users by email or name..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <select
                value={accountTypeFilter}
                onChange={(e) => {
                  setAccountTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Account Types</option>
                <option value="INDIVIDUAL">Individual</option>
                <option value="AGENCY">Agency</option>
              </select>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-700/50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Audits
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Content
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                              {(user.name || user.email).charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-slate-100">
                                {user.name || "No name"}
                              </p>
                              <p className="text-sm text-slate-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                              user.accountType === "AGENCY"
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                            }`}
                          >
                            {user.accountType === "AGENCY" ? (
                              <Building2 className="w-3 h-3" />
                            ) : (
                              <Users className="w-3 h-3" />
                            )}
                            {user.accountType}
                          </span>
                          {user.agency && (
                            <p className="text-xs text-slate-500 mt-1">
                              {user.agency.name} ({user.agency.clients} clients)
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-medium text-slate-900 dark:text-slate-100">
                            {user.stats.audits}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-medium text-slate-900 dark:text-slate-100">
                            {user.stats.contentAnalyses}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-500">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            onClick={() => fetchUserDetail(user.id)}
                            className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-500">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-700 rounded-lg disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-700 rounded-lg disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Activities Tab */}
        {activeTab === "activities" && (
          <>
            {/* Period Filter */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm text-slate-600 dark:text-slate-400">Period:</span>
              {["1d", "7d", "30d", "all"].map((period) => (
                <button
                  key={period}
                  onClick={() => setActivityPeriod(period)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    activityPeriod === period
                      ? "bg-purple-600 text-white"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  {period === "all" ? "All Time" : `Last ${period}`}
                </button>
              ))}
            </div>

            {/* Activity Stats */}
            {activityStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {Object.entries(activityStats.actionBreakdown || {}).slice(0, 4).map(([action, count]) => (
                  <div key={action} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 mb-1">{getActionLabel(action)}</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      {count as number}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Activities List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700">
              {activities.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                      {(activity.user.name || activity.user.email).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {activity.user.name || activity.user.email}
                        </span>
                        <span className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full">
                          {getActionLabel(activity.action)}
                        </span>
                      </div>
                      {activity.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {activity.description}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 mt-1">
                        {formatDate(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  No activities found for this period
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* User Detail Modal */}
      {showUserDetail && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                    {(selectedUser.user.name || selectedUser.user.email).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      {selectedUser.user.name || "No name"}
                    </h2>
                    <p className="text-slate-500">{selectedUser.user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowUserDetail(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {selectedUser.stats.audits}
                  </p>
                  <p className="text-xs text-slate-500">Audits</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {selectedUser.stats.contentAnalyses}
                  </p>
                  <p className="text-xs text-slate-500">Content</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {selectedUser.stats.scheduledContent}
                  </p>
                  <p className="text-xs text-slate-500">Scheduled</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {selectedUser.stats.activities}
                  </p>
                  <p className="text-xs text-slate-500">Activities</p>
                </div>
              </div>

              {/* Recent Audits */}
              {selectedUser.audits?.length > 0 && (
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-3">
                    Recent Audits
                  </h3>
                  <div className="space-y-2">
                    {selectedUser.audits.map((audit: any) => (
                      <div
                        key={audit.id}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {audit.domain}
                          </p>
                          <p className="text-xs text-slate-500">{formatDate(audit.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              audit.status === "COMPLETED"
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {audit.status}
                          </span>
                          {audit.overallScore && (
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1">
                              Score: {audit.overallScore}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Activities */}
              {selectedUser.activities?.length > 0 && (
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-3">
                    Recent Activities
                  </h3>
                  <div className="space-y-2">
                    {selectedUser.activities.slice(0, 5).map((activity: any) => (
                      <div
                        key={activity.id}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                      >
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {activity.description || getActionLabel(activity.action)}
                        </span>
                        <span className="text-xs text-slate-500">
                          {formatDate(activity.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </SidebarLayout>
  );
}
