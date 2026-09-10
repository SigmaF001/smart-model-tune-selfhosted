# TuneLab Self-hosted Frontend

React/Vite frontend for the TuneLab self-hosted stack. Authentication is provided by the Keycloak service in the backend Docker Compose stack; no Lovable or Supabase runtime is required.

## Development

```sh
cp .env.example .env
npm ci
npm run dev
```

The Vite development server proxies `/api/v1`, `/ws`, `/health` and `/ready` to `VITE_ENGINE_PROXY_TARGET`.

## Production

Keep this repository next to `slm-finetune-platform-dem`, then run from the backend repository:

```sh
docker compose up -d --build
```

The edge proxy serves this frontend, routes `/auth/` to Keycloak, and keeps the API, WebSocket, and object-storage routes on the existing self-hosted stack.

Required private values such as database passwords, Keycloak admin credentials, SMTP credentials, and Google OAuth credentials belong in the backend `.env`, never in this repository.
