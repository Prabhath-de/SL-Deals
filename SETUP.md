# Setup guide

This takes about 20 minutes. You need a free [Supabase](https://supabase.com) account and the Vercel project you already have.

> **Why a new database?** The first version of the site used a database you can't manage directly, and it had a privacy problem (anyone could read submitters' emails and phone numbers). The new version runs on your own Supabase project, so you fully own the data and its security rules.

---

## 1. Create the Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Name: `dealfinder-lk`. Region: **Southeast Asia (Singapore)** — closest to Sri Lanka.
3. Choose a strong database password and save it somewhere safe.
4. Wait about 2 minutes for the project to start.

## 2. Create the tables and security rules

1. In the project, open **SQL Editor** → **New query**.
2. Open `supabase/migrations/20261028000000_init.sql` from this project, copy everything, paste it in, and click **Run**.
3. You should see "Success. No rows returned".

## 3. Set up sign-in emails

1. **Authentication → URL Configuration**
   - **Site URL:** `https://sri-lanka-deals.vercel.app` (or your own domain)
   - **Redirect URLs:** add `https://sri-lanka-deals.vercel.app/**` and `http://localhost:8080/**`
2. **Authentication → Sign In / Providers → Email**: keep **Confirm email** on, so fake emails can't sign up.
3. Supabase's built-in email sender is limited to a few emails per hour. Before you launch publicly, add your own SMTP under **Authentication → Emails → SMTP Settings** (Resend, Brevo or Zoho Mail all have free plans).

## 4. Connect the website

1. In Supabase: **Project Settings → API**. Copy the **Project URL** and the **anon public** key.
2. In Vercel: open the project → **Settings → Environment Variables**, and add:

   | Name | Value |
   | --- | --- |
   | `VITE_SUPABASE_URL` | your Project URL |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | your anon public key |
   | `VITE_SUPABASE_PROJECT_ID` | the id in the URL (`https://<this part>.supabase.co`) |
   | `VITE_SITE_URL` | `https://sri-lanka-deals.vercel.app` |
   | `VITE_CONTACT_EMAIL` | the email shown on the Contact page (optional) |
   | `VITE_FACEBOOK_URL` | your Facebook page (optional) |

3. Push the code to GitHub. Vercel builds and deploys it.

For running on your own computer, copy `.env.example` to `.env` and fill in the same values.

## 5. Make yourself an admin

1. Open the live site → **Sign in → Create an account** with your email, and confirm it from the email you get.
2. Back in Supabase **SQL Editor**, run (with your email):

   ```sql
   insert into public.user_roles (user_id, role)
   select id, 'admin' from auth.users where email = 'YOUR-EMAIL@example.com';
   ```

3. Sign out and sign in again. You'll see **Admin panel** in the account menu, or open `/admin`.

From now on you can give other people admin access from **Admin → Users**.

## 6. Copy the old deals (optional)

The script copies every deal and its image from the old database into the new one. It doesn't copy submitters' names, emails or phone numbers.

You need:
- The **old** URL and key — they're in the `.env` file of the original project (`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`).
- The **new** project's **service_role** key — Supabase → **Project Settings → API → service_role**. Keep this secret: never put it in `.env` or GitHub.

Run this in the project folder (Mac/Linux, one command):

```bash
OLD_SUPABASE_URL="https://OLD.supabase.co" \
OLD_SUPABASE_KEY="old-publishable-key" \
NEW_SUPABASE_URL="https://NEW.supabase.co" \
NEW_SUPABASE_SERVICE_ROLE_KEY="new-service-role-key" \
node scripts/migrate-old-database.mjs
```

On Windows PowerShell:

```powershell
$env:OLD_SUPABASE_URL="https://OLD.supabase.co"
$env:OLD_SUPABASE_KEY="old-publishable-key"
$env:NEW_SUPABASE_URL="https://NEW.supabase.co"
$env:NEW_SUPABASE_SERVICE_ROLE_KEY="new-service-role-key"
node scripts/migrate-old-database.mjs
```

Old categories are mapped to the new ones (Food → Restaurants & Dining, Hotels/Travel → Hotels & Travel, and so on). Check them in **Admin → Deals** afterwards. Once the copy is done you can delete `scripts/migrate-old-database.mjs`.

---

## Daily use

- **Review submissions:** Admin → Deals → *Waiting for review*. Approve, or reject with a reason the sender will see.
- **Feature an offer on the home page:** select it → *Feature*, or tick *Feature on the home page* when editing.
- **Expired offers** disappear from the site automatically the day after their last day. Archive them in Admin → Deals → *Expired* to keep the list tidy.
- **Reports:** visitors can flag wrong or ended offers. Check Admin → Reports.
- **Backup:** Admin → Deals → *Export CSV* downloads every deal.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Red bar: "The database isn't connected yet" | The `VITE_SUPABASE_*` variables are missing. Add them in Vercel and redeploy. |
| Refreshing a page shows a Vercel 404 | Make sure `vercel.json` is in the repository. |
| Confirmation email link goes to localhost | Fix the **Site URL** in step 3. |
| "Admins only" after running the SQL | Sign out and sign in again. |
| "You can submit up to 10 deals per day" | That's the spam limit. Admins don't have it. Change the number in the `prepare_new_deal` function. |
