# BAVIS — Frontend UI/UX Redesign & Command-Centre Design Specification

## 1. Purpose

This document defines the **visual redesign, information architecture, layout system, interaction model, and UX direction** for the existing BAVIS frontend.

BAVIS (Border AI Video Intelligence System) is an AI-powered border surveillance platform that turns existing IP CCTV infrastructure into an intelligent operational surveillance network.

The current frontend functionality is already implemented and working. **This redesign must improve the UI/UX without breaking the existing functionality, API contracts, routing, authentication, WebSocket behavior, mock data, or backend integration.**

The target is not a normal SaaS dashboard and not a generic CCTV monitoring screen.

The target is:

> **A modern Indian defence-inspired Command & Control / Intelligence, Surveillance & Reconnaissance (C2/ISR) operator interface.**

The interface should feel like a system used in a professional border command centre: operational, dense but readable, information-first, calm under pressure, precise, trustworthy, and mission-oriented.

---

# 2. Core Design Philosophy

## 2.1 BAVIS is a C2 system, not a SaaS dashboard

Avoid the visual language of:

- fintech dashboards
- analytics SaaS
- admin panels
- generic cybersecurity dashboards
- social-media-style cards
- oversized rounded cards
- excessive gradients
- colorful marketing UI
- excessive glassmorphism
- decorative charts with little operational value

Instead, design around:

- Common Operational Picture
- situational awareness
- threat prioritization
- live surveillance
- event intelligence
- evidence
- camera health
- operational status
- fast decision making
- command hierarchy
- traceability

The interface should answer, within seconds:

1. **What is happening?**
2. **Where is it happening?**
3. **How serious is it?**
4. **Which camera detected it?**
5. **What evidence exists?**
6. **What should the operator investigate or acknowledge?**
7. **Is the surveillance system itself healthy?**

---

# 3. Design References & Inspiration

Use the following concepts as inspiration, not as direct visual copies.

## Indian / Border Context

### CIBMS — Comprehensive Integrated Border Management System

The Indian Ministry of Home Affairs describes CIBMS as integration of manpower, sensors, networks, intelligence and command-and-control solutions to improve situational awareness and facilitate rapid response.

This is the correct conceptual direction for BAVIS:

**Sensors → Intelligence → Situational Awareness → Decision → Response**

BAVIS should visually communicate the same principle, but with its own identity and scope.

### BOLD-QIT / Smart Border Surveillance

The border-security context suggests an interface where multiple surveillance inputs are fused into an operational picture rather than presented as isolated camera feeds.

### Indian Command / Defence Systems

Look for visual inspiration from modern Indian defence C2, surveillance, command-centre, VMS and situational-awareness products.

The design should feel:

- indigenous
- mission-critical
- operational
- sovereign
- technical
- restrained
- high reliability

Do not turn the UI into a stereotypical "military HUD."

---

# 4. Primary UX Principle

## Observe → Detect → Track → Correlate → Verify → Respond → Investigate

The UI should mirror the BAVIS intelligence pipeline.

### Observe

Live cameras and operational status.

### Detect

AI detections appear directly over video.

### Track

Objects receive tracking IDs and persistent visual identity.

### Correlate

Related events, cameras, timestamps and detections are connected.

### Verify

The operator can inspect evidence.

### Respond

The operator acknowledges/resolves the alert.

### Investigate

Historical events can be searched and reconstructed.

The UI should make this workflow feel natural rather than forcing the operator to navigate through unrelated pages.

---

# 5. Overall Application Shell

The application should use a **persistent command-centre shell**.

Recommended structure:

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ BAVIS | BORDER INTELLIGENCE SYSTEM       SYSTEM STATUS   USER   TIME        │
├────────────┬─────────────────────────────────────────────────────────────────┤
│            │                                                                 │
│            │                    PRIMARY OPERATIONAL AREA                     │
│            │                                                                 │
│ NAVIGATION │                                                                 │
│            │                                                                 │
│            │                                                                 │
├────────────┴─────────────────────────────────────────────────────────────────┤
│ EVENT / ALERT / SYSTEM STATUS STRIP                                         │
└──────────────────────────────────────────────────────────────────────────────┘
```

The shell should remain visually stable while the main operational content changes.

---

# 6. Navigation Philosophy

Do not use a large conventional sidebar with oversized icons and text.

Use a compact **Command Rail**.

Recommended navigation:

```text
COMMAND
├── Overview
├── Live Surveillance
├── Incidents
├── Events
├── Cameras
├── Zones
└── System Health

