# BAVIS — AI / Computer Vision — Build Prompt

Share this together with `BAVIS_Team_Build_Guide.docx` (the full architecture document) in the same prompt/context. Read Sections 4 (Architecture), 6.1 (this workstream's spec) and 8 (Shared Contracts) before writing any code.

---

You are building the **AI / Computer Vision workstream** for BAVIS (Border AI Video Intelligence System), a hackathon project (SIH26187) that turns existing CCTV into an intelligent surveillance platform. This is the core intelligence of the project — nothing else in the system can fake what this workstream produces convincingly.

## Mission
Turn raw video frames into structured detections: who/what is in frame, where, and how confident — exposed as a callable service, not a notebook.

## What you're building
1. **Object detector** — person + vehicle classes, running on video frames.
2. **Multi-object tracker** — assigns stable `track_id`s to detections across frames (so the same person/vehicle keeps one ID as it moves).
3. **Face detection** — detection only, not recognition. Recognition is out of scope unless explicitly requested later, and would need its own authorization/governance layer.
4. **ANPR pipeline** — license plate region detection + OCR text extraction with a confidence score.
5. **Night / low-light movement analytics** — a mode or model variant that still detects motion/objects reliably in poor lighting.
6. **Inference server** — a thin FastAPI (or gRPC) wrapper around all of the above so it's callable by the Backend/Ingestion service over the network, not something someone has to run cell-by-cell.

## Tech stack
- Python, PyTorch or ONNX Runtime for inference.
- A YOLO-family detector (or equivalent) for person/vehicle detection — use a pretrained model to start; don't attempt custom training unless you have labeled data and time for it.
- ByteTrack or BoT-SORT for tracking (or an equivalent lightweight tracker — don't build a tracker from scratch).
- OpenCV for frame handling and preprocessing.
- OCR: Tesseract, PaddleOCR, or EasyOCR for the ANPR text step — pick whichever gives better accuracy on your test plates, don't commit to one blindly.

## Contract you must produce — this is what everything downstream depends on
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
Every detection your service returns — regardless of which sub-model produced it (person detector, face detector, ANPR) — must be expressible in this shape. ANPR-specific output (plate text, per-character confidence) can be added as extra fields, but don't remove or rename the core fields above — the Backend and Intelligence teammates are already coding against this exact contract.

## Build order (each step should produce something visibly working)
1. Get a pretrained detector running on a single local video file, printing detections to console. No server yet.
2. Wrap it in a minimal FastAPI endpoint: `POST /infer` accepts a frame (or frame reference) + `camera_id`, returns detections in the contract shape above. This is the point where Backend can start integrating with you.
3. Add the tracker on top of raw detections so `track_id` is stable across frames for the same object.
4. Add face detection as a second detection type through the same endpoint.
5. Add the ANPR pipeline as its own endpoint or detection type — test it against a handful of real plate images before wiring it to live video.
6. Add a night/low-light mode — can be a separate model, a preprocessing step (e.g. brightness/contrast normalization), or a confidence-threshold adjustment, whichever gets acceptable results on your test footage.
7. Load-test against multiple simulated camera feeds at once so you know your realistic FPS/throughput before the demo, not during it.

## Constraints
- Don't let this service touch the database directly — it returns detections over the API; storage is the Data/Backend team's job.
- Don't hardcode camera count or resolution — read frame dimensions from the incoming request.
- Log inference latency per frame so the team has real numbers for the "Evaluation Metrics" section of the submission (precision/recall if you have ground truth, otherwise at least FPS and latency).

## Definition of done
`POST /infer` reliably returns detections in the contract shape for a live or looped video feed, with stable tracking IDs, for at least 3 concurrent simulated cameras, including at least one low-light clip and one ANPR-suitable clip.

Ask me clarifying questions only if something above is genuinely ambiguous for your setup — otherwise start scaffolding at Step 1.
