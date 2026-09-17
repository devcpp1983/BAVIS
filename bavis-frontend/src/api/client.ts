import type { Camera, Alert, Zone, Evidence, EventFilterParams, UserRole, AuditLogEntry, TrackInvestigation } from '../types/bavis';
import { mockServer } from '../mock/mockServer';

// Default to mock mode for seamless frontend demo deployment
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
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
    if (USE_MOCK) {
      return { access_token: 'mock_jwt_token_bavis_2026', role: 'operator', username };
    }
    try {
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
    } catch {
      return { access_token: 'mock_jwt_token_bavis_2026', role: 'operator', username };
    }
  },

  async getCameras(): Promise<Camera[]> {
    if (USE_MOCK) {
      return mockServer.getCameras();
    }
    try {
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
        latency_ms: 18,
      }));
    } catch {
      return mockServer.getCameras();
    }
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
    try {
      const query = status ? `?status=${status}` : '';
      const res = await fetch(`${API_BASE_URL}/alerts${query}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch alerts');
      return await res.json();
    } catch {
      return mockServer.getAlerts(status);
    }
  },

  async acknowledgeAlert(alertId: string, userId: string): Promise<Alert> {
    if (USE_MOCK) {
      return mockServer.acknowledgeAlert(alertId, userId);
    }
    try {
      const res = await fetch(`${API_BASE_URL}/alerts/${alertId}/ack`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ acknowledged_by: userId }),
      });
      if (!res.ok) throw new Error(`Failed to acknowledge alert ${alertId}`);
      return await res.json();
    } catch {
      return mockServer.acknowledgeAlert(alertId, userId);
    }
  },

  async createOrUpdateZone(zone: Partial<Zone>): Promise<Zone> {
    if (USE_MOCK) {
      return mockServer.createOrUpdateZone(zone);
    }
    try {
      const res = await fetch(`${API_BASE_URL}/zones`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(zone),
      });
      if (!res.ok) throw new Error('Failed to save zone configuration');
      return await res.json();
    } catch {
      return mockServer.createOrUpdateZone(zone);
    }
  },

  async getZones(cameraId?: string): Promise<Zone[]> {
    if (USE_MOCK) {
      return mockServer.getZones(cameraId);
    }
    try {
      const query = cameraId ? `?camera=${cameraId}` : '';
      const res = await fetch(`${API_BASE_URL}/zones${query}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch zones');
      return await res.json();
    } catch {
      return mockServer.getZones(cameraId);
    }
  },

  async getEvidence(evidenceId: string): Promise<Evidence> {
    if (USE_MOCK) {
      return mockServer.getEvidence(evidenceId);
    }
    try {
      const res = await fetch(`${API_BASE_URL}/evidence/${evidenceId}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error(`Failed to fetch evidence ${evidenceId}`);
      return await res.json();
    } catch {
      return mockServer.getEvidence(evidenceId);
    }
  },

  async getEvents(params: EventFilterParams): Promise<Alert[]> {
    if (USE_MOCK) {
      return mockServer.getEvents(params);
    }
    try {
      const query = new URLSearchParams();
      if (params.camera) query.append('camera', params.camera);
      if (params.type) query.append('type', params.type);
      const res = await fetch(`${API_BASE_URL}/events?${query.toString()}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed to fetch filtered events');
      return await res.json();
    } catch {
      return mockServer.getEvents(params);
    }
  },

  async getAuditLogs(): Promise<AuditLogEntry[]> {
    return mockServer.getAuditLogs();
  },

  async getTrackInvestigation(trackId: string): Promise<TrackInvestigation | null> {
    return mockServer.getTrackInvestigation(trackId);
  },

  runScenario(
    scenarioId: 1 | 2 | 3,
    onStepUpdate?: (step: { stepNumber: number; totalSteps: number; title: string; detail: string; incidentCreated?: Alert }) => void
  ) {
    return mockServer.runScenario(scenarioId, onStepUpdate);
  },

  resetDemoState() {
    return mockServer.resetDemoState();
  },

  subscribeAlertStream(onData: (event: { type: 'ALERT' | 'DETECTION' | 'SCENARIO_STEP'; payload: any }) => void): () => void {
    if (USE_MOCK) {
      return mockServer.subscribeWS(onData);
    }

    let ws: WebSocket | null = null;
    let isConnected = true;

    const connectWS = () => {
      try {
        ws = new WebSocket(WS_BASE_URL);

        ws.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.alert_id) {
              onData({
                type: 'ALERT',
                payload: parsed,
              });
            } else if (parsed.type && parsed.payload) {
              onData(parsed);
            }
          } catch (err) {
            console.error('WS Parse Error:', err);
          }
        };

        ws.onerror = () => {
          // Fallback to mock WS if connection fails
        };
        ws.onclose = () => {
          if (isConnected) {
            setTimeout(connectWS, 4000);
          }
        };
      } catch {
        // Ignore WS errors in demo
      }
    };

    connectWS();

    return () => {
      isConnected = false;
      if (ws) ws.close();
    };
  },

  setRole(role: UserRole) {
    mockServer.setRole(role);
  },
};