INTELLIGENCE
├── Search
├── Evidence
└── Analytics

ADMINISTRATION
├── Operators
├── Cameras
└── Configuration
```

Role permissions must continue to control what is visible and actionable.

---

# 7. Command Rail

The left rail should be narrow.

Example:

```text
┌──────┐
│ B    │
│      │
│ ◉    │ Overview
│ ◫    │ Surveillance
│ !    │ Incidents
│ ◌    │ Events
│ ▣    │ Cameras
│ ⬡    │ Zones
│ ≋    │ Health
│      │
│ ⚙    │ Settings
│ 👤   │ Operator
└──────┘
```

Requirements:

- compact
- high contrast
- clear active state
- tooltip on hover
- keyboard accessible
- no unnecessary animation
- active state should feel operational rather than decorative

---

# 8. Top Command Bar

The top bar should communicate system identity and operational state.

Suggested content:

```text
BAVIS
BORDER AI VIDEO INTELLIGENCE SYSTEM

● SYSTEM NOMINAL
│
CAMERAS  24/28
ALERTS   03
TRACKS   17
UPTIME   99.98%

SECTOR ALPHA
02 SEP 2026
15:42:08 IST

OPERATOR
```

Important information should always be visible.

Do not waste the top bar on:

- large search boxes
- marketing slogans
- decorative profile cards
- unnecessary breadcrumbs

---

# 9. Visual Language

## 9.1 Base theme

Use a dark operational theme.

Preferred foundation:

- near-black blue
- deep navy
- charcoal
- muted slate
- desaturated military green
- subtle steel/blue-gray

Avoid pure black everywhere.

Example conceptual palette:

```text
Background       #080D12
Panel            #0D141B
Panel Elevated   #111A22
Border           #26323C
Primary Text     #E6EDF2
Secondary Text   #8795A1
Muted Text       #56636D

Operational Green
Warning Amber
Critical Red
Informational Blue
```

Do not use these exact values blindly. Adapt them to the existing application theme.

---

# 10. Operational Color Semantics

Color must have meaning.

Use a strict semantic system:

### Green

- system healthy
- online
- verified
- resolved
- normal

### Amber

- warning
- degraded
- medium priority
- attention required

### Red

- critical alert
- intrusion
- high-priority threat
- camera failure requiring action

### Blue

- information
- navigation
- selected object
- analytical state

### White / Neutral

- primary information
- labels
- metadata

Do not use red/yellow/green simply for decoration.

In defence-oriented interfaces, these colors carry operational meaning.

---

# 11. Typography

Use a professional technical typeface.

Recommended:

- Inter
- IBM Plex Sans
- Geist
- Manrope for selected headings

Optional technical/numeric font:

- IBM Plex Mono
- JetBrains Mono

Use monospace selectively for:

- timestamps
- camera IDs
- event IDs
- coordinates
- confidence values
- system telemetry

Avoid using monospace for the entire UI.

---

# 12. Shape Language

The interface should use **controlled geometry**.

Avoid:

- giant 24–32px rounded cards
- pill-shaped everything
- excessive circles
- bubbly buttons

Prefer:

- 4–8px radius
- thin borders
- sharp panel divisions
- compact controls
- subtle corner treatments
- small status indicators

The interface should feel engineered.

---

# 13. Surface Treatment

Use layers rather than floating cards everywhere.

Example:

```text
BACKGROUND
   ↓
OPERATIONAL GRID
   ↓
PRIMARY PANEL
   ↓
DETAIL PANEL
   ↓
