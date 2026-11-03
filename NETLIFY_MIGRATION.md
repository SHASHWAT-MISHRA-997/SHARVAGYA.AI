# Netlify-only migration

SHARVAGYA.AI currently has a Next.js frontend and a separate FastAPI/Postgres
application. Netlify deploys the Next.js application directly, but it does not
run the existing Python application as a persistent web service. The backend
must therefore be replaced with Netlify Functions and Netlify Database before
the public login can be enabled.

## Non-negotiable production rules

- Keep credentials only in Netlify environment variables with Functions scope.
- Use Netlify Database for relational data; do not use browser storage as a
  database or persist password material in the browser.
- Reimplement authentication, authorization, rate limiting, audit logging, and
  data deletion controls before redirecting the frontend API client to Netlify.
- Keep the current FastAPI service as the local reference until each route is
  migrated and verified by endpoint-level tests.
- Do not publish the app to users until login, registration, session expiry,
  password reset, dashboard reads, and authorization isolation pass end-to-end
  tests.

## Migration sequence

1. Create a Netlify project connected to `SHASHWAT-MISHRA-997/SHARVAGYA.AI`
   with `frontend` as its base directory.
2. Provision Netlify Database and apply the schema migration.
3. Move identity and organization routes first, including password hashing,
   signed sessions, rate limits, and reset-email delivery.
4. Move workspace reads and writes (events, risk scores, alerts, watchlists,
   and dashboard) with per-organization authorization checks.
5. Move the assistant route only after a server-side model provider and
   guarded source retrieval are configured; never put an AI key in a public
   browser variable.
6. Configure production secrets in the Netlify dashboard and deploy a preview.
7. Run the complete login and API regression suite against the preview, then
   promote production only after it passes.

The initial Netlify health function lives at `/api/v1/health`. It is a runtime
verification endpoint only; it must not be represented as a migrated backend.
