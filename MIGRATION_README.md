# Kateb — standalone migration

The source has been detached from the Emergent runtime at code level.

## Backend
- FastAPI + MongoDB remain.
- LLM calls now use `OPENAI_API_KEY` directly.
- Video virality analysis sends extracted frames directly to OpenAI vision.
- Stripe uses the official `stripe` Python SDK directly.
- Avatar/object storage uses S3-compatible storage when configured, with local disk as a development fallback.
- Google OAuth remains a direct backend flow.

## Frontend
- Emergent visual-edit dependency and CRACO wrapper were removed.
- `REACT_APP_BACKEND_URL` controls the API origin.

## Required deployment secrets
Copy `backend/.env.example` to your hosting provider's environment settings and fill in real values.
Copy `frontend/.env.example` and set the public backend URL.

## Important
No API keys are included in this archive. You must provide your own OpenAI, MongoDB, Google OAuth, Stripe, and (if used) Meta/TikTok/YouTube credentials.

For production, configure S3-compatible storage rather than relying on local disk, because many free hosts use ephemeral filesystems.
