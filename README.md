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

## Pages
- `/` Home (featured + latest blogs/news)
- `/blogs`, `/blogs/:slug` (Portable Text, TOC, author, share)
- `/news`, `/news/:slug` (Portable Text, TOC, author, share)
- `/about` (founder card + rich content)
- `/contact` (gradient hero + FormSubmit form)

## Development Notes
- Client-only Sanity access via `@sanity/client` + GROQ
- Images via Sanity CDN helper `urlForImage`
- SEO per-page with `react-helmet-async`
