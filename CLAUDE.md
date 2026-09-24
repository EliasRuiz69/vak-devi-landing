# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Package manager

**pnpm only — never npm.** pnpm is activated via corepack. In each new PowerShell session you must prepend the shims directory to PATH before any pnpm command:

```powershell
$env:PATH = "$env:LOCALAPPDATA\corepack-shims;$env:PATH"
pnpm dev
```

## Common commands

```powershell
pnpm dev          # dev server → http://localhost:3000
pnpm build        # production build (type-checks; Next 16 does not run lint here)
pnpm lint         # ESLint only — has pre-existing errors, see "Known tech debt"
```

If `pnpm dev` fails with "port in use", kill the hanging process first:
```powershell
taskkill /PID <pid> /F
```

⚠️ **Local build ≠ Dokploy build.** `pnpm build` locally sees *every* variable in `.env.local`, but the Dockerfile used by Dokploy only passes the Supabase variables at build time (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and the `SUPABASE_SERVICE_ROLE_KEY` secret). `RESEND_API_KEY`, `RESEND_FROM_EMAIL` and `THERAPIST_EMAIL` exist only at runtime. So code that initializes an external client (Resend or any other SDK) **at module level** — outside a function — can pass the local build and still fail in Dokploy, because Next evaluates route modules while collecting page data. Always create such clients **inside the function that uses them**, never at module level, as `src/lib/notify-appointment.ts` does (fix `5630ed9`; the module-level `new Resend(...)` introduced in `6825e8e` broke the Dokploy build with `Missing API key`). `createAdminClient()` in `src/lib/supabase-admin.ts` follows the same rule.

## Architecture

Next.js 16 App Router, TypeScript, Tailwind v4, React 19. Backend: self-hosted Supabase (Postgres + Auth + Storage via `@supabase/ssr` / `supabase-js`), Resend for email, `@dnd-kit` (Servicios drag-and-drop), `recharts` (dashboard charts) and `@headlessui/react` (Combobox). Deployed by Dokploy from the Dockerfile on every push to `master`.

**Animation stack**: GSAP 3.15 (ScrollTrigger + SplitText) + Lenis 1.3 smooth scroll + Three.js 0.185 WebGL hero.

All GSAP plugins are registered once in [src/lib/gsap.ts](src/lib/gsap.ts) — always import `gsap`, `ScrollTrigger`, and `SplitText` from there, never directly from the `gsap` package.

**Smooth scroll**: Lenis runs inside `SmoothScroll.tsx` (client provider wrapping `<body>`). It feeds Lenis RAF ticks via `gsap.ticker` and calls `ScrollTrigger.update` on every scroll event.

**Hero WebGL** (`src/components/hero/`):
- `HeroCanvas.tsx` — Three.js setup: `OrthographicCamera(-1,1,1,-1)` + `PlaneGeometry(2,2)`, two image textures, `gsap.ticker` drives the render loop (mouse lerp at 0.06, hoverTarget decay at 0.985). Disposed fully on unmount.
- `heroShaders.ts` — GLSL vertex + fragment shaders. Fragment: fbm noise distortion, `coverUv()` for aspect-correct texture mapping, cursor falloff via `smoothstep(0.22, 0.0, dist)`; texture blend is `mixAmt = clamp(falloff * 0.6, 0, 1) * uIntensity` (falloff × load-in intensity — `uHover` only scales distortion `strength`, it does not affect the texture blend).
- `Hero.tsx` — mounts `HeroCanvas` on desktop; on mobile or `prefers-reduced-motion`, renders a static `<Image>` with a CSS Ken Burns loop instead. **Never touch the shader or Three.js logic when making content changes.**

**Text animations**: `RevealText.tsx` wraps GSAP SplitText (`type:"lines"`). It wraps each line in a `willChange: transform` span and animates `yPercent: 110 → 0` with `expo.out`. The H1 uses `trigger="load"` (fires immediately); sections use `trigger="scroll"` (ScrollTrigger at `top 85%`). Pass only a plain string as children — SplitText treats U+2026 `…` as a single character; do not use three ASCII periods `...`.

