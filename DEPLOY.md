# Deployment

Follow [DEPLOY_TH.md](DEPLOY_TH.md) for complete Thai instructions, SQL order, environment values and where to obtain them.

Runtime: Node 24, Next.js App Router. Build: `npm ci && npm run build`. Start: `npm start`. Do not use static export, Apache-only hosting or a PHP runtime.

Root directory contains package.json. Required env: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. AI env: DEEPSEEK_API_KEY, DEEPSEEK_MODEL (defaults deepseek-flash). No service-role/admin password variables.

Set env separately for Vercel Preview and Production. Rebuild after changing public vars. Keep private repository/branch and deploy preview before switching production. The old production deployment/database have not been modified by this local delivery.

Storage uploads go directly to Supabase, so files do not pass through Vercel's function request body limit. LUMI route maxDuration is 90 seconds with a 75-second internal provider abort; ensure your selected Vercel plan/runtime supports it. Use a lower request scope/model latency if your plan cannot sustain that duration.

Test login, event sync across sessions, persistence, real AI, RLS, Storage, PWA and real mobile devices after configuration. Use TEST_REPORT.md as the gate; a successful local build alone is not production acceptance.
