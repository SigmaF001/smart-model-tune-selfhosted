# Self-host API audit and Ubuntu deployment — 5 October 2026

## Correction: isolated deployment

The initial deployment described below incorrectly replaced main's
`slm-frontend` on port 8082. This was corrected on 5 October 2026:

| Site | Container | Loopback port | Public URL |
| --- | --- | --- | --- |
| Main (restored original release) | `slm-frontend` | 8082 | https://life-crawling-giver.ngrok-free.dev/ |
| Self-host (separate image build) | `tunelab-selfhosted-frontend` | 8084 | https://corps-pos-shopping-cardiovascular.trycloudflare.com/ |

The corrected self-host Compose project is `tunelab-selfhosted-isolated`,
release directory is `/home/slmuser/tunelab-selfhosted/releases/20261005-isolated`,
and image is `tunelab-selfhosted:20261005-isolated`. It uses the already verified
browser build and packages it into a separate server image. Main was restored
using its original image/container, not rebuilt from the current local main
branch, which contains separate Keycloak migration work. The existing main
candidate on port 8083 remains unchanged.

The self-host public connector is `tunelab-selfhosted-public-tunnel`. Its Quick
Tunnel URL changes on restart. It connects to the self-host frontend, while
ngrok continues to connect only to main. The backend API and edge retained
their original IDs/start times and were not restarted.

The superseded release's `docker-compose.server.yml` was renamed on the server
to `docker-compose.server.yml.superseded` to prevent accidental reuse. The
incorrectly targeted self-host container remains stopped as
`tunelab-selfhosted-old-8082`, with automatic restart disabled. Current deployment
and rollback instructions in README operate only on the isolated project.

Post-correction public checks passed: both homepages and `/health` returned
200; both unauthenticated projects endpoints returned 401 JSON. Main serves
`index-D3imhJiy.js`; self-host serves `index-BSE3bdwA.js`, whose bytes match the
verified local build. Self-host `/ready` returned 200 with all five dependency
checks `ok`. Nginx and Compose configuration validation also passed.

## Quick Tunnel recovery — 6 October 2026

Cloudflare returned `Unauthorized: Tunnel not found` for both accountless Quick
Tunnel connectors. This was an expired Quick Tunnel registration, not a
frontend or backend error. Restarting only
`tunelab-selfhosted-public-tunnel` and `tunelab-edge-quick-tunnel` created fresh
connections and registered successfully.

Current temporary URLs:

- Self-host frontend: `https://needed-toxic-sleep-members.trycloudflare.com`
- Backend edge connector: `https://looked-ontario-rated-beautifully.trycloudflare.com`

Both `/health` endpoints returned HTTP 200 after recovery. These URLs can change
after a restart; read the latest URL from each container's logs. The ICMP proxy
and UDP receive-buffer warnings do not prevent HTTP/HTTPS proxying here.

The notes below are the historical initial deployment, not the current topology.

## Scope

Deployed the existing self-hosted frontend to the Ubuntu server behind
https://life-crawling-giver.ngrok-free.dev/ . No backend source, configuration,
authentication settings, or containers were changed or restarted.

The frontend already uses Supabase access tokens, same-origin `/api/v1/`
requests, and same-origin WebSocket URLs. Reviewed endpoint methods and paths
against backend routers and the running API's OpenAPI path list (50 paths).
No endpoint-path correction was required. Added a standalone server Compose
configuration and a Dockerfile that packages the verified browser bundle.

## Verified

- 39 tests in 14 test files passed.
- Strict ESLint, TypeScript checking, i18n checking, and production build passed.
- Server image built successfully from the transferred release artifact.
- Artifact SHA-256 matched before and after transfer:
  `f89fc43d4069b80a452c1eb21eb0136d73464dcb7bf50a2d1e23086b16045544`.
- Candidate container passed Nginx validation and health/readiness probes before
  replacing the live frontend.
- Public `/` and `/projects` returned 200 with HTML.
- Public JavaScript and CSS returned 200 and matched local build bytes.
- Public `/health` returned 200 with `status: ok`.
- Public `/ready` returned 200 with postgres, redis, minio, worker_gpu, and
  worker_cpu checks all `ok`. The new frontend proxies this path directly to
  `slm-api:8000`, bypassing the edge's unavailable readiness route.
- Unauthenticated `/api/v1/projects` returned 401 JSON.
- WebSocket upgrade without a token returned 403.
- `slm-api` and `slm-edge` retained their original IDs and start times
  (3 October 2026); only the frontend was replaced.

## Release and rollback

- Server directory: `/home/slmuser/tunelab-selfhosted/releases/20261005-1610`
- Image: `tunelab-selfhosted:20261005-1610`
- Active container: `slm-frontend`, loopback `8082:8080`
- Previous container: `slm-frontend-backup-20261005`, stopped and retained
- Existing ngrok configuration continues to target port 8082.
- Temporary candidate container was removed after verification.
- Rollback commands are in the repository README.

## Validation limits

Authenticated live API reads remain pending permission to use the test account
from `Data.txt`. Automatic approval review rejected this authentication check
because it sends credentials to Supabase and a token to the ngrok frontend;
the earlier explicit permission covered only WeTTY server access. No account
credentials or bearer tokens were sent by that rejected check.

No upload, training, inference, deletion, or authenticated job-progress flow was
run. Successful health/readiness and unauthenticated rejection do not establish
successful authenticated application flows.

The build reports a large JavaScript bundle and stale Browserslist metadata;
neither prevented the build. Docker reported disabled IPv4 forwarding on the
host, but the tested frontend-to-backend health/readiness requests succeeded.
