// Supabase Edge Function: staff-admin
// Lets a SUPER ADMINISTRATOR invite staff. Needs the service-role key, which is why it cannot run in the browser.
// The caller's own login token is verified here; nobody else can use it.
// Deploy:  supabase functions deploy staff-admin     (SUPABASE_* secrets are provided automatically)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...cors, "Content-Type": "application/json" } });
const ROLES = ["super_admin", "admin", "editor", "hr", "content"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const token = (req.headers.get("authorization") || "").replace(/^Bearer /i, "");
  const { data: u } = await sb.auth.getUser(token);
  if (!u?.user) return json({ error: "Please sign in again." }, 401);
  const { data: me } = await sb.from("staff").select("role,active").eq("user_id", u.user.id).maybeSingle();
  if (!me?.active || me.role !== "super_admin") return json({ error: "Only a Super Administrator can manage staff accounts." }, 403);

  const b = await req.json().catch(() => ({}));
  if (b.action === "invite") {
    const email = String(b.email || "").trim().toLowerCase();
    if (!/^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(email)) return json({ error: "Invalid email address." }, 400);
    if (!ROLES.includes(b.role)) return json({ error: "Invalid role." }, 400);
    const redirectTo = typeof b.redirectTo === "string" && /^https:\/\//.test(b.redirectTo) ? b.redirectTo : undefined;
    const { data, error } = await sb.auth.admin.inviteUserByEmail(email, { redirectTo, data: { name: String(b.name || "").slice(0, 80) } });
    if (error || !data?.user) return json({ error: error?.message || "Could not send the invitation." }, 400);
    const { error: e2 } = await sb.from("staff").upsert({ user_id: data.user.id, email, display_name: String(b.name || "").slice(0, 80) || null, role: b.role, active: true, invited_by: u.user.id }, { onConflict: "user_id" });
    if (e2) return json({ error: e2.message }, 400);
    return json({ ok: true });
  }
  if (b.action === "delete_user") {                       // fully removes a person's login (their staff row is removed by cascade)
    if (b.user_id === u.user.id) return json({ error: "You cannot delete your own account here." }, 400);
    const { error } = await sb.auth.admin.deleteUser(String(b.user_id));
    return error ? json({ error: error.message }, 400) : json({ ok: true });
  }
  return json({ error: "Unknown action" }, 400);
});
