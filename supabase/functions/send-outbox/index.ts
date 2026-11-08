// Supabase Edge Function: send-outbox
// Delivers the e-mails queued by public.submit_form (staff notification + visitor acknowledgement).
// Secrets live ONLY here (Supabase > Edge Functions > Secrets), never in website code:
//   RESEND_API_KEY   API key from resend.com (or any provider; swap the fetch below)
//   MAIL_FROM        e.g. "Qartexa Website <website@qartexa.com>"  (a domain you have verified with the provider)
//   WEBHOOK_SECRET   a long random string; the same value is set on the Database Webhook header "x-webhook-secret"
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically by Supabase.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

async function deliver(id: string) {
  const { data: job } = await sb.from("email_outbox").select("*").eq("id", id).maybeSingle();
  if (!job || job.status === "sent") return "skip";
  const { data: sub } = await sb.from("form_submissions").select("*").eq("id", job.submission_id).maybeSingle();
  const { data: form } = sub?.form_id ? await sb.from("forms").select("*").eq("id", sub.form_id).maybeSingle() : { data: null };
  const { data: fields } = sub?.form_id ? await sb.from("form_fields").select("name,type,label_en,label_fr").eq("form_id", sub.form_id) : { data: [] };
  if (!sub || !form) { await sb.from("email_outbox").update({ status: "failed", last_error: "submission or form missing", attempts: job.attempts + 1 }).eq("id", id); return "fail"; }
  const fr = sub.lang === "fr";
  const label = (n: string) => { const f = (fields || []).find((x: any) => x.name === n); return f ? (fr && f.label_fr) || f.label_en : n; };
  const emailField = (fields || []).find((x: any) => x.type === "email");
  const visitor = emailField ? String(sub.data?.[emailField.name] ?? "") : "";
  const rows = Object.entries(sub.data || {}).map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#5d7188;vertical-align:top"><b>${esc(label(k))}</b></td><td style="padding:6px 0">${esc(Array.isArray(v) ? v.join(", ") : v).replace(/\n/g, "<br>")}</td></tr>`).join("");
  let payload: Record<string, unknown>;
  if (job.kind === "notify") {
    if (!form.recipients?.length) { await sb.from("email_outbox").update({ status: "failed", last_error: "no recipients configured" }).eq("id", id); return "fail"; }
    payload = { to: form.recipients, cc: form.cc?.length ? form.cc : undefined, bcc: form.bcc?.length ? form.bcc : undefined, reply_to: visitor || undefined,
      subject: `[Qartexa website] ${form.name}${sub.data?.name ? " from " + String(sub.data.name).slice(0, 60) : ""}`,
      html: `<p>A new message was received through <b>${esc(form.name)}</b>.</p><table style="font:14px Arial,sans-serif">${rows}</table><p style="color:#5d7188;font-size:12px">View, assign and add notes in the staff portal (Form submissions). Reference ${esc(sub.id)}.</p>` };
  } else {
    if (!visitor) { await sb.from("email_outbox").update({ status: "failed", last_error: "no visitor email" }).eq("id", id); return "fail"; }
    const subject = (fr ? form.ack_subject_fr : form.ack_subject_en) || form.ack_subject_en || (fr ? "Nous avons bien reçu votre message" : "We received your message");
    const body = (fr ? form.ack_body_fr : form.ack_body_en) || form.ack_body_en || (fr ? "Merci de nous avoir contactés. Notre équipe vous répondra prochainement." : "Thank you for contacting us. Our team will reply shortly.");
    payload = { to: [visitor], subject, html: `<div style="font:15px Arial,sans-serif;line-height:1.6">${esc(body).replace(/\n/g, "<br>")}<p style="color:#5d7188;font-size:12px">Qartexa Technologies</p></div>` };
  }
  const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: Deno.env.get("MAIL_FROM"), ...payload }) });
  if (r.ok) { await sb.from("email_outbox").update({ status: "sent", sent_at: new Date().toISOString(), attempts: job.attempts + 1, last_error: null }).eq("id", id); return "sent"; }
  await sb.from("email_outbox").update({ status: "failed", attempts: job.attempts + 1, last_error: (await r.text()).slice(0, 300) }).eq("id", id);
  return "fail";
}

Deno.serve(async (req) => {
  if (req.headers.get("x-webhook-secret") !== Deno.env.get("WEBHOOK_SECRET") || !Deno.env.get("WEBHOOK_SECRET")) return new Response("forbidden", { status: 403 });
  const body = await req.json().catch(() => ({}));
  const ids: string[] = [];
  if (body?.record?.id) ids.push(body.record.id);                       // Database Webhook on INSERT
  else {                                                                // scheduled retry of pending / failed (max 5 attempts)
    const { data } = await sb.from("email_outbox").select("id").in("status", ["pending", "failed"]).lt("attempts", 5).order("created_at").limit(25);
    (data || []).forEach((x: any) => ids.push(x.id));
  }
  const out: Record<string, number> = {};
  for (const id of ids) { const k = await deliver(id); out[k] = (out[k] || 0) + 1; }
  return new Response(JSON.stringify(out), { headers: { "Content-Type": "application/json" } });
});
