import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

/**
 * SSS Brain asset index: everything any ecosystem site has produced and stored on SWADEBASE.
 * Founder only. Actions:
 *   { action: "summary" }                                        -> totals per site
 *   { action: "search", query?, app?, kind?, since?, limit?, offset?, sign? } -> newest-first list
 *   { action: "open", bucket, path, download? }                  -> one playable/downloadable link
 * Links are short-lived signed URLs; nothing is made public.
 */
const FOUNDER_EMAIL = "swadesoul@gmail.com";
const ALLOWED = [
  /^https:\/\/([a-z0-9-]+\.)?sssbrain\.live$/, /^https:\/\/sssbrain\.lovable\.app$/,
  /^https:\/\/[a-z0-9-]*785aa432-2b2d-4eef-9523-05108a5f6c24[a-z0-9.-]*$/, /^https:\/\/swadebase\.cloud$/,
];
const cors = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin && ALLOWED.some((r) => r.test(origin)) ? origin : "https://sssbrain.live",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
});

serve(async (req) => {
  const headers = { ...cors(req.headers.get("origin")), "Content-Type": "application/json" };
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
  if (req.method === "OPTIONS") return new Response(null, { headers });
  try {
    const url = Deno.env.get("SUPABASE_URL") ?? "https://swadebase.cloud";
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Unauthorized" }, 401);
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false } });
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user?.email || user.email.toLowerCase() !== FOUNDER_EMAIL || !user.email_confirmed_at) {
      return json({ error: "Founder access required" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "search");

    if (action === "summary") {
      const { data, error } = await admin.rpc("brain_assets_summary");
      if (error) return json({ error: error.message }, 500);
      // Durable copies in Backblaze. A failure here never hides the summary itself.
      const { data: backup } = await admin.rpc("brain_backup_status");
      return json({ success: true, ...data, backup: backup ?? null });
    }

    const publicBase = "https://swadebase.cloud/storage/v1";
    const sign = async (bucket: string, path: string, download?: string) => {
      const { data, error } = await admin.storage.from(bucket)
        .createSignedUrl(path, 3600, download ? { download } : undefined);
      if (error || !data?.signedUrl) return null;
      return publicBase + data.signedUrl.replace(/^https?:\/\/[^/]+(\/storage\/v1)?/, "");
    };

    if (action === "open") {
      const bucket = String(body.bucket || ""), path = String(body.path || "");
      if (!bucket || !path || path.includes("..")) return json({ error: "bucket and path are required" }, 400);
      const link = await sign(bucket, path, body.download ? String(path.split("/").pop()) : undefined);
      if (!link) return json({ error: "File not found" }, 404);
      return json({ success: true, url: link, expires_in: 3600 });
    }

    if (action === "search") {
      const { data, error } = await admin.rpc("brain_search_assets", {
        p_query: body.query ?? null, p_app: body.app ?? null, p_kind: body.kind ?? null,
        p_since: body.since ?? null, p_limit: body.limit ?? 50, p_offset: body.offset ?? 0,
      });
      if (error) return json({ error: error.message }, 500);
      const items = (data?.items ?? []) as Array<Record<string, unknown>>;
      if (body.sign !== false) {
        await Promise.all(items.slice(0, 60).map(async (it) => {
          it.url = await sign(String(it.bucket), String(it.path));
        }));
      }
      return json({ success: true, total: data?.total ?? 0, items });
    }
    return json({ error: "Unsupported action" }, 400);
  } catch (e) {
    console.error("brain-assets error", e);
    return json({ error: "Unexpected error" }, 500);
  }
});
