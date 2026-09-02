export type ObjectType = 'person' | 'vehicle' | 'face';

export type SeverityLevel = 'low' | 'medium' | 'high';

export type AlertStatus = 'new' | 'acknowledged' | 'resolved';

export type VisionMode = 'day' | 'night' | 'thermal';

export type UserRole = 'operator' | 'supervisor' | 'admin';

export type RuleType = 'virtual_fence_breach' | 'anpr_unlisted_vehicle' | 'dwell_time_exceeded' | 'low_light_movement' | 'restricted_perimeter';

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
  notes?: string[];
  audit_trail: Array<{
    actor: string;
    action: string;
    timestamp: string;
    role: UserRole;
  }>;
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
  from?: string;
  to?: string;
  searchQuery?: string;
}
