# ყვავილო

Georgian flower gifting application. Cloudflare Pages serves the frontend; Supabase provides authentication, Postgres, private photo storage, and scheduled reminder functions.

## Current implementation and launch status

Implemented: email/password registration and login, email confirmation callback, password recovery, expiring-session refresh, per-account people/dates/orders, private photo upload and signed previews, database-backed catalog, server-validated order requests, staff fulfillment controls, calendar (.ics) export, web push subscription UI and a scheduled push sender. The landing page uses existing images, a teal/linen/peach palette, responsive layouts and reduced-motion-aware animations.

**Not a launched payment system.** Checkout records a pending request; it never claims that money has been charged or delivery is confirmed. A merchant payment provider and webhook reconciliation still need implementation after the owner selects a provider (for example Bank of Georgia or TBC). Staff can confirm and deliver requests through `/operations` if the business fulfills them manually. There is no courier API integration. Do not activate catalog items before prices, stock and fulfillment arrangements are real.

No live Supabase project, payment credentials or push secrets were supplied. Local SQL and client tests cover core behavior, but live email delivery, cloud storage, device push and live payments have not been verified. Web photo selection and calendar export are provided; this is not an iOS/Android native app or automatic native calendar synchronization.

## 1. Create the database

1. Create a Supabase project owned by the business.
2. In its SQL editor run `supabase/schema.sql`, then `supabase/catalog.sql`. The schema enables row-level access rules and private photo storage. The catalog imports existing bouquet designs as **inactive** records; there are no demo customers, orders, or occasions.
3. In Auth, enable email/password and email confirmation. Set the Site URL to the published Cloudflare domain. Add the exact production `/account` URL and local `http://127.0.0.1:3000/account` to the redirect allowlist for password recovery. Configure production SMTP with your sender domain before launching registration to customers.
4. Obtain the project URL and public anon key from the project API settings. Never use the service-role key in frontend variables.

## 2. Cloudflare Pages deployment

- Build command: `npm run build`
- Build output directory: `out`
- Root directory: the repository root (`/`)
- Node version: 22 or later
- Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Production and Preview environments. Add `NEXT_PUBLIC_VAPID_PUBLIC_KEY` when push is configured.
- Redeploy after changing any `NEXT_PUBLIC_` variable: Next embeds these values at build time.
- This repository now exports HTML for Pages; it does not need `wrangler deploy`. The account API runs on Supabase, not on a Next server.
- `public/_redirects` maps dynamic person/bouquet URLs to a static app shell. Client navigation preserves `/people/<id>` and `/flowers/<id>` paths, including direct visits and refreshes.

The landing page remains visible without configuration. Account creation is unavailable until the project URL/key are configured. Old prototype browser data is deliberately not imported into real accounts.

## 3. Activate products and staff access

In Supabase's table editor, inspect `products.data`, set the actual price, and turn `active` on only for available products. `products.data` contains the name, image path, price, flower composition and descriptions. Changes appear when the catalog reloads. Deactivated products remain readable for previous orders; they cannot be ordered.

Register the business owner's account, then grant staff access in the SQL editor:

```sql
insert into public.staff(user_id)
select id from auth.users where email = 'YOUR_ACTUAL_OWNER_EMAIL'
on conflict do nothing;
```

Open `/operations` while signed in as that staff user. Normal customers cannot read all orders, confirm requests, mark orders delivered, or alter catalog prices. A confirmed delivery creates the bouquet freshness record and an account notification. This is a manual fulfillment workflow and does not dispatch a courier.

## 4. Web push reminders

1. Generate a VAPID key pair with a reputable Web Push library (for example `npx web-push generate-vapid-keys`). Keep the pair stable.
2. Put the public key in Cloudflare's `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and rebuild.
3. Set these Supabase Edge Function secrets: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_CONTACT` (a real `mailto:` contact), and `REMINDER_CRON_SECRET` (a long random secret). Supabase injects its own URL and service-role key into Edge Functions.
4. Deploy `supabase/functions/send-reminders` with the Supabase CLI (`supabase functions deploy send-reminders`). Its JWT gateway check is disabled in `supabase/config.toml`; the function requires the private `x-cron-secret` header on every request.
5. Add the two Vault secrets described in `supabase/schedule.sql`, then run that SQL to schedule a run every ten minutes.
6. In the website's notification or account page, explicitly enable notifications on the device. On iPhone/iPad, use the installed Home Screen web app. The app does not request notification permission on first load.

The job creates reminders 7 days, 1 day, and on the occasion date using Asia/Tbilisi. It queues unread notifications, leases jobs to prevent concurrent sends, retries temporary failures, and removes expired subscriptions. A notification is marked sent only after the push service accepts it; that does not guarantee OS delivery. A scheduler outage longer than a day does not backfill missed dates. February 29 reminders are sent in leap years.

## 5. Local development and checks

```sh
npm install
cp .env.example .env.local
# Fill .env.local with your project's PUBLIC configuration.
npm run dev
npm run lint
npm test
npm run build
npm start
```

`npm start` previews the exported Pages site with equivalent profile/bouquet rewrites. For direct dynamic route refreshes, this export preview is the reliable production-like check; Next's development server may reject paths not included in generateStaticParams.

`tests/database.mjs` uses PGlite (real PostgreSQL in WASM) with local Supabase auth/storage schema stubs. It checks two-account isolation, private storage rules, standard/custom dates, server-side prices, order retry idempotency, staff fulfillment and reminder deduplication. `tests/client.mjs` checks request shapes, token refresh concurrency, failed requests and differential writes. `tests/push.mjs` verifies cron authorization, push delivery failures and endpoint restrictions using a stub sender. These tests do not replace live Supabase, SMTP, payment-provider or real-device tests.

Before public launch, verify signup/confirmation/recovery with actual email; create two accounts and verify isolation on two devices; upload a photo; place and confirm an order; import a calendar file; test a scheduled push on supported devices; and complete the selected provider's sandbox and production payment checks.