**Content data**: the source of truth for services is the Supabase `services` table, read in `ServicesSection.tsx` (server component, `createAdminClient()`), which maps rows to the `Service` type and passes them into `Services.tsx` → `ServiceCard.tsx`. `src/content/services.ts` only defines the `Service` TypeScript type — its static `staticServices` array is an inactive fallback inside `Services.tsx` (`services ?? staticServices`) that never runs in production, since `ServicesSection.tsx` always passes real data.
- The `es_premium` column (mapped to `premium` in the `Service` type) renders a **"Destacado"** badge.
- The `is_promo` column (boolean, NOT NULL, default `false`; migration `006_servicios_promo.sql`, mapped to `promo`) marks a promotion: `Services.tsx` removes that service from the regular list and renders it only in the "Promociones" block (an `h3`, placed before the regular list). The card gets a 2px `gold` border and a "Promoción" label (gold background, `ink` text — never white). With `premium` and `promo` together, "Promoción" sits on the left and "Destacado" on the right. If no service is in promotion, the block is not rendered at all. Both grids are animated via `[data-service-grid]` / `[data-service-card]` attributes (not `:scope > div`).
- `tools` (pills) are **not displayed today**: the `services` table has no `tools` column, so `ServicesSection.tsx` always maps `tools: undefined`.

**"¿Quién te acompaña?"** (`AboutTherapist.tsx`): all copy is inline in the component, not in `src/content/`. Only the credentials list lives in the `CREDENTIALS` constant at the top of the file. The therapist photo is a `next/image` with `fill` inside an `aspect-[3/4]` container sized by `max-w-[200px]` (below `lg`) and `lg:w-1/2` of its grid column (`lg`+); keep `sizes` in sync if you change either.

**Legal pages**: `src/app/politica-de-cookies/page.tsx` and `src/app/politica-de-privacidad/page.tsx` only hold `metadata` and read `politicas/politica-de-*-vakdevi.html` with `fs.readFileSync` at build time, injecting its `<style>` and `<body>`. So `politicas/` is the **live source of the legal text** (not historical) — edit the HTML there to change the policy copy, not the `page.tsx`.

**Service images**: `services.imagen_url` (Supabase, `text`, nullable) stores the full public Supabase Storage URL for a service's image. Files live in the public `servicios` bucket (created manually in Supabase Studio — see `supabase/migrations/005_imagen_servicios.sql` for the column and a note on the bucket). All reads/writes go through `createAdminClient()` (service role key) via `uploadServiceImage`/`deleteServiceImage` in `src/app/actions/admin.ts` — never exposed to the browser. Accepted types: `image/jpeg`, `image/png`, `image/webp`; max 5MB, validated both client-side (`ServiciosClient.tsx`) and server-side (re-validated in `uploadServiceImage`, since the client check can be bypassed). Next.js's own Server Actions body-size limit is raised in `next.config.ts` (`experimental.serverActions.bodySizeLimit: "6mb"` — headroom above the 5MB business rule to cover multipart overhead). Stored filename is `crypto.randomUUID()` + the original extension, never the original filename. Replacing an image deletes the previous file from the bucket after a successful save — best-effort, logged to console on failure, never blocking the form.

## Routes & auth

- **Public**: `/` (landing), `/agendar` (booking, `BookingWizard.tsx` + `actions/schedule.ts`), `/api/slots` (available-slot calculation), `/login` (`LoginForm.tsx` + `actions/auth.ts`), `/politica-de-cookies`, `/politica-de-privacidad`.
- **Admin** (`/admin/*`): `citas` (+ `[id]`), `citas-nueva`, `clientes`, `dashboard`, `disponibilidad`, `servicios`.
- **Protection**: `src/middleware.ts` refreshes the Supabase session; unauthenticated requests to `/admin/*` redirect to `/login`, and an authenticated user visiting `/login` is sent to `/admin`. Matcher: `/admin/:path*` and `/login`. Server actions additionally check the session with `assertAdmin()`. Next 16 deprecates the `middleware` file convention in favor of `proxy` (see Known tech debt).

## Environment variables

Names only — values live in `.env.local` (git-ignored) and in Dokploy; never write them into files, commits or chat.

| Variable | Available at build (Docker) | Used for |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase URL (browser + server) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Supabase anon key (auth client, middleware) |
| `SUPABASE_SERVICE_ROLE_KEY` | yes (BuildKit secret) | `createAdminClient()` — server only |
| `RESEND_API_KEY` | **runtime only** | Resend |
| `RESEND_FROM_EMAIL` | **runtime only** | Email sender (falls back to `onboarding@resend.dev`) |
| `THERAPIST_EMAIL` | **runtime only** | Recipient of new-appointment notifications |

