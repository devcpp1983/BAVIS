import type {
  Camera,
  Alert,
  Zone,
  Evidence,
  EventFilterParams,
  UserRole,
  AuditLogEntry,
  TrackInvestigation,
} from '../types/bavis';
import {
  INITIAL_CAMERAS,
  INITIAL_ALERTS,
  INITIAL_ZONES,
  INITIAL_EVIDENCE,
  MOCK_USERS,
  INITIAL_AUDIT_LOGS,
  MOCK_TRACK_INVESTIGATIONS,
} from './mockData';

type WebSocketCallback = (data: { type: 'ALERT' | 'DETECTION' | 'SCENARIO_STEP'; payload: any }) => void;

class MockServer {
  private cameras: Camera[] = [...INITIAL_CAMERAS];
  private alerts: Alert[] = [];
  private zones: Zone[] = [];
  private evidenceStore: Record<string, Evidence> = {};
  private auditLogs: AuditLogEntry[] = [];
  private trackStore: Record<string, TrackInvestigation> = { ...MOCK_TRACK_INVESTIGATIONS };
  private wsSubscribers: Set<WebSocketCallback> = new Set();
  private currentRole: UserRole = 'operator';
  private scenarioInterval: any = null;

  constructor() {
    this.initFromLocalStorage();
  }

  private initFromLocalStorage() {
    try {
      const savedZones = localStorage.getItem('bavis_demo_zones');
      this.zones = savedZones ? JSON.parse(savedZones) : [...INITIAL_ZONES];

      const savedAlerts = localStorage.getItem('bavis_demo_alerts');
      this.alerts = savedAlerts ? JSON.parse(savedAlerts) : [...INITIAL_ALERTS];

      const savedEvidence = localStorage.getItem('bavis_demo_evidence');
      this.evidenceStore = savedEvidence ? JSON.parse(savedEvidence) : { ...INITIAL_EVIDENCE };

      const savedAudit = localStorage.getItem('bavis_demo_audit');
      this.auditLogs = savedAudit ? JSON.parse(savedAudit) : [...INITIAL_AUDIT_LOGS];
    } catch (e) {
      console.warn('LocalStorage fallback to defaults:', e);
      this.zones = [...INITIAL_ZONES];
      this.alerts = [...INITIAL_ALERTS];
      this.evidenceStore = { ...INITIAL_EVIDENCE };
      this.auditLogs = [...INITIAL_AUDIT_LOGS];
    }
  }

  private persist() {
    try {
      localStorage.setItem('bavis_demo_zones', JSON.stringify(this.zones));
      localStorage.setItem('bavis_demo_alerts', JSON.stringify(this.alerts));
      localStorage.setItem('bavis_demo_evidence', JSON.stringify(this.evidenceStore));
      localStorage.setItem('bavis_demo_audit', JSON.stringify(this.auditLogs));
    } catch {
      // LocalStorage full or disabled, gracefully ignore
    }
  }

  public resetDemoState() {
    if (this.scenarioInterval) {
      clearInterval(this.scenarioInterval);
      this.scenarioInterval = null;
    }
    this.zones = [...INITIAL_ZONES];
    this.alerts = [...INITIAL_ALERTS];
    this.evidenceStore = { ...INITIAL_EVIDENCE };
    this.auditLogs = [...INITIAL_AUDIT_LOGS];
    this.trackStore = { ...MOCK_TRACK_INVESTIGATIONS };
    this.persist();

    this.addAuditLog('SYSTEM RESET', 'Master Command Console', 'SUCCESS', 'Reset to initial factory state');
    return true;
  }

  // --- Role Management ---
  public setRole(role: UserRole) {
    this.currentRole = role;
    this.addAuditLog(`ROLE SWITCH [${role.toUpperCase()}]`, 'Auth RBAC', 'SUCCESS', 'Security Console');
  }

  public getCurrentUser() {
    return MOCK_USERS[this.currentRole];
  }

  public async getCameras(): Promise<Camera[]> {
    await this.delay(30);
    return [...this.cameras];
  }

  public async getCameraStream(id: string): Promise<{ camera_id: string; stream_url: string; vision_mode: string; status: string }> {
    await this.delay(20);
    const camera = this.cameras.find((c) => c.camera_id === id) || this.cameras[0];
    return {
      camera_id: camera.camera_id,
      stream_url: camera.stream_url,
      vision_mode: camera.vision_mode,
      status: camera.status,
    };
  }