ACTIVE ALERT
```

Panels should feel like parts of one command console.

Use:

- subtle borders
- slight elevation
- low-opacity backgrounds
- restrained shadows
- occasional inner highlights

Do not turn the entire application into glassmorphism.

---

# 14. Main Overview — Common Operational Picture

This should be the most important screen.

The overview should not be just a collection of cards.

It should present a **Common Operational Picture (COP)**.

Recommended layout:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ COMMAND STATUS / SECTOR / TIME / SYSTEM HEALTH                              │
├────────────┬───────────────────────────────────────────────┬────────────────┤
│            │                                               │                │
│ ACTIVE     │                                               │ PRIORITY       │
│ INCIDENTS  │              OPERATIONAL MAP                 │ ALERTS         │
│            │                                               │                │
│            │          cameras / zones / events             │                │
│            │                                               │                │
├────────────┴───────────────────────────────────────────────┤                │
│                                                             │                │
│                 LIVE SURVEILLANCE STRIP                     │                │
│                                                             │                │
├─────────────────────────────────────────────────────────────┴────────────────┤
│ EVENT TIMELINE / SYSTEM ACTIVITY                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

If the current backend does not provide GPS/map data, do not invent a real geographic system.

Instead, create a **camera-sector operational map / schematic** or use a clearly simulated tactical map for the demo.

---

# 15. Operational Map

The map is the visual centre of the command experience.

It should display:

- camera positions
- camera status
- restricted zones
- virtual fences
- active incidents
- tracked objects where applicable
- selected camera
- sector boundaries
- event markers
- alert locations

Use subtle gridlines and terrain/satellite styling.

Avoid making the map visually dominant to the point that it becomes difficult to read.

---

# 16. Camera Surveillance View

The camera grid should be redesigned as an operational surveillance wall.

Instead of:

```text
[ Camera Card ]
[ Camera Card ]
[ Camera Card ]
```

Use:

```text
┌──────────────────────┐
│ CAM-07 ● LIVE        │
│ SECTOR ALPHA         │
│                      │
│     VIDEO            │
│   + detection box    │
│   + track ID         │
│                      │
│ P:02 V:01            │
│ AI 94%    15:41:09   │
└──────────────────────┘
```

Every camera tile should expose:

- camera ID
- sector/location
- live/offline state
- timestamp
- object counts
- detection state
- tracking IDs when relevant
- recording state if available
- alert indicator
- connection health

Do not overload the tile with every possible field.

Use progressive disclosure.

---

# 17. Video Overlay Design

Bounding boxes should feel like professional computer vision instrumentation.

Example:

```text
┌───────────────────────────────┐
│                               │
│     ┌──────────────┐          │
│     │ PERSON       │          │
│     │ ID: P-014    │          │
│     │ 96%          │          │
│     └──────────────┘          │
│                               │
└───────────────────────────────┘
```

Use:

- thin bounding boxes
- compact labels
- track ID
- confidence
- object class

Avoid giant labels.

Tracking should visually persist between frames.

---

# 18. Camera Detail View

Clicking a camera should open a focused surveillance workspace.

Recommended:

```text
┌───────────────────────────────────────────────────────────────┐
│ CAM-07 / SECTOR ALPHA / LIVE / ONLINE                       │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│                       LARGE VIDEO                             │
│                                                               │
│       detection boxes / zones / tracking                     │
│                                                               │
├─────────────────────────────┬─────────────────────────────────┤
│ DETECTIONS                  │ CAMERA STATUS                  │
│ Person 02                   │ FPS                             │
│ Vehicle 01                 │ Latency                         │
│ Track P-014                 │ Stream                          │
│                             │ Recording                       │
├─────────────────────────────┴─────────────────────────────────┤
│ RECENT EVENTS                                                  │
└───────────────────────────────────────────────────────────────┘
```

The video should receive the largest visual area.

---

# 19. Alert System

Alerts are the heart of BAVIS.

Do not represent alerts as ordinary notifications.

Treat them as **operational events**.

Recommended alert hierarchy:

```text
CRITICAL
████████████████████████
INTRUSION DETECTED
CAM-07 · SECTOR ALPHA
15:41:09 IST
PERSON ENTERED RESTRICTED ZONE
[VIEW INCIDENT]

HIGH
████████████████████████
NIGHT MOVEMENT DETECTED
CAM-12 · SECTOR BRAVO
```

Critical alerts should visually interrupt the operator's attention without becoming annoying.

---

# 20. Alert Rail

The right-side alert rail should remain visible on the command screen.

Structure:

```text
PRIORITY EVENTS

[CRITICAL]
Virtual Fence Breach
CAM-07
15:41:09
NEW

[HIGH]
Night Movement
CAM-12
15:38:21

