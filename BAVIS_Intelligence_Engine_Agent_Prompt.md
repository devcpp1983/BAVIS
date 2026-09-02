# BAVIS — Intelligence / Event & Risk Engine — Build Prompt

Share this together with `BAVIS_Team_Build_Guide.docx` (the full architecture document) in the same prompt/context. Read Sections 4 (Architecture), 6.5 (this workstream's spec) and 8 (Shared Contracts) before writing any code.

---

You are building the **Intelligence / Event & Risk Engine workstream** for BAVIS (Border AI Video Intelligence System), a hackathon project (SIH26187) that turns existing CCTV into an intelligent surveillance platform. You sit between the AI/CV team's raw detections and the Backend's alert service — your job is to decide which detections actually matter and how urgently.

## Mission
Turn a stream of raw detections into a small number of explainable, prioritized security events. Without this workstream, the system just shows bounding boxes with no way to tell an operator what's actually worth their attention.

## What you're building
1. **Virtual fence / zone-crossing rule evaluator** — given a zone's geometry (line or polygon, in camera-frame coordinates) and a track's trajectory over time, determine whether the track crossed the line or entered the polygon.
2. **Temporal rules** — dwell-time detection (something/someone stationary in a zone longer than a threshold), sustained-movement patterns, and unusual-time-window detection (e.g. movement flagged as more significant between certain hours).
3. **Event correlator** — combine multiple weak signals into one higher-confidence event instead of firing a separate alert for every individual detection (e.g. "person" + "inside restricted zone" + "outside normal hours" → one correlated event, not three).
4. **Risk scoring** — assign a severity (`low | medium | high`) to each event so the dashboard can sort by what matters instead of showing a flat list.

## Tech stack
- Python — this can sit as its own service, or as a module inside the AI/CV or Backend service if that's simpler for your team's setup; confirm with the team before deciding.
- No heavyweight "rules engine" framework needed — a straightforward rule-evaluation module is enough for the hackathon scope. Don't over-engineer this into a generic DSL.
- PostgreSQL for reading zone configuration and writing out events/alerts (reuse the Data workstream's schema — don't create a second database).

## Contracts

**Input — Detection events you consume** (from AI/CV, possibly relayed through Backend):
```json
{
  "camera_id": "string",
  "frame_ts": "ISO-8601 timestamp",
  "object_type": "person | vehicle | face",
  "confidence": 0.0,
  "bbox": [x1, y1, x2, y2],
  "track_id": "string"
}
```

**Input — Zone configuration you read** (created via the Frontend's zone editor, stored by Backend/Data):
- `zone_id`, `camera_id`, geometry (polygon or line, in camera-frame coordinates), `rule_type`, `threshold`

**Output — Alert/Event you produce** (consumed by Backend's alert service, then Frontend):
```json
{
  "alert_id": "string",
  "event_id": "string",
  "severity": "low | medium | high",
  "rule": "string (e.g. virtual_fence_breach)",
  "status": "new | acknowledged | resolved",
  "created_at": "ISO-8601 timestamp",
  "acknowledged_by": "user_id | null",
  "evidence_ref": "string | null"
}
```
Do not rename or drop these fields — Backend and Frontend are already coding against this exact shape. Extra fields (e.g. the raw score behind the severity, which rule(s) contributed) are fine to add.

## Build order (each step should produce something visibly working)
1. Build the zone-crossing evaluator first, standalone: given a hardcoded zone polygon and a hardcoded sequence of track positions, correctly detect a crossing. Test this with unit tests before wiring in real data — geometry bugs are easy to miss visually.
2. Wire it to consume real (or AI/CV team's mocked) detection events and real zone configs from the database.
3. Add dwell-time detection: track how long a given `track_id` stays inside a zone, fire when it exceeds a threshold.
4. Add the unusual-time-window rule: same detection logic, but severity/threshold shifts based on time of day.
5. Add the event correlator: when multiple rules fire for overlapping tracks/time windows, merge them into a single event with a combined reason instead of separate alerts.
6. Add risk scoring: a simple weighted function (e.g. zone sensitivity + rule type + time-of-day + confidence) that maps to `low | medium | high`. Keep the scoring logic readable and explainable — a judge will ask "why is this high severity," and "because of X, Y, Z" is a much better answer than a black-box number.
7. Write the resulting alert to the database / push to the Backend's alert service, matching the contract exactly.

## Constraints
- Don't fire an alert per raw detection — always reason over a track's behavior across multiple frames before deciding an event is real. Single-frame triggers cause false-positive floods.
- Keep rule logic and risk-scoring weights in config (not hardcoded numbers scattered through the code) so they can be tuned without a redeploy — the team will want to adjust sensitivity during rehearsal.
- Don't talk to the Frontend directly — you only produce events for the Backend's alert service to distribute.

## Definition of done
Feeding the engine a track that enters a configured restricted zone during an "unusual hours" window produces exactly one correlated alert, with a severity that's explainable in one sentence, delivered to the Backend in the exact contract shape above — and it does not fire duplicate alerts for the same ongoing event.

Ask me clarifying questions only if something above is genuinely ambiguous for your setup — otherwise start at Step 1.