## Database & migrations

Schema changes live as SQL files in `supabase/migrations/` (`001`–`006`). **The user runs migrations manually in the Supabase Studio SQL Editor. The agent never applies migrations and never touches the production database directly — it only creates or edits the `.sql` files.**

## Admin panel

`src/app/admin/` — every mutation goes through server actions in `src/app/actions/admin.ts`, gated by `assertAdmin()` (Supabase auth session check). Besides the sections below:
- **Clientes** (`/admin/clientes`): CRM over the `clients` table (source of truth for who is a client) with per-client stats computed from `appointments` by email (sessions, billed total, last session, top two services; cancelled/no-show excluded). Search by name/email, create, edit name/phone and **private notes** (LFPDPPP notice), delete (removes only the `clients` row — its appointments stay).
- **Dashboard** (`/admin/dashboard`): read-only. KPI cards (today's and this week's appointments, month revenue and average ticket from `completed` sessions, weekly occupancy against `schedule_config`, most requested service), today's agenda linking to each cita, and three `recharts` charts in `DashboardCharts.tsx` (14-day revenue, sessions by service, sessions by hour).
- **Disponibilidad** (`/admin/disponibilidad`): edits the active `schedule_config` row (working days, start/end time, slot duration → `updateScheduleConfig`) and manages `blocked_dates`: full-day ranges (`addBlockedDateRange`) and partial-hour blocks within one day (`addBlockedTimeRange`), removable with `removeBlockedDate`. `/api/slots` and the public booking flow read these.

**Citas** (`/admin/citas`):
- `CitasClient.tsx` renders a Lista/Calendario toggle above the existing status/search/service filters. Both views consume the same filtered `visible` array — switching views never re-filters or duplicates that logic.
- Calendario has its own Día/Semana/Mes selector, backed by three separate components: `CalendarMonthView.tsx`, `CalendarWeekView.tsx`, `CalendarDayView.tsx`. Each keeps its own navigation state (the day/week/month currently shown), initialized from `getTodayMerida()` — none of the three are synced to each other.
- All three pull their date math from pure functions in `src/lib/admin-utils.ts`:
  - `getTodayMerida()` — "today" in `America/Merida`, avoids midnight-boundary bugs from using the server/browser's local time.
  - `getCalendarWeekStart(fecha)` — Monday of the **calendar week** (7 full days, Mon–Sun) containing `fecha`. Distinct from `getWeekStart`, which is the **working week** (Monday–Friday) used by `countWorkingDays` / the dashboard — don't conflate the two.
  - `getMonthGrid(year, month)` — full month grid as `string[][]` (weeks of 7 ISO dates, including previous/next month padding), built on `getCalendarWeekStart` + `addDays`.
  - `addDays(fecha, n)` — generic date arithmetic (`n` can be negative); `subtractDays` delegates to it.
  - `getDateBlockInfo(fecha, blockedDates)` — resolves `blocked_dates` rows for a date into `{ bloqueoTotal, motivoTotal, bloqueosParciales }`, distinguishing a full-day block (`hora_inicio` NULL) from a partial-hour block (`hora_inicio`/`hora_fin` set, always with `fecha === fecha_fin`). Reused as-is by Mes, Semana and Día — never reimplement this distinction inside a component.
  - `src/app/admin/citas/day-appointments.ts` (`getDayCalendarData`) — filters + sorts a single day's appointments by `hora_inicio`; reused by Semana and Día (Mes keeps its own inline filter, predating this helper — not worth touching).
- Status label/color come from `src/lib/appointment-status.ts` (`STATUS_LABEL`, `STATUS_STYLE`) — the single source of truth, also imported by `/admin/dashboard`. Never redefine these locally in a component.

**Servicios** (`/admin/servicios`): `ServiciosClient.tsx` holds the drag-and-drop list and the edit form, including the "En promoción" switch (`is_promo`) and the gold "Promoción" badge in the list. Saving goes through `updateService`/`createService`, and `reorderServices` revalidates `/`, `/admin/servicios` and `/agendar`, so the landing reflects order and promotion changes.

