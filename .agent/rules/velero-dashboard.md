---
trigger: always_on
---

# Velero Dashboard - Frontend Rules

## Goal
Build a web UI that operates Velero backups/restores via the backend API only.
The frontend must NOT talk to Kubernetes directly.

## Directory & Ownership
- All frontend code lives under: /frontend
- Frontend is a separate deployable (its own Dockerfile, its own Kubernetes Deployment).
- Do not place backend code, k8s client code, or RBAC manifests inside /frontend.

## Tech & Style
- Prefer: React + TypeScript (or Next.js) for SPA UX.
- Keep UI minimal, operator-friendly:
  - Backups list (status/phase, started/completed time, warnings/errors counts)
  - "Create Backup" form + submit button
  - Restores list
  - "Create Restore" form + submit button

## API Contract (mandatory)
- Backend base URL must be configurable via env:
  - VITE_API_BASE_URL (or NEXT_PUBLIC_API_BASE_URL)
- All API calls go through a single module:
  - /frontend/src/api/client.ts (or equivalent)
- Must implement:
  - GET  /api/backups
  - POST /api/backups
  - GET  /api/restores
  - POST /api/restores
- Handle errors:
  - Show toast/banner with HTTP status + backend message
  - Do not silently fail

## Security
- Never embed kubeconfig, tokens, cluster URLs, or credentials in frontend.
- Do not add “admin shortcuts” that bypass backend authorization.

## Output Expectations
When asked to implement a feature:
1) Update UI component(s)
2) Update API client types/interfaces
3) Update minimal tests/linting if present
4) Provide clear run/build steps for /frontend only


# Velero Dashboard - Frontend Rules

## Goal
Build a web UI that operates Velero backups/restores via the backend API only.
The frontend must NOT talk to Kubernetes directly.

## Directory & Ownership
- All frontend code lives under: /frontend
- Frontend is a separate deployable (its own Dockerfile, its own Kubernetes Deployment).
- Do not place backend code, k8s client code, or RBAC manifests inside /frontend.

## Tech & Style
- Prefer: React + TypeScript (or Next.js) for SPA UX.
- Keep UI minimal, operator-friendly:
  - Backups list (status/phase, started/completed time, warnings/errors counts)
  - "Create Backup" form + submit button
  - Restores list
  - "Create Restore" form + submit button

## API Contract (mandatory)
- Backend base URL must be configurable via env:
  - VITE_API_BASE_URL (or NEXT_PUBLIC_API_BASE_URL)
- All API calls go through a single module:
  - /frontend/src/api/client.ts (or equivalent)
- Must implement:
  - GET  /api/backups
  - POST /api/backups
  - GET  /api/restores
  - POST /api/restores
- Handle errors:
  - Show toast/banner with HTTP status + backend message
  - Do not silently fail

## Security
- Never embed kubeconfig, tokens, cluster URLs, or credentials in frontend.
- Do not add “admin shortcuts” that bypass backend authorization.

## Output Expectations
When asked to implement a feature:
1) Update UI component(s)
2) Update API client types/interfaces
3) Update minimal tests/linting if present
4) Provide clear run/build steps for /frontend only
