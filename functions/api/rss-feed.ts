// Cloudflare Pages Function: /api/rss-feed
// Runs at Cloudflare Edge with global CDN caching for ultra-fast news aggregation

interface ServerArticle {
  id: string;
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  sourceColor?: string;
  sourceIcon?: string;
  image?: string | null;
  category: string;
}

const BENIN_SOURCES = [
  { name: "Benin Web TV", url: "https://beninwebtv.bj/feed/", color: "#3498db", icon: "📺" },
  { name: "Matin Libre", url: "https://matinlibre.com/feed/", color: "#34495e", icon: "☀️" },
  { name: "Le Potentiel", url: "https://lepotentiel.bj/?feed=rss2", color: "#2980b9", icon: "💪" },
  { name: "Le Béninois Libéré", url: "https://www.lebeninoislibere.bj/feed/", color: "#8e44ad", icon: "🗞️" },
  { name: "Le Matinal", url: "https://lematinal.bj/feed/", color: "#e67e22", icon: "📰" },
  { name: "Boulevard des Infos", url: "https://www.boulevard-des-infos.bj/feed/", color: "#9b59b6", icon: "🛣️" },
  { name: "Africa Ho", url: "https://www.africaho.bj/feed/", color: "#2c3e50", icon: "🌍" },
  { name: "L'Investigateur", url: "https://linvestigateur.info/feed/", color: "#16a085", icon: "🔍" },
  { name: "La Nouvelle Tribune", url: "https://lanouvelletribune.info/feed/", color: "#c0392b", icon: "🗞️" },
  { name: "Bénin Intelligent", url: "https://beninintelligent.bj/feed/", color: "#1abc9c", icon: "💡" }
];

function decodeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8230;/g, '…')
    .replace(/&#038;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&hellip;/g, '…')
    .replace(/&eacute;/g, 'é')
    .replace(/&egrave;/g, 'è')
    .replace(/&ecirc;/g, 'ê')
    .replace(/&agrave;/g, 'à')
    .replace(/&ocirc;/g, 'ô')
    .replace(/&ugrave;/g, 'ù')
    .replace(/&ccedil;/g, 'ç')
    .replace(/&#(\d+);/g, (_, code) => {
      try { return String.fromCharCode(parseInt(code, 10)); } catch { return ''; }
    });
}

