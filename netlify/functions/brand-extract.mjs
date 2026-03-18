/**
 * HoldingVision Pro — Brand Extract Function
 * Scrapes a client's website to extract: logo, color palette, business name, tagline.
 * Endpoint: POST /api/brand-extract  body: { url: "https://example.com" }
 */

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response("", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), { status: 405 });
  }

  try {
    const { url } = await req.json();
    if (!url) return new Response(JSON.stringify({ error: "URL required" }), { status: 400 });

    // Normalize URL
    let targetUrl = url.trim();
    if (!targetUrl.startsWith("http")) targetUrl = "https://" + targetUrl;

    // Fetch the page
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: `Site returned ${res.status}` }), { status: 502 });
    }

    const html = await res.text();
    const baseUrl = new URL(targetUrl);
    const origin = baseUrl.origin;

    // ═══ EXTRACT BUSINESS NAME ═══
    const name = extractName(html);

    // ═══ EXTRACT TAGLINE / DESCRIPTION ═══
    const tagline = extractTagline(html);

    // ═══ EXTRACT LOGO ═══
    const logo = extractLogo(html, origin);

    // ═══ EXTRACT COLORS ═══
    const colors = extractColors(html);

    // ═══ EXTRACT FAVICON (fallback for logo) ═══
    const favicon = extractFavicon(html, origin, baseUrl.hostname);

    return new Response(JSON.stringify({
      success: true,
      brand: {
        name,
        tagline,
        logo: logo || favicon,
        favicon,
        colors,
        sourceUrl: targetUrl,
      },
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
}

// ─── Helpers ─────────────────────────────────────

function extractName(html) {
  // Try og:site_name first
  const ogSite = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:site_name["']/i);
  if (ogSite) return ogSite[1].trim();

  // Try <title> tag (clean up common patterns)
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    let title = titleMatch[1].trim();
    // Remove common suffixes like " - Accueil", " | Home", etc.
    title = title.replace(/\s*[-|–]\s*(accueil|home|bienvenue|welcome|page d'accueil).*$/i, "");
    // If title is too long, take first part before separator
    if (title.length > 60) {
      const parts = title.split(/\s*[-|–:]\s*/);
      title = parts[0];
    }
    return title.trim();
  }

  return null;
}

function extractTagline(html) {
  // Try og:description
  const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i);
  if (ogDesc && ogDesc[1].length < 200) return ogDesc[1].trim();

  // Try meta description
  const metaDesc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
  if (metaDesc && metaDesc[1].length < 200) return metaDesc[1].trim();

  return null;
}

function extractLogo(html, origin) {
  // Try og:image first (usually the best quality)
  const ogImg = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (ogImg) return resolveUrl(ogImg[1], origin);

  // Try common logo patterns in <img> tags
  const logoPatterns = [
    /<img[^>]+class=["'][^"']*logo[^"']*["'][^>]+src=["']([^"']+)["']/i,
    /<img[^>]+id=["'][^"']*logo[^"']*["'][^>]+src=["']([^"']+)["']/i,
    /<img[^>]+src=["']([^"']+)["'][^>]+class=["'][^"']*logo[^"']*["']/i,
    /<img[^>]+alt=["'][^"']*logo[^"']*["'][^>]+src=["']([^"']+)["']/i,
    /<img[^>]+src=["']([^"']+logo[^"']+)["']/i,
    // Header img (first image in header/nav)
    /<(?:header|nav)[^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i,
  ];

  for (const pattern of logoPatterns) {
    const match = html.match(pattern);
    if (match) return resolveUrl(match[1], origin);
  }

  return null;
}

function extractFavicon(html, origin, hostname) {
  // Try apple-touch-icon (higher res)
  const apple = html.match(/<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']+)["']/i);
  if (apple) return resolveUrl(apple[1], origin);

  // Try icon / shortcut icon
  const icon = html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i)
    || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i);
  if (icon) return resolveUrl(icon[1], origin);

  // Fallback: Google favicon service
  return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
}

function extractColors(html) {
  const colors = new Map();

  // Extract from inline styles and CSS
  const colorRegex = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;
  const rgbRegex = /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/g;

  // Focus on <style> blocks and style attributes
  const styleBlocks = html.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || [];
  const styleAttrs = html.match(/style=["'][^"']+["']/gi) || [];
  const cssText = [...styleBlocks, ...styleAttrs].join(" ");

  // Also check CSS custom properties and theme-color meta
  const themeColor = html.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i);
  if (themeColor) colors.set(themeColor[1].toLowerCase(), (colors.get(themeColor[1].toLowerCase()) || 0) + 50);

  // Collect hex colors
  let match;
  while ((match = colorRegex.exec(cssText)) !== null) {
    const hex = normalizeHex(match[0]).toLowerCase();
    if (!isBlackWhiteGray(hex)) {
      colors.set(hex, (colors.get(hex) || 0) + 1);
    }
  }

  // Collect rgb colors
  while ((match = rgbRegex.exec(cssText)) !== null) {
    const hex = rgbToHex(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
    if (!isBlackWhiteGray(hex)) {
      colors.set(hex, (colors.get(hex) || 0) + 1);
    }
  }

  // Also check for CSS variables that look like brand colors
  const varRegex = /--(?:primary|brand|accent|main|theme)[^:]*:\s*([^;]+)/gi;
  while ((match = varRegex.exec(cssText)) !== null) {
    const val = match[1].trim();
    const hexMatch = val.match(/#([0-9a-fA-F]{3,6})/);
    if (hexMatch) {
      const hex = normalizeHex(hexMatch[0]).toLowerCase();
      colors.set(hex, (colors.get(hex) || 0) + 100); // High priority for named brand vars
    }
  }

  // Sort by frequency and return top colors
  const sorted = [...colors.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([hex]) => hex)
    .slice(0, 6);

  // Generate a usable palette
  const primary = sorted[0] || "#c89650";
  const secondary = sorted[1] || shiftHue(primary, 30);
  const accent = sorted[2] || shiftHue(primary, -30);

  return {
    primary,
    secondary,
    accent,
    all: sorted,
  };
}

function resolveUrl(url, origin) {
  if (!url) return null;
  if (url.startsWith("//")) return "https:" + url;
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return origin + url;
  return origin + "/" + url;
}

function normalizeHex(hex) {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  return "#" + hex;
}

function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("");
}

function isBlackWhiteGray(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;
  // Filter out near-black, near-white, and grays
  if (max < 30) return true;  // too dark
  if (min > 225) return true; // too light
  if (saturation < 0.12) return true; // too gray
  return false;
}

function shiftHue(hex, degrees) {
  // Simple hue shift for fallback colors
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);

  // Convert to HSL
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  // Shift hue
  h = (h + degrees / 360 + 1) % 1;

  // Convert back to RGB
  function hue2rgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  }

  let r2, g2, b2;
  if (s === 0) { r2 = g2 = b2 = l; }
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r2 = hue2rgb(p, q, h + 1/3);
    g2 = hue2rgb(p, q, h);
    b2 = hue2rgb(p, q, h - 1/3);
  }

  return rgbToHex(Math.round(r2 * 255), Math.round(g2 * 255), Math.round(b2 * 255));
}
