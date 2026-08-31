import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const apiHeaders = {
  apikey: SERVICE_ROLE_KEY,
  authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "content-type": "application/json",
};

async function rpc(name: string, body: Record<string, unknown>) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: apiHeaders,
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${name}:${r.status}`);
  return await r.json();
}

function jsString(v: unknown) {
  return JSON.stringify(String(v ?? ""));
}

function detectPlatform(ref: string) {
  const s = ref.toLowerCase();
  if (s.includes("wp-content") || s.includes("wordpress")) return "wordpress";
  if (s.includes("wixsite") || s.includes("wix.com")) return "wix";
  if (s.includes("jimdosite") || s.includes("jimdo")) return "jimdo";
  if (s.includes("webflow")) return "webflow";
  if (s.includes("myshopify") || s.includes("shopify")) return "shopify";
  return "unknown";
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const key = (url.searchParams.get("key") ?? "").trim();
  const cors = {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,OPTIONS",
    "access-control-allow-headers": "content-type",
    "cache-control": "public, max-age=60, stale-while-revalidate=300",
    "x-content-type-options": "nosniff",
  };
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "GET")
    return new Response("method not allowed", { status: 405, headers: cors });
  if (!/^[0-9a-fA-F-]{36}$/.test(key))
    return new Response("/* invalid ZunftEcho widget key */", {
      status: 400,
      headers: { ...cors, "content-type": "application/javascript; charset=utf-8" },
    });

  try {
    const config = await rpc("get_widget_public_config", { p_widget_key: key });
    if (!config || config.active !== true) {
      return new Response("/* ZunftEcho widget disabled */", {
        status: 200,
        headers: { ...cors, "content-type": "application/javascript; charset=utf-8" },
      });
    }

    const ref = req.headers.get("referer") ?? "";
    let origin = "";
    try {
      origin = ref ? new URL(ref).origin : "";
    } catch {
      origin = "";
    }
    if (origin) {
      rpc("record_widget_installation", {
        p_widget_key: key,
        p_origin: origin,
        p_platform: detectPlatform(ref),
        p_user_agent: req.headers.get("user-agent") ?? null,
      }).catch(() => {});
    }

    const base = String(config.public_widget_base_url ?? "").replace(/\/$/, "");
    if (!base) {
      return new Response("console.warn('ZunftEcho widget is not published yet.');", {
        status: 200,
        headers: { ...cors, "content-type": "application/javascript; charset=utf-8" },
      });
    }

    const script = `(() => {
  if (window.__zunftEchoLoaded_${key.replaceAll("-", "_")}) return;
  window.__zunftEchoLoaded_${key.replaceAll("-", "_")} = true;
  const cfg = ${JSON.stringify(config)};
  const key = ${jsString(key)};

  // This loader executes in the customer's page, so it is the authoritative
  // place to collect page/UTM metadata for the iframe-based widget.
  let clientId = '';
  try {
    const clientStorageKey = 'zunftecho_client_' + key;
    const legacyClientStorageKey = 'handwerkai_client_' + key;
    clientId = localStorage.getItem(clientStorageKey) || localStorage.getItem(legacyClientStorageKey) || '';
    if (!clientId) {
      clientId = (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function')
        ? globalThis.crypto.randomUUID()
        : (Date.now().toString(36) + '-' + Math.random().toString(36).slice(2));
      localStorage.setItem(clientStorageKey, clientId);
    }
  } catch {
    clientId = (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function')
      ? globalThis.crypto.randomUUID()
      : (Date.now().toString(36) + '-' + Math.random().toString(36).slice(2));
  }

  const hostUrl = new URL(window.location.href);
  const isRawLocalFile = window.location.protocol === 'file:';
  const widgetParams = new URLSearchParams();
  widgetParams.set('key', key);
  widgetParams.set('client_id', clientId);
  widgetParams.set('origin', window.location.origin);
  widgetParams.set('page_url', window.location.href);
  if (document.title) widgetParams.set('page_title', document.title);
  if (document.referrer) widgetParams.set('referrer', document.referrer);
  ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].forEach((name) => {
    const value = hostUrl.searchParams.get(name);
    if (value) widgetParams.set(name, value);
  });

  const wrap = document.createElement('div');
  wrap.id = 'zunftecho-widget-' + key;
  wrap.style.position = 'fixed';
  wrap.style.zIndex = String(cfg.z_index || 2147483000);
  wrap.style[cfg.position === 'bottom_left' ? 'left' : 'right'] = '20px';
  wrap.style.bottom = '20px';
  wrap.style.fontFamily = 'system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif';

  const panel = document.createElement('div');
  panel.style.display = 'none';
  panel.style.position = 'absolute';
  panel.style.bottom = '64px';
  panel.style[cfg.position === 'bottom_left' ? 'left' : 'right'] = '0';
  panel.style.width = 'min(400px, calc(100vw - 24px))';
  panel.style.height = 'min(650px, calc(100vh - 100px))';
  panel.style.background = '#fff';
  panel.style.borderRadius = '16px';
  panel.style.overflow = 'hidden';
  panel.style.isolation = 'isolate';
  panel.style.boxShadow = '0 20px 60px rgba(0,0,0,.20)';
  panel.style.border = '1px solid rgba(0,0,0,.08)';

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', 'Chat schließen');
  closeButton.textContent = '×';
  closeButton.style.position = 'absolute';
  closeButton.style.zIndex = '3';
  closeButton.style.top = '8px';
  closeButton.style.right = '10px';
  closeButton.style.display = 'inline-flex';
  closeButton.style.alignItems = 'center';
  closeButton.style.justifyContent = 'center';
  closeButton.style.width = '36px';
  closeButton.style.height = '36px';
  closeButton.style.border = '1px solid rgba(15,23,42,.14)';
  closeButton.style.borderRadius = '999px';
  closeButton.style.background = 'rgba(255,255,255,.94)';
  closeButton.style.color = '#172033';
  closeButton.style.fontSize = '26px';
  closeButton.style.lineHeight = '1';
  closeButton.style.cursor = 'pointer';
  closeButton.style.boxShadow = '0 5px 18px rgba(15,23,42,.14)';

  const iframe = document.createElement('iframe');
  iframe.src = ${jsString(base)} + '/widget?' + widgetParams.toString();
  iframe.title = cfg.agent_name ? ('Chat mit ' + cfg.agent_name) : 'ZunftEcho Chat';
  iframe.allow = 'geolocation; clipboard-write';
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  iframe.style.width = '100%'; iframe.style.height = '100%'; iframe.style.border = '0'; iframe.style.background = '#fff';
  if (isRawLocalFile) {
    panel.style.height = 'auto';
    const notice = document.createElement('div');
    notice.setAttribute('role', 'status');
    notice.style.padding = '24px';
    notice.style.color = '#172033';
    notice.style.lineHeight = '1.55';
    notice.innerHTML = '<strong style="display:block;font-size:18px;margin-bottom:10px">Lokale Vorschau sicher starten</strong>'
      + '<span style="display:block;margin-bottom:12px">Direkt geöffnete <code>file://</code>-Dateien besitzen keine prüfbare Website-Adresse. Starten Sie im Ordner der HTML-Datei:</span>'
      + '<code style="display:block;padding:10px 12px;border-radius:10px;background:#eef4f8;overflow-wrap:anywhere">python -m http.server 5500</code>'
      + '<span style="display:block;margin-top:12px">Öffnen Sie danach <strong>http://localhost:5500</strong>. Der Demo-Widget ist dafür freigeschaltet.</span>';
    panel.appendChild(notice);
  } else {
    panel.appendChild(iframe);
  }
  panel.appendChild(closeButton);

  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute('aria-label', cfg.launcher_label || 'Chat öffnen');
  button.setAttribute('aria-expanded', 'false');
  const logo = document.createElement('img');
  logo.src = ${jsString(base)} + '/zunftecho-mark.png';
  logo.alt = '';
  logo.setAttribute('aria-hidden', 'true');
  logo.width = 28;
  logo.height = 28;
  logo.style.width = '28px';
  logo.style.height = '28px';
  logo.style.objectFit = 'contain';
  logo.style.flex = '0 0 auto';
  logo.onerror = () => { logo.style.display = 'none'; };
  const buttonLabel = document.createElement('span');
  buttonLabel.textContent = cfg.launcher_label || 'Chat';
  button.appendChild(logo);
  button.appendChild(buttonLabel);
  button.style.border = '0';
  button.style.borderRadius = '999px';
  button.style.padding = '14px 18px';
  button.style.background = cfg.primary_color || '#111827';
  button.style.color = '#fff';
  button.style.fontWeight = '700';
  button.style.display = 'inline-flex';
  button.style.alignItems = 'center';
  button.style.justifyContent = 'center';
  button.style.gap = '10px';
  button.style.minHeight = '52px';
  button.style.cursor = 'pointer';
  button.style.boxShadow = '0 10px 30px rgba(0,0,0,.18)';
  const setOpen = (open) => {
    panel.style.display = open ? 'block' : 'none';
    button.setAttribute('aria-expanded', String(open));
    if (open) closeButton.focus();
  };
  button.onclick = () => setOpen(panel.style.display === 'none');
  closeButton.onclick = () => {
    setOpen(false);
    button.focus();
  };
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && panel.style.display !== 'none') closeButton.click();
  });

  if (cfg.mobile_fullscreen) {
    const mq = window.matchMedia('(max-width: 640px)');
    const applyMobile = () => {
      if (mq.matches) {
        panel.style.position = 'fixed'; panel.style.inset = '0'; panel.style.width = '100vw'; panel.style.height = '100dvh'; panel.style.borderRadius = '0';
      } else {
        panel.style.position = 'absolute'; panel.style.inset = 'auto'; panel.style.bottom = '64px'; panel.style.width = 'min(400px, calc(100vw - 24px))'; panel.style.height = 'min(650px, calc(100vh - 100px))'; panel.style.borderRadius = '16px'; panel.style[cfg.position === 'bottom_left' ? 'left' : 'right'] = '0';
      }
    };
    applyMobile(); mq.addEventListener?.('change', applyMobile);
  }

  wrap.appendChild(panel); wrap.appendChild(button); document.body.appendChild(wrap);
})();`;

    return new Response(script, {
      status: 200,
      headers: { ...cors, "content-type": "application/javascript; charset=utf-8" },
    });
  } catch (e) {
    console.error("widget-loader", e);
    return new Response("/* ZunftEcho widget temporarily unavailable */", {
      status: 200,
      headers: {
        ...cors,
        "content-type": "application/javascript; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }
});
