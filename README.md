# Cloudflare Web App Template

A full-stack web application template for Cloudflare Workers with type-safe RPC, authentication, and modern tooling.

## Technology Stack

- **Frontend**: TanStack Router + React, Tailwind CSS, TanStack Query
- **Backend**: Hono on Cloudflare Workers
- **RPC**: hono/client (type-safe)
- **Database**: Cloudflare D1 or PlanetScale (your choice)
- **ORM**: Drizzle
- **Auth**: Better Auth (Google OAuth)
- **Logging**: Axiom
- **File Storage**: Cloudflare R2

## Quick Start

### 1. Install Dependencies

```bash
bun install
```

### 2. Run Setup

The setup script will ask you to choose your database (D1 or PlanetScale) and configure the project accordingly.

```bash
bun run setup
```

### 3. Configure Environment

Copy the example environment file and fill in your values:

```bash
cp env.example .dev.vars
```

Note: The `.dev.vars` file should be at the root of the project. Wrangler will automatically load it when running from the backend directory.

### 4. Set Up Database

For D1:
```bash
wrangler d1 create your-app-db
# Update backend/wrangler.toml with the database ID
bun run db:push
```

For PlanetScale:
```bash
wrangler hyperdrive create your-hyperdrive --connection-string="your-planetscale-url"
# Update backend/wrangler.toml with the Hyperdrive ID
bun run db:push
```

### 5. Start Development

```bash
bun run dev
```

## Available Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start both frontend and backend in development |
| `bun run dev:frontend` | Start only frontend dev server |
| `bun run dev:backend` | Start only backend (wrangler dev) |
| `bun run build` | Build both frontend and backend |
| `bun run typecheck` | Run TypeScript type checking |
| `bun run setup` | Run initial project setup |
| `bun run db:generate` | Generate Drizzle migrations |
| `bun run db:push` | Push schema to database |
| `bun run db:migrate` | Run migrations |

## Project Structure

```
/
├── frontend/               # React frontend with TanStack Router
│   ├── src/
│   │   ├── routes/         # File-based routes
│   │   ├── components/     # Shared components
│   │   └── lib/            # Utilities (API client, query client)
│   └── ...
│
├── backend/                # Hono backend on Cloudflare Workers
│   ├── pages/              # Route handlers (one file per frontend page)
│   ├── functions/          # Shared business logic
│   ├── db/                 # Database schema and client
│   ├── lib/                # Auth, errors, R2 helpers
│   ├── middleware/         # Auth, CSP
│   └── ...
│
├── scripts/
│   └── setup.ts            # Project setup script
│
├── package.json            # Root workspace config
├── env.example             # Example environment variables
├── AGENTS.md               # AI agent instructions
└── README.md               # This file
```

## Default Pages

| Page | Route | Description |
|------|-------|-------------|
| Landing | `/` | Public landing page |
| Login | `/login` | Google OAuth login |
| Logout | `/logout` | Logout page |
| Auth Callback | `/auth/callback` | OAuth callback handler |
| App Dashboard | `/app` | Protected dashboard (requires auth) |

## Documentation

See `AGENTS.md` for detailed documentation on:
- Backend architecture (pages/functions pattern)
- API response format
- Authentication setup
- Security configuration
- Database schema patterns

## Production Deployment

1. Build the project:
   ```bash
   bun run build
   ```

2. Set production secrets:
   ```bash
   cd backend
   wrangler secret put GOOGLE_CLIENT_ID
   wrangler secret put GOOGLE_CLIENT_SECRET
   wrangler secret put BETTER_AUTH_SECRET
   wrangler secret put BETTER_AUTH_URL  # Your production URL, e.g., https://your-app.workers.dev
   wrangler secret put AXIOM_TOKEN
   # ... other secrets
   ```

3. Deploy:
   ```bash
   wrangler deploy
   ```
