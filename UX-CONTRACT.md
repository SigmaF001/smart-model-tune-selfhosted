# UX Contract

## Product context

- Audience: authenticated TuneLab practitioners.
- Primary jobs: create and monitor fine-tuning work, inspect results, manage API access.
- Active locales: English and Thai.
- Accessibility target: WCAG 2.2 AA.

## Business-context sources

| Domain / scope | Authoritative source | Source type | Reviewed date |
|---|---|---|---|
| API lifecycle and schemas | `../slm-finetune-platform-dem/openapi.json` | API contract | 2026-09-28 |
| Authentication and ownership | `../slm-finetune-platform-dem/api/core/auth.py` | Server authorization | 2026-09-28 |
| Job reconnect behavior | `../slm-finetune-platform-dem/docs/adr/ADR-008-ws-progress-snapshot.md` | ADR | 2026-09-28 |

## Visual contract

- Project design context: `DESIGN.md`.
- Runtime token source: `src/index.css`, adapted through `tailwind.config.ts`.
- Supported themes: light and dark.

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Select/Listbox | `src/components/ui/select.tsx` | shared primitive | authored | keyboard + build |
| Form | shared Input/Button primitives | page validation | create | tests + build |
| Toast | `src/hooks/use-toast.ts` | shared provider | success/error | component behavior |
| CRUD confirmation | `components/engine/ConfirmDialog.tsx` | shared primitive | destructive | tests + build |

## Flow ledger

| Operation | Trigger | Pending | Success feedback | Failure recovery |
|---|---|---|---|---|
| Create API key | API-key form | Button disabled | Plaintext shown once, copy control | Inline Engine error |
| Revoke API key | Confirmation dialog | Confirm button busy | List invalidated | Dialog remains open |
| Rate template | Rating button | Rating buttons disabled | List invalidated | Existing value remains |
| Observe analytics/deployments | Route load | Spinner | Current Engine data | Inline Engine error |

## Async and resilience

- REST uses same-origin routes and attaches the refreshed Supabase bearer token.
- Self-host login uses the same Supabase project as the main frontend. MFA
  challenge is completed before showing protected routes.
- API connectivity and dependency readiness are independent states: failed
  `/ready` with successful `/health` is reported as unknown readiness.
- WebSocket uses the same origin and bearer subprotocol; REST snapshots remain the reconnect fallback.
- Create job APIs support idempotency headers. API key values stay in component memory only and are never persisted.

## Verification

- Static/project commands: `npm test`, `npm run lint:strict`, `npm run build`.
- Docker smoke check is deferred when the Docker daemon is unavailable.
