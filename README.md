# Chesssaga

Static React site built with Vite, React Router, Tailwind CSS, and Sanity CMS (client-side GROQ). Designed for static hosting (e.g., Hostinger).

## Quick Start
- Prereqs: Node 18+, npm
- Install & run:
```powershell
npm install
npm run dev
```

## Configure Sanity
Create `.env`:
```ini
VITE_SANITY_PROJECT_ID=your_project_id
VITE_SANITY_DATASET=production

# Server-side (Vercel Functions)
SANITY_PROJECT_ID=your_project_id
SANITY_DATASET=production
SANITY_API_WRITE_TOKEN=your_sanity_token

RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_SECRET_KEY=your_razorpay_secret

R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_BUCKET_NAME=chess-saga-videos

VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_PASSWORD_SETUP_REDIRECT=https://your-domain.com/reset-password
SUPABASE_SITE_URL=https://your-domain.com

SANITY_API_VERSION=2024-06-01
```
Allow CORS origins in Sanity (localhost:5173 and your production domain).

## Build & Deploy
```powershell
npm run build
```
Upload `dist/` to your host. Ensure SPA fallback via `.htaccess`:
```
RewriteEngine On
RewriteRule ^ index.html [L]
```

## Large Video Uploads (R2 Worker)
Cloudflare dashboard uploads can be limiting for large video files. This repo now includes a dedicated Worker for authenticated R2 video management and multipart uploads:

- `workers/lecture-video-manager/`

Use this Worker to upload and manage lecture videos (including large files), then store the uploaded object key in Sanity `lecture.videoKey`.

Deployment and endpoint usage are documented in:

- `workers/lecture-video-manager/README.md`

## Pages
- `/` Home (featured + latest blogs/news)
- `/blogs`, `/blogs/:slug` (Portable Text, TOC, author, share)
- `/news`, `/news/:slug` (Portable Text, TOC, author, share)
- `/about` (founder card + rich content)
- `/programs` active program catalog
- `/trial` trial booking form (serverless lead capture)
- `/enroll` payment checkout with Razorpay
- `/dashboard` learner login + secure course playback
- `/reset-password` Supabase recovery/password setup
- `/contact` contact lead form (serverless lead capture)

## Development Notes
- Client-only Sanity access via `@sanity/client` + GROQ
- Images via Sanity CDN helper `urlForImage`
- SEO per-page with `react-helmet-async`
