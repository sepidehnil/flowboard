# DevFlow

DevFlow is a production-style multi-user SaaS dashboard for freelancers and developers. Each authenticated user owns an isolated workspace of projects, tasks, clients, invoices, and activity — backed by PostgreSQL and secured on the server.

Built as a portfolio-grade Next.js application demonstrating real authentication, database design, CRUD, analytics, and polished dashboard UX.

## Features

- Email/password authentication with Auth.js (NextAuth v5)
- Per-user data isolation (every query filters by `userId`)
- Automatic demo data seeding on registration
- Dashboard metrics and Recharts visualizations from live DB data
- Full CRUD for projects, tasks, clients, and invoices
- Project detail pages with linked tasks
- Analytics and settings (profile, password, theme)
- Light / dark / system theme
- Responsive sidebar + mobile drawer
- Loading, empty, error, and not-found states
- React Hook Form + Zod validation (client and server)

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js App Router |
| Language | TypeScript (strict) |
| UI | React, Tailwind CSS, Lucide |
| Forms | React Hook Form, Zod |
| Charts | Recharts |
| Auth | Auth.js / NextAuth v5 (JWT sessions) |
| ORM | Prisma |
| Database | PostgreSQL |
| Password hashing | bcryptjs |

## Architecture

```text
src/
├── app/
│   ├── (auth)/              # login, register, forgot-password
│   ├── (dashboard)/         # protected dashboard routes
│   └── api/auth/            # Auth.js route handlers
├── actions/                 # Server Actions (CRUD + auth)
├── components/              # UI, layout, feature modules
├── lib/
│   ├── auth.ts
│   ├── db.ts
│   ├── validations/
│   └── services/            # ownership helpers, demo data, analytics
└── types/
```

- **Server Components by default** for data fetching
- **Server Actions** for mutations with ownership checks
- **Middleware** redirects unauthenticated users away from `/dashboard/*`
- Business logic lives in `lib/services` and `actions`, not in React trees

## Multi-user data model

```text
User
 ├── Projects
 ├── Tasks
 ├── Clients
 ├── Invoices
 └── Activities
```

Every owned row stores `userId`. Mutations load the resource with:

```ts
where: { id, userId: session.user.id }
```

User A never receives User B’s rows — filtering is enforced on the server, not only in the UI.

## Database schema (Prisma)

Core models: `User`, `Project`, `Task`, `Client`, `Invoice`, `Activity`, plus Auth.js `Account` / `Session` / `VerificationToken`.

Enums:

- Project: `PLANNED`, `IN_PROGRESS`, `COMPLETED`, `ON_HOLD`
- Task: `TODO`, `IN_PROGRESS`, `DONE` + priority `LOW`–`URGENT`
- Invoice: `DRAFT`, `SENT`, `PAID`, `OVERDUE`, `CANCELLED`

## Authentication

1. Register → password hashed with bcrypt → user created → **personal demo data seeded** → session established
2. Login → credentials verified against hash → JWT session
3. Logout → session cleared
4. Protected routes require a valid session (middleware + layout)

Demo seed user (optional, via `npm run db:seed`):

- Email: `demo@devflow.app`
- Password: `password123`

## Installation

### Prerequisites

- Node.js 20+
- PostgreSQL 14+ running locally or remotely

### Setup

```bash
npm install --registry https://registry.npmjs.org/
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/devflow?schema=public"
AUTH_SECRET="generate-with-openssl-rand-base64-32"
```

Start PostgreSQL (Docker recommended):

```bash
docker compose up -d
```

Then:

```bash
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Demo login after seeding:

- Email: `demo@devflow.app`
- Password: `password123`

## Useful Prisma commands

```bash
npm run db:generate   # prisma generate
npm run db:migrate    # prisma migrate dev
npm run db:seed       # seed demo user
npm run db:studio     # Prisma Studio
```

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Auth.js signing secret |

Never commit real secrets. `.env` is gitignored; `.env.example` is safe to commit.

## Deployment

1. Provision PostgreSQL (Neon, Supabase, Railway, etc.)
2. Set `DATABASE_URL` and `AUTH_SECRET` in the host
3. Run `npx prisma migrate deploy`
4. Deploy to Vercel (or similar) with `npm run build`

## Screenshots

Add portfolio screenshots here after running the app:

- Login / register
- Dashboard with charts
- Projects table
- Dark mode view
- Mobile drawer navigation

## Future improvements

- Email-based password reset provider
- File uploads for client/project assets
- Role-based team workspaces
- Stripe billing integration
- Real-time notifications

## License

MIT — feel free to fork and adapt for your portfolio.

