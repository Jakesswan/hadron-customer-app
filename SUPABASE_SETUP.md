# Hadron Group — Cloud Setup (Supabase)

This is a one-time setup. Once you've finished it, every device that signs in
gets the same data, the customer portal works, and push notifications can fire.

Estimated time: **30–45 minutes**.

---

## 1. Create the Supabase project

1. Go to <https://supabase.com> and sign in (use your Hadron Google account so
   billing and ownership stay in one place).
2. Click **New project** and pick the **Hadron Group** organisation.
3. Project settings:
   - **Name:** Hadron Customer Interface
   - **Database password:** generate a strong one and stash it in 1Password.
   - **Region:** Cape Town (`af-south-1`) — closest to your users.
   - **Pricing plan:** Free tier is fine to start. Upgrade to Pro ($25/mo)
     when you go live so the project never pauses.
4. Click **Create new project** and wait ~2 minutes while it provisions.

## 2. Run the schema

1. In the project dashboard, open **SQL Editor → New query**.
2. Open `supabase-schema.sql` from this repo, copy the **whole file**, paste it
   into the editor.
3. Click **Run**. You should see "Success. No rows returned." If anything
   errors, screenshot the message and ping me.

## 3. Enable auth providers

1. **Authentication → Providers**
2. **Email** is on by default. Under it:
   - Toggle **Confirm email** OFF for now (faster onboarding while you're
     testing). Turn it back ON before launch.
3. **Google** — click it, toggle **Enable**:
   - Get a Google OAuth client ID at
     <https://console.cloud.google.com/apis/credentials>.
   - Application type: **Web application**.
   - Authorized JavaScript origins:
     - `https://hadrongrp.com`
     - `https://jakesswan.github.io`
   - Authorized redirect URIs: copy the **Callback URL** Supabase shows
     (looks like `https://YOUR-PROJECT.supabase.co/auth/v1/callback`).
   - Paste the Google **Client ID** and **Client secret** back into Supabase
     and **Save**.

## 4. Set the URL allow-list

1. **Authentication → URL Configuration**
2. **Site URL**: `https://hadrongrp.com` (or `https://jakesswan.github.io/hadron-customer-app/` until your custom domain is wired).
3. **Redirect URLs**: add both, one per line:
   - `https://hadrongrp.com/`
   - `https://jakesswan.github.io/hadron-customer-app/`
   - `http://localhost:8080/` (for local dev)

## 5. Plug the keys into the app

1. In the project dashboard, **Project Settings → API**.
2. Copy:
   - **Project URL** (e.g. `https://abcd1234.supabase.co`)
   - **anon public key** (a long JWT)
3. Open `supabase-client.js` and replace the two placeholders near the top:

   ```js
   const SUPABASE_URL      = 'https://abcd1234.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJhbGciOi...the-rest-of-the-jwt';
   ```

4. Both values are public-facing. Row-level security in
   `supabase-schema.sql` is what actually guards the data.

## 6. Create your first user (Hadron staff)

1. Open the deployed app in a browser.
2. The new login screen should appear. Click **Sign up**, enter your work
   email + a strong password.
3. Go back to Supabase → **Authentication → Users**. Confirm your user
   is listed.
4. Open **SQL Editor → New query** and run, replacing the email:

   ```sql
   insert into public.organisations (name, slug, type)
     values ('Hadron Group', 'hadron', 'hadron')
     on conflict (slug) do nothing;

   update public.profiles
     set role = 'admin',
         organisation_id = (select id from public.organisations where slug = 'hadron')
     where email = 'jake@hadrongrp.com';
   ```

5. Sign out and back in. Profile should now show "Hadron staff (admin)".

## 7. Onboard a customer (smoke test)

1. SQL Editor:

   ```sql
   insert into public.organisations (name, slug, type)
     values ('Acme Mining', 'acme-mining', 'customer')
     returning id;
   ```

2. Sign up a second user (a personal email is fine for testing).
3. Promote that user to customer admin of Acme:

   ```sql
   update public.profiles
     set role = 'customer_admin',
         organisation_id = (select id from public.organisations where slug = 'acme-mining')
     where email = 'tester@example.com';
   ```

