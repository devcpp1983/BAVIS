export type ObjectType = 'person' | 'vehicle' | 'face';

export type SeverityLevel = 'low' | 'medium' | 'high';

export type AlertStatus = 'new' | 'acknowledged' | 'resolved';

export type VisionMode = 'day' | 'night' | 'thermal';

export type UserRole = 'operator' | 'supervisor' | 'admin';

export type RuleType =
  | 'virtual_fence_breach'
  | 'anpr_unlisted_vehicle'
  | 'dwell_time_exceeded'
  | 'low_light_movement'
  | 'restricted_perimeter'
  | 'multiple_track_correlation';

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Detection {
  camera_id: string;
  frame_ts: string;
  object_type: ObjectType;
  confidence: number;
  bbox: [number, number, number, number]; // [x1, y1, x2, y2]
  track_id: string;
  anpr_plate?: string;
  speed_kmh?: number;
}

export interface IncidentTimelineStep {
  time: string;
  title: string;
  detail: string;
  status: 'completed' | 'current' | 'pending';
}

export interface ReasoningStep {
  label: string;
  description: string;
  highlight?: boolean;
}

export interface Alert {
  alert_id: string;
  event_id: string;
  severity: SeverityLevel;
  rule: RuleType | string;
  status: AlertStatus;
  created_at: string;
  acknowledged_by: string | null;
  acknowledged_at?: string | null;
  evidence_ref: string | null;
  camera_id: string;
  camera_name?: string;
  location_code?: string;
  object_type?: ObjectType;
  description?: string;
  track_id?: string;
  classification?: string;
  detection_timeline?: IncidentTimelineStep[];
  reasoning_chain?: ReasoningStep[];
  integrity_hash?: string;
}

export interface Camera {
  camera_id: string;
  name: string;
  location_code: string;
  stream_url: string;
  status: 'active' | 'offline' | 'degraded';
  vision_mode: VisionMode;
  fps: number;
  resolution: string;
  last_ping: string;
  latency_ms?: number;
  active_tracks_count?: number;
  current_zone_name?: string;
}

export interface Point2D {
  x: number; // 0 to 1 normalized coordinate
  y: number; // 0 to 1 normalized coordinate
}

export interface Zone {
  zone_id: string;
  camera_id: string;
  name: string;
  rule_type: RuleType;
  severity: SeverityLevel;
  dwell_threshold_sec?: number;
  active_hours?: string;
  coverage_cameras?: string[];
  rule_person?: boolean;
  rule_vehicle?: boolean;
  rule_loiter?: boolean;
  points: Point2D[];
  active: boolean;
  created_at: string;
  created_by: string;
}

export interface Evidence {
  evidence_id: string;
  event_id: string;
  alert_id: string;
  camera_id: string;
  snapshot_url: string;
  clip_url?: string;
  frame_ts: string;
  detections: Detection[];
  rule_fired: string;
  risk_score: number;
  integrity_hash: string;
  notes?: string[];
  audit_trail: Array<{
    actor: string;
    action: string;
    timestamp: string;
    role: UserRole;
  }>;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  operator: string;
  role: UserRole;
  action: string;
  resource: string;
  result: 'SUCCESS' | 'DENIED' | 'FLAGGED';
  source: string;
}

export interface TrackInvestigation {
  track_id: string;
  object_type: ObjectType;
  first_detected: string;
  last_detected: string;
  cameras_observed: string[];
  zones_entered: string[];
  associated_events: string[];
  max_confidence: number;
  speed_kmh?: number;
  evidence_id?: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  badgeId: string;
  unit: string;
  avatarUrl?: string;
}

export interface EventFilterParams {
  camera?: string;
  type?: ObjectType | 'all';
  severity?: SeverityLevel | 'all';
  status?: AlertStatus | 'all';
  track_id?: string;
  from?: string;
  to?: string;
  searchQuery?: string;
}

