"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Check, Loader2, Plug, Zap, AlertCircle, ExternalLink, RefreshCw } from "lucide-react";

interface WordPressConnection {
  siteUrl: string;
  apiKey: string;
  connected: boolean;
  siteName?: string;
}

interface FixResult {
  success: boolean;
  message?: string;
  fixed?: number;
  // Dynamic fields from WordPress / API responses
  [key: string]: any;
}

interface WordPressConnectProps {
  domain: string;
  onConnectionChange?: (connected: boolean) => void;
}

export function WordPressConnect({ domain, onConnectionChange }: WordPressConnectProps) {
  const [showModal, setShowModal] = useState(false);
  const [connection, setConnection] = useState<WordPressConnection | null>(null);
  const [siteUrl, setSiteUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [connectMode, setConnectMode] = useState<"manual" | "auto" | "fix">("auto");
  const [handshakeStatus, setHandshakeStatus] = useState<"idle" | "pending" | "approved" | "error">("idle");
  const [connectToken, setConnectToken] = useState("");
  const [authUrl, setAuthUrl] = useState("");

  // Load saved connection - use global key for WordPress connection
  // WordPress site is independent of the audited domain
  useEffect(() => {
    // Try global connection first, then domain-specific for backward compatibility
    const globalSaved = localStorage.getItem('wp_connection_global');
    const domainSaved = localStorage.getItem(`wp_connection_${domain}`);
    const saved = globalSaved || domainSaved;
    
    if (saved) {
      const conn = JSON.parse(saved);
      setConnection(conn);
      onConnectionChange?.(conn.connected);
      
      // Migrate to global key if using domain-specific
      if (!globalSaved && domainSaved) {
        localStorage.setItem('wp_connection_global', domainSaved);
      }
    }
  }, [domain, onConnectionChange]);

  // Poll for handshake approval
  useEffect(() => {
    if (handshakeStatus !== "pending" || !connectToken || !siteUrl) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/wordpress?action=handshake_status&site_url=${encodeURIComponent(siteUrl)}&connect_token=${connectToken}`
        );
        const data = await response.json();

        if (data.status === "approved") {
          setHandshakeStatus("approved");
          
          // First try to get API key from status response (plugin v5+ includes it)
          let apiKey = data.api_key || data.apiKey;
          let siteName = data.site_name || data.siteName;
          let returnedSiteUrl = data.site_url || data.siteUrl || siteUrl;
          
          // If not in status, complete the handshake to get API key
          if (!apiKey) {
            const completeResponse = await fetch("/api/wordpress", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                site_url: siteUrl,
                action: "handshake_complete",
                options: { connect_token: connectToken },
              }),
            });
            const completeData = await completeResponse.json();
            console.log("[WP Connect] Handshake complete response:", completeData);

            // Handle various response formats from the plugin
            apiKey = completeData.api_key || completeData.apiKey || completeData.key;
            siteName = completeData.site_name || completeData.siteName || completeData.name || siteName;
            returnedSiteUrl = completeData.site_url || completeData.siteUrl || returnedSiteUrl;
          }
          
          console.log("[WP Connect] Extracted API key:", apiKey ? 'present (length: ' + apiKey.length + ')' : 'missing');
          
          if (apiKey && apiKey.length >= 20) {
            const conn: WordPressConnection = {
              siteUrl: returnedSiteUrl,
              apiKey: apiKey, // Use the actual API key from plugin
              connected: true,
              siteName: siteName || returnedSiteUrl,
            };
            // Save to global key so it works across all audited domains
            localStorage.setItem('wp_connection_global', JSON.stringify(conn));
            console.log("[WP Connect] Connection saved with real API key");
            setConnection(conn);
            onConnectionChange?.(true);
            setShowModal(false);
            setHandshakeStatus("idle");
          } else {
            // DO NOT use connectToken as fallback - it won't work for authentication
            console.error("[WP Connect] Failed to get valid API key from plugin");
            setHandshakeStatus("error");
            setError("Connection approved but failed to retrieve API key. Please use Manual Setup with the API key from WordPress admin → SEO AutoFix → API / Connect.");
          }
        }
      } catch {
        // Continue polling
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [handshakeStatus, connectToken, siteUrl, domain, onConnectionChange]);

  const handleAutoConnect = async () => {
    if (!siteUrl) {
      setError("Please enter your WordPress site URL");
      return;
    }

    setConnecting(true);
    setError("");

    try {
      const response = await fetch("/api/wordpress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site_url: siteUrl,
          action: "handshake_init",
        }),
      });
      const data = await response.json();

      // Handle both auth_url and approval_url for compatibility
      const authUrlFromResponse = data.auth_url || data.approval_url;
      const tokenFromResponse = data.connect_token || data.token;
      
      if (data.success && authUrlFromResponse) {
        setConnectToken(tokenFromResponse);
        setAuthUrl(authUrlFromResponse);
        setHandshakeStatus("pending");
        // Open WordPress admin in new tab
        window.open(authUrlFromResponse, "_blank");
      } else {
        // Show detailed error message
        const errorMsg = data.error || "Failed to initiate connection";
        const details = data.details ? ` (${data.details.substring(0, 100)})` : "";
        setError(`${errorMsg}${details}`);
      }
    } catch (err) {
      setError(`Connection failed: ${err instanceof Error ? err.message : "Make sure SEO AutoFix Pro plugin is installed and activated on your WordPress site."}`);
    } finally {
      setConnecting(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    setError("");

    try {
      const response = await fetch(
        `/api/wordpress?site_url=${encodeURIComponent(siteUrl)}&api_key=${encodeURIComponent(apiKey)}`
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Failed to connect");
        return;
      }

      const conn: WordPressConnection = {
        siteUrl,
        apiKey,
        connected: true,
        siteName: data.name,
      };

      // Save to global key so it works across all audited domains
      localStorage.setItem('wp_connection_global', JSON.stringify(conn));
      setConnection(conn);
      onConnectionChange?.(true);
      setShowModal(false);
    } catch {
      setError("Connection failed. Check your credentials.");
    } finally {
      setConnecting(false);
    }
  };

  const handleFixApiKey = async () => {
    setConnecting(true);
    setError("");

    try {
      const response = await fetch(
        `/api/wordpress?site_url=${encodeURIComponent(siteUrl)}&api_key=${encodeURIComponent(apiKey)}`
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Failed to verify API key");
        return;
      }

      const conn: WordPressConnection = {
        siteUrl,
        apiKey,
        connected: true,
        siteName: data.name,
      };

      // Save to global key so it works across all audited domains
      localStorage.setItem('wp_connection_global', JSON.stringify(conn));
      setConnection(conn);
      onConnectionChange?.(true);
      setShowModal(false);
      console.log("[WP Connect] API key updated successfully");
    } catch {
      setError("API key verification failed. Check the key and try again.");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    // Remove both global and domain-specific keys
    localStorage.removeItem('wp_connection_global');
    localStorage.removeItem(`wp_connection_${domain}`);
    setConnection(null);
    onConnectionChange?.(false);
  };

  return (
    <>
      {connection?.connected ? (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-2xl p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                <Check className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-base font-bold text-green-800 dark:text-green-200">
                  ✅ WordPress Connected
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {connection.siteName || connection.siteUrl}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:ml-auto flex-wrap">
              <span className="px-3 py-1.5 bg-green-100 dark:bg-green-800/40 text-green-700 dark:text-green-300 text-sm font-semibold rounded-full flex items-center gap-1.5 border border-green-200 dark:border-green-700">
                <Zap className="h-4 w-4" />
                Auto-Fix Ready
              </span>
              <button
                onClick={() => setShowModal(true)}
                className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-white hover:bg-blue-500 border border-blue-300 dark:border-blue-700 rounded-lg transition-all flex items-center gap-1"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Fix Connection
              </button>
              <button
                onClick={handleDisconnect}
                className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:text-white hover:bg-red-500 border border-red-300 dark:border-red-700 rounded-lg transition-all flex items-center gap-1"
              >
                <X className="h-3.5 w-3.5" />
                Clear Connection
              </button>
            </div>
          </div>
          <p className="text-xs text-green-600 dark:text-green-500 mt-3 bg-green-100/50 dark:bg-green-900/30 px-3 py-2 rounded-lg">
            💡 Auto-fix buttons are now available on each category section and individual issues below.
          </p>
        </div>
      ) : (
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-medium"
        >
          <Plug className="h-4 w-4" />
          Connect WordPress
        </button>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Plug className="h-5 w-5" />
                Connect WordPress Site
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setHandshakeStatus("idle");
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Connection Mode Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setConnectMode("auto")}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  connectMode === "auto"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                🚀 Auto Connect
              </button>
              <button
                onClick={() => setConnectMode("manual")}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  connectMode === "manual"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                🔧 Manual Setup
              </button>
              {connection?.connected && (
                <button
                  onClick={() => setConnectMode("fix")}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    connectMode === "fix"
                      ? "bg-orange-500 text-white"
                      : "bg-orange-100 hover:bg-orange-200 text-orange-700"
                  }`}
                >
                  🔑 Fix API Key
                </button>
              )}
            </div>

            <div className="space-y-4">
              {connectMode === "auto" ? (
                <>
                  <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">
                      One-Click Connection
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Enter your WordPress URL and click connect. You'll be redirected to approve the connection in your WordPress admin.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      WordPress Site URL
                    </label>
                    <input
                      type="url"
                      value={siteUrl}
                      onChange={(e) => setSiteUrl(e.target.value)}
                      placeholder="https://yoursite.com"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  {handshakeStatus === "pending" && (
                    <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
                      <div className="flex items-center gap-3 text-yellow-800 dark:text-yellow-200">
                        <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/50 rounded-full flex items-center justify-center">
                          <Loader2 className="h-5 w-5 animate-spin text-yellow-600" />
                        </div>
                        <div>
                          <span className="font-semibold block">Waiting for Approval</span>
                          <span className="text-sm text-yellow-700 dark:text-yellow-300">Check your WordPress admin panel</span>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                        <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-2">
                          A new tab should have opened. If not, click below:
                        </p>
                        <a
                          href={authUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open WordPress Admin
                        </a>
                      </div>
                    </div>
                  )}

                  {handshakeStatus === "approved" && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border border-green-200 dark:border-green-800 rounded-xl p-4">
                      <div className="flex items-center gap-3 text-green-800 dark:text-green-200">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <span className="font-semibold block">Connection Successful!</span>
                          <span className="text-sm text-green-700 dark:text-green-300">Your WordPress site is now connected</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleAutoConnect}
                    disabled={connecting || !siteUrl || handshakeStatus === "pending"}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {connecting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : handshakeStatus === "pending" ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Waiting for approval...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        Connect Automatically
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                      Setup Instructions
                    </h3>
                    <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                      <li>Install SEO AutoFix Pro plugin on your WordPress site</li>
                      <li>Go to SEO AutoFix → API / Connect</li>
                      <li>Enable Remote API</li>
                      <li>Copy Site URL and API Key below</li>
                    </ol>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      WordPress Site URL
                    </label>
                    <input
                      type="url"
                      value={siteUrl}
                      onChange={(e) => setSiteUrl(e.target.value)}
                      placeholder="https://yoursite.com"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">API Key</label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Your API key from plugin"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <button
                    onClick={handleConnect}
                    disabled={connecting || !siteUrl || !apiKey}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {connecting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        Connect & Verify
                      </>
                    )}
                  </button>
                </>
              )}
              
              {connectMode === "fix" ? (
                <>
                  <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                    <h3 className="font-medium text-orange-800 dark:text-orange-200 mb-2">
                      Fix API Key Authentication
                    </h3>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                      If auto-fix buttons are failing, you need to update the API key with the correct one from WordPress admin.
                    </p>
                    <ol className="text-sm text-orange-700 dark:text-orange-300 space-y-1 list-decimal list-inside">
                      <li>Go to WordPress admin: <code className="bg-orange-100 px-1 rounded">https://arialflow.com/wp-admin</code></li>
                      <li>Navigate to <strong>SEO AutoFix → API / Connect</strong></li>
                      <li>Ensure <strong>Remote API</strong> is enabled</li>
                      <li>Copy the <strong>API Key</strong> shown on the page</li>
                      <li>Paste it below and click Update</li>
                    </ol>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      WordPress Site URL
                    </label>
                    <input
                      type="url"
                      value={siteUrl}
                      onChange={(e) => setSiteUrl(e.target.value)}
                      placeholder="https://arialflow.com"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Correct API Key</label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Paste the API key from WordPress admin"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <button
                    onClick={handleFixApiKey}
                    disabled={connecting || !siteUrl || !apiKey}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                  >
                    {connecting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        Update API Key
                      </>
                    )}
                  </button>
                </>
              ) : null}

              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// AI-Powered Fix Button - generates content on website and sends to WordPress
interface AIFixButtonProps {
  domain: string;
  fixType: 'alt_text' | 'meta_description' | 'social';
  label: string;
  onFixed?: (result: FixResult) => void;
}

export function AIFixButton({ domain, fixType, label, onFixed }: AIFixButtonProps) {
  const [fixing, setFixing] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [result, setResult] = useState<FixResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleAIFix = async () => {
    const saved = localStorage.getItem('wp_connection_global') || localStorage.getItem(`wp_connection_${domain}`);
    if (!saved) {
      setResult({ success: false, message: "No WordPress connection found" });
      return;
    }

    const { siteUrl, apiKey } = JSON.parse(saved);
    setFixing(true);
    setResult(null);

    try {
      // Step 1: Fetch pending items from WordPress
      setProgress('Fetching items from WordPress...');
      const pendingRes = await fetch("/api/wordpress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site_url: siteUrl,
          api_key: apiKey,
          action: fixType === 'social' ? 'social_settings' : 'ai_pending',
          options: { type: fixType === 'alt_text' ? 'images' : 'posts' }
        }),
      });
      
      if (!pendingRes.ok) {
        throw new Error('Failed to fetch pending items');
      }
      
      const pendingData = await pendingRes.json();
      console.log('[AIFix] Pending items:', pendingData);

      // Handle social fixes differently
      if (fixType === 'social') {
        setProgress('Configuring social settings...');
        const availableImage = pendingData.available_images?.logo || pendingData.available_images?.featured;
        
        const applyRes = await fetch("/api/wordpress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            site_url: siteUrl,
            api_key: apiKey,
            action: 'social_apply',
            options: {
              enable_og_tags: true,
              enable_twitter_cards: true,
              default_og_image: availableImage || ''
            }
          }),
        });
        
        const applyData = await applyRes.json();
        setResult({
          success: true,
          message: 'Social settings applied',
          fixes_applied: applyData.fixes_applied,
          og_image_set: !!availableImage,
          needs_manual_action: !availableImage ? [{
            issue: 'og_image',
            message: 'No logo or featured image found. Upload a default social image in WordPress Media Library.',
            admin_url: `${siteUrl}/wp-admin/upload.php`
          }] : []
        });
        onFixed?.(applyData);
        return;
      }

      // Step 2: Generate AI content for each item
      const items = fixType === 'alt_text' ? pendingData.images : pendingData.posts;
      if (!items || items.length === 0) {
        setResult({ success: true, message: 'No items need fixing', fixed: 0 });
        return;
      }

      setProgress(`Generating AI content for ${items.length} items...`);
      const generatedItems: Array<{ id: number; alt_text?: string; meta_description?: string }> = [];
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        setProgress(`Generating ${i + 1}/${items.length}...`);
        
        try {
          if (fixType === 'alt_text') {
            const aiRes = await fetch("/api/ai", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: 'generate_alt_text',
                data: {
                  imageName: item.filename,
                  pageContext: item.page_context || item.title,
                  imageUrl: item.url
                }
              }),
            });
            const aiData = await aiRes.json();
            if (aiData.altText) {
              generatedItems.push({ id: item.id, alt_text: aiData.altText });
            }
          } else if (fixType === 'meta_description') {
            const aiRes = await fetch("/api/ai", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: 'generate_meta_description',
                data: {
                  title: item.title,
                  content: item.excerpt
                }
              }),
            });
            const aiData = await aiRes.json();
            if (aiData.metaDescription) {
              generatedItems.push({ id: item.id, meta_description: aiData.metaDescription });
            }
          }
        } catch (err) {
          console.error(`[AIFix] Failed to generate for item ${item.id}:`, err);
        }
      }

      // Step 3: Send generated content to WordPress
      setProgress(`Applying ${generatedItems.length} fixes to WordPress...`);
      const applyRes = await fetch("/api/wordpress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site_url: siteUrl,
          api_key: apiKey,
          action: 'ai_apply',
          options: {
            type: fixType,
            items: generatedItems
          }
        }),
      });

      const applyData = await applyRes.json();
      console.log('[AIFix] Apply result:', applyData);

      const remaining = items.length - generatedItems.length;
      setResult({
        success: true,
        message: `Applied ${applyData.applied} AI-generated ${fixType === 'alt_text' ? 'alt texts' : 'meta descriptions'}`,
        fixed: applyData.applied,
        needs_manual_action: remaining > 0 ? [{
          issue: fixType,
          message: `${remaining} items could not be processed. Try running again or fix manually.`,
          admin_url: `${siteUrl}/wp-admin/${fixType === 'alt_text' ? 'upload.php' : 'edit.php'}`
        }] : []
      });
      onFixed?.(applyData);
      
    } catch (error) {
      console.error('[AIFix] Error:', error);
      setResult({ success: false, message: String(error) });
    } finally {
      setFixing(false);
      setProgress('');
    }
  };

  if (result) {
    const needsManual = result.needs_manual_action?.length > 0;
    return (
      <div className="relative">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
            needsManual
              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200'
              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200'
          }`}
        >
          <Check className="h-4 w-4" />
          <span className="font-medium">{needsManual ? 'Partial' : 'Fixed!'}</span>
          <span className="text-xs opacity-75">({result.fixed || 0} items)</span>
        </button>
        {showDetails && (
          <div className="absolute top-full right-0 mt-1 z-10 p-3 bg-white dark:bg-slate-800 border rounded-lg shadow-lg text-xs max-w-sm">
            <p className="text-green-600 font-medium mb-2">✓ {result.message}</p>
            {needsManual && result.needs_manual_action?.map((action: { issue: string; message: string; admin_url?: string }, i: number) => (
              <div key={i} className="mt-2 text-yellow-600">
                <p>⚠ {action.message}</p>
                {action.admin_url && (
                  <a href={action.admin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-[10px]">
                    Open in WordPress →
                  </a>
                )}
              </div>
            ))}
            <button onClick={() => { setResult(null); handleAIFix(); }} className="mt-2 text-blue-600 hover:underline text-[10px]">
              Run Again
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleAIFix}
      disabled={fixing}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 shadow-sm font-medium"
    >
      {fixing ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {progress || 'Processing...'}
        </>
      ) : (
        <>
          <Zap className="h-3.5 w-3.5" />
          {label}
        </>
      )}
    </button>
  );
}

// Auto-Fix Button Component
interface AutoFixButtonProps {
  domain: string;
  fixType: string;
  label: string;
  checkId?: string;
  onFixed?: (result: FixResult) => void;
}

export function AutoFixButton({ domain, fixType, label, onFixed }: AutoFixButtonProps) {
  const [fixing, setFixing] = useState(false);
  const [result, setResult] = useState<FixResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleFix = async () => {
    // Use global key for WordPress connection
    const saved = localStorage.getItem('wp_connection_global') || localStorage.getItem(`wp_connection_${domain}`);
    if (!saved) {
      setResult({ success: false, message: "No WordPress connection found" });
      return;
    }

    const { siteUrl, apiKey } = JSON.parse(saved);
    console.log(`[AutoFix] Starting fix: ${fixType}`);
    console.log(`[AutoFix] Site URL: ${siteUrl}`);
    console.log(`[AutoFix] API Key: ${apiKey ? apiKey.substring(0, 8) + '...' : 'missing'}`);
    
    setFixing(true);
    setResult(null);

    try {
      const response = await fetch("/api/wordpress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site_url: siteUrl,
          api_key: apiKey,
          action: fixType,
        }),
      });

      console.log(`[AutoFix] Response status: ${response.status}`);
      const data = await response.json();
      console.log(`[AutoFix] Response data:`, data);
      
      // Handle 401 authentication errors specifically
      if (response.status === 401 || data.error === "Invalid API key") {
        console.error(`[AutoFix] Authentication failed - API key invalid`);
        setResult({ 
          success: false, 
          message: "Authentication failed. Click 'Fix Connection' button above to update your API key from WordPress admin → SEO AutoFix → API / Connect." 
        });
        return;
      }
      
      setResult(data);
      onFixed?.(data);
    } catch (error) {
      console.error(`[AutoFix] Error:`, error);
      setResult({ success: false, message: "Fix failed - check plugin connection" });
    } finally {
      setFixing(false);
    }
  };

  // Extract fix details from result
  const getFixSummary = () => {
    if (!result) return null;
    const items: string[] = [];
    
    // Check various result properties for fix counts
    if (result.fixed && result.fixed > 0) items.push(`${result.fixed} items fixed`);
    if (result.alt_result?.fixed && result.alt_result.fixed > 0) items.push(`${result.alt_result.fixed} alt texts`);
    if (result.meta_result?.fixed && result.meta_result.fixed > 0) items.push(`${result.meta_result.fixed} meta descriptions`);
    if (result.content_images_fixed?.fixed && result.content_images_fixed.fixed > 0) items.push(`${result.content_images_fixed.fixed} content images`);
    if (result.title_optimization?.optimized && result.title_optimization.optimized > 0) items.push(`${result.title_optimization.optimized} titles`);
    if (result.fixes_applied?.length && result.fixes_applied.length > 0) items.push(`${result.fixes_applied.length} settings enabled`);
    
    return items.length > 0 ? items.join(', ') : result.message;
  };

  // Check if actual fixes were applied (not just "already done" messages)
  const getActualFixCount = () => {
    if (!result) return 0;
    let count = 0;
    if (result.fixed && result.fixed > 0) count += result.fixed;
    if (result.alt_result?.fixed && result.alt_result.fixed > 0) count += result.alt_result.fixed;
    if (result.meta_result?.fixed && result.meta_result.fixed > 0) count += result.meta_result.fixed;
    if (result.content_images_fixed?.fixed && result.content_images_fixed.fixed > 0) count += result.content_images_fixed.fixed;
    if (result.title_optimization?.optimized && result.title_optimization.optimized > 0) count += result.title_optimization.optimized;
    if (result.fixes_applied?.length && result.fixes_applied.length > 0) count += result.fixes_applied.length;
    return count;
  };

  // Check if there are manual actions needed
  const needsManualAction = result?.needs_manual_action?.length > 0;
  
  // Check if no actual fixes were made (already done scenario)
  const noFixesNeeded = result?.success && getActualFixCount() === 0 && !needsManualAction;

  if (result) {
    if (result.success) {
      // Determine the appropriate status message
      const getStatusLabel = () => {
        if (noFixesNeeded) return 'Already OK';
        if (needsManualAction) return 'Partial Fix';
        if (getActualFixCount() > 0) return 'Fixed!';
        return 'Complete';
      };
      
      const getStatusColor = () => {
        if (noFixesNeeded) return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-200';
        if (needsManualAction) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800 hover:bg-yellow-200';
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 hover:bg-green-200';
      };
      
      const getStatusIcon = () => {
        if (noFixesNeeded) return <AlertCircle className="h-4 w-4" />;
        return <Check className="h-4 w-4" />;
      };
      
      return (
        <div className="relative">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${getStatusColor()}`}
          >
            {getStatusIcon()}
            <span className="font-medium">{getStatusLabel()}</span>
            <span className="text-xs opacity-75">(details)</span>
          </button>
          {showDetails && (
            <div className="absolute top-full right-0 mt-1 z-10 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg text-xs max-w-sm min-w-[280px]">
              <p className="text-green-700 dark:text-green-300 font-medium mb-2">✓ Applied:</p>
              <p className="text-slate-600 dark:text-slate-400 mb-2">{getFixSummary()}</p>
              
              {needsManualAction && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-yellow-700 dark:text-yellow-300 font-medium mb-2">⚠ Manual Action Needed:</p>
                  {result.needs_manual_action.map((action: { issue: string; message: string; admin_url?: string }, i: number) => (
                    <div key={i} className="mb-2 text-slate-600 dark:text-slate-400">
                      <p className="text-xs">{action.message}</p>
                      {action.admin_url && (
                        <a href={action.admin_url} target="_blank" rel="noopener noreferrer" 
                           className="text-blue-600 hover:underline text-[10px]">
                          Open in WordPress →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setResult(null); handleFix(); }}
                  className="text-blue-600 hover:underline text-[10px]"
                >
                  Run Again
                </button>
              </div>
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div className="relative">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
          >
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">Failed</span>
          </button>
          {showDetails && (
            <div className="absolute top-full right-0 mt-1 z-10 p-3 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-700 rounded-lg shadow-lg text-xs max-w-xs">
              <p className="text-red-700 dark:text-red-300 font-medium mb-1">Error:</p>
              <p className="text-slate-600 dark:text-slate-400">{result.message || 'Unknown error'}</p>
              <button
                onClick={(e) => { e.stopPropagation(); setResult(null); }}
                className="mt-2 text-blue-600 hover:underline"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      );
    }
  }

  return (
    <button
      onClick={handleFix}
      disabled={fixing}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 shadow-sm hover:shadow transition-all font-medium"
    >
      {fixing ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Fixing...
        </>
      ) : (
        <>
          <Zap className="h-3.5 w-3.5" />
          {label}
        </>
      )}
    </button>
  );
}

// Verify/Rescan Button Component - checks if fixes were actually applied
interface VerifyButtonProps {
  domain: string;
  category?: 'local_seo' | 'onpage' | 'social';
  onVerified?: (status: VerifyStatus) => void;
}

interface VerifyStatus {
  success: boolean;
  status: Record<string, {
    issues: Array<{
      type: string;
      fixable: boolean;
      message: string;
      action: string;
      count?: number;
    }>;
    [key: string]: unknown;
  }>;
  timestamp: string;
}

export function VerifyButton({ domain, category, onVerified }: VerifyButtonProps) {
  const [verifying, setVerifying] = useState(false);
  const [status, setStatus] = useState<VerifyStatus | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleVerify = async () => {
    const saved = localStorage.getItem('wp_connection_global') || localStorage.getItem(`wp_connection_${domain}`);
    if (!saved) return;

    const { siteUrl, apiKey } = JSON.parse(saved);
    setVerifying(true);

    try {
      const url = `/api/wordpress?action=verify&site_url=${encodeURIComponent(siteUrl)}&api_key=${encodeURIComponent(apiKey)}${category ? `&category=${category}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      
      setStatus(data);
      onVerified?.(data);
    } catch (error) {
      console.error('[Verify] Error:', error);
    } finally {
      setVerifying(false);
    }
  };

  const getTotalIssues = () => {
    if (!status?.status) return 0;
    return Object.values(status.status).reduce((total, cat) => 
      total + (cat.issues?.length || 0), 0);
  };

  const getFixableCount = () => {
    if (!status?.status) return 0;
    return Object.values(status.status).reduce((total, cat) => 
      total + (cat.issues?.filter((i: { fixable: boolean }) => i.fixable).length || 0), 0);
  };

  if (status) {
    const totalIssues = getTotalIssues();
    const fixable = getFixableCount();
    const allFixed = totalIssues === 0;

    return (
      <div className="relative">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
            allFixed 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200'
              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200'
          }`}
        >
          {allFixed ? <Check className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
          <span className="font-medium">{allFixed ? 'All Fixed!' : `${totalIssues} issues`}</span>
          {fixable > 0 && <span className="text-xs opacity-75">({fixable} fixable)</span>}
        </button>
        {showDetails && (
          <div className="absolute top-full right-0 mt-1 z-10 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg text-xs max-w-sm min-w-[280px]">
            <p className="font-medium mb-2">Current Status:</p>
            {Object.entries(status.status).map(([cat, data]) => (
              <div key={cat} className="mb-2">
                <p className="font-medium text-slate-700 dark:text-slate-300 capitalize">{cat.replace('_', ' ')}</p>
                {data.issues?.length === 0 ? (
                  <p className="text-green-600 text-[10px]">✓ No issues</p>
                ) : (
                  data.issues?.map((issue: { type: string; fixable: boolean; message: string; action: string }, i: number) => (
                    <div key={i} className={`text-[10px] ${issue.fixable ? 'text-blue-600' : 'text-yellow-600'}`}>
                      {issue.fixable ? '🔧' : '⚠'} {issue.message}
                    </div>
                  ))
                )}
              </div>
            ))}
            <button
              onClick={(e) => { e.stopPropagation(); handleVerify(); }}
              className="mt-2 text-blue-600 hover:underline text-[10px] flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" /> Rescan
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleVerify}
      disabled={verifying}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-200 transition-colors"
    >
      {verifying ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Checking...
        </>
      ) : (
        <>
          <RefreshCw className="h-3.5 w-3.5" />
          Verify Fixes
        </>
      )}
    </button>
  );
}

// Bulk Fix All Button
interface BulkFixButtonProps {
  domain: string;
  fixes: string[];
  onComplete?: () => void;
}

export function BulkFixButton({ domain, fixes, onComplete }: BulkFixButtonProps) {
  const [fixing, setFixing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  const handleBulkFix = async () => {
    // Use global key for WordPress connection
    const saved = localStorage.getItem('wp_connection_global') || localStorage.getItem(`wp_connection_${domain}`);
    if (!saved) return;

    const { siteUrl, apiKey } = JSON.parse(saved);
    setFixing(true);
    setProgress(0);

    try {
      const response = await fetch("/api/wordpress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site_url: siteUrl,
          api_key: apiKey,
          action: "fix_bulk",
          options: { fixes },
        }),
      });

      const data = await response.json();
      
      // Handle 401 authentication errors
      if (response.status === 401 || data.error === "Invalid API key") {
        console.error("[BulkFix] Authentication failed");
        alert("Authentication failed. Click 'Fix Connection' to update your API key from WordPress admin.");
        return;
      }
      
      setDone(true);
      onComplete?.();
    } catch {
      // Handle error
    } finally {
      setFixing(false);
      setProgress(100);
    }
  };

  if (done) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <Check className="h-5 w-5" />
        All fixes applied! Refresh to see updated results.
      </div>
    );
  }

  return (
    <button
      onClick={handleBulkFix}
      disabled={fixing}
      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 font-medium"
    >
      {fixing ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Applying {fixes.length} fixes... {progress}%
        </>
      ) : (
        <>
          <Zap className="h-5 w-5" />
          Auto-Fix All Issues ({fixes.length})
        </>
      )}
    </button>
  );
}

// Category Auto-Fix Button Component
interface CategoryFixButtonProps {
  domain: string;
  category: string;
  label: string;
  icon?: React.ReactNode;
  onFixed?: (result: FixResult) => void;
}

export function CategoryFixButton({ domain, category, label, icon, onFixed }: CategoryFixButtonProps) {
  const [fixing, setFixing] = useState(false);
  const [result, setResult] = useState<FixResult | null>(null);

  const categoryToAction: Record<string, string> = {
    local_seo: "fix_local_seo",
    onpage: "fix_onpage",
    links: "fix_links",
    usability: "fix_usability",
    performance: "fix_performance",
    social: "fix_social",
    technology: "fix_technology",
    content: "fix_content",
    eeat: "fix_eeat",
  };

  const handleFix = async () => {
    // Use global key for WordPress connection
    const saved = localStorage.getItem('wp_connection_global') || localStorage.getItem(`wp_connection_${domain}`);
    if (!saved) return;

    const { siteUrl, apiKey } = JSON.parse(saved);
    setFixing(true);
    setResult(null);

    try {
      const response = await fetch("/api/wordpress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site_url: siteUrl,
          api_key: apiKey,
          action: categoryToAction[category] || `fix_${category}`,
        }),
      });

      const data = await response.json();
      
      // Handle 401 authentication errors
      if (response.status === 401 || data.error === "Invalid API key") {
        setResult({ 
          success: false, 
          message: "Auth failed - use 'Fix Connection' to update API key" 
        });
        return;
      }
      
      setResult(data);
      onFixed?.(data);
    } catch {
      setResult({ success: false, message: "Fix failed" });
    } finally {
      setFixing(false);
    }
  };

  if (result?.success) {
    return (
      <span className="flex items-center gap-1 text-green-600 text-sm">
        <Check className="h-4 w-4" />
        Fixed!
      </span>
    );
  }

  return (
    <button
      onClick={handleFix}
      disabled={fixing}
      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
    >
      {fixing ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          Fixing...
        </>
      ) : (
        <>
          {icon || <Zap className="h-3 w-3" />}
          {label}
        </>
      )}
    </button>
  );
}

// Comprehensive Auto-Fix All Button
interface AutoFixAllButtonProps {
  domain: string;
  onComplete?: () => void;
}

export function AutoFixAllButton({ domain, onComplete }: AutoFixAllButtonProps) {
  const [fixing, setFixing] = useState(false);
  const [result, setResult] = useState<FixResult | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Use global key for WordPress connection
    const saved = localStorage.getItem('wp_connection_global') || localStorage.getItem(`wp_connection_${domain}`);
    setConnected(!!saved);
  }, [domain]);

  const handleAutoFixAll = async () => {
    // Use global key for WordPress connection
    const saved = localStorage.getItem('wp_connection_global') || localStorage.getItem(`wp_connection_${domain}`);
    if (!saved) return;

    const { siteUrl, apiKey } = JSON.parse(saved);
    setFixing(true);
    setResult(null);

    try {
      const response = await fetch("/api/wordpress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site_url: siteUrl,
          api_key: apiKey,
          action: "auto_fix_all",
          options: { categories: ["all"] },
        }),
      });

      const data = await response.json();
      
      // Handle 401 authentication errors
      if (response.status === 401 || data.error === "Invalid API key") {
        setResult({ 
          success: false, 
          message: "Authentication failed. Click 'Fix Connection' to update your API key from WordPress admin." 
        });
        return;
      }
      
      setResult(data);
      onComplete?.();
    } catch {
      setResult({ success: false, message: "Auto-fix failed" });
    } finally {
      setFixing(false);
    }
  };

  if (!connected) {
    return null;
  }

  if (result?.success) {
    return (
      <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl">
        <Check className="h-6 w-6 text-green-600" />
        <div>
          <p className="font-medium text-green-800 dark:text-green-200">All fixes applied successfully!</p>
          <p className="text-sm text-green-700 dark:text-green-300">
            {result.fixes_applied} fixes were applied. Refresh the page to see updated results.
          </p>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleAutoFixAll}
      disabled={fixing}
      className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white rounded-xl hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 disabled:opacity-50 font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
    >
      {fixing ? (
        <>
          <Loader2 className="h-6 w-6 animate-spin" />
          Applying All Fixes...
        </>
      ) : (
        <>
          <Zap className="h-6 w-6" />
          🚀 Auto-Fix All SEO Issues
        </>
      )}
    </button>
  );
}

// Issue Detection Component
interface IssueDetectorProps {
  domain: string;
  onIssuesDetected?: (issues: DetectedIssues) => void;
}

interface DetectedIssues {
  total_issues: number;
  total_fixable: number;
  issues: Record<string, Array<{
    id: string;
    message: string;
    severity: string;
    fixable: boolean;
    count?: number;
  }>>;
  fixable_actions: string[];
}

export function IssueDetector({ domain, onIssuesDetected }: IssueDetectorProps) {
  const [detecting, setDetecting] = useState(false);
  const [issues, setIssues] = useState<DetectedIssues | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Use global key for WordPress connection
    const saved = localStorage.getItem('wp_connection_global') || localStorage.getItem(`wp_connection_${domain}`);
    setConnected(!!saved);
  }, [domain]);

  const handleDetect = async () => {
    // Use global key for WordPress connection
    const saved = localStorage.getItem('wp_connection_global') || localStorage.getItem(`wp_connection_${domain}`);
    if (!saved) return;

    const { siteUrl, apiKey } = JSON.parse(saved);
    setDetecting(true);

    try {
      const response = await fetch(
        `/api/wordpress?action=detect_issues&site_url=${encodeURIComponent(siteUrl)}&api_key=${encodeURIComponent(apiKey)}`
      );
      const data = await response.json();
      
      if (data.success) {
        setIssues(data);
        onIssuesDetected?.(data);
      }
    } catch {
      // Handle error
    } finally {
      setDetecting(false);
    }
  };

  if (!connected) {
    return null;
  }

  return (
    <div className="space-y-4">
      <button
        onClick={handleDetect}
        disabled={detecting}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {detecting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Scanning WordPress Site...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4" />
            Detect Issues from Plugin
          </>
        )}
      </button>

      {issues && (
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Plugin Issues Detected</span>
            <span className="text-sm text-muted-foreground">
              {issues.total_issues} issues, {issues.total_fixable} fixable
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            {Object.entries(issues.issues).map(([category, categoryIssues]) => (
              categoryIssues.length > 0 && (
                <div key={category} className="flex items-center justify-between p-2 bg-background rounded">
                  <span className="capitalize">{category.replace(/_/g, " ")}</span>
                  <span className="text-orange-600 font-medium">{categoryIssues.length}</span>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