4. Log in as each user in different browsers — confirm they see their own
   data only.

---

## 8. Push notifications

### 8.1. Generate VAPID keys

```bash
npx web-push generate-vapid-keys
```

You'll get a public + private key. Keep both safe.

### 8.2. Paste the public key into push.js

```js
const VAPID_PUBLIC_KEY = 'BNcRdr...';
```

Commit + redeploy.

### 8.3. Install the Supabase CLI (one-time)

```bash
npm install -g supabase
supabase login
supabase link --project-ref <YOUR-PROJECT-REF>
```

`<YOUR-PROJECT-REF>` is the part of your Supabase URL before `.supabase.co`.

### 8.4. Set the secrets

```bash
supabase secrets set VAPID_PUBLIC_KEY=BNcRdr...
supabase secrets set VAPID_PRIVATE_KEY=oF3Lp...
supabase secrets set VAPID_SUBJECT=mailto:sales@hadrongrp.com
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set automatically.

### 8.5. Deploy the function

```bash
cd hadron-app
supabase functions deploy notify
```

### 8.6. Smoke-test it

From the app, sign in, click **Enable push notifications** on the Profile
screen, accept the OS prompt. Then from your terminal:

```bash
curl -X POST \
  "https://<YOUR-PROJECT-REF>.supabase.co/functions/v1/notify" \
  -H "Authorization: Bearer <YOUR-SERVICE-ROLE-KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id":"<your-profile-id>",
    "title":"Hello from Hadron!",
    "body":"If you can see this, push is working.",
    "link":"./"
  }'
```

You should get `{ "delivered": 1, "failed": 0, "removed_endpoints": 0 }` and
the notification should appear on your device.

### 8.7. Wire automatic triggers (optional, do later)

Once smoke-test works, you can fire notifications automatically on database
events. Two patterns:

**Option A — From the app.** When the LIMS authoriser approves a result,
have the app call `supabase.functions.invoke('notify', { body: {...} })`
directly. Simpler, but only fires when the app is open.

**Option B — From a database trigger via pg_net.** Wire a Postgres trigger
that calls the function on row changes. Reliable, fires regardless of
client state. Example (run in SQL Editor when you're ready):

```sql
-- Enable pg_net
create extension if not exists pg_net;

-- Notify customer when a sample is reported
create or replace function notify_sample_reported()
returns trigger language plpgsql as $$
begin
  if new.status = 'reported' and (old.status is distinct from 'reported') then
    perform net.http_post(
      url := 'https://<YOUR-PROJECT-REF>.supabase.co/functions/v1/notify',
      headers := jsonb_build_object(
        'Content-Type','application/json',
        'Authorization','Bearer <YOUR-SERVICE-ROLE-KEY>'
      ),
      body := jsonb_build_object(
        'org_id', new.organisation_id,
        'role',   'customer_admin',
        'title',  'Lab report ready',
        'body',   'Sample ' || coalesce(new.sample_no, new.id) || ' has been authorised.',
        'link',   '#lims/sample/' || new.id
      )
    );
  end if;
  return new;
end $$;

drop trigger if exists trg_notify_sample_reported on public.samples;
create trigger trg_notify_sample_reported
  after update on public.samples
  for each row execute procedure notify_sample_reported();
```

---

## Useful queries

Daily traffic:
```sql
select count(*) as users, count(distinct organisation_id) as orgs
from public.profiles;
```

Latest samples across all customers:
```sql
select s.created_at, o.name as org, st.name as site, s.sample_no, s.status
from public.samples s
join public.organisations o on o.id = s.organisation_id
left join public.sites st on st.id = s.site_id
order by s.created_at desc
limit 50;
```

Pending push subscriptions:
```sql
select count(*), count(distinct user_id) from public.push_subscriptions;
```

---

## Where to ask if something breaks

- Schema problem → re-run `supabase-schema.sql`, the `IF NOT EXISTS` guards
  make it safe.
- Auth redirect loop → double-check the **Redirect URLs** allow-list in step 4.
- "Cloud not configured" banner in console → step 5 wasn't done.
- RLS denies a query you think should work → run as the user in SQL Editor:
  `set role authenticated; set local "request.jwt.claim.sub" = '<user-uuid>';`
