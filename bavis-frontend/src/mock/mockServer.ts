import type { Camera, Alert, Zone, Evidence, EventFilterParams, Detection, UserRole } from '../types/bavis';
import { INITIAL_CAMERAS, INITIAL_ALERTS, INITIAL_ZONES, INITIAL_EVIDENCE, MOCK_USERS } from './mockData';

type WebSocketCallback = (data: { type: 'ALERT' | 'DETECTION'; payload: Alert | Detection }) => void;

class MockServer {
  private cameras: Camera[] = [...INITIAL_CAMERAS];
  private alerts: Alert[] = [...INITIAL_ALERTS];
  private zones: Zone[] = [...INITIAL_ZONES];
  private evidenceStore: Record<string, Evidence> = { ...INITIAL_EVIDENCE };
  private wsSubscribers: Set<WebSocketCallback> = new Set();
  private currentRole: UserRole = 'operator';

  constructor() {
    this.startAutoGenerator();
  }

  // --- Role Management ---
  public setRole(role: UserRole) {
    this.currentRole = role;
  }

  public getCurrentUser() {
    return MOCK_USERS[this.currentRole];
  }

  // --- REST Endpoints Simulation ---

  // GET /cameras
  public async getCameras(): Promise<Camera[]> {
    await this.delay(40);
    return [...this.cameras];
  }

  // GET /cameras/{id}/stream
  public async getCameraStream(id: string): Promise<{ camera_id: string; stream_url: string; vision_mode: string; status: string }> {
    await this.delay(30);
    const camera = this.cameras.find((c) => c.camera_id === id);
    if (!camera) throw new Error(`Camera ${id} not found`);
    return {
      camera_id: camera.camera_id,
      stream_url: camera.stream_url,
      vision_mode: camera.vision_mode,
      status: camera.status,
    };
  }

  // GET /alerts?status=
  public async getAlerts(status?: string): Promise<Alert[]> {
    await this.delay(50);
    if (!status || status === 'all') {
      return [...this.alerts];
    }
    return this.alerts.filter((a) => a.status === status);
  }

  // POST /alerts/{id}/ack
  public async acknowledgeAlert(alertId: string, userId: string): Promise<Alert> {
    await this.delay(60);
    const alertIndex = this.alerts.findIndex((a) => a.alert_id === alertId);
    if (alertIndex === -1) {
      throw new Error(`Alert ${alertId} not found`);
    }

    const updated: Alert = {
      ...this.alerts[alertIndex],
      status: 'acknowledged',
      acknowledged_by: MOCK_USERS[this.currentRole]?.name || userId,
      acknowledged_at: new Date().toISOString(),
    };

    this.alerts[alertIndex] = updated;

    // Broadcast status change via WS
    this.notifySubscribers('ALERT', updated);

    return updated;
  }

  // POST /zones (Requires Supervisor or Admin role)
  public async createOrUpdateZone(zone: Partial<Zone>): Promise<Zone> {
    await this.delay(80);
    if (this.currentRole === 'operator') {
      throw new Error('Permission denied: Only Supervisors and Admins can modify security zones.');
    }

    const existingIndex = this.zones.findIndex((z) => z.zone_id === zone.zone_id);
    const updatedZone: Zone = {
      zone_id: zone.zone_id || `zone-${Date.now()}`,
      camera_id: zone.camera_id || 'cam-01',
      name: zone.name || 'New Restricted Zone',
      rule_type: zone.rule_type || 'virtual_fence_breach',
      severity: zone.severity || 'high',
      dwell_threshold_sec: zone.dwell_threshold_sec,
      points: zone.points || [],
      active: zone.active !== undefined ? zone.active : true,
      created_at: new Date().toISOString(),
      created_by: MOCK_USERS[this.currentRole]?.name || 'System Operator',
    };

    if (existingIndex >= 0) {
      this.zones[existingIndex] = updatedZone;
    } else {
      this.zones.push(updatedZone);
    }

    return updatedZone;
  }

  // GET /zones
  public async getZones(cameraId?: string): Promise<Zone[]> {
    await this.delay(40);
    if (cameraId) {
      return this.zones.filter((z) => z.camera_id === cameraId);
    }
    return [...this.zones];
  }

  // GET /evidence/{id}
  public async getEvidence(evidenceId: string): Promise<Evidence> {
    await this.delay(50);
    const evidence = this.evidenceStore[evidenceId];
    if (!evidence) {
      return {
        evidence_id: evidenceId,
        event_id: `evt_${evidenceId}`,
        alert_id: `alt_${evidenceId}`,
        camera_id: 'cam-01',
        snapshot_url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
        frame_ts: new Date().toISOString(),
        rule_fired: 'virtual_fence_breach',
        risk_score: 92,
        detections: [
          {
            camera_id: 'cam-01',
            frame_ts: new Date().toISOString(),
            object_type: 'person',
            confidence: 0.93,
            bbox: [220, 300, 490, 700],
            track_id: 'TR-8942',
          },
        ],
        audit_trail: [
          {
            actor: 'AI Vision Engine',
            action: 'Detection Frame Captured',
            timestamp: new Date().toISOString(),
            role: 'operator',
          },
        ],
      };
    }
    return evidence;
  }