  public async getAlerts(status?: string): Promise<Alert[]> {
    await this.delay(30);
    if (!status || status === 'all') {
      return [...this.alerts];
    }
    return this.alerts.filter((a) => a.status === status);
  }

  public async acknowledgeAlert(alertId: string, _userId: string): Promise<Alert> {
    await this.delay(40);
    const alertIndex = this.alerts.findIndex((a) => a.alert_id === alertId);
    if (alertIndex === -1) {
      throw new Error(`Incident ${alertId} not found`);
    }

    const updated: Alert = {
      ...this.alerts[alertIndex],
      status: 'acknowledged',
      acknowledged_by: MOCK_USERS[this.currentRole]?.name || 'Command Operator',
      acknowledged_at: new Date().toISOString(),
    };

    this.alerts[alertIndex] = updated;
    this.persist();

    this.addAuditLog(`ACKNOWLEDGE INCIDENT [${alertId}]`, `Incident ${alertId}`, 'SUCCESS', MOCK_USERS[this.currentRole]?.name || 'Operator');
    this.notifySubscribers('ALERT', updated);

    return updated;
  }

  public async createOrUpdateZone(zone: Partial<Zone>): Promise<Zone> {
    await this.delay(50);
    if (this.currentRole === 'operator') {
      this.addAuditLog(`ZONE UPDATE REJECTED [${zone.name || 'Zone'}]`, 'Zone Engine', 'DENIED', 'Operator role lacks permission');
      throw new Error('Permission denied: Only Supervisors and Admins can configure security zones.');
    }

    const existingIndex = this.zones.findIndex((z) => z.zone_id === zone.zone_id);
    const updatedZone: Zone = {
      zone_id: zone.zone_id || `zone-${Date.now()}`,
      camera_id: zone.camera_id || 'cam-01',
      name: zone.name || 'New Restricted Zone',
      rule_type: zone.rule_type || 'virtual_fence_breach',
      severity: zone.severity || 'high',
      dwell_threshold_sec: zone.dwell_threshold_sec || 10,
      active_hours: zone.active_hours || '24/7 ALL HOURS',
      points: zone.points || [],
      active: zone.active !== undefined ? zone.active : true,
      created_at: new Date().toISOString(),
      created_by: MOCK_USERS[this.currentRole]?.name || 'Inspector A. Sharma',
    };

    if (existingIndex >= 0) {
      this.zones[existingIndex] = updatedZone;
    } else {
      this.zones.push(updatedZone);
    }

    this.persist();
    this.addAuditLog(`SAVE ZONE RULE [${updatedZone.name}]`, `Camera ${updatedZone.camera_id}`, 'SUCCESS', MOCK_USERS[this.currentRole]?.name || 'Supervisor');

    return updatedZone;
  }

  public async getZones(cameraId?: string): Promise<Zone[]> {
    await this.delay(30);
    if (cameraId) {
      return this.zones.filter((z) => z.camera_id === cameraId);
    }
    return [...this.zones];
  }

  public async getEvidence(evidenceId: string): Promise<Evidence> {
    await this.delay(30);
    const evidence = this.evidenceStore[evidenceId];
    if (!evidence) {
      return {
        evidence_id: evidenceId,
        event_id: `EVT-${evidenceId.slice(-4)}`,
        alert_id: `INC-2026-${evidenceId.slice(-4)}`,
        camera_id: 'cam-01',
        snapshot_url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
        frame_ts: new Date().toISOString(),
        rule_fired: 'virtual_fence_breach',
        risk_score: 92,
        integrity_hash: 'SHA256: 7b9e3d0f81a42c67e901bc89a712f54a8109d9e4a3b2c1f0e9d8c7b6a504f321',
        detections: [
          {
            camera_id: 'cam-01',
            frame_ts: new Date().toISOString(),
            object_type: 'person',
            confidence: 0.94,
            bbox: [220, 300, 490, 700],
            track_id: 'TRK-CAM01-017',
            speed_kmh: 4.8,
          },
        ],
        audit_trail: [
          {
            actor: 'AI Vision Engine v2.4',
            action: 'Detection Frame Captured & Signed',
            timestamp: new Date().toISOString(),
            role: 'operator',
          },
        ],
      };
    }
    this.addAuditLog(`VIEW EVIDENCE [${evidenceId}]`, `Evidence Vault`, 'SUCCESS', MOCK_USERS[this.currentRole]?.name || 'Operator');
    return evidence;
  }

