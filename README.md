# Maison Laurent — Restaurant Reservations

A full-stack restaurant reservation and table-management application built with
TanStack Start, React 19, TypeScript, Tailwind CSS, and Supabase.

## What is included

- Customer sign-up, sign-in, profile management, and reservation history
- Live table availability with category and capacity filters
- Reservation creation, modification, cancellation, and double-booking guards
- Staff booking management, table CRUD, dashboard, and user directory
- Role-based access control for customer, staff, manager, and admin accounts
- In-app booking notifications, reminders, and seating alerts
- Supabase Row Level Security policies and server-side authorization
- Responsive public pages and authenticated dashboards

## Requirements

- Node.js 22 or newer
- npm 10 or newer
- A Supabase project, or the Supabase CLI for a local database

## Run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create the local environment file:

   ```bash
   cp .env.example .env
   ```

3. Fill in the project URL, project ID, and publishable key in `.env`. These
   values are available from the Supabase project settings. A service-role key
   is not required by the application.

4. Apply the database migrations.

   For a linked hosted project:

   ```bash
   supabase link --project-ref YOUR_PROJECT_ID
   supabase db push
   ```

   For a local Supabase stack:

   ```bash
   supabase start
   supabase db reset
   ```

   When using the local stack, replace the URL and publishable key in `.env`
   with the values printed by `supabase status`.

5. Start the application:

   ```bash
   npm run dev
   ```

   Open the URL printed by Vite (normally `http://localhost:8080`).

## Create the first staff account

Every new account receives the `customer` role. After signing up, promote the
account from the Supabase SQL editor:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from auth.users
where email = 'you@example.com'
on conflict (user_id, role) do nothing;
```

The same account may keep its customer role; staff roles take precedence in the
application.

## Validation commands

```bash
npm run typecheck
npm run lint
npm run build
```

Run all three in sequence with:

```bash
npm run check
```

To inspect the production bundle locally:

```bash
npm run preview
```

## Database layout

The migration source of truth is [`supabase/migrations`](supabase/migrations).
The timestamped migrations create:

- profiles and application roles
- restaurant tables and reservations
- notifications and favourite tables
- availability, reminder, and booking-protection functions
- RLS policies, triggers, indexes, realtime publications, and seed tables

The files under `drizzle/migrations` are retained as a legacy Lovable mirror.
Use the Supabase migrations for new environments.

## Environment variables

| Variable                        | Purpose                     |
| ------------------------------- | --------------------------- |
| `SUPABASE_PROJECT_ID`           | Supabase project reference  |
| `SUPABASE_URL`                  | Server-side Supabase URL    |
| `SUPABASE_PUBLISHABLE_KEY`      | Server-side publishable key |
| `VITE_SUPABASE_PROJECT_ID`      | Browser project reference   |
| `VITE_SUPABASE_URL`             | Browser Supabase URL        |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser publishable key     |

Only publishable Supabase credentials belong in browser variables. Never add a
service-role key to a `VITE_` variable.

## Deployment

The project is connected to Lovable. Pushing normal commits to the connected
branch syncs them back to Lovable. Do not force-push or rewrite published
history.

Before deploying, apply the latest Supabase migrations and run `npm run check`.
The Lovable Vite configuration builds the application with its configured Nitro
Cloudflare preset into `.output`.
