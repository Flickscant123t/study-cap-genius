# Study Cap Genius

Study Cap Genius is a Vite + React + TypeScript app with Supabase and Stripe integration.

## Tech stack

- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase
- Stripe

## Local development

```sh
git clone https://github.com/Flickscant123t/study-cap-genius.git
cd study-cap-genius
npm install
npm run dev
```

Useful scripts:

```sh
npm run build
npm run test
npm run lint
```

## Deploying to Vercel

This repo is configured for Vercel deployment from GitHub.

If deployment stops triggering or the project appears disconnected from Vercel:

```sh
npx vercel login
npx vercel link
npx vercel --prod
```

Then verify in the Vercel dashboard:

- `Project Settings -> Git`: repository is connected
- Production branch is `main`
- Required environment variables are set

Note: newer Vercel CLI versions can warn on older Node 20.x builds. If needed, upgrade Node to latest 20.x or 22.x.

## Stripe webhooks

- Stripe sends events to `https://studycapgenius.vercel.app/api/stripe-webhook`.
- That route proxies payloads to the Supabase function `stripe-webhook`.
- Deploy Supabase functions with:

```sh
supabase functions deploy stripe-webhook --project-ref pthlcyiiceyvpzkalwog
supabase functions deploy stripe-renewal --project-ref pthlcyiiceyvpzkalwog
supabase functions deploy stripe-sync-subscription --project-ref pthlcyiiceyvpzkalwog
supabase functions deploy stripe-create-checkout --project-ref pthlcyiiceyvpzkalwog
```

- Ensure `STRIPE_SECRET_KEY` is set in Supabase secrets.
- Ensure `STRIPE_PRICE_ID` is set in Supabase secrets (the recurring price used for premium checkout).
- After webhook-related deploys, resend the latest `checkout.session.completed` event from Stripe to resync outstanding payments.