function parseXmlItems(xmlText: string, sourceName: string, sourceColor?: string, sourceIcon?: string): ServerArticle[] {
  const items: ServerArticle[] = [];
  if (!xmlText || xmlText.includes('<html') || xmlText.includes('404 Not Found') || xmlText.includes('Erreur 404')) {
    return items;
  }

  const itemMatches = xmlText.match(/<item[\s\S]*?<\/item>|<entry[\s\S]*?<\/entry>/gi) || [];

  for (const itemXml of itemMatches.slice(0, 15)) {
    const titleMatch = itemXml.match(/<title[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/title>/i);
    const rawTitle = titleMatch ? (titleMatch[1] || titleMatch[2] || '') : '';
    const title = decodeHtml(rawTitle.replace(/<[^>]+>/g, '').trim());

    const linkMatch = itemXml.match(/<link[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/link>|<link[^>]+href=["']([^"']+)["']/i);
    const link = linkMatch ? (linkMatch[1] || linkMatch[2] || linkMatch[3] || '').trim() : '';

    const descMatch = itemXml.match(/<description[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/description>|<summary[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/summary>|<content:encoded[^>]*>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/content:encoded>/i);
    const rawDesc = descMatch ? (descMatch[1] || descMatch[2] || descMatch[3] || descMatch[4] || descMatch[5] || descMatch[6] || '') : '';
    const cleanDesc = decodeHtml(rawDesc.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()).substring(0, 190) + '...';

    const dateMatch = itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>|<updated[^>]*>([\s\S]*?)<\/updated>|<dc:date[^>]*>([\s\S]*?)<\/dc:date>/i);
    const rawDate = dateMatch ? (dateMatch[1] || dateMatch[2] || dateMatch[3] || '') : '';
    const parsedDate = new Date(rawDate);
    const pubDateStr = !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : new Date().toISOString();

    const imgMatch = itemXml.match(/url=["']([^"']+(?:\.jpg|\.jpeg|\.png|\.webp|\.gif)[^"']*)["']/i) || 
                     itemXml.match(/href=["']([^"']+(?:\.jpg|\.jpeg|\.png|\.webp|\.gif)[^"']*)["']/i) || 
                     itemXml.match(/<img[^>]+src=["']([^"']+)["']/i) ||
                     itemXml.match(/<enclosure[^>]+url=["']([^"']+)["']/i) ||
                     itemXml.match(/<media:content[^>]+url=["']([^"']+)["']/i);
    const image = imgMatch ? (imgMatch[1] || imgMatch[2] || imgMatch[3] || null) : null;

    const lowerTitle = title.toLowerCase();
    const isCorrupted = !title || title.length < 5 || 
      lowerTitle.includes('404') || 
      lowerTitle.includes('not found') || 
      lowerTitle.includes('erreur') || 
      lowerTitle.includes('maintenance') || 
      !link || (!link.startsWith('http://') && !link.startsWith('https://'));

    if (!isCorrupted) {
      let linkHash = 0;
      for (let i = 0; i < link.length; i++) {
        linkHash = ((linkHash << 5) - linkHash) + link.charCodeAt(i);
        linkHash |= 0;
      }
      const id = `art-${sourceName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Math.abs(linkHash)}`;

      items.push({
        id,
        title,
        link,
        description: cleanDesc,
        pubDate: pubDateStr,
        source: sourceName,
        sourceColor: sourceColor || "#3498db",
        sourceIcon: sourceIcon || "📰",
        image,
        category: "societe"
      });
    }
  }
  return items;
}

export async function onRequestGet() {
  const allArticles: ServerArticle[] = [];
  const seenUrls = new Set<string>();

  // Fetch all feeds in parallel directly from Cloudflare Edge Network (Ultra-fast)
  const results = await Promise.allSettled(
    BENIN_SOURCES.map(async (source) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const resp = await fetch(source.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 ActuHub/Cloudflare',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (resp.ok) {
        const text = await resp.text();
        return parseXmlItems(text, source.name, source.color, source.icon);
      }
      return [];
    })
  );

  for (const res of results) {
    if (res.status === 'fulfilled' && Array.isArray(res.value)) {
      for (const art of res.value) {
        if (art.link && !seenUrls.has(art.link)) {
          seenUrls.add(art.link);
          allArticles.push(art);
        }
      }
    }
  }

  // Deduplicate and filter items older than 72 hours
  const nowMs = Date.now();
  const maxAgeMs = 72 * 60 * 60 * 1000;
  const uniqueMap = new Map<string, ServerArticle>();

  for (const art of allArticles) {
    const t = new Date(art.pubDate).getTime();
    if (isNaN(t) || (nowMs - t) > maxAgeMs) continue;

    const slug = art.title.toLowerCase().trim().replace(/[^a-z0-9]/g, '').substring(0, 45);
    if (slug.length < 5) continue;

    if (!uniqueMap.has(slug)) {
      uniqueMap.set(slug, art);
    } else {
      const existing = uniqueMap.get(slug)!;
      const existingT = new Date(existing.pubDate).getTime();
      if (t > existingT || (!existing.image && art.image)) {
        uniqueMap.set(slug, art);
      }
    }
  }

  const finalArticles = Array.from(uniqueMap.values());
  finalArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  return new Response(
    JSON.stringify({
      status: "success",
      source: "cloudflare-edge-autonomous",
      count: finalArticles.length,
      timestamp: new Date().toISOString(),
      articles: finalArticles
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Cache-Control": "public, max-age=60, s-maxage=120, stale-while-revalidate=300"
      }
    }
  );
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
