# BAVIS — DevOps, Security & Integration — Build Prompt

Share this together with `BAVIS_Team_Build_Guide.docx` (the full architecture document) in the same prompt/context. Read Sections 4 (Architecture), 6.6 (this workstream's spec) and 7 (Repository Structure) before writing any code.

---

You are building the **DevOps, Security & Integration workstream** for BAVIS (Border AI Video Intelligence System), a hackathon project (SIH26187) that turns existing CCTV into an intelligent surveillance platform. Every other workstream (AI/CV, Backend, Frontend, Data, Intelligence) is building its own piece — your job is to make sure all of it can actually run together as one system, stay reasonably secure, and be demoed reliably to judges without anyone typing five different startup commands.

**Before starting**, inventory what already exists: check each teammate's codebase for an existing `Dockerfile`, `.env.example`, or run instructions. Your job is to wire existing services together, not rebuild them.

## Mission
Turn five to six independently-built services into one system a judge can start with a single command.

## What you're building
1. **`docker-compose` stack** — brings up ingestion, AI/CV inference service, backend API, frontend, database, and evidence storage together, with correct networking between them.
2. **TLS / secrets management** — HTTPS where practical for the demo, and all secrets (DB passwords, JWT signing keys, API keys) in environment variables or a `.env` file that's never committed.
3. **RBAC enforcement check** — verify the backend's role-based access control actually works end-to-end, not just that it exists in code (i.e. confirm an operator really can't hit an admin-only endpoint).
4. **Audit logging pipeline** — confirm sensitive actions (login, zone changes, alert acknowledgement) are actually being logged somewhere retrievable, not just designed to be.
5. **CI** — lint + test on push, and build images for each service (GitHub Actions is fine for a hackathon).
6. **Basic observability** — request/inference latency, FPS, and error-rate visibility (Prometheus/Grafana if there's time; even structured logs with clear latency fields are enough for a hackathon demo if not).

## Tech stack
- Docker & docker-compose.
- TLS termination via a reverse proxy (e.g. Caddy or nginx) if you have time; self-signed certs are fine for a demo.
- `.env` files for secrets, never committed — add `.env` to `.gitignore` if it isn't already.
- GitHub Actions for CI.
- Prometheus/Grafana, or fall back to structured logging with latency/error fields if time is short — don't let observability tooling eat time better spent on reliability.

## Network / service map you're wiring together
| Service | Talks to |
|---|---|
| Ingestion (Backend-owned) | AI/CV inference service (sends frames), Database |
| AI/CV inference service | Called by Ingestion/Backend |
| Intelligence engine | Reads detections + zone config, writes alerts, may be its own service or a module inside Backend |
| Backend API | Database, Redis/queue, Frontend (via REST/WebSocket), Evidence storage |
| Frontend | Backend API only |
| Database (Postgres) | Backend, Data/Intelligence |
| Evidence storage (S3/MinIO) | Backend, Data |

## Build order (each step should produce something visibly working)
1. Get a minimal `docker-compose.yml` running just the database and backend, confirm the backend can connect to Postgres inside Docker (this catches most "works on my machine" networking issues early).
2. Add the frontend service, confirm it can reach the backend's API across the Docker network (not `localhost` — use service names).
3. Add the AI/CV inference service, confirm the backend/ingestion can reach it.
4. Add the intelligence engine (as its own service or folded into an existing one, per what that teammate actually built).
5. Add evidence storage (MinIO) and confirm the backend can write/read from it.
6. Wire environment variables for every service through `.env`, remove any hardcoded credentials or URLs you find along the way.
7. Add a reverse proxy with TLS in front of the frontend/backend if time allows.
8. Set up CI: lint + test on push for each service that has tests; build (not necessarily push) Docker images to confirm they build cleanly.
9. Add basic observability: at minimum, structured logs with latency fields on the ingestion→AI/CV→intelligence→alert path, since "alert latency" is a metric the team wants for the submission.
10. Do a full clean-machine test: delete all containers/volumes, run `docker-compose up` from scratch, confirm the whole demo scenario works with zero manual steps beyond that one command.

## Constraints
- Don't refactor other teammates' application code to fit your infrastructure — adapt the infrastructure to what they built (add a `Dockerfile` for a service that's missing one, rather than restructuring their app).
- Every secret must come from an environment variable — if you find a hardcoded credential while wiring things up, flag it and fix it, don't leave it for later.
- Keep the `docker-compose.yml` at the repo root, matching the structure in `BAVIS_Team_Build_Guide.docx` Section 7, so it matches what the team already expects.

## Definition of done
A judge (or teammate) can clone the repo on a clean machine, copy `.env.example` to `.env`, run `docker-compose up`, and within a few minutes have the full demo scenario (Section 11 of the main doc) working end to end — with no manual steps, no hardcoded secrets in the repo, and role-based access actually enforced.

Ask me clarifying questions only if something above is genuinely ambiguous for your setup — otherwise start at Step 1.
