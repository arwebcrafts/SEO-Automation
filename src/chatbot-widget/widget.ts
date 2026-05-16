/**
 * SEO Hub Chatbot Widget - Embeddable Script
 * Usage: <script src="https://yourdomain.com/widget.js" data-site-id="your-site-id"></script>
 */
(function () {
  const script = document.currentScript as HTMLScriptElement;
  const siteId = script?.getAttribute("data-site-id");
  if (!siteId) return console.error("[SEO Hub Chatbot] Missing data-site-id");

  const API_BASE = script?.src ? new URL(script.src).origin : "";
  let sessionId = sessionStorage.getItem("seo-hub-session") || "s_" + Math.random().toString(36).slice(2);
  sessionStorage.setItem("seo-hub-session", sessionId);

  // Styles
  const style = document.createElement("style");
  style.textContent = `
    #seo-hub-chatbot-btn{position:fixed;bottom:24px;right:24px;z-index:99999;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff;border:none;cursor:pointer;box-shadow:0 4px 15px rgba(59,130,246,.4);display:flex;align-items:center;justify-content:center;transition:transform .2s}
    #seo-hub-chatbot-btn:hover{transform:scale(1.05)}
    #seo-hub-chatbot-panel{position:fixed;bottom:90px;right:24px;z-index:99999;width:360px;max-height:480px;background:#fff;border-radius:16px;box-shadow:0 20px 50px rgba(0,0,0,.15);display:none;flex-direction:column;overflow:hidden;font-family:Inter,-apple-system,sans-serif}
    #seo-hub-chatbot-panel.open{display:flex}
    .shc-header{padding:16px;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff}
    .shc-header h3{margin:0;font-size:14px;font-weight:600}
    .shc-header p{margin:4px 0 0;font-size:12px;opacity:.8}
    .shc-messages{flex:1;overflow-y:auto;padding:16px;max-height:300px}
    .shc-msg{margin-bottom:12px;display:flex}
    .shc-msg.user{justify-content:flex-end}
    .shc-msg .bubble{max-width:80%;padding:10px 14px;border-radius:12px;font-size:13px;line-height:1.4}
    .shc-msg.bot .bubble{background:#f1f5f9;color:#334155;border-bottom-left-radius:4px}
    .shc-msg.user .bubble{background:#3b82f6;color:#fff;border-bottom-right-radius:4px}
    .shc-input{display:flex;padding:12px;border-top:1px solid #e2e8f0;gap:8px}
    .shc-input input{flex:1;padding:8px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;outline:none}
    .shc-input input:focus{border-color:#3b82f6}
    .shc-input button{padding:8px 12px;background:#3b82f6;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px}
  `;
  document.head.appendChild(style);

  // Button
  const btn = document.createElement("button");
  btn.id = "seo-hub-chatbot-btn";
  btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>';
  document.body.appendChild(btn);

  // Panel
  const panel = document.createElement("div");
  panel.id = "seo-hub-chatbot-panel";
  panel.innerHTML = `
    <div class="shc-header"><h3>Chat with us</h3><p>We typically reply instantly</p></div>
    <div class="shc-messages" id="shc-msgs"></div>
    <div class="shc-input"><input id="shc-input" placeholder="Type a message..." /><button id="shc-send">Send</button></div>
  `;
  document.body.appendChild(panel);

  // Logic
  const msgs = document.getElementById("shc-msgs");
  const input = document.getElementById("shc-input") as HTMLInputElement;
  const sendBtn = document.getElementById("shc-send");

  function addMsg(text: string, role: string) {
    const div = document.createElement("div");
    div.className = `shc-msg ${role === "user" ? "user" : "bot"}`;
    div.innerHTML = `<div class="bubble">${text}</div>`;
    msgs?.appendChild(div);
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }

  // Fetch config and show welcome
  fetch(`${API_BASE}/api/chatbot/config/${siteId}`).then(r => r.json()).then(cfg => {
    if (cfg.welcomeMessage) addMsg(cfg.welcomeMessage, "bot");
  }).catch(() => addMsg("Hi! How can I help you?", "bot"));

  async function send() {
    const text = input?.value?.trim();
    if (!text) return;
    if (input) input.value = "";
    addMsg(text, "user");

    try {
      const res = await fetch(`${API_BASE}/api/chatbot/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, sessionId, message: text }),
      });
      const data = await res.json();
      addMsg(data.reply || "Sorry, I couldn't process that.", "bot");
    } catch {
      addMsg("Sorry, something went wrong. Please try again.", "bot");
    }
  }

  btn.onclick = () => panel.classList.toggle("open");
  sendBtn?.addEventListener("click", send);
  input?.addEventListener("keydown", (e: KeyboardEvent) => { if (e.key === "Enter") send(); });
})();
