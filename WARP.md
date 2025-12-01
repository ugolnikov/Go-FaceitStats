# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands and environment

### Installation and environment
- Install dependencies:
  - `npm install`
- Local environment variables (required for any request to Faceit API):
  - Create `.env.local` in the project root with:
    - `FACEIT_API_KEY=your_faceit_api_key_here`

### Development server
- Start the Next.js dev server (App Router, TypeScript):
  - `npm run dev`
- The app runs on `http://localhost:3000` by default.

### Build and production
- Production build:
  - `npm run build`
- Start the production server (after `npm run build`):
  - `npm start`

### Linting and type safety
- Run ESLint via Next’s built‑in config:
  - `npm run lint`
- TypeScript is configured via `tsconfig.json` and enforced by Next’s build. There is no separate `npm run typecheck` script; type errors will surface during `npm run dev` / `npm run build`.

### Tests
- There are currently **no automated tests or test scripts** configured (no Jest/Vitest/Playwright config and no `test` npm script). If you add a test runner, update this section with the appropriate `npm test` / single‑test commands.

## High-level architecture

### Framework and routing
- This is a **Next.js App Router** application (see `app/` directory) using **TypeScript** and **Tailwind CSS**.
- Entry layout:
  - `app/layout.tsx` defines the root HTML shell, global styles (`app/globals.css`), Vercel analytics (`@vercel/analytics` and `@vercel/speed-insights`), and a top‑level `NextIntlClientProvider`.
- Localized segment:
  - `app/[locale]/layout.tsx` wraps all locale‑scoped pages with `NextIntlClientProvider` using messages loaded from the filesystem via `i18n/request.ts`.
  - Supported locales and default locale are defined in `i18n/routing.ts` and mirrored in `next-intl` middleware.

### Internationalization and middleware
- **next-intl** is the core i18n layer:
  - `i18n/routing.ts` uses `defineRouting` to declare locales (`en`, `ru`, `zh`, `es`, `de`), `defaultLocale: 'en'`, and `localePrefix: 'as-needed'` (root path may be unprefixed for the default locale).
  - `i18n/request.ts` implements `getRequestConfig`, resolving the effective locale (`requestLocale` validated against `routing.locales`) and loading the corresponding `messages/${locale}.json` bundle.
  - `i18n/navigation.ts` wraps Next’s navigation utilities (`Link`, `useRouter`, `usePathname`, etc.) in a locale‑aware API.
- **Middleware**:
  - `middleware.ts` wires `next-intl` middleware with the routing config and defines a matcher that applies locale handling to all non‑API, non‑asset paths.

### Page flows

#### 1. Search / home page
- File: `app/[locale]/page.tsx` (client component).
- Responsibilities:
  - Renders the main search UI (`SearchInput`) and the `LanguageSelector` dropdown.
  - Maintains search form state (`input`, `loading`, `error`).
  - On submit, calls `/api/faceit` via `fetch` with `{ input, matchesLimit: 1 }` to validate the player and obtain canonical player data.
  - Persists successful searches to local history via `addToHistory` from `lib/storage.ts`.
  - Navigates to the player page using the locale‑aware router from `i18n/navigation.ts` (`router.push('/player/${slug}')`).

#### 2. Player stats page
- File: `app/[locale]/player/[slug]/page.tsx` (client component).
- Responsibilities:
  - Reads `[slug]` and `[locale]` from route params.
  - Fetches full player stats from `/api/faceit` with `{ input: decodedSlug, matchesLimit }`.
  - Controls `matchesLimit` (10/20/30) for how many recent matches are aggregated.
  - Provides a secondary search bar (reusing `SearchInput`) to jump directly to another player; successful search again uses `/api/faceit`, updates history via `addToHistory`, and pushes to `/player/${newSlug}`.
  - Builds JSON‑LD structured data for SEO (based on player data and current URL) and passes it to the `StructuredData` component.

#### 3. Player layout and metadata
- File: `app/[locale]/player/[slug]/layout.tsx`.
- Responsibilities:
  - Implements `generateMetadata` using only the slug (no blocking data fetch) to keep rendering fast.
  - Sets page `<title>`, `<meta>` description and OpenGraph/Twitter metadata, as well as a canonical URL.

### API integration with Faceit
- Core API route: `app/api/faceit/route.ts`.
- HTTP client:
  - Uses a preconfigured `axiosInstance` with a 10‑second timeout and default JSON headers.
  - `getApiHeaders()` reads `FACEIT_API_KEY` from the environment and, if present, adds a `Bearer` Authorization header to all Faceit requests.
- Input handling:
  - Accepts JSON body `{ input: string, matchesLimit?: number }`.
  - Validates that `input` is a non‑empty string; otherwise returns HTTP 400.
- Steam and Faceit ID resolution:
  - `extractSteamId(input)` attempts to interpret the input as:
    - A raw SteamID64 (17‑digit number), or
    - A Steam profile URL on `steamcommunity.com` with the `/profiles/{id}` pattern.
  - If a Steam ID is found, `getPlayerIdBySteamId(steamId)` calls `GET /players?game=cs2&game_player_id={steamId}` on the Faceit Open API and returns `player_id`.
  - If there is no Steam ID, the route assumes the input is a Faceit nickname and calls `GET /players?nickname={nickname}`.