[MEDIUM]
Unknown Vehicle
CAM-04
15:31:02
RESOLVED
```

Interaction:

- click → incident detail
- acknowledge → optimistic state update
- resolve → status change
- keyboard navigation
- newest critical event at top

---

# 21. Alert Behaviour

When a new high/critical alert arrives:

1. Add it to the alert rail.
2. Update the alert count.
3. Highlight the associated camera.
4. Highlight the associated operational-map location if available.
5. Show a subtle notification.
6. Allow the operator to open the incident.
7. Do not force navigation away from the current workflow.

Avoid aggressive full-screen popups for every event.

---

# 22. Incident Investigation Workspace

This is where BAVIS should differentiate itself from normal CCTV software.

An incident page should tell the story of an event.

Recommended structure:

```text
INCIDENT #INC-00127
────────────────────────────────────────────────────────

CRITICAL · VIRTUAL FENCE BREACH
CAM-07 · SECTOR ALPHA
02 SEP 2026 · 15:41:09 IST

┌─────────────────────────────┬─────────────────────────────┐
│ PRIMARY EVIDENCE            │ INCIDENT SUMMARY            │
│                             │                             │
│ snapshot / video            │ What happened               │
│                             │ Where                        │
│                             │ When                         │
│                             │ Detection confidence         │
└─────────────────────────────┴─────────────────────────────┘

DETECTION CHAIN

15:41:06  PERSON DETECTED
15:41:07  TRACK P-014 CREATED
15:41:09  RESTRICTED ZONE CROSSED
15:41:09  RULE TRIGGERED
15:41:10  ALERT GENERATED
15:41:18  OPERATOR ACKNOWLEDGED

RELATED EVENTS
RELATED CAMERAS
EVIDENCE
OPERATOR ACTIONS
```

This makes BAVIS feel like an intelligence platform rather than a camera viewer.

---

# 23. Evidence Viewer

Evidence should be treated as an operational artifact.

Show:

- snapshot
- video clip if available
- event timestamp
- camera
- detection class
- track ID
- confidence
- rule
- incident ID

Provide actions such as:

- expand
- playback
- download/export if supported
- mark reviewed
- return to incident

Do not make evidence look like a normal photo gallery.

---

# 24. Event Timeline

The timeline should communicate causality.

Example:

```text
15:41:06
● PERSON DETECTED
CAM-07

15:41:07
● TRACK CREATED
P-014

15:41:09
● VIRTUAL FENCE CROSSED
ZONE-03

15:41:09
● ALERT GENERATED
CRITICAL

15:41:18
● ACKNOWLEDGED
Operator: OP-021
```

Use a vertical operational timeline.

---

# 25. Event Search

The event search page should feel like an intelligence investigation tool.

Primary filters:

- date/time
- camera
- sector
- event type
- severity
- status
- object type
- track ID

Results should be compact.

Example:

```text
TIME       EVENT                 CAMERA   SEVERITY   STATUS
15:41:09   Fence Breach         CAM-07   CRITICAL   NEW
15:38:21   Night Movement       CAM-12   HIGH       ACK
15:31:02   Unknown Vehicle      CAM-04   MEDIUM     RESOLVED
```

Clicking a row should open the incident workspace.

---

# 26. Zone Editor

The zone editor must remain functional while receiving a major visual upgrade.

Workspace:

```text
┌──────────────────────────────────────────────────────────────┐
│ CAM-07 / ZONE CONFIGURATION                                  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                        CAMERA VIDEO                          │
│                                                              │
│               ┌────────────────────┐                         │
│               │  RESTRICTED ZONE   │                         │
│               │                    │                         │
│               └────────────────────┘                         │
│                                                              │
├──────────────────────────────┬───────────────────────────────┤
│ ZONE TYPE                    │ ACTIONS                       │
│ Restricted                   │ [SAVE ZONE]                   │
│ Warning                      │ [CLEAR]                       │
│ Detection                    │ [CANCEL]                      │
└──────────────────────────────┴───────────────────────────────┘
```

Design principles:

- clear drawing mode
- clear selected points
- visible polygon/line
- coordinate-independent
- save confirmation
- unsaved-change state
- role permissions
- supervisor-only editing where required

---

# 27. System Health

A professional surveillance system must monitor itself.

Create a compact system health workspace.

Track, where available:

- cameras online
- cameras offline
- stream latency
- WebSocket connection
- backend API health
- AI inference status
- event pipeline
- storage/recording status
- last event received
- system uptime

Example:

```text
SYSTEM HEALTH

