# BAVIS — Data, Storage & Event Schema — Build Prompt

Share this together with `BAVIS_Team_Build_Guide.docx` (the full architecture document) in the same prompt/context. Read Sections 4 (Architecture), 6.4 (this workstream's spec) and 9 (Data Model) before writing any code.

---

You are building the **Data / Storage workstream** for BAVIS (Border AI Video Intelligence System), a hackathon project (SIH26187) that turns existing CCTV into an intelligent surveillance platform. Every other workstream — Backend, AI/CV, Frontend, Intelligence — reads or writes through the schema you own, so treat it as the single source of truth, not just "the database for the backend."

**Before starting**, check the existing backend codebase: if migrations already exist there because the backend developer built the DB layer while building the API, your job is to **verify and extend** that schema against the reference below, not recreate it from scratch. If you find it already matches, say so and move straight to seed data.

## Mission
Own the data model, the database, and evidence storage so every workstream reads and writes the same shapes.

## What you're building
1. **PostgreSQL schema + migrations** for seven core tables: `Camera`, `Detection`, `Track`, `Alert`, `Evidence`, `Zone`, `AuditLog`.
2. **Evidence storage structure** — an S3-compatible bucket (or MinIO for local/demo use) layout for snapshots/clips, with retention metadata so old evidence can eventually be purged.
3. **Seed / fixture data script** — populates realistic-looking demo data so Frontend and Backend teammates can develop and demo without waiting on live cameras or a live AI pipeline.

## Data model — the reference everyone else is coding against
| Entity | Representative fields |
|---|---|
| Camera | camera_id, name, location_code, stream_url, status, configuration |
| Detection | frame_ts, camera_id, object_type, confidence, bbox, track_id |
| Track | track_id, camera_id, start_time, end_time, trajectory_summary, object_class |
| Alert | alert_id, event_id, severity, rule, status, created_at, acknowledged_by |
| Evidence | evidence_id, event_id, snapshot_ref, retention_metadata |
| Zone | zone_id, camera_id, geometry (polygon/line), rule_type, threshold |
| AuditLog | actor, action, object, timestamp, result, source |

Relevant relationships: Detection, Track, and Alert all reference `camera_id`; Evidence references `event_id`; Zone references `camera_id`. Don't rename or drop these fields without telling the team — Backend and Frontend are already coding against this shape.

## Build order
1. Check what already exists in the backend codebase — if migrations already cover most of this, extend rather than recreate. Report what you found before writing new migrations.
2. Write/verify migrations for all seven tables with correct types, primary keys, and foreign keys.
3. Stand up the evidence storage bucket (MinIO locally is fine for the demo) with a simple folder-per-camera or folder-per-event structure.
4. Write the seed script: 3–4 cameras, a realistic spread of detections/tracks across them, and alerts covering all three states (`new`, `acknowledged`, `resolved`) so the Frontend has something to render immediately without a live pipeline.
5. Add a simple reset command (e.g. `make seed` or a script) so the team can wipe and repopulate demo data on demand — useful right before a rehearsal or the actual demo.

## Constraints
- Use a migration tool (Alembic, Prisma, or whatever the backend already uses) rather than hand-editing the schema — the team needs to be able to reapply migrations on a clean database.
- Don't invent fields the team hasn't agreed on; if you think a field is missing from the reference table above, flag it rather than silently adding it.
- Keep evidence file references as paths/URLs in the database — don't store binary blobs in Postgres.

## Definition of done
Running the seed script against a fresh database gives the Frontend and Backend teammates enough realistic data to demo every screen — camera list, live-feed placeholders, alerts in all three states, a populated incident timeline — without any live camera or AI service running.

Ask me clarifying questions only if something above is genuinely ambiguous for your setup — otherwise start with Step 1.
