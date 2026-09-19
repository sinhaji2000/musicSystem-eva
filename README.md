# Multi-Window Media Sequencer — Frontend

React (Vite) client for the media sequencer. Backend, API documentation and the sync explanation are in [`../ava-bharat/README.md`](../ava-bharat/README.md).

## Run locally

```bash
npm install
cp .env.example .env   # set VITE_API_URL if the backend isn't on localhost:8080
npm run dev
```

Open http://localhost:5173.

## Structure

| File | Role |
| --- | --- |
| `src/api.js` | Fetch wrapper for the backend API |
| `src/usePlaybackState.js` | Polls `/api/windows/state`, tracks server clock offset, ticks every 250ms |
| `src/playback.js` | Pure function: (window, server time, sync) → what to show now |
| `src/components/MediaWindow.jsx` | One window: screen, badge, playlist with remove buttons |
| `src/components/MediaView.jsx` | Image / video / blank / fallback rendering |
| `src/components/ControlPanel.jsx` | Sync, add-to-playlist, new media, new window forms |

## Deploy

Any static host works (Vercel, Netlify, Cloudflare Pages):

- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_URL=https://<your-backend>` (read at build time)

Then add the frontend's URL to the backend's `CORS_ALLOWED_ORIGINS`.
