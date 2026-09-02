import type { Camera, Alert, Zone, Evidence, EventFilterParams, Detection, UserRole } from '../types/bavis';
import { mockServer } from '../mock/mockServer';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/alerts/stream';

function getAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...extra };
  const token = localStorage.getItem('bavis_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  async login(username: string, password: string): Promise<{ access_token: string; role: string; username: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error('Login failed');
    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem('bavis_token', data.access_token);
    }
    return data;
  },

  async getCameras(): Promise<Camera[]> {
    if (USE_MOCK) {
      return mockServer.getCameras();
    }
    const res = await fetch(`${API_BASE_URL}/cameras`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch cameras');
    const rawCams = await res.json();

    return rawCams.map((c: any) => ({
      camera_id: c.camera_id,
      name: c.name,
      location_code: c.location_code,
      stream_url: `${API_BASE_URL}/cameras/${c.camera_id}/stream`,
      status: c.status === 'online' ? 'active' : c.status || 'offline',
      vision_mode: c.configuration?.vision_mode || 'day',
      fps: c.configuration?.fps || 25,
      resolution: c.configuration?.resolution || '1080p',
      last_ping: new Date().toISOString(),
    }));
  },

  async getCameraStream(id: string): Promise<{ camera_id: string; stream_url: string; vision_mode: string; status: string }> {
    if (USE_MOCK) {
      return mockServer.getCameraStream(id);
    }
    return {
      camera_id: id,
      stream_url: `${API_BASE_URL}/cameras/${id}/stream`,
      vision_mode: 'day',
      status: 'active',
    };
  },

  async getAlerts(status?: string): Promise<Alert[]> {
    if (USE_MOCK) {
      return mockServer.getAlerts(status);
    }
    const query = status ? `?status=${status}` : '';
    const res = await fetch(`${API_BASE_URL}/alerts${query}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch alerts');
    const rawAlerts = await res.json();

    return rawAlerts.map((a: any) => ({
      alert_id: a.alert_id,
      event_id: a.event_id,
      severity: a.severity || 'high',
      rule: a.rule,
      status: a.status || 'new',
      created_at: a.created_at,
      acknowledged_by: a.acknowledged_by || null,
      evidence_ref: a.evidence_ref || null,
      camera_id: a.camera_id || 'CAM-BOP-01',
      camera_name: a.camera_id ? `Camera ${a.camera_id}` : 'BOP Sector Alpha',
      location_code: 'BOP-ALPHA-01',
      object_type: a.rule?.includes('anpr') ? 'vehicle' : 'person',
      description: `Security rule breach: ${a.rule?.replace(/_/g, ' ')}`,
    }));
  },

  async acknowledgeAlert(alertId: string, userId: string): Promise<Alert> {
    if (USE_MOCK) {
      return mockServer.acknowledgeAlert(alertId, userId);
    }
    const res = await fetch(`${API_BASE_URL}/alerts/${alertId}/ack`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ acknowledged_by: userId }),
    });
    if (!res.ok) throw new Error(`Failed to acknowledge alert ${alertId}`);
    const a = await res.json();

    return {
      alert_id: a.alert_id,
      event_id: a.event_id,
      severity: a.severity,
      rule: a.rule,
      status: a.status,
      created_at: a.created_at,
      acknowledged_by: a.acknowledged_by,
      evidence_ref: a.evidence_ref,
      camera_id: a.camera_id || 'CAM-BOP-01',
    };
  },

  async createOrUpdateZone(zone: Partial<Zone>): Promise<Zone> {
    if (USE_MOCK) {
      return mockServer.createOrUpdateZone(zone);
    }
    const payload = {
      camera_id: zone.camera_id || 'CAM-BOP-01',
      name: zone.name || 'Restricted Buffer Zone',
      geometry: { type: 'Polygon', points: zone.points || [] },
      rule_type: zone.rule_type || 'virtual_fence',
      threshold: {
        severity: zone.severity || 'high',
        dwell_seconds: zone.dwell_threshold_sec || 3,
        active: zone.active !== false,
      },
    };

    const res = await fetch(`${API_BASE_URL}/zones`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to save zone configuration');
    const z = await res.json();

    return {
      zone_id: z.zone_id,
      camera_id: z.camera_id,
      name: z.name,
      rule_type: z.rule_type,
      severity: z.threshold?.severity || 'high',
      dwell_threshold_sec: z.threshold?.dwell_seconds || 3,
      points: z.geometry?.points || [
        { x: 0.1, y: 0.2 },
        { x: 0.8, y: 0.2 },
        { x: 0.8, y: 0.8 },
        { x: 0.1, y: 0.8 },
      ],
      active: z.threshold?.active !== false,
      created_at: new Date().toISOString(),
      created_by: 'operator',
    };
  },

  async getZones(cameraId?: string): Promise<Zone[]> {
    if (USE_MOCK) {
      return mockServer.getZones(cameraId);
    }
    const query = cameraId ? `?camera=${cameraId}` : '';
    const res = await fetch(`${API_BASE_URL}/zones${query}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch zones');
    const rawZones = await res.json();

    return rawZones
      .filter((z: any) => !cameraId || z.camera_id === cameraId)
      .map((z: any) => ({
        zone_id: z.zone_id,
        camera_id: z.camera_id,
        name: z.name,
        rule_type: z.rule_type,
        severity: z.threshold?.severity || 'high',
        dwell_threshold_sec: z.threshold?.dwell_seconds || 3,
        points: z.geometry?.points || [
          { x: 0.1, y: 0.2 },
          { x: 0.8, y: 0.2 },
          { x: 0.8, y: 0.8 },
          { x: 0.1, y: 0.8 },
        ],
        active: z.threshold?.active !== false,
        created_at: new Date().toISOString(),
        created_by: 'operator',
      }));
  },

  async getEvidence(evidenceId: string): Promise<Evidence> {
    if (USE_MOCK) {
      return mockServer.getEvidence(evidenceId);
    }
    const res = await fetch(`${API_BASE_URL}/evidence/${evidenceId}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error(`Failed to fetch evidence ${evidenceId}`);
    const e = await res.json();

    return {
      evidence_id: e.evidence_id,
      event_id: e.event_id,
      alert_id: `ALT-${e.evidence_id}`,
      camera_id: e.retention_metadata?.camera_id || 'CAM-BOP-01',
      snapshot_url: e.snapshot_ref || '/data/evidence/snapshot_1.jpg',
      clip_url: undefined,
      frame_ts: new Date().toISOString(),
      detections: [],
      rule_fired: 'virtual_fence_breach',
      risk_score: 92,
      audit_trail: [
        {
          actor: 'System Auto Ingestion',
          action: 'EVIDENCE_CAPTURED',
          timestamp: new Date().toISOString(),
          role: 'operator',
        },
      ],
    };
  },

  async getEvents(params: EventFilterParams): Promise<Alert[]> {
    if (USE_MOCK) {
      return mockServer.getEvents(params);
    }
    const query = new URLSearchParams();
    if (params.camera) query.append('camera', params.camera);
    if (params.type) query.append('type', params.type);

    const res = await fetch(`${API_BASE_URL}/events?${query.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch filtered events');
    const rawEvents = await res.json();

    return rawEvents.map((evt: any) => ({
      alert_id: `EVT-${evt.id}`,
      event_id: evt.id,
      severity: 'medium',
      rule: `detection_${evt.object_type}`,
      status: 'new',
      created_at: evt.frame_ts,
      acknowledged_by: null,
      evidence_ref: `/data/evidence/snapshot_${evt.id}.jpg`,
      camera_id: evt.camera_id,
      camera_name: `Camera ${evt.camera_id}`,
      location_code: 'BOP-ALPHA-01',
      object_type: evt.object_type,
      description: `Detected ${evt.object_type} (Track: ${evt.track_id}, Confidence: ${Math.round(evt.confidence * 100)}%)`,
    }));
  },

  subscribeAlertStream(onData: (event: { type: 'ALERT' | 'DETECTION'; payload: Alert | Detection }) => void): () => void {
    if (USE_MOCK) {
      return mockServer.subscribeWS(onData);
    }

    let ws: WebSocket | null = null;
    let isConnected = true;

    const connectWS = () => {
      ws = new WebSocket(WS_BASE_URL);

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.alert_id) {
            onData({
              type: 'ALERT',
              payload: {
                alert_id: parsed.alert_id,
                event_id: parsed.event_id,
                severity: parsed.severity || 'high',
                rule: parsed.rule,
                status: parsed.status || 'new',
                created_at: parsed.created_at,
                acknowledged_by: parsed.acknowledged_by || null,
                evidence_ref: parsed.evidence_ref || null,
                camera_id: parsed.camera_id || 'CAM-BOP-01',
                camera_name: parsed.camera_id ? `Camera ${parsed.camera_id}` : 'BOP Sector Alpha',
                location_code: 'BOP-ALPHA-01',
                description: `Security breach: ${parsed.rule?.replace(/_/g, ' ')}`,
              },
            });
          } else if (parsed.type && parsed.payload) {
            onData(parsed);
          }
        } catch (err) {
          console.error('WS Parse Error:', err);
        }
      };

      ws.onerror = (err) => console.error('WebSocket connection error:', err);
      ws.onclose = () => {
        if (isConnected) {
          setTimeout(connectWS, 3000);
        }
      };
    };

    connectWS();

    return () => {
      isConnected = false;
      if (ws) ws.close();
    };
  },

  setRole(role: UserRole) {
    if (USE_MOCK) {
      mockServer.setRole(role);
    }
  },

  triggerDemoAlert(rule: 'virtual_fence_breach' | 'anpr_unlisted_vehicle' | 'dwell_time_exceeded' | 'low_light_movement', cameraId?: string, severity?: 'low' | 'medium' | 'high') {
    if (USE_MOCK) {
      return mockServer.triggerManualDemoAlert(rule, cameraId, severity);
    }
  },
};
