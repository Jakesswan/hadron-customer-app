/*
 * Hadron Group — `notify` Edge Function
 *
 * Sends a Web Push notification to one or more users.
 *
 * Deploy:
 *   supabase functions deploy notify
 *
 * Required secrets (set with `supabase secrets set`):
 *   VAPID_PUBLIC_KEY    Same value you put in push.js
 *   VAPID_PRIVATE_KEY   The private key from `npx web-push generate-vapid-keys`
 *   VAPID_SUBJECT       e.g. "mailto:sales@hadrongrp.com"
 *
 * Invocation (from the app, a database trigger via pg_net, or a cron job):
 *   POST /functions/v1/notify
 *   Authorization: Bearer <anon or service-role JWT>
 *   {
 *     "user_id":   "<profiles.id>",   // OR
 *     "org_id":    "<organisations.id>",  // fan-out to every member of an org
 *     "role":      "customer_admin",  // optional filter when using org_id
 *     "title":     "New lab report ready",
 *     "body":      "Sample SAM-1042 has been authorised.",
 *     "link":      "#lims/sample/SAM-1042",
 *     "tag":       "sample-1042"      // optional, dedups in OS notification tray
 *   }
 *
 * Response: { delivered: number, failed: number, removed_endpoints: number }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'https://esm.sh/web-push@3.6.7';

const SUPABASE_URL         = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY     = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC         = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE        = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT        = Deno.env.get('VAPID_SUBJECT') || 'mailto:sales@hadrongrp.com';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

interface NotifyBody {
  user_id?: string;
  org_id?: string;
  role?: string;
  title: string;
  body?: string;
  link?: string;
  tag?: string;
}

async function getTargetUserIds(req: NotifyBody): Promise<string[]> {
  if (req.user_id) return [req.user_id];
  if (req.org_id) {
    let q = supabase.from('profiles').select('id').eq('organisation_id', req.org_id);
    if (req.role) q = q.eq('role', req.role);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map(p => p.id);
  }
  return [];
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  let body: NotifyBody;
  try { body = await req.json(); }
  catch { return new Response('Invalid JSON', { status: 400 }); }

  if (!body.title) return new Response('title is required', { status: 400 });

  const userIds = await getTargetUserIds(body);
  if (!userIds.length) return Response.json({ delivered: 0, failed: 0, removed_endpoints: 0 });

  const { data: subs, error: subErr } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth_secret')
    .in('user_id', userIds);
  if (subErr) return new Response(subErr.message, { status: 500 });

  const payload = JSON.stringify({
    title: body.title,
    body:  body.body  || '',
    link:  body.link  || './',
    tag:   body.tag   || ''
  });

  let delivered = 0, failed = 0, removed = 0;
  const deadEndpoints: string[] = [];

  await Promise.all((subs || []).map(async (sub) => {
    try {
      await webpush.sendNotification({
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth_secret }
      }, payload);
      delivered++;
    } catch (err: any) {
      // 404/410 from the push service means the subscription is dead — clean it up.
      if (err.statusCode === 404 || err.statusCode === 410) {
        deadEndpoints.push(sub.id);
        removed++;
      } else {
        console.error('[notify] push failed for', sub.endpoint, err.statusCode || err.message);
        failed++;
      }
    }
  }));

  if (deadEndpoints.length) {
    await supabase.from('push_subscriptions').delete().in('id', deadEndpoints);
  }

  return Response.json({ delivered, failed, removed_endpoints: removed });
});