● API                 NOMINAL
● ALERT STREAM        NOMINAL
● AI INFERENCE        NOMINAL
● CAMERA NETWORK      24 / 28 ONLINE
● EVENT PIPELINE      NOMINAL

ATTENTION
CAM-14 OFFLINE
Last seen 04:12 ago
```

This makes the interface operationally credible.

---

# 28. Dashboard Metrics

Use metrics sparingly.

Good:

```text
24/28
CAMERAS ONLINE

17
ACTIVE TRACKS

03
OPEN ALERTS

99.98%
SYSTEM HEALTH
```

Bad:

- 12 decorative charts
- fake revenue-style graphs
- meaningless percentages
- huge KPI cards
- charts that don't support a decision

Every metric should answer an operational question.

---

# 29. Micro-Interactions

Motion should communicate system state.

Use:

- subtle alert pulse
- camera online transition
- detection box appearance
- timeline insertion
- panel expansion
- hover state
- selected-object highlight

Avoid:

- bouncing cards
- excessive spring animation
- page-wide transitions
- spinning icons without meaning
- flashy particle effects

Suggested animation timing:

- 100–180ms for controls
- 180–250ms for panels
- 250–400ms for larger transitions

Respect `prefers-reduced-motion`.

---

# 30. Live Data Behaviour

The UI must feel alive without being distracting.

WebSocket events should update:

- alert count
- alert rail
- incident state
- camera status where applicable
- event timeline
- selected incident if relevant

Do not reload the entire page.

Use incremental updates.

Show a small live-state indicator:

```text
● LIVE
Last update 0.8s ago
```

If the WebSocket disconnects:

```text
◌ RECONNECTING
Alert stream unavailable
Retrying...
```

This must be visually clear but not catastrophic unless the system truly cannot operate.

---

# 31. Empty States

Every screen must handle empty data.

Do not show:

> "No data found"

Use operational language.

Examples:

```text
NO ACTIVE INCIDENTS

All monitored sectors are currently nominal.
```

```text
NO CAMERAS ONLINE

No camera streams are currently available.
Check camera network health.
```

```text
NO MATCHING EVENTS

No events matched the selected filters.
```

---

# 32. Loading States

Avoid generic skeletons everywhere.

Use operational loading states:

```text
CONNECTING TO SURVEILLANCE NETWORK...
```

```text
LOADING EVENT INDEX...
```

```text
SYNCING CAMERA STATUS...
```

Keep loading states short and subtle.

---

# 33. Error States

Errors should tell operators what happened and what they can do.

Bad:

> Something went wrong.

Better:

```text
CAMERA STREAM UNAVAILABLE

CAM-07 is not responding.

Last successful frame:
15:40:58 IST

[RETRY STREAM]
[VIEW CAMERA HEALTH]
```

---

# 34. Login Screen

The login page should establish the product identity.

Do not use a generic startup SaaS login.

Suggested:

```text
                 BAVIS

      BORDER AI VIDEO INTELLIGENCE SYSTEM

      ┌──────────────────────────────┐
      │ OPERATOR ID                  │
      │                              │
      │ PASSWORD                     │
      │                              │
      │ [ AUTHENTICATE ]             │
      └──────────────────────────────┘

      SECURE OPERATIONS NETWORK
      SYSTEM STATUS ● NOMINAL

      CLASSIFICATION / ACCESS LEVEL