- Stats fetching:
  - `getPlayerStats(playerId, matchesLimit?)` performs parallel requests for:
    - `GET /players/{playerId}` (base profile and `games` info).
    - `GET /players/{playerId}/stats/cs2` (lifetime stats and segments).
  - For recent match stats (if `matchesLimit` is provided), it prefers `GET /players/{playerId}/games/cs2/stats?limit={matchesLimit}` and falls back to `GET /players/{playerId}/history?game=cs2&limit={matchesLimit}` on error.
  - It normalizes the Faceit profile URL: if `faceit_url` contains a `{lang}` placeholder, it is replaced with `en`; otherwise it falls back to `https://www.faceit.com/en/players/{nickname}`.
  - Returns a single aggregated JSON object with:
    - `player` (augmented with a normalized `faceit_url`),
    - `games` (notably `games.cs2`),
    - `lifetime` stats,
    - `segments` (often per‑map stats),
    - `recentMatchesStats` (array of recent match stats or `[]`).
- Error handling and caching:
  - Exposes `POST` only; there is no GET handler.
  - Distinguishes between:
    - 401 (missing/invalid `FACEIT_API_KEY`),
    - 404 (player not found by Steam ID or nickname),
    - 429 (Faceit rate limiting), and
    - generic failures (returns message from Faceit’s error payload when available).
  - Sets `export const dynamic = 'force-dynamic'` and `revalidate = 0` to disable static caching of API results.

### UI components and stateful utilities

#### Search and history
- `components/SearchInput.tsx`:
  - Client component that renders the main text input used on both the home and player pages.
  - Shows search suggestions from local history (`getSearchHistory()` from `lib/storage.ts`), filtered by current input and limited to the most recent 5 entries.
  - On suggestion click, updates the parent’s value and triggers `onSubmit(suggestion)`; uses small timeouts and click/blur coordination to avoid losing focus prematurely.
- `components/HistorySidebar.tsx`:
  - Optional UI for showing a fixed sidebar of search history items with a clear‑all button.
  - Uses `SearchHistoryItem` from `lib/storage.ts`; not currently wired into the main pages but ready for future use.
- `lib/storage.ts`:
  - Browser‑only helpers to persist:
    - `faceit_search_history` (recent searches, deduped and limited to 20 records),
    - `faceit_last_search` (last result + parameters, with a 24‑hour TTL),
    - `faceit_language` (preferred language code).
  - All methods guard against `window` being undefined for SSR and catch `localStorage` errors gracefully.

#### Stats display and thresholds
- `components/StatsDisplay.tsx`:
  - Central presentation component for a single player’s stats.
  - Consumes the aggregated data from `/api/faceit` and:
    - Renders player header (avatar, nickname, country flag derived from country code, Steam profile link if available).
    - Displays high‑level CS2 stats (ELO, level, region) with visual indicators.
    - Aggregates `recentMatchesStats` locally into KD, winrate, headshot %, ADR, average kills/deaths, and number of wins, with support for different key naming conventions in the Faceit payload.
    - Displays lifetime stats (`Matches`, `Wins`, `Win Rate %`, `Average K/D Ratio`, `Average Headshots %`, ADR variants) where present.
    - Splits `segments` into map‑related segments (Mirage, Dust, Inferno, etc.) and “other” segments, with an accordion UI for map details.
- `components/StatIndicator.tsx` and `lib/statsThresholds.ts`:
  - `statsThresholds.ts` defines numeric thresholds for what constitutes “good”, “average”, and “bad” for KD, headshot %, winrate, ELO, and ADR.
  - `StatIndicator` converts a numeric value plus type into a color and arrow (`↑`, `→`, `↓`) to visually indicate stat quality.
  - `formatStatValue` normalizes string/number values from the API into a numeric score that can be compared against thresholds.

#### Localization and language selection
- `components/LanguageSelector.tsx`:
  - Renders a `<select>` for supported languages with flag emojis.
  - Uses `useLocale`, `useRouter`, and `usePathname` from the `next-intl` navigation wrapper.
  - Calls `router.replace(pathname, { locale: newLocale })` to switch locales without changing the rest of the URL.

#### SEO helpers
- `components/StructuredData.tsx`:
  - Client‑side component that injects/upgrades a `<script type="application/ld+json" id="structured-data">` tag in `<head>` whenever the `data` prop changes.
  - Used by the player page to register `Person` schema with Faceit/Steam profile links.
- `app/sitemap.ts` and `app/robots.ts`:
  - Provide Next’s metadata routes for `/sitemap.xml` and `/robots.txt`, using **relative URLs**; Next injects the correct origin.

### Configuration and styling
- `next.config.js`:
  - Wraps the Next config with `next-intl` plugin (`withNextIntl('./i18n/request.ts')`).
  - Configures `images` to allow remote images from Faceit and Steam CDNs, with AVIF/WebP formats, custom sizes, and a TTL.
  - Enables compression, disables the `X-Powered-By` header, and turns off production browser source maps.
  - Uses `compiler.removeConsole` in production (except `console.error`/`console.warn`).
  - Defines custom HTTP headers for security and caching, including:
    - DNS prefetch, X‑Frame‑Options, X‑Content‑Type‑Options, Referrer‑Policy,
    - Caching for `/api` responses and `_next/static` assets.
- `tailwind.config.ts`:
  - Standard Tailwind config with dark mode via the `class` strategy, ShadCN‑style design tokens (`--background`, `--foreground`, etc.), and `tailwindcss-animate`.
- `lib/utils.ts`:
  - Exposes a `cn` helper that combines `clsx` and `tailwind-merge` for className merging.

## Notes for future Warp agents
- This codebase is relatively small; when making feature changes, follow the existing flow:
  - For any new user‑facing functionality, look first at the relevant page under `app/[locale]/…`, then at supporting components in `components/`, and any data/Faceit logic in `app/api/faceit/route.ts` or `lib/`.
  - For routing or locale issues, check `i18n/routing.ts`, `i18n/request.ts`, `i18n/navigation.ts`, and `middleware.ts` together—they define how locales are resolved and how URLs are constructed.
- If you introduce tests or additional build/lint/typecheck scripts, update the **Commands and environment** section accordingly so future agents know the canonical commands to run.