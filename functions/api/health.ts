// Cloudflare Pages Function: /api/health
export async function onRequestGet() {
  return new Response(JSON.stringify({ status: "ok", engine: "cloudflare-pages-edge", timestamp: new Date().toISOString() }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}