```

Possible visual elements:

- subtle border-sector grid
- abstract surveillance scan
- restrained Indian defence identity
- system telemetry
- no unnecessary patriotic decoration

---

# 35. Indian Identity

BAVIS should feel Indian without becoming visually loud.

Good ways:

- subtle saffron/white/green accents
- Indian defence-inspired terminology
- sector/BOP terminology where appropriate
- sovereign/indigenous technology language
- disciplined command-centre styling

Avoid:

- giant Indian flag backgrounds
- Ashoka Chakra everywhere
- excessive saffron
- patriotic slogans
- decorative military badges

The product should look like serious operational software, not a poster.

---

# 36. Responsive Strategy

Primary target:

### Desktop Command Centre

1920×1080

Secondary:

### Laptop

1440×900

### Smaller laptop

1366×768

The application is primarily an operator console.

Do not blindly collapse everything into a mobile SaaS layout.

At smaller desktop sizes:

- collapse secondary panels
- use drawers
- reduce camera grid density
- preserve alerts
- preserve current incident context
- keep critical system status visible

---

# 37. Component Design System

Create reusable components.

Suggested:

```text
CommandShell
CommandRail
TopStatusBar
SystemStatus
OperationalMap
CameraWall
CameraTile
CameraDetail
DetectionOverlay
TrackingLabel
AlertRail
AlertItem
SeverityBadge
IncidentPanel
IncidentTimeline
EvidenceViewer
EventTable
EventFilters
ZoneEditor
ZonePolygon
SystemHealthPanel
MetricStrip
StatusIndicator
LiveIndicator
Toast
Drawer
Modal
CommandButton
```

Do not build every screen from unrelated custom components.

---

# 38. Design Tokens

Centralize:

- colors
- typography
- spacing
- border radius
- shadows
- animation duration
- severity colors
- status colors
- z-index layers

Example:

```text
--bg-0
--bg-1
--bg-2
--border
--text-primary
--text-secondary
--status-online
--status-warning
--status-critical
--accent
--spacing-xs
--spacing-sm
--spacing-md
--spacing-lg
--radius-sm
```

The entire UI should feel like one coherent system.

---

# 39. Accessibility

Even though this is a defence-style UI, do not sacrifice accessibility.

Ensure:

- keyboard navigation
- visible focus states
- adequate contrast
- semantic buttons
- accessible labels
- tooltips for icon-only actions
- reduced motion support
- screen-reader-friendly status messages where practical

Critical alerts must not depend on color alone.

---

# 40. Performance Requirements

The redesign must not make the existing working application slower.

Priorities:

1. live video performance
2. alert latency
3. detection overlay rendering
4. event timeline updates
5. navigation responsiveness
6. visual effects

Avoid heavy animation libraries when CSS is enough.

Avoid unnecessary rerenders.

Do not render invisible camera streams.

Use virtualization where event lists become large.

---

# 41. Important Functional Preservation Rule

This is a **UI/UX transformation, not a backend rewrite.**

Do NOT break:

- authentication
- role-based permissions
- routing
- REST endpoints
- WebSocket connection
- camera API
- event API
- alert API
- evidence API
- zone API
- acknowledgement workflow
- detection overlays
- mock server
- Docker deployment
- existing data contracts

If an existing feature works, preserve its behavior.

Change how it looks and how the operator experiences it.

---

# 42. UX Priority Order

When deciding what deserves visual attention, use this hierarchy:

### Priority 1 — Immediate Threat

Critical alerts and active incidents.

### Priority 2 — Operational Picture

Where are cameras, zones and incidents?

### Priority 3 — Evidence

What actually happened?

### Priority 4 — Response

Acknowledge, resolve, investigate.

### Priority 5 — System Health

Can BAVIS be trusted right now?

### Priority 6 — Historical Intelligence

What happened earlier?

### Priority 7 — Configuration

Zones, cameras and administration.

This hierarchy should influence layout, typography, color, motion and interaction.

---

# 43. Progressive Disclosure

Do not show every piece of information at once.

Level 1:

```text
CRITICAL
Fence Breach
CAM-07
```

Level 2:

```text
Person P-014
96% confidence
15:41:09
```

Level 3:

```text
Evidence
Detection chain
Related cameras
Operator actions
```

This keeps the main screen scannable while retaining deep investigative capability.

---

# 44. Operator Workflow

The ideal interaction should feel like:

```text
LOGIN
  ↓
COMMAND OVERVIEW
  ↓
ALERT APPEARS
  ↓
OPERATOR SEES CAMERA + LOCATION
  ↓
OPEN INCIDENT
  ↓
VERIFY EVIDENCE
  ↓
ACKNOWLEDGE
  ↓
INVESTIGATE IF REQUIRED
  ↓
RESOLVE
```

The operator should never need to hunt through multiple menus to understand a high-priority event.

---

# 45. Demo Mode / Hackathon Presentation

The UI must look excellent during a live SIH demonstration.

A judge should immediately understand:

```text
Existing CCTV
      ↓
AI Detection
      ↓
Tracking
      ↓
