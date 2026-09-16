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
pnpm build        # production build (type-checks + lint)
pnpm lint         # ESLint only
```

If `pnpm dev` fails with "port in use", kill the hanging process first:
```powershell
taskkill /PID <pid> /F
```

## Architecture

Next.js 16 App Router, TypeScript, Tailwind v4, React 19.

**Animation stack**: GSAP 3.15 (ScrollTrigger + SplitText) + Lenis 1.3 smooth scroll + Three.js 0.185 WebGL hero.

All GSAP plugins are registered once in [src/lib/gsap.ts](src/lib/gsap.ts) — always import `gsap`, `ScrollTrigger`, and `SplitText` from there, never directly from the `gsap` package.

**Smooth scroll**: Lenis runs inside `SmoothScroll.tsx` (client provider wrapping `<body>`). It feeds Lenis RAF ticks via `gsap.ticker` and calls `ScrollTrigger.update` on every scroll event.

**Hero WebGL** (`src/components/hero/`):
- `HeroCanvas.tsx` — Three.js setup: `OrthographicCamera(-1,1,1,-1)` + `PlaneGeometry(2,2)`, two image textures, `gsap.ticker` drives the render loop (mouse lerp at 0.06, hoverTarget decay at 0.985). Disposed fully on unmount.
- `heroShaders.ts` — GLSL vertex + fragment shaders. Fragment: fbm noise distortion, `coverUv()` for aspect-correct texture mapping, cursor falloff via `smoothstep(0.22, 0.0, dist)`; texture blend is `mixAmt = clamp(falloff * 0.6, 0, 1) * uIntensity` (falloff × load-in intensity — `uHover` only scales distortion `strength`, it does not affect the texture blend).
- `Hero.tsx` — mounts `HeroCanvas` on desktop; on mobile or `prefers-reduced-motion`, renders a static `<Image>` with a CSS Ken Burns loop instead. **Never touch the shader or Three.js logic when making content changes.**

**Text animations**: `RevealText.tsx` wraps GSAP SplitText (`type:"lines"`). It wraps each line in a `willChange: transform` span and animates `yPercent: 110 → 0` with `expo.out`. The H1 uses `trigger="load"` (fires immediately); sections use `trigger="scroll"` (ScrollTrigger at `top 85%`). Pass only a plain string as children — SplitText treats U+2026 `…` as a single character; do not use three ASCII periods `...`.

**Content data**: the public Services section reads live from the Supabase `services` table via `ServicesSection.tsx` (server component, `createAdminClient()`), which maps rows to the `Service` type and passes them into `Services.tsx` → `ServiceCard.tsx`. `src/content/services.ts` is **not** the data source for the public page anymore — it only supplies the `Service` TypeScript type; its static `staticServices` array is a fallback inside `Services.tsx` (`services ?? staticServices`) that never activates in production, since `ServicesSection.tsx` always passes real data. The `premium: true` flag renders a "Destacado" badge; `tools` (pills) is not currently populated from Supabase — the `services` table has no `tools` column, so `ServicesSection.tsx` always maps `tools: undefined`.

⚠️ `src/app/agendar/BookingForm.tsx` still imports `services` (the array itself, not just the type) from `src/content/services.ts` — but that file is orphaned: no active route imports `BookingForm.tsx` (the real `/agendar` flow uses `BookingWizard.tsx` + `schedule.ts`). Candidate for future cleanup, not touched here.

**Service images**: `services.imagen_url` (Supabase, `text`, nullable) stores the full public Supabase Storage URL for a service's image. Files live in the public `servicios` bucket (created manually in Supabase Studio — see `supabase/migrations/005_imagen_servicios.sql` for the column and a note on the bucket). All reads/writes go through `createAdminClient()` (service role key) via `uploadServiceImage`/`deleteServiceImage` in `src/app/actions/admin.ts` — never exposed to the browser. Accepted types: `image/jpeg`, `image/png`, `image/webp`; max 5MB, validated both client-side (`ServiciosClient.tsx`) and server-side (re-validated in `uploadServiceImage`, since the client check can be bypassed). Next.js's own Server Actions body-size limit is raised in `next.config.ts` (`experimental.serverActions.bodySizeLimit: "6mb"` — headroom above the 5MB business rule to cover multipart overhead). Stored filename is `crypto.randomUUID()` + the original extension, never the original filename. Replacing an image deletes the previous file from the bucket after a successful save — best-effort, logged to console on failure, never blocking the form.

## Design tokens

Defined as CSS vars in [src/app/globals.css](src/app/globals.css), exposed to Tailwind via `@theme inline`:

| Token | Value | Usage |
|-------|-------|-------|
| `purple-1` | `#8B1EA0` | Primary: hero overlay, CTA section bg, buttons |
| `purple-2` | `#7B2D8B` | Accents, highlighted text |
| `purple-3` | `#9B4DAB` | Decorative lines, card borders |
| `ink` | `#2A1230` | Body text, hero gradient — never use pure black |
| `lavender` | `#F5F0FA` | Page background |

Fonts: `--font-serif` = Playfair Display (titles, hero H1, italic subtitles), `--font-sans` = Inter (body). Both loaded via `next/font/google` in `layout.tsx`.

## Hero images

Stored in `public/hero/`:
- `connect-1.jpg` — two silhouettes under a tree at sunset (wide/panoramic; Unsplash, Harli Marten)
- `connect-2.jpg` — two hands holding, warm skin tones (detail/close-up; Unsplash, Nadin Mario)

`connect-1` is Texture 1 (default view); `connect-2` blends in as the cursor moves across the hero.

## Part 2 (not yet implemented)

`src/app/agendar/page.tsx` is a placeholder for the Supabase booking + Resend email flow. Do not implement until the user explicitly requests it.