**Alta manual** (`/admin/citas-nueva`):
- `NuevaCitaForm.tsx` uses `@headlessui/react`'s `Combobox` to search existing clients by name and autofill email/phone — **the only UI-component library in the project** (besides `@dnd-kit` for drag-and-drop and `recharts` for charts); everything else in the admin panel is hand-rolled Tailwind.
- `createManualAppointment` (`src/app/actions/admin.ts`) requires the submitted email to match an existing row in `clients` — if it doesn't, validation fails with a field error pointing to the Clientes tab. This is a deliberate business rule **exclusive to this admin flow**. ⚠️ The public booking flow (`/agendar` → `schedule.ts`) has no such restriction and must keep creating new clients freely — never port this validation there.
- Unlike `/agendar`, the manual form allows past dates (no `min` on the date input) — meant for logging sessions that already happened outside the online system.

**Appointment emails**: `src/lib/notify-appointment.ts` (`sendAppointmentEmails`) centralizes the Resend send (client confirmation + therapist notification, `Promise.allSettled`, non-blocking — logs on failure, never blocks the booking/creation). Used by both `schedule.ts` (public flow) and `createManualAppointment` (`admin.ts`). The admin flow skips the call entirely when the appointment's `fecha` is before `getTodayMerida()` — a manual entry for a past date never triggers "we're looking forward to seeing you" emails.

## Design tokens

Defined as CSS vars in [src/app/globals.css](src/app/globals.css), exposed to Tailwind via `@theme inline`:

| Token | Value | Usage |
|-------|-------|-------|
| `purple-1` | `#8B1EA0` | Primary: hero overlay, CTA section bg, buttons |
| `purple-2` | `#7B2D8B` | Accents, highlighted text |
| `purple-3` | `#9B4DAB` | Decorative lines, card borders |
| `ink` | `#2A1230` | Body text, hero gradient — never use pure black |
| `lavender` | `#F5F0FA` | Page background |
| `gold` | `#B8891F` | Promotions only: card border + "Promoción" label (label text is always `ink`) |

Fonts: `--font-serif` = Playfair Display (titles, hero H1, italic subtitles), `--font-sans` = Inter (body). Both loaded via `next/font/google` in `layout.tsx`.

## Hero images

Stored in `public/hero/`:
- `connect-1.jpg` — two silhouettes under a tree at sunset (wide/panoramic; Unsplash, Harli Marten)
- `connect-2.jpg` — two hands holding, warm skin tones (detail/close-up; Unsplash, Nadin Mario)

`connect-1` is Texture 1 (default view); `connect-2` blends in as the cursor moves across the hero. `hands-1.jpg` / `hands-2.jpg` in the same folder are not referenced by any code today.

## Other folders

- `politicas/` — HTML source of the cookie and privacy policies; **live**, read by the `politica-de-*` pages (see Legal pages).
- `brand-source/` — `vak_devi_logo_original.html`, a one-off source file for the logo; not used by the app.
- `imagenes/` — local working originals (service/hero artwork). Listed in `.gitignore`, never versioned; service images reach the site by upload through `/admin/servicios` into Supabase Storage, not through `public/`.

## Workflow

- One change at a time. When asked to report first, analyze and propose, then wait for confirmation before editing.
- One commit per logical change, with explicit file lists (never `git add .` / `-A`); no interactive git commands.
- Never `git push` without the explicit instruction "push".

## Known tech debt (documented, not fixed)

- `pnpm lint`: 13 errors + 1 warning as of 2026-09-23 — `react-hooks/set-state-in-effect` (NuevaCitaForm, ServiciosClient, Hero, CookieBanner), `react/no-unescaped-entities` (CalendarDayView, CitasClient, `citas/[id]/page.tsx`, BookingWizard), `@next/next/no-html-link-for-pages` (`<a>` instead of `<Link>` in NuevaCitaForm), plus an unused `redirect` import warning in `citas/[id]/page.tsx`. `pnpm build` does not run lint, so none of this blocks a deploy.
- Every build prints the Next 16 deprecation warning: the `middleware` file convention should become `proxy` (`src/middleware.ts`).

## Scheduling system

The Supabase booking + Resend email flow is **fully implemented and in production** — `src/app/agendar/page.tsx` is no longer a placeholder. The public flow is `BookingWizard.tsx` + `src/app/actions/schedule.ts`; the admin-side management (Calendar views, manual entry, appointment emails) is documented in **Admin panel** above. The old pre-wizard chain (`BookingForm.tsx` → `actions/booking.ts` → `lib/supabase.ts`) was orphaned dead code and has been deleted.