Event Intelligence
      ↓
Risk / Alert
      ↓
Operator Action
```

The visual demo should emphasize:

- live camera
- bounding boxes
- tracking IDs
- critical alert
- incident evidence
- timeline
- acknowledgement
- zone breach
- system health

The interface should make the AI pipeline visible without exposing implementation complexity.

---

# 46. Recommended Demo Scenario

Example:

```text
CAM-07
SECTOR ALPHA

AI detects person
       ↓
TRACK P-014 CREATED
       ↓
Person approaches restricted zone
       ↓
Virtual fence crossed
       ↓
RULE ENGINE TRIGGERS
       ↓
CRITICAL ALERT
       ↓
Operator sees alert + camera
       ↓
Incident opened
       ↓
Evidence reviewed
       ↓
Operator ACKNOWLEDGES
```

This scenario should be visually compelling but operationally believable.

---

# 47. Anti-Patterns — Strictly Avoid

Do not create:

- generic Bootstrap dashboard
- huge rounded cards
- neon cyberpunk UI
- excessive purple gradients
- excessive glassmorphism
- crypto-style dashboards
- gaming HUD
- fake radar just for aesthetics
- unnecessary 3D globe
- excessive charts
- giant icons
- excessive animations
- random military camouflage
- decorative guns/tanks/aircraft
- patriotic clutter
- dashboard screenshots copied from another product

BAVIS should look like **real operational software**.

---

# 48. Visual Character

The final product should communicate:

**PRECISION**

Thin lines, disciplined spacing, compact typography.

**AUTHORITY**

Strong hierarchy and restrained color.

**INTELLIGENCE**

Evidence, tracking, correlation and context.

**READINESS**

Live status and immediate alerts.

**TRUST**

Clear system health and traceable actions.

**INDIGENOUS DEFENCE TECHNOLOGY**

Indian identity expressed subtly through the system language and visual accents.

---

# 49. Final Visual Target

Imagine a modern Indian border command centre at night.

A large operational display shows:

- a dark tactical sector view
- surveillance cameras
- restricted zones
- active incidents
- a few live tracks
- system status
- event timeline

The operator does not feel like they are using a website.

They feel like they are operating a **mission system**.

That is the target.

---

# 50. Implementation Rule for the Frontend Agent

Before modifying code:

1. Inspect the existing frontend.
2. Identify the current routing structure.
3. Identify reusable components.
4. Identify API/WebSocket integration.
5. Identify current pages.
6. Identify existing styling system.
7. Identify which functionality already works.
8. Do not rewrite working logic unnecessarily.

Then redesign the interface in phases:

### Phase 1 — Design Foundation

- theme
- typography
- spacing
- tokens
- command shell
- navigation
- status system

### Phase 2 — Core Command Experience

- overview
- alert rail
- operational map
- camera wall
- camera tiles
- system health

### Phase 3 — Intelligence Workflow

- incident workspace
- evidence viewer
- timeline
- event search
- filtering

### Phase 4 — Operational Tools

- zone editor
- camera management
- role-specific actions
- settings

### Phase 5 — Polish

- micro-interactions
- transitions
- empty/error states
- responsive desktop behavior
- accessibility
- performance optimization
- final visual consistency

After each phase, verify that existing functionality still works.

---

# 51. Definition of Design Success

The redesign is successful when a user can look at the BAVIS screen and immediately understand:

> **Where is the situation?**

> **What is happening?**

> **How serious is it?**

> **Which camera detected it?**

> **What evidence exists?**

> **What should I do next?**

And when a judge sees it, the immediate impression should be:

> **"This looks like a real command-and-control system, not a college CCTV dashboard."**

---

# 52. Final Instruction

Treat this document as the **frontend design source of truth** for the BAVIS UI/UX redesign.

The existing frontend functionality is valuable and should be preserved.

The mission is to transform its presentation and operator experience into a:

**Modern Defence C2 / ISR-inspired Border Surveillance Command Centre**

with:

**situational awareness + AI video intelligence + incident response + evidence + system health**

in one coherent interface.

Do not sacrifice functionality for visual design.

Do not sacrifice usability for visual complexity.

Do not sacrifice operational clarity for aesthetics.

The final interface must look sophisticated because it is **well structured**, not because it is overloaded with visual effects.
