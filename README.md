# Wavvy — Complete A–Z Guide (English)

This README replaces the previous summary with a complete, step-by-step guide so you can set up, develop, and deploy this app from A to Z. It covers prerequisites, environment variables, Supabase setup (database + storage), local development, deployment, security, and troubleshooting.

Important: this repository contains a `.env.local` file. Never commit real secrets to a public repository. Use the template below and keep secrets in your hosting provider's environment settings.

Quick checklist: Node.js (LTS), npm/pnpm/yarn, Git, Supabase project, (optional) Vercel account.

## 1) Prerequisites

- Node.js (LTS, e.g. 18+)
- npm, pnpm, or yarn
- Git
- Supabase account and project
- (Optional) Vercel account for deployment

## 2) Clone and install

1. Clone the repository and enter the folder:

```bash
git clone <your-repo-url>
cd wavvy
```

2. Install dependencies:

```bash
npm install
# or
# pnpm install
# yarn install
```

## 3) Environment variables (`.env.local` template)

Create a `.env.local` in the project root and populate the following values (replace placeholders with your real keys):

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-supabase-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=public-anon-key-placeholder
SUPABASE_SERVICE_ROLE_KEY=service-role-key-placeholder
GEMINI_API_KEY=your_gemini_or_google_api_key
RESEND_API_KEY=your_resend_api_key
ADMIN_EMAIL=you@example.com
RAPIDAPI_KEY=your_rapidapi_key
NEXT_PUBLIC_APP_URL=https://your-app-url.vercel.app
GROQ_API_KEY=your_groq_api_key
# Optional
GROQ_LYRICS_MODEL=llama-3.1-8b-instant
```

Notes:
- Any env starting with `NEXT_PUBLIC_` is exposed to the browser. Keep only public keys there.
- `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to the client. Keep it server-side only (API routes, server functions).

## 4) Supabase setup (Database + Storage)

1. Create a Supabase project.
2. Create the database tables. At minimum you should have:

- `profiles` (id, email, username, role)
- `songs` (id, title, artist_id, youtube_url, duration, artwork_url, mood, genre, play_count, ...)
- `artist_profiles` (id, name, image_url, ...)
- `recently_played` (id, profile_id, song_id, played_at)
- `liked_songs` (id, profile_id, song_id, created_at)
- `playlists` (id, profile_id, title, created_at)
- `playlist_songs` (id, playlist_id, song_id, position)
- `song_requests` (id, profile_id, youtube_url, note, status, admin_note, created_at)

3. Storage: create a public bucket for artist images or song artwork (e.g., `artist-images`) and set appropriate permissions/CORS so images load from your site.
4. Enable Email/Password auth in Supabase Auth.

If this repository includes `supabase/*.sql` migration files, run them in the Supabase SQL editor to create the schema.

## 5) Important files and project layout

- `app/` — Next.js app routes, pages, and layouts
- `app/api/` — server-side routes (e.g., `app/api/get-audio/route.ts`)
- `components/` — UI components and the player
- `lib/supabase.ts` — Supabase client initialization
- `store/musicStore.ts` — Zustand player store
- `public/` — static assets (images, loader JSON)
- `supabase/` — SQL files and DB helpers

Explore these files when customizing behavior or adding features.

## 6) Run locally

1. Ensure `.env.local` is populated.
2. Start the dev server:

```bash
npm run dev
# or
# pnpm dev
# yarn dev
```

3. Open `http://localhost:3000`.

## 7) Core features (how they are implemented)

- Authentication: handled via Supabase client in `lib/supabase.ts` and enforced in layouts under `app/auth`.
- Player state: stored in `store/musicStore.ts` (Zustand) for current song, queue, history, shuffle/repeat, progress, and volume (with localStorage hydration).
- API: server logic lives under `app/api/*/route.ts`. Example: `get-audio` fetches and serves audio data from a YouTube URL or other sources.
- Admin: `/admin` area is protected by role checks; admin pages allow creating/editing songs and approving requests.

## 8) Song request flow

- Users submit YouTube URLs from `dashboard/request` which creates a `song_requests` record.
- Admins review requests in `/admin` and can approve to move metadata into `songs` (oEmbed data can be used to autofill metadata).

## 8.1) Add Song (Admin) — Implementation Details

This section explains the end-to-end Add Song flow (UI → client → server → DB → storage), security, edge cases, and a sample server flow.

- User flow:
	- Admin opens the Add Song modal or page and fills fields: `title`, `artist` (select or new), `album` (optional), `youtube_url`, `genre`, `mood`, `duration` (optional), and `artwork` (upload or auto-fetch).
	- Client validates required fields, URL format (YouTube), and file types/sizes for artwork and shows immediate UI errors.

- Client → API:
	- Client sends a POST to a server endpoint (e.g. `POST /api/admin/songs`) using JSON or `multipart/form-data` for uploads.
	- Never send the service role key from the client.

