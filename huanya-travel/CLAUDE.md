# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

All commands run from `huanya-travel/`:

```bash
npm run dev      # start dev server (localhost:3000)
npm run build    # production build
npm run lint     # eslint check
```

No test runner is configured. Playwright or Jest must be added before writing automated tests.

## Environment

Copy `.env.local.example` to `.env.local` and fill in Supabase credentials:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only, optional)

## Architecture

**Stack:** Next.js 16 (App Router) · React 19 · Supabase (auth + Postgres) · Tailwind CSS v4 · TypeScript

**Two user roles:** `tourist` (posts demands, selects bids, pays) and `driver` (browses demands, submits bids, completes trips).

### Route layout

```
app/
  (auth)/login          # Supabase signInWithPassword
  (auth)/register       # Supabase signUp with role in user metadata
  page.tsx              # Public landing page
  demand/create         # Tourist: publish a trip demand
  demand/[id]           # Tourist: view bids on their demand
  tourist/dashboard     # Tourist: list own demands
  driver/marketplace    # Driver: browse open demands
  driver/bids           # Driver: manage submitted bids
  order/[id]            # Order detail (both roles)
  order/[id]/pay        # Tourist: deposit/full payment
  profile/driver/[id]   # Public driver profile
  api/demands           # GET (list) / POST (create)
  api/demands/[id]      # GET / PATCH / DELETE
  api/bids              # GET / POST
  api/bids/[id]         # PATCH (accept/reject/withdraw)
  api/orders/[id]       # GET / PATCH (status updates)
  api/auth              # Supabase auth helper
```

### Auth & middleware

`src/middleware.ts` (via `src/lib/supabase/middleware.ts`) guards routes:
- `/tourist/*` and `/demand/*` → tourist-only, redirect unauthenticated to `/login`
- `/driver/*` → driver-only, redirect unauthenticated to `/login`
- `/login` and `/register` → redirect authenticated users to `/`

Server components use `createClient()` from `@/lib/supabase/server` (cookie-based). Client components use `createClient()` from `@/lib/supabase/client`.

### Core data model (Supabase tables)

| Table | Key fields | Notes |
|-------|-----------|-------|
| `profiles` | `id`, `role`, `full_name`, `rating`, `is_verified` | One row per auth user |
| `demands` | `tourist_id`, `status`, `travel_date`, `pickup_loc`, `dropoff_loc`, `budget_min/max` | Budget stored as AUD **cents** |
| `bids` | `demand_id`, `driver_id`, `price`, `vehicle_info`, `status` | Price stored as AUD **cents** |
| `orders` | `demand_id`, `bid_id`, `tourist_id`, `driver_id`, `amount`, `payment_status`, `trip_status` | Created when a bid is accepted |

**Status enums** (defined in `src/types/index.ts`):
- `DemandStatus`: `pending → confirmed → in_progress → completed | cancelled`
- `BidStatus`: `active → accepted | rejected | withdrawn`
- `PaymentStatus`: `unpaid → deposited → paid_in_full | refunded`
- `TripStatus`: `confirmed → in_progress → completed | disputed | cancelled`

### Key conventions

- Budget/price values are **AUD cents in the DB** and **AUD dollars in the UI/forms** — convert at the API boundary (`body.budget_min * 100` on write, `/100` on display).
- All API routes authenticate via `supabase.auth.getUser()` and return `{ error: 'Unauthorized' }` with 401 if not authenticated.
- `@/components/ui/` contains reusable primitives (`Input`, `Button`, `Textarea`). `@/components/shared/` contains app-specific components (`Navbar`, `LocationInput`).
- The app is Chinese-language: all user-visible strings, labels, and error messages are in Mandarin.
