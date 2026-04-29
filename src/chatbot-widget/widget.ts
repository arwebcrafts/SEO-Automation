(() => {
  const script = document.currentScript as HTMLScriptElement | null;
  const siteId =
    script?.dataset.siteId ||
    new URLSearchParams(window.location.search).get("site_id") ||
    "";

  if (!siteId) {
    console.warn("[SeoRise Chatbot] Missing data-site-id");
    return;
  }

  const base =
    script?.src.replace(/\/widget\.js.*$/, "") ||
    (window as unknown as { SEO_RISE_WIDGET_BASE?: string }).SEO_RISE_WIDGET_BASE ||
    "";

  async function loadConfig() {
    const res = await fetch(`${base}/api/chatbot/config/${siteId}`, {
      credentials: "omit",
    });
    if (!res.ok) throw new Error("config");
    return res.json() as Promise<{
      businessName: string;
      greeting: string;
      primaryColor: string;
      leadFormEnabled: boolean;
    }>;
  }

  function mount(cfg: {
    businessName: string;
    greeting: string;
    primaryColor: string;
    leadFormEnabled: boolean;
  }) {
    const host = document.createElement("div");
    host.attachShadow({ mode: "open" });
    document.body.appendChild(host);
    const root = host.shadowRoot!;

    const style = document.createElement("style");
    style.textContent = `
      :host { all: initial; }
      .wrap { position: fixed; right: 16px; bottom: 16px; z-index: 2147483647; font-family: system-ui, sans-serif; }
      .btn { width: 56px; height: 56px; border-radius: 50%; border: none; cursor: pointer; color: #fff; font-size: 24px; box-shadow: 0 4px 16px rgba(0,0,0,.2); }
      .panel { position: absolute; bottom: 64px; right: 0; width: 320px; max-height: 420px; background: #fff; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,.15); display: none; flex-direction: column; overflow: hidden; }
      .panel.open { display: flex; }
      .head { padding: 12px 14px; color: #fff; font-weight: 600; font-size: 15px; }
      .body { flex: 1; overflow-y: auto; padding: 10px; font-size: 14px; color: #111; background: #f9fafb; }
      .msg { margin: 6px 0; padding: 8px 10px; border-radius: 8px; max-width: 90%; }
      .msg.u { background: #e0e7ff; margin-left: auto; }
      .msg.a { background: #fff; border: 1px solid #e5e7eb; }
      .foot { display: flex; gap: 6px; padding: 8px; border-top: 1px solid #e5e7eb; background: #fff; }
      input, textarea { flex: 1; font: inherit; padding: 8px; border: 1px solid #d1d5db; border-radius: 8px; }
      button.send { padding: 8px 12px; border: none; border-radius: 8px; color: #fff; cursor: pointer; font-weight: 600; }
      .lead { padding: 8px; background: #fff; border-top: 1px solid #e5e7eb; display: none; flex-direction: column; gap: 6px; }
      .lead.show { display: flex; }
    `;
    root.appendChild(style);

    const wrap = document.createElement("div");
    wrap.className = "wrap";
    const panel = document.createElement("div");
    panel.className = "panel";
    const head = document.createElement("div");
    head.className = "head";
    head.style.background = cfg.primaryColor;
    head.textContent = cfg.businessName;
    const body = document.createElement("div");
    body.className = "body";
    const foot = document.createElement("div");
    foot.className = "foot";
    const input = document.createElement("textarea");
    input.rows = 2;
    input.placeholder = "Message…";
    const sendBtn = document.createElement("button");
    sendBtn.className = "send";
    sendBtn.style.background = cfg.primaryColor;
    sendBtn.textContent = "Send";
    foot.appendChild(input);
    foot.appendChild(sendBtn);

    const lead = document.createElement("div");
    lead.className = "lead";
    if (cfg.leadFormEnabled) {
      const n = document.createElement("input");
      n.placeholder = "Name";
      const e = document.createElement("input");
      e.placeholder = "Email";
      e.type = "email";
      const p = document.createElement("input");
      p.placeholder = "Phone";
      const sub = document.createElement("button");
      sub.className = "send";
      sub.style.background = cfg.primaryColor;
      sub.textContent = "Send details";
      lead.appendChild(n);
      lead.appendChild(e);
      lead.appendChild(p);
      lead.appendChild(sub);
      sub.onclick = async () => {
        await fetch(`${base}/api/chatbot/leads?siteId=${encodeURIComponent(siteId)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            siteId,
            name: n.value,
            email: e.value,
            phone: p.value,
            firstMessage: messages.map((m) => `${m.role}: ${m.content}`).join("\n"),
          }),
        });
        lead.classList.remove("show");
        const m = document.createElement("div");
        m.className = "msg a";
        m.textContent = "Thanks — we received your details.";
        body.appendChild(m);
      };
    }

    const launcher = document.createElement("button");
    launcher.className = "btn";
    launcher.style.background = cfg.primaryColor;
    launcher.textContent = "💬";
    launcher.onclick = () => {
      panel.classList.toggle("open");
    };

    panel.appendChild(head);
    panel.appendChild(body);
    panel.appendChild(lead);
    panel.appendChild(foot);
    wrap.appendChild(panel);
    wrap.appendChild(launcher);
    root.appendChild(wrap);

    const greet = document.createElement("div");
    greet.className = "msg a";
    greet.textContent = cfg.greeting;
    body.appendChild(greet);

    const messages: { role: "user" | "assistant"; content: string }[] = [];

    async function send() {
      const text = input.value.trim();
      if (!text) return;
      input.value = "";
      const u = document.createElement("div");
      u.className = "msg u";
      u.textContent = text;
      body.appendChild(u);
      messages.push({ role: "user", content: text });

      const res = await fetch(`${base}/api/chatbot/message?siteId=${encodeURIComponent(siteId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, messages }),
      });
      if (!res.ok) {
        const err = document.createElement("div");
        err.className = "msg a";
        err.textContent = "Sorry, something went wrong.";
        body.appendChild(err);
        return;
      }
      const reader = res.body?.getReader();
      const dec = new TextDecoder();
      const a = document.createElement("div");
      a.className = "msg a";
      body.appendChild(a);
      let full = "";
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          full += dec.decode(value, { stream: true });
          a.textContent = full;
        }
      }
      messages.push({ role: "assistant", content: full });
      if (cfg.leadFormEnabled && /email|phone|contact|reach/i.test(text)) {
        lead.classList.add("show");
      }
    }

    sendBtn.onclick = () => {
      void send();
    };
  }

  loadConfig()
    .then(mount)
    .catch(() => console.warn("[SeoRise Chatbot] Could not load config"));
})();