- Server flow (detailed):
	1. Authenticate & authorize: verify the requester is an admin server-side (do not trust client-provided role flags).
	2. Validate input: required fields, sanitize text, parse YouTube video id.
	3. Metadata enrichment: optionally call YouTube oEmbed to fetch title, thumbnail, author, duration if missing.
	4. Storage (artwork):
		 - If the admin uploaded an image, upload to Supabase Storage server-side with the `SUPABASE_SERVICE_ROLE_KEY` into a public bucket (e.g., `artist-images`) and get a public URL.
		 - If using a remote thumbnail, fetch and save it to Storage server-side to ensure permanent availability.
	5. Database writes:
		 - Upsert artist into `artist_profiles` if new.
		 - Insert a `songs` row with `title`, `artist_id`, `youtube_url`, `artwork_url`, `genre`, `mood`, `duration`, `created_by`.
		 - Use service-role privileges server-side or a privileged function to bypass RLS for admin writes.
	6. Post-write actions: invalidate caches or revalidate Next.js pages, enqueue background jobs (waveform, thumbnail processing), and log the action.
	7. Response: return `201 Created` with the created song object (or minimal object and let client fetch details).

- Example DB columns (concise):
	- `artist_profiles`: `id (uuid)`, `name`, `image_url`, `created_at`
	- `songs`: `id (uuid)`, `title`, `artist_id`, `youtube_url`, `artwork_url`, `duration`, `genre`, `mood`, `play_count DEFAULT 0`, `created_by`, `created_at`

- Security & best practices:
	- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser. Keep it server-side and in environment variables.
	- Enforce RLS policies and server-side admin checks for privileged operations.
	- Validate and strictly whitelist `mood` and `genre` values.
	- Rate-limit the endpoint and keep audit logs for admin actions.

- Edge cases & error handling:
	- Duplicate detection: check existing YouTube id and return `409 Conflict` if already present.
	- YouTube video unavailable: allow manual override of metadata when enrichment fails.
	- Large artwork uploads: use signed upload URLs so the client uploads directly to Storage and server finalizes the DB insert.
	- Partial failure cleanup: if storage upload succeeds but DB insert fails, delete the uploaded object to avoid orphans.

- Server pseudocode (simplified TypeScript):

```ts
// server-side endpoint (simplified)
import { createServerSupabase } from './lib/supabase-admin'; // uses SERVICE_ROLE_KEY

export async function POST(req) {
	const supabaseAdmin = createServerSupabase(process.env.SUPABASE_SERVICE_ROLE_KEY);
	const adminUser = await verifyAdminSession(req); // server-side auth check

	const body = await req.json();
	validate(body);

	// enrich metadata
	const meta = await fetchYouTubeOembed(body.youtube_url).catch(() => null);

	// upload artwork if needed
	const artworkUrl = await uploadArtworkIfNeeded(supabaseAdmin, body.artwork);

	// insert song
	const { data, error } = await supabaseAdmin.from('songs').insert([{ 
		title: body.title || meta?.title,
		artist_id: body.artist_id,
		youtube_url: body.youtube_url,
		artwork_url: artworkUrl,
		duration: body.duration || meta?.duration,
		genre: body.genre,
		mood: body.mood,
		created_by: adminUser.id
	}]);

	if (error) return new Response(JSON.stringify({ error }), { status: 500 });
	return new Response(JSON.stringify(data[0]), { status: 201 });
}
```

- Client tips:
	- For large artwork files, implement a two-step upload: server returns a signed upload URL, client uploads directly to Storage, then server finalizes the DB insert using the Storage path.
	- After creation, refresh listing endpoints or invalidate caches (SWR/React Query) so the new song appears.

- Testing & observability:
	- Unit test server validation and YouTube id parsing.
	- Integration test flow against a test Supabase instance (upload artwork, insert song, verify DB and storage).
	- Log admin id, song id, and outcome; track metrics for adds/failures.

## 9) Deployment (Vercel) A–Z

1. Connect your Git repository to Vercel and create a new project.
2. Add the environment variables in the Vercel dashboard (do not commit them to Git).
3. Build command: `npm run build` (Next.js default settings apply).
4. Deploy and verify `NEXT_PUBLIC_APP_URL` and Open Graph images.

## 10) Security best practices

- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client code.
- Ensure `.env.local` is in `.gitignore`.
- Use Row-Level Security (RLS) policies in Supabase and restrict writes to server-side endpoints where appropriate.

## 11) Debugging tips

- Check browser network logs and Supabase logs if auth or DB calls fail.
- Inspect `app/api/get-audio/route.ts` for audio processing issues.
- Use `console.log` while developing but remove verbose logging in production.

## 12) Customization ideas

- Add new moods by updating `songs.mood` values and UI filters.
- Add playlist sharing by generating share tokens and public playlist endpoints.
- Integrate live streaming with WebRTC or a media server for broadcast features.

## 13) Contributing & workflow

- Create feature branches: `git checkout -b feat/your-feature`
- Run linting and formatting: `npm run lint`
- Open a pull request and use Vercel preview deployments for testing.

## 14) Useful resources

- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs

---

Would you like me to also:

1. Create a `.env.local.example` file you can fill in locally? (recommended)
2. Prepare a copyable set of Vercel environment variable values for the dashboard? (I can format them for easy paste)

Reply with `1`, `2`, or `1 and 2` and I'll add the files and configuration next.


