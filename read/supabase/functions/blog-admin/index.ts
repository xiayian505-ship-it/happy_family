import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const SHARED_AUTH_URL = "https://bkjqaetxwvcdciieevvs.supabase.co";
const SHARED_AUTH_KEY = "sb_publishable_dAHoIimWgbGAF2wtIVSZfg_V8rzc200";
const ADMIN_UIDS = new Set([
  "372c6a7f-4e6b-49fa-8228-183b46cbdede",
  "bd126b9b-aa23-42e0-85f5-4560cab8fc57",
  "7348ca2f-147d-4a3b-b9d2-a854c4a12430"
]);
const DEFAULT_ORIGINS = ["https://happyfamily.stillnessbyslowly.com"];

function allowedOrigins(): Set<string> {
  const configured = Deno.env.get("BLOG_ALLOWED_ORIGINS")?.split(",").map((value) => value.trim()).filter(Boolean) || [];
  return new Set(configured.length ? configured : DEFAULT_ORIGINS);
}

function corsHeaders(origin: string): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Vary": "Origin"
  };
}

function json(origin: string, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers:{ ...corsHeaders(origin), "Content-Type":"application/json; charset=utf-8", "Cache-Control":"no-store" } });
}

async function requireAdministrator(request: Request): Promise<{ id:string }> {
  const authorization = request.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) throw new Response("missing bearer token", { status:401 });

  // Ask the original Auth authority to validate signature, expiry, revocation,
  // and user existence. Never trust client-provided JWT claims by themselves.
  const response = await fetch(`${SHARED_AUTH_URL}/auth/v1/user`, {
    headers:{ "apikey":SHARED_AUTH_KEY, "Authorization":authorization }
  });
  if (!response.ok) throw new Response("invalid administrator session", { status:401 });
  const user = await response.json();
  if (!user?.id || !ADMIN_UIDS.has(user.id)) throw new Response("administrator permission required", { status:403 });
  return { id:user.id };
}

function postId(pathname: string): string | null {
  const match = pathname.match(/\/posts\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function postValues(request: Request): Promise<{ title:string; content:string; published:boolean }> {
  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const content = typeof body?.content === "string" ? body.content : "";
  if (!title || title.length > 160 || typeof body?.published !== "boolean") throw new Response("invalid post", { status:400 });
  return { title, content, published:body.published };
}

Deno.serve(async (request) => {
  const origin = request.headers.get("Origin") || "";
  if (!allowedOrigins().has(origin)) return new Response("origin not allowed", { status:403 });
  if (request.method === "OPTIONS") return new Response(null, { status:204, headers:corsHeaders(origin) });

  try {
    await requireAdministrator(request);
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) return json(origin, { error:"server configuration unavailable" }, 500);
    const db = createClient(supabaseUrl, serviceRoleKey, { auth:{ persistSession:false, autoRefreshToken:false } });
    const url = new URL(request.url);
    const id = postId(url.pathname);

    if (request.method === "GET" && url.pathname.endsWith("/posts")) {
      const { data, error } = await db.from("posts").select("id,title,content,published,created_at,updated_at").order("created_at", { ascending:false });
      if (error) throw error;
      return json(origin, { posts:data || [] });
    }
    if (request.method === "POST" && url.pathname.endsWith("/posts")) {
      const values = await postValues(request);
      const { data, error } = await db.from("posts").insert(values).select("id,title,content,published,created_at,updated_at").single();
      if (error) throw error;
      return json(origin, { post:data }, 201);
    }
    if (request.method === "PATCH" && id) {
      const values = await postValues(request);
      const { data, error } = await db.from("posts").update({ ...values, updated_at:new Date().toISOString() }).eq("id", id).select("id,title,content,published,created_at,updated_at").single();
      if (error) throw error;
      return json(origin, { post:data });
    }
    if (request.method === "DELETE" && id) {
      const { error } = await db.from("posts").delete().eq("id", id);
      if (error) throw error;
      return json(origin, { deleted:true });
    }
    return json(origin, { error:"route not found" }, 404);
  } catch (error) {
    if (error instanceof Response) return json(origin, { error:await error.text() }, error.status);
    console.error("blog admin request failed", error);
    return json(origin, { error:"administrative operation failed" }, 500);
  }
});
