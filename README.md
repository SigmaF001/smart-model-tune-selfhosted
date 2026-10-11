# TuneLab self-hosted frontend

This frontend authenticates with Keycloak. Keycloak stores account and realm
data in its own PostgreSQL database; application data remains in the Engine's
PostgreSQL database and is accessed through the existing backend API. The
browser sends a Keycloak access token through same-origin `/api/v1/*` and
`/ws/*` routes.

## Configuration

Copy `.env.example` to `.env` for a new checkout. Set distinct strong values
for `AUTH_DB_PASSWORD` and `KEYCLOAK_ADMIN_PASSWORD`. These are server-side
secrets; never put them in a `VITE_*` variable. Keep an existing `.env` and
database volumes intact.

The backend must trust this Keycloak realm's issuer and audience before it will
accept these tokens. This frontend change does not update backend settings or
link Keycloak subjects to existing Engine owner IDs. Until the backend
operator completes that configuration and links verified existing users,
Keycloak login can succeed while protected Engine API calls return 401. The
PostgreSQL database here contains Keycloak accounts only; it is separate from
the Engine business database. A new volume starts with no Supabase users or
earlier MySQL Keycloak accounts. Recreate or migrate those accounts separately,
then have the backend operator link each verified identity to its existing
Engine owner ID before users expect to see their old projects.

## Cloudflare Tunnel to the backend

The Ubuntu connector `tunelab-edge-quick-tunnel` must point to backend edge
`http://127.0.0.1:8088` with origin Host `edge`. Read its latest
`https://...trycloudflare.com` hostname from the connector logs on Ubuntu.
Quick Tunnel hostnames change on restart. Supply the hostname without
`https://` or a path:

```sh
TUNNEL_HOSTNAME=<current-host>.trycloudflare.com \
  docker compose -f docker-compose.yml -f docker-compose.quick-tunnel.yml up -d --build frontend
```

The frontend listens on `http://localhost:5173` by default. Test in order:

```sh
curl -f https://<current-host>.trycloudflare.com/health
curl -f http://localhost:5173/health
```

Both should return `{"status":"ok"}`. Then sign in with a Keycloak account and
confirm `/api/v1/projects` returns JSON after the backend trusts this issuer. The backend
edge does not expose `/ready`; the UI reports unknown dependency readiness
when `/health` works. WebSocket progress uses the same origin and bearer
subprotocol. Chat uses non-streaming inference, which works with Quick Tunnel.
For a stable public hostname, use a Cloudflare Named Tunnel.

## Account pages

Login, registration, password recovery and MFA challenges use Keycloak's
hosted account pages. Password recovery requires SMTP to be configured in
Keycloak. Users manage password and authenticator settings in the Keycloak
account portal.

## PostgreSQL account stack

The regular Compose stack starts PostgreSQL and Keycloak with the frontend.
The PostgreSQL volume persists accounts and realm data. This configuration
does not migrate an earlier MySQL-backed Keycloak database; preserve its volume
and plan that account migration separately before replacing an existing store.
Password recovery requires SMTP and enabling **Forgot password** in Keycloak's
realm login settings.

## Ubuntu server release

For the existing Ubuntu host, use `docker-compose.server.yml` as a standalone
Compose file, with `AUTH_DB_PASSWORD`, `KEYCLOAK_ADMIN_PASSWORD`,
`AUTH_PUBLIC_URL`, and `FRONTEND_ORIGIN` set privately in the server environment.
Use a stable HTTPS `AUTH_PUBLIC_URL` ending in `/auth`; do not initialize a
production realm with a rotating Quick Tunnel URL. Its project is
`tunelab-selfhosted-isolated`, container is
`tunelab-selfhosted-frontend`, and loopback port is **8084**. Main frontend
retains `slm-frontend` on **8082** and the existing ngrok URL. Self-host
joins `slm-platform_slm-net`, hosts Keycloak and its private PostgreSQL, and
proxies to `slm-edge:80` and `slm-api:8000`. Backend configuration remains a
separate operator action before authenticated API calls can work. Unlike the
remote Quick Tunnel setup, `/ready` can reach the API directly.

Build the browser bundle with the frontend's public OIDC settings, then transfer
`dist/`, the Nginx template, release Dockerfile, `docker/keycloak/` realm import
and Compose file to a new Ubuntu release directory. Set runtime credentials in
a private server environment file with mode `600`; never copy the development
`.env`. Import of the realm occurs at first startup, so choose the permanent
HTTPS URL before starting it. Build and start all required services:

```sh
RELEASE_TAG=<release-id> docker compose --env-file .env.production -f docker-compose.server.yml build frontend
RELEASE_TAG=<release-id> docker compose --env-file .env.production -f docker-compose.server.yml up -d --no-build
```

For a separate public test URL, start the optional frontend tunnel:

```sh
RELEASE_TAG=<release-id> docker compose --env-file .env.production -f docker-compose.server.yml --profile public up -d --no-build
docker logs --tail 80 tunelab-selfhosted-public-tunnel
```

Read the `trycloudflare.com` URL from this frontend tunnel's logs. It changes on
restart. Use it for temporary frontend checks only; Keycloak needs a stable
issuer URL for production and the backend must be configured to trust that exact
issuer before API login can work.

Never stop, rename, or replace `slm-frontend` to deploy self-host. Do not change
the existing ngrok target. Keep the preceding self-host image and release
directory until validation is done.

The corrected 5 October 2026 release is at
`/home/slmuser/tunelab-selfhosted/releases/20261005-isolated`, with image
`tunelab-selfhosted:20261005-isolated`. The earlier `20261005-1610` release
incorrectly targeted main's container and is superseded. Main was restored from
its original container. To roll back a future self-host update, select the
previous isolated release tag from the isolated release directory:

```sh
RELEASE_TAG=<previous-isolated-tag> docker compose -f docker-compose.server.yml up -d --no-build --no-deps frontend
```

## Local verification

```sh
npm ci
npm test
npm run lint:strict
npx tsc --noEmit -p tsconfig.app.json
npm run build
```