  public async getEvents(params: EventFilterParams): Promise<Alert[]> {
    await this.delay(40);
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
    if (params.track_id) {
      filtered = filtered.filter((a) => a.track_id?.toLowerCase().includes(params.track_id!.toLowerCase()));
    }
    if (params.searchQuery) {
      const q = params.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.rule.toLowerCase().includes(q) ||
          a.camera_name?.toLowerCase().includes(q) ||
          a.location_code?.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q) ||
          a.alert_id.toLowerCase().includes(q) ||
          a.track_id?.toLowerCase().includes(q) ||
          a.classification?.toLowerCase().includes(q)
      );
    }

    return filtered;
  }

  public async getAuditLogs(): Promise<AuditLogEntry[]> {
    await this.delay(20);
    return [...this.auditLogs];
  }

  public addAuditLog(action: string, resource: string, result: 'SUCCESS' | 'DENIED' | 'FLAGGED', source?: string) {
    const entry: AuditLogEntry = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: `${new Date().toISOString().substring(11, 19)} UTC`,
      operator: MOCK_USERS[this.currentRole]?.name || 'System Operator',
      role: this.currentRole,
      action,
      resource,
      result,
      source: source || 'Operator Console',
    };
    this.auditLogs = [entry, ...this.auditLogs].slice(0, 50);
    this.persist();
  }

  public async getTrackInvestigation(trackId: string): Promise<TrackInvestigation | null> {
    await this.delay(30);
    return this.trackStore[trackId] || null;
  }

  // --- WebSocket Endpoint Simulation ---
  public subscribeWS(callback: WebSocketCallback): () => void {
    this.wsSubscribers.add(callback);
    return () => {
      this.wsSubscribers.delete(callback);
    };
  }

  private notifySubscribers(type: 'ALERT' | 'DETECTION' | 'SCENARIO_STEP', payload: any) {
    this.wsSubscribers.forEach((cb) => {
      try {
        cb({ type, payload });
      } catch (err) {
        console.error('WS Subscriber error:', err);
      }
    });
  }

  // --- Guided Scenario Execution Engine (3 Polished Scenarios) ---
  public runScenario(scenarioId: 1 | 2 | 3, onStepUpdate?: (step: { stepNumber: number; totalSteps: number; title: string; detail: string; incidentCreated?: Alert }) => void) {
    if (this.scenarioInterval) {
      clearInterval(this.scenarioInterval);
      this.scenarioInterval = null;
    }

    const now = new Date();
    const timeStr = now.toISOString().substring(11, 19);

    if (scenarioId === 1) {
      // SCENARIO 01: PERIMETER INTRUSION (Person approaches restricted buffer)
      const steps = [
        {
          title: 'TARGET DETECTED AT ZERO LINE',
          detail: 'Thermal camera CAM-BOP-01 isolated human silhouette at boundary wire coordinate [N 28°14.22\', E 82°04.11\'].',
          det: {
            camera_id: 'cam-01',
            frame_ts: new Date().toISOString(),
            object_type: 'person' as const,
            confidence: 0.94,
            bbox: [240, 310, 480, 720] as [number, number, number, number],
            track_id: 'TRK-CAM01-017',
            speed_kmh: 4.8,
          },
        },
        {
          title: 'KALMAN TRACK INITIALIZED [TRK-CAM01-017]',
          detail: 'ByteTrack spatial correlation established persistent trajectory moving South across 45 frames.',
          det: {
            camera_id: 'cam-01',
            frame_ts: new Date().toISOString(),
            object_type: 'person' as const,
            confidence: 0.96,
            bbox: [260, 330, 500, 740] as [number, number, number, number],
            track_id: 'TRK-CAM01-017',
            speed_kmh: 5.2,
          },
        },
        {
          title: 'POLYGON ZONE NORTH BUFFER CROSSED',
          detail: 'Spatial boundary test confirmed intersection with Restricted Buffer Zone-101.',
          det: {
            camera_id: 'cam-01',
            frame_ts: new Date().toISOString(),
            object_type: 'person' as const,
            confidence: 0.95,
            bbox: [290, 360, 530, 760] as [number, number, number, number],
            track_id: 'TRK-CAM01-017',
            speed_kmh: 4.4,
          },
        },
        {
          title: 'DWELL THRESHOLD (10s) EXCEEDED',
          detail: 'Temporal tracker confirmed unauthorized presence exceeding maximum allowed dwell parameter.',
          det: {
            camera_id: 'cam-01',
            frame_ts: new Date().toISOString(),
            object_type: 'person' as const,
            confidence: 0.97,
            bbox: [300, 370, 540, 770] as [number, number, number, number],
            track_id: 'TRK-CAM01-017',
            speed_kmh: 2.1,
          },
        },
        {
          title: 'SECURITY EVENT CORRELATED → HIGH PRIORITY ALERT',
          detail: 'Event intelligence engine evaluated breach risk at 94/100. Dispatched INC-2026-0047 to C2 matrix.',
          det: null,
        },
      ];

      let currentStep = 0;
      this.scenarioInterval = setInterval(() => {
        if (currentStep < steps.length) {
          const s = steps[currentStep];
          if (s.det) {
            this.notifySubscribers('DETECTION', s.det);
          }

          let createdAlert: Alert | undefined;
          if (currentStep === steps.length - 1) {
            const alertId = `INC-2026-0047`;
            const evidenceId = `EVD-2026-00921`;

            createdAlert = {
              alert_id: alertId,
              event_id: 'EVT-7001',
              severity: 'high',
              rule: 'virtual_fence_breach',
              classification: 'RESTRICTED ZONE INTRUSION',
              status: 'new',
              created_at: new Date().toISOString(),
              acknowledged_by: null,
              evidence_ref: evidenceId,
              camera_id: 'cam-01',
              camera_name: 'BOP-North-01 Perimeter Fence',
              location_code: 'BOP-N01-SEC-A',
              object_type: 'person',
              track_id: 'TRK-CAM01-017',
              description: 'Individual breached Zero Line perimeter fence moving South toward restricted BOP buffer corridor.',
              integrity_hash: 'SHA256: 7b9e3d0f81a42c67e901bc89a712f54a8109d9e4a3b2c1f0e9d8c7b6a504f321',
              detection_timeline: [
                { time: `${timeStr}`, title: 'PERSON DETECTED', detail: 'YOLOv8 deep detector isolated human target at border wire boundary.', status: 'completed' },
                { time: `${timeStr}`, title: 'TRACK-017 CREATED', detail: 'ByteTrack Kalman filter established persistent trajectory across frame window.', status: 'completed' },
                { time: `${timeStr}`, title: 'TRACK ENTERED RESTRICTED ZONE', detail: 'Spatial intersection verified with Polygon Zone-101 (Perimeter Buffer).', status: 'completed' },
                { time: `${timeStr}`, title: 'DWELL TIME THRESHOLD EXCEEDED', detail: 'Target persisted inside restricted perimeter > 10.0s threshold.', status: 'completed' },
                { time: `${timeStr}`, title: 'EVENT CORRELATED', detail: 'Multi-rule temporal intelligence engine evaluated compound breach score (94/100).', status: 'completed' },
                { time: `${timeStr}`, title: 'HIGH PRIORITY ALERT GENERATED', detail: 'Dispatched to Command & Control HUD with SHA256 forensic snapshot.', status: 'completed' },
              ],
              reasoning_chain: [
                { label: 'PERSON DETECTED', description: 'Visual class: Person (Confidence 94.2%)', highlight: false },
                { label: 'TRACK PERSISTED', description: 'Tracker ID: TRK-CAM01-017 maintained continuity', highlight: false },
                { label: 'RESTRICTED ZONE ENTERED', description: 'Crossed Polygon Zone North Buffer', highlight: true },
                { label: 'DWELL TIME > THRESHOLD', description: 'Occupancy duration: 14.8s (Limit: 10s)', highlight: true },
                { label: 'UNUSUAL TIME WINDOW', description: 'Evening darkness illumination profile', highlight: false },
                { label: 'CORRELATED SECURITY EVENT', description: 'High probability unauthorized infiltration attempt', highlight: true },
                { label: 'HIGH SEVERITY ALERT', description: 'Immediate Quick Reaction Team (QRT) notification dispatched', highlight: true },
              ],
            };

            this.alerts = [createdAlert, ...this.alerts.filter((a) => a.alert_id !== alertId)];
            this.persist();
            this.addAuditLog(`DISPATCH HIGH ALERT [${alertId}]`, 'CAM-BOP-01', 'SUCCESS', 'Perimeter Intrusion Scenario');
            this.notifySubscribers('ALERT', createdAlert);
          }

          if (onStepUpdate) {
            onStepUpdate({
              stepNumber: currentStep + 1,
              totalSteps: steps.length,
              title: s.title,
              detail: s.detail,
              incidentCreated: createdAlert,
            });
          }

          this.notifySubscribers('SCENARIO_STEP', {
            scenarioId,
            stepNumber: currentStep + 1,
            totalSteps: steps.length,
            title: s.title,
            detail: s.detail,
          });

          currentStep++;
        } else {
          clearInterval(this.scenarioInterval);
          this.scenarioInterval = null;
        }
      }, 1200);

    } else if (scenarioId === 2) {
      // SCENARIO 02: UNLISTED VEHICLE ANPR CHECKPOINT BREACH
      const steps = [
        {
          title: 'VEHICLE DETECTED AT CHECKPOINT-03',
          detail: 'Commercial pickup truck isolated entering inspection approach lane at Checkpoint-03 Gate.',
          det: {
            camera_id: 'cam-02',
            frame_ts: new Date().toISOString(),
            object_type: 'vehicle' as const,
            confidence: 0.91,
            bbox: [180, 220, 750, 680] as [number, number, number, number],
            track_id: 'TRK-CAM02-023',
            speed_kmh: 24.5,
          },
        },
        {
          title: 'ANPR OCR PLATE LOCALIZATION',
          detail: 'High-resolution crop isolated license plate region; CRNN extracted text: [UP16-AB-8849] (Confidence 91.4%).',
          det: {
            camera_id: 'cam-02',
            frame_ts: new Date().toISOString(),
            object_type: 'vehicle' as const,
            confidence: 0.93,
            bbox: [180, 220, 750, 680] as [number, number, number, number],
            track_id: 'TRK-CAM02-023',
            anpr_plate: 'UP16-AB-8849',
            speed_kmh: 22.1,
          },
        },
        {
          title: 'AUTHORIZED PERMIT REGISTRY QUERY',
          detail: 'Query sent to MHA Checkpost Permit DB. Result: NO VALID TRANSIT CLEARANCE RECORDED.',
          det: null,
        },
        {
          title: 'UNAUTHORIZED LANE INTRUSION → BARRIER INTERLOCK',
          detail: 'Vehicle continued past stop line without authorization. Generated High Severity Alert INC-2026-0048.',
          det: null,
        },
      ];

      let currentStep = 0;
      this.scenarioInterval = setInterval(() => {
        if (currentStep < steps.length) {
          const s = steps[currentStep];
          if (s.det) {
            this.notifySubscribers('DETECTION', s.det);
          }

          let createdAlert: Alert | undefined;
          if (currentStep === steps.length - 1) {
            const alertId = 'INC-2026-0048';
            createdAlert = {
              alert_id: alertId,
              event_id: 'EVT-7002',
              severity: 'high',
              rule: 'anpr_unlisted_vehicle',
              classification: 'UNLISTED COMMERCIAL VEHICLE AT CHECKPOINT',
              status: 'new',
              created_at: new Date().toISOString(),
              acknowledged_by: null,
              evidence_ref: 'EVD-2026-00922',
              camera_id: 'cam-02',
              camera_name: 'Checkpoint-03 ANPR Inspection Bay',
              location_code: 'CHECKPOINT-03-GATE',
              object_type: 'vehicle',
              track_id: 'TRK-CAM02-023',
              description: 'Unflagged vehicle [UP16-AB-8849] entered restricted checkpoint bypass lane without valid daily permit.',
              integrity_hash: 'SHA256: 4f1a8c92e35b7104d802ef63b918a25c7403f8e1b2a5d9c6e0f7a4b3c201e892',
              detection_timeline: [
                { time: `${timeStr}`, title: 'VEHICLE DETECTED', detail: 'Commercial transport pickup detected on camera.', status: 'completed' },
                { time: `${timeStr}`, title: 'ANPR OCR EXTRACTED', detail: 'Extracted registration UP16-AB-8849.', status: 'completed' },
                { time: `${timeStr}`, title: 'PERMIT REGISTRY MATCH FAILED', detail: 'License not present on allowlist.', status: 'completed' },
                { time: `${timeStr}`, title: 'BARRIER LOCKDOWN TRIGGERED', detail: 'Dispatched alert to checkpost staff.', status: 'completed' },
              ],
              reasoning_chain: [
                { label: 'VEHICLE DETECTED', description: 'Class: Commercial Pickup Truck', highlight: false },
                { label: 'ANPR OCR PARSED', description: 'License: UP16-AB-8849', highlight: false },
                { label: 'PERMIT LIST QUERY', description: 'Result: UNREGISTERED / NOT ON ALLOWLIST', highlight: true },
                { label: 'BYPASS LANE ENTRY', description: 'Breached restricted lane', highlight: true },
                { label: 'HIGH SEVERITY ACTION', description: 'Checkpoint barrier lockdown signal emitted', highlight: true },
              ],
            };

            this.alerts = [createdAlert, ...this.alerts.filter((a) => a.alert_id !== alertId)];
            this.persist();
            this.addAuditLog(`DISPATCH HIGH ALERT [${alertId}]`, 'CHECKPOINT-03', 'FLAGGED', 'ANPR Vehicle Scenario');
            this.notifySubscribers('ALERT', createdAlert);
          }

          if (onStepUpdate) {
            onStepUpdate({
              stepNumber: currentStep + 1,
              totalSteps: steps.length,
              title: s.title,
              detail: s.detail,
              incidentCreated: createdAlert,
            });
          }

          this.notifySubscribers('SCENARIO_STEP', {
            scenarioId,
            stepNumber: currentStep + 1,
            totalSteps: steps.length,
            title: s.title,
            detail: s.detail,
          });

          currentStep++;
        } else {
          clearInterval(this.scenarioInterval);
          this.scenarioInterval = null;
        }
      }, 1200);

    } else if (scenarioId === 3) {
      // SCENARIO 03: NIGHT MOVEMENT (Riverine / low light corridor)
      const steps = [
        {
          title: 'CLAHE LOW-LIGHT ENHANCEMENT ENGAGED',
          detail: 'Thermal camera CAM-04 detected movement in dark sector of riverine crossing at 03:14 IST.',
          det: {
            camera_id: 'cam-04',
            frame_ts: new Date().toISOString(),
            object_type: 'vehicle' as const,
            confidence: 0.89,
            bbox: [310, 260, 620, 540] as [number, number, number, number],
            track_id: 'TRK-CAM04-009',
            speed_kmh: 12.4,
          },
        },
        {
          title: 'TRACK PERSISTED ACROSS RIVERINE BUFFER',
          detail: 'Continuous trajectory verified traversing between boundary marker 88 and marker 91.',
          det: {
            camera_id: 'cam-04',
            frame_ts: new Date().toISOString(),
            object_type: 'vehicle' as const,
            confidence: 0.92,
            bbox: [340, 290, 650, 570] as [number, number, number, number],
            track_id: 'TRK-CAM04-009',
            speed_kmh: 14.1,
          },
        },
        {
          title: 'RESTRICTED NIGHT WINDOW EVALUATION → ESCALATED AUDIT',
          detail: 'Active hours policy violation (22:00–05:00 restricted hours). Correlated event logged.',
          det: null,
        },
      ];

      let currentStep = 0;
      this.scenarioInterval = setInterval(() => {
        if (currentStep < steps.length) {
          const s = steps[currentStep];
          if (s.det) {
            this.notifySubscribers('DETECTION', s.det);
          }

          if (onStepUpdate) {
            onStepUpdate({
              stepNumber: currentStep + 1,
              totalSteps: steps.length,
              title: s.title,
              detail: s.detail,
            });
          }

          this.notifySubscribers('SCENARIO_STEP', {
            scenarioId,
            stepNumber: currentStep + 1,
            totalSteps: steps.length,
            title: s.title,
            detail: s.detail,
          });

          currentStep++;
        } else {
          clearInterval(this.scenarioInterval);
          this.scenarioInterval = null;
        }
      }, 1200);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const mockServer = new MockServer();
