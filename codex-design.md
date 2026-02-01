# Codex Design Decisions (Cloudflare Template)

This document captures the agreed design decisions for the Cloudflare template so another AI (or human) can review and implement consistently.

## Backend framework and structure
- Framework: **Hono** (Cloudflare Workers compatible).
- RPC: **Hono RPC** with **Zod validators** for type safety.
- Backend folder structure:
  - `backend/pages/` — each page file defines its own handlers.
    - `onLoad` (GET): loads all data for the page in one call.
    - `onSubmit<Name>` (POST): named submit handlers for distinct actions.
  - `backend/functions/` — shared functions used by multiple pages.
    - Any shared logic between pages must be extracted here.
    - New functionality should not be duplicated across page files.
  - `backend/database/`
    - `schema.ts` — Drizzle schema source of truth.
    - `migrations/` — generated migration files.

## RPC boundary
- Transport is standard HTTP endpoints served by Hono.
- Frontend uses Hono RPC client (`hc`) to call backend with type safety.
- Each endpoint must define Zod validators for request/response typing.

## Recommended response shapes
### onLoad (GET)
```ts
type LoadResponse<T> =
  | { ok: true; data: T; meta?: { requestId?: string; serverTime?: string } }
  | { ok: false; error: { code: string; message: string } };
```

### onSubmit (POST)
```ts
type SubmitResponse<T> =
  | { ok: true; data: T; meta?: { requestId?: string } }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        fieldErrors?: Record<string, string>;
        formErrors?: string[];
      };
    };
```

## Frontend stack
- Runtime: **Bun**.
- Framework: **TanStack Start** + **TanStack Router**.
- Styling: **Tailwind CSS**.
- RPC client: Hono RPC (`hc`).

## Auth
- Auth management: **BetterAuth**.
- Login provider: **Google OAuth** only.
- Sessions: use **secure httpOnly cookies** (server-issued).
  - Session records should be stored in DB (D1 or PlanetScale) with expiry.
  - Cookie contains an opaque token, not a JWT.

## Database
- Supported providers: **Cloudflare D1** or **PlanetScale**.
- ORM: **Drizzle**.
- Migration strategy:
  - `backend/database/schema.ts` is the source of truth.
  - Migrations generated into `backend/database/migrations/`.
  - Scripts expected:
    - `db:generate` (generate migrations)
    - `db:migrate` (apply migrations)
- PlanetScale uses **Hyperdrive** as connector (when selected).

## Storage
- File/object storage: **Cloudflare R2**.
- Bucket naming is left to the project creator.
- Access control:
  - Private bucket by default.
  - Use signed URLs for uploads/downloads when access must be restricted.

## Logging
- Logging provider: **Axiom**.
- Default: add automated backend logging (requests, errors, latency, requestId).

## AI
- If AI/LLM functionality is requested in the future, use **Vercel AI SDK**.

## Default pages
- Landing page
  - `onLoad` (may be empty depending on content).
- Login page
  - `onSubmit` for sign-in.
- Signed-in page (post-login default)
- Logout page
  - `onSubmit` for logout.

## Environment variables
- Local development: `.dev.vars`.
- Secrets: `wrangler secret put` (Cloudflare Secrets).
- Provide an `env.example` listing required vars.

## Deployment
- Cloudflare Pages preview deployments should be enabled for all branches/PRs.
- Prefer automated setup scripts to create Pages project and env vars on first setup.
- Preview URLs should be visible in PR checks once connected.

## Typechecking rule
- Any time code changes are made, run: `tsc --noEmit`.

## Agent instructions
- In `AGENTS.md` (or `clod.md` if used), the user must be prompted at project start
  to choose **D1** or **PlanetScale**. This choice determines DB wiring.
- `AGENTS.md` should also include all decisions above so future agents implement
  consistently.
