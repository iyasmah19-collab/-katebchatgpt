# Kateb deployment

## Frontend — Vercel
Set the Vercel project Root Directory to `frontend`.
Build command: `npm run build`
Output directory: `build`
Environment variable:
`REACT_APP_BACKEND_URL=https://YOUR-BACKEND-DOMAIN`

The `frontend/vercel.json` file contains the SPA fallback so React Router routes work on refresh.

## Backend — Render or Docker host
The backend is a FastAPI app. `render.yaml` and `backend/Dockerfile` are included.

Required secrets:
- MONGO_URL
- JWT_SECRET
- OPENAI_API_KEY
- STRIPE_API_KEY
- STRIPE_WEBHOOK_SECRET
- OWNER_ACCESS_TOKEN

OAuth integrations require their provider credentials if those features are enabled. Configure Google/Meta/TikTok/YouTube credentials exactly as used by the relevant endpoints.

## Storage
For production, configure an S3-compatible bucket. Local filesystem storage is only a development fallback and should not be relied on for persistent uploads on ephemeral hosts.

## Domain
After the frontend is deployed, add `kateb.work.gd` to the Vercel project and use the DNS records Vercel provides. Do not copy an old SSL certificate or private key from the Emergent deployment.

## Security
Never commit `.env`, API keys, OAuth client secrets, Stripe secrets, or private keys. Rotate any credential that was previously exposed in chat or screenshots.