  // GET /events?camera=&type=&severity=&from=&to=
  public async getEvents(params: EventFilterParams): Promise<Alert[]> {
    await this.delay(60);
    let filtered = [...this.alerts];

    if (params.camera && params.camera !== 'all') {
      filtered = filtered.filter((a) => a.camera_id === params.camera);
    }
    if (params.severity && params.severity !== 'all') {
      filtered = filtered.filter((a) => a.severity === params.severity);
    }
    if (params.status && params.status !== 'all') {
      filtered = filtered.filter((a) => a.status === params.status);
    }
    if (params.type && params.type !== 'all') {
      filtered = filtered.filter((a) => a.object_type === params.type);
    }
    if (params.searchQuery) {
      const q = params.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.rule.toLowerCase().includes(q) ||
          a.camera_name?.toLowerCase().includes(q) ||
          a.location_code?.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q) ||
          a.alert_id.toLowerCase().includes(q)
      );
    }

    return filtered;
  }

  // --- WebSocket Endpoint Simulation ---

  public subscribeWS(callback: WebSocketCallback): () => void {
    this.wsSubscribers.add(callback);
    return () => {
      this.wsSubscribers.delete(callback);
    };
  }

  private notifySubscribers(type: 'ALERT' | 'DETECTION', payload: Alert | Detection) {
    this.wsSubscribers.forEach((cb) => {
      try {
        cb({ type, payload });
      } catch (err) {
        console.error('WS Subscriber callback error:', err);
      }
    });
  }

  // Trigger manual synthetic intrusion alert (for demo control widget)
  public triggerManualDemoAlert(
    rule: 'virtual_fence_breach' | 'anpr_unlisted_vehicle' | 'dwell_time_exceeded' | 'low_light_movement',
    cameraId: string = 'cam-01',
    severity: 'low' | 'medium' | 'high' = 'high'
  ): Alert {
    const cam = this.cameras.find((c) => c.camera_id === cameraId) || this.cameras[0];
    const alertId = `alt_${Date.now().toString().slice(-5)}`;
    const eventId = `evt_${Date.now().toString().slice(-5)}`;
    const evidenceId = `evd_${Date.now().toString().slice(-5)}`;

    const isVehicle = rule === 'anpr_unlisted_vehicle';
    const objectType = isVehicle ? 'vehicle' : 'person';
    const plate = isVehicle ? `UP${Math.floor(10 + Math.random() * 88)}-XY-${Math.floor(1000 + Math.random() * 8999)}` : undefined;

    const newAlert: Alert = {
      alert_id: alertId,
      event_id: eventId,
      severity,
      rule,
      status: 'new',
      created_at: new Date().toISOString(),
      acknowledged_by: null,
      evidence_ref: evidenceId,
      camera_id: cam.camera_id,
      camera_name: cam.name,
      location_code: cam.location_code,
      object_type: objectType,
      description: isVehicle
        ? `Unregistered vehicle [${plate}] breached ANPR Checkpoint ${cam.location_code}.`
        : `Target detected crossing ${rule.replace(/_/g, ' ')} boundary at ${cam.location_code}.`,
    };

    // Store Evidence
    this.evidenceStore[evidenceId] = {
      evidence_id: evidenceId,
      event_id: eventId,
      alert_id: alertId,
      camera_id: cam.camera_id,
      snapshot_url: isVehicle
        ? 'https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=1200&q=80'
        : 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
      frame_ts: newDateISO(),
      rule_fired: rule,
      risk_score: severity === 'high' ? 96 : severity === 'medium' ? 75 : 45,
      detections: [
        {
          camera_id: cam.camera_id,
          frame_ts: newDateISO(),
          object_type: objectType,
          confidence: 0.95,
          bbox: isVehicle ? [150, 200, 750, 650] : [200, 250, 480, 710],
          track_id: `TR-${Math.floor(1000 + Math.random() * 9000)}`,
          anpr_plate: plate,
        },
      ],
      audit_trail: [
        {
          actor: 'BAVIS Realtime Alert Service',
          action: `Alert Triggered [${rule}]`,
          timestamp: newDateISO(),
          role: 'operator',
        },
      ],
    };

    this.alerts.unshift(newAlert);
    this.notifySubscribers('ALERT', newAlert);

    return newAlert;
  }

  private startAutoGenerator() {
    setInterval(() => {
      const randomCam = this.cameras[Math.floor(Math.random() * this.cameras.length)];
      const isVehicle = randomCam.camera_id === 'cam-02';
      const objType = isVehicle ? 'vehicle' : 'person';

      const detection: Detection = {
        camera_id: randomCam.camera_id,
        frame_ts: new Date().toISOString(),
        object_type: objType,
        confidence: Number((0.85 + Math.random() * 0.14).toFixed(2)),
        bbox: isVehicle
          ? [120 + Math.floor(Math.random() * 50), 200, 680, 620]
          : [200 + Math.floor(Math.random() * 100), 220 + Math.floor(Math.random() * 50), 450, 700],
        track_id: `TR-${Math.floor(1000 + Math.random() * 9000)}`,
        anpr_plate: isVehicle ? 'UP16-AB-8849' : undefined,
      };

      this.notifySubscribers('DETECTION', detection);
    }, 2500);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

function newDateISO(): string {
  return new Date().toISOString();
}

export const mockServer = new MockServer();
