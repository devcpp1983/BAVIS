import React, { useState } from 'react';
import type { Camera, Alert, Zone, Point2D, RuleType, SeverityLevel } from '../types/bavis';
import {
  ShieldAlert,
  Video,
  Navigation,
  Crosshair,
  Plus,
  Layers,
  Check,
  X,
} from 'lucide-react';

interface OperationalMapProps {
  cameras: Camera[];
  alerts: Alert[];
  zones?: Zone[];
  selectedCameraId?: string;
  onSelectCamera: (cam: Camera) => void;
  onSelectAlert?: (alert: Alert) => void;
  onSaveZone?: (zone: Partial<Zone>) => void;
  interactiveDrawingAllowed?: boolean;
}

export const OperationalMap: React.FC<OperationalMapProps> = ({
  cameras,
  alerts,
  zones = [],
  selectedCameraId,
  onSelectCamera,
  onSelectAlert,
  onSaveZone,
  interactiveDrawingAllowed = true,
}) => {
  const [mapMode, setMapMode] = useState<'operational' | 'satellite' | 'terrain' | 'thermal'>('operational');
  const [isDrawingZone, setIsDrawingZone] = useState<boolean>(false);
  const [newZonePoints, setNewZonePoints] = useState<Point2D[]>([]);
  const [showZoneModal, setShowZoneModal] = useState<boolean>(false);

  // Zone creation form state
  const [newZoneName, setNewZoneName] = useState<string>('Restricted Sector Alpha');
  const [newZoneType, setNewZoneType] = useState<RuleType>('virtual_fence_breach');
  const [newZoneSeverity, setNewZoneSeverity] = useState<SeverityLevel>('high');
  const [newZoneDwell, setNewZoneDwell] = useState<number>(15);
  const [newZoneHours, setNewZoneHours] = useState<string>('22:00 — 05:00');
  const [newZoneCam, setNewZoneCam] = useState<string>('cam-01');
  const [rulePerson, setRulePerson] = useState<boolean>(true);
  const [ruleVehicle, setRuleVehicle] = useState<boolean>(true);
  const [ruleLoiter, setRuleLoiter] = useState<boolean>(false);

  // Sector geographic coordinates for cameras
  const cameraMapCoords: Record<string, { x: number; y: number; angle: number; zone: string; sector: string }> = {
    'cam-01': { x: 22, y: 36, angle: 45, zone: 'Zone North Buffer', sector: 'BOP-N01' },
    'cam-02': { x: 48, y: 64, angle: -30, zone: 'Inspection Bay', sector: 'CHECKPOINT-03' },
    'cam-03': { x: 74, y: 30, angle: 120, zone: 'Patrol Corridor C', sector: 'BOP-N02' },
    'cam-04': { x: 86, y: 76, angle: -135, zone: 'Riverine Waterway', sector: 'SECTOR-DELTA' },
  };

  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawingZone) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Number(((e.clientX - rect.left) / rect.width).toFixed(3));
    const y = Number(((e.clientY - rect.top) / rect.height).toFixed(3));

    if (newZonePoints.length < 8) {
      setNewZonePoints((prev) => [...prev, { x, y }]);
    }
  };

  const handleCompletePolygon = () => {
    if (newZonePoints.length < 3) {
      alert('Click at least 3 points on the map to define a polygon boundary.');
      return;
    }
    setShowZoneModal(true);
  };

  const handleConfirmSaveZone = () => {
    if (!onSaveZone) return;
    onSaveZone({
      zone_id: `zone-${Date.now()}`,
      name: newZoneName,
      camera_id: newZoneCam,
      rule_type: newZoneType,
      severity: newZoneSeverity,
      dwell_threshold_sec: newZoneDwell,
      active_hours: newZoneHours,
      rule_person: rulePerson,
      rule_vehicle: ruleVehicle,
      rule_loiter: ruleLoiter,
      points: newZonePoints,
      active: true,
      created_at: new Date().toISOString(),
      created_by: 'Inspector A. Sharma',
    });

    setIsDrawingZone(false);
    setNewZonePoints([]);
    setShowZoneModal(false);
  };

  const handleCancelDrawing = () => {
    setIsDrawingZone(false);
    setNewZonePoints([]);
    setShowZoneModal(false);
  };

  return (
    <div className="relative w-full h-full min-h-[380px] bg-[var(--bg-panel)] border border-[var(--border-tactical)] rounded flex flex-col overflow-hidden select-none font-mono">
      {/* 1. Top GIS Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-1.5 bg-[var(--bg-panel-elevated)] border-b border-[var(--border-tactical)] gap-2">
        <div className="flex items-center gap-2 text-xs">
          <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold text-[var(--text-primary)] uppercase tracking-wider">
            GEOSPATIAL OPERATIONS MAP (GIS SECTOR COP)
          </span>
          <span className="text-[10px] text-[var(--text-muted)] hidden md:inline">
            | LAT 28°14'N LONG 82°04'E • GRID 44R-EQ-9921
          </span>
        </div>

        <div className="flex items-center gap-2 text-[10px]">
          {/* Interactive Boundary Drawing Toggle */}
          {interactiveDrawingAllowed && onSaveZone && (
            <div className="flex items-center gap-1">
              {!isDrawingZone ? (
                <button
                  onClick={() => setIsDrawingZone(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-950 border border-cyan-600 text-cyan-300 font-bold hover:bg-cyan-900 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>CREATE VIRTUAL BOUNDARY</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 bg-red-950/80 border border-red-500/80 px-2 py-0.5 rounded text-red-200">
                  <span className="font-bold text-[9px] animate-pulse">DRAWING ({newZonePoints.length} PTS)</span>
                  <button
                    onClick={handleCompletePolygon}
                    disabled={newZonePoints.length < 3}
                    className="px-1.5 py-0.2 rounded bg-emerald-900 text-emerald-200 font-bold hover:bg-emerald-800 disabled:opacity-40 cursor-pointer"
                  >
                    CLOSE & SAVE
                  </button>
                  <button
                    onClick={handleCancelDrawing}
                    className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                  >
                    CANCEL
                  </button>
                </div>
              )}
            </div>
          )}

          {/* GIS Layer Switcher */}
          <div className="flex items-center bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded p-0.5">
            <button
              onClick={() => setMapMode('operational')}
              className={`px-2 py-0.5 rounded cursor-pointer ${
                mapMode === 'operational'
                  ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-700/60'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              OPERATIONAL
            </button>
            <button
              onClick={() => setMapMode('satellite')}
              className={`px-2 py-0.5 rounded cursor-pointer ${
                mapMode === 'satellite'
                  ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-700/60'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              SATELLITE
            </button>
            <button
              onClick={() => setMapMode('terrain')}
              className={`px-2 py-0.5 rounded cursor-pointer ${
                mapMode === 'terrain'
                  ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-700/60'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              TERRAIN
            </button>
            <button
              onClick={() => setMapMode('thermal')}
              className={`px-2 py-0.5 rounded cursor-pointer ${
                mapMode === 'thermal'
                  ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-700/60'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              IR HEAT
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Geospatial Display Surface */}
      <div className="relative flex-1 bg-[var(--bg-panel-elevated)] overflow-hidden">
        {/* Layer Mode Dynamic Backgrounds */}
        {mapMode === 'satellite' && (
          <div
            className="absolute inset-0 opacity-40 pointer-events-none bg-cover bg-center"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1600&q=80')`,
            }}
          ></div>
        )}

        {mapMode === 'terrain' && (
          <div
            className="absolute inset-0 opacity-25 pointer-events-none"
            style={{
              backgroundImage: `
                radial-gradient(circle at 30% 40%, rgba(34, 197, 94, 0.15) 0%, transparent 60%),
                radial-gradient(circle at 70% 30%, rgba(234, 179, 8, 0.12) 0%, transparent 50%),
                linear-gradient(rgba(14, 116, 144, 0.15) 1px, transparent 1px),
                linear-gradient(90deg, rgba(14, 116, 144, 0.15) 1px, transparent 1px)
              `,
              backgroundSize: '100% 100%, 100% 100%, 24px 24px, 24px 24px',
            }}
          ></div>
        )}

        {mapMode === 'thermal' && (
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage: `
                radial-gradient(circle at 25% 40%, rgba(239, 68, 68, 0.3) 0%, transparent 40%),
                radial-gradient(circle at 50% 65%, rgba(245, 158, 11, 0.25) 0%, transparent 45%),
                radial-gradient(circle at 75% 30%, rgba(6, 182, 212, 0.2) 0%, transparent 45%)
              `,
            }}
          ></div>
        )}

        {/* Tactical Vector Topography SVG */}
        <svg
          className="absolute inset-0 w-full h-full z-0"
          onClick={handleMapClick}
          style={{ cursor: isDrawingZone ? 'crosshair' : 'default' }}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Topographic Elevation Ridgeline Contours */}
          <path
            d="M 0 60 Q 200 20 400 70 T 800 50 T 1200 80"
            fill="none"
            stroke="#334155"
            strokeWidth="1"
            opacity="0.5"
          />
          <path
            d="M 0 140 Q 250 80 500 150 T 900 110 T 1200 160"
            fill="none"
            stroke="#334155"
            strokeWidth="1"
            opacity="0.4"
          />
          <path
            d="M 0 220 Q 300 180 600 240 T 1000 200 T 1200 250"
            fill="none"
            stroke="#334155"
            strokeWidth="1"
            opacity="0.3"
          />

          {/* River / Waterway Buffer (Riverine Sector Delta) */}
          <path
            d="M 780 400 Q 820 280 870 180 T 980 0"
            fill="none"
            stroke="#0284c7"
            strokeWidth="16"
            opacity="0.25"
          />
          <text x="850" y="320" fill="#38bdf8" fontSize="8" fontFamily="monospace" opacity="0.8">
            [ RIVERINE WATERWAY SECTOR DELTA ]
          </text>

          {/* INTERNATIONAL ZERO LINE / BORDER WIRE */}
          <path
            d="M 10 90 Q 240 35 480 120 T 820 80 T 1200 140"
            fill="none"
            stroke="#ef4444"
            strokeWidth="2.5"
            strokeDasharray="6 4"
            opacity="0.9"
          />
          <text x="130" y="55" fill="#ef4444" fontSize="10" fontFamily="monospace" fontWeight="bold">
            ═════════════════ [ INTERNATIONAL BORDER ZERO LINE ] ═════════════════
          </text>

          {/* Primary Patrol Road / Service Conduit */}
          <path
            d="M 20 280 L 260 250 L 500 290 L 760 240 L 1100 280"
            fill="none"
            stroke="#06b6d4"
            strokeWidth="1.8"
            strokeDasharray="4 3"
            opacity="0.7"
          />
          <text x="310" y="275" fill="#22d3ee" fontSize="8" fontFamily="monospace">
            PATROL ROAD ALPHA (BORDER CONDUIT)
          </text>

          {/* Render Active Configured Zones */}
          {zones.map((z) => {
            if (!z.points || z.points.length < 3) return null;
            const pointsStr = z.points.map((p) => `${p.x * 100}% ${p.y * 100}%`).join(' ');
            const isHigh = z.severity === 'high';
            return (
              <g key={z.zone_id}>
                <polygon
                  points={pointsStr}
                  fill={isHigh ? 'rgba(239, 68, 68, 0.14)' : 'rgba(245, 158, 11, 0.14)'}
                  stroke={isHigh ? '#ef4444' : '#f59e0b'}
                  strokeWidth="1.5"
                  strokeDasharray="5 3"
                />
                <text
                  x={`${z.points[0].x * 100 + 2}%`}
                  y={`${z.points[0].y * 100 + 4}%`}
                  fill={isHigh ? '#f87171' : '#fbbf24'}
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  [{z.name.toUpperCase()}]
                </text>
              </g>
            );
          })}

          {/* User Interactively Drawing Polygon Points */}
          {isDrawingZone && newZonePoints.length > 0 && (
            <g>
              <polygon
                points={newZonePoints.map((p) => `${p.x * 100}% ${p.y * 100}%`).join(' ')}
                fill="rgba(6, 182, 212, 0.25)"
                stroke="#06b6d4"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
              {newZonePoints.map((p, idx) => (
                <circle
                  key={idx}
                  cx={`${p.x * 100}%`}
                  cy={`${p.y * 100}%`}
                  r="5"
                  fill="#06b6d4"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              ))}
            </g>
          )}

          {/* Multi-Camera Continuous Tracking Breadcrumb Vector (T-042) */}
          <g>
            {/* Movement Path Vector: CAM-01 (18:41:02) -> CAM-02 (18:41:18) -> CAM-03 (18:42:31) */}
            <path
              d="M 240 180 Q 380 230 480 250 T 730 160"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              strokeDasharray="3 3"
              opacity="0.8"
            />
            {/* Breadcrumb Steps */}
            <circle cx="240" cy="180" r="4" fill="#06b6d4" stroke="#ffffff" strokeWidth="1" />
            <text x="248" y="184" fill="#94a3b8" fontSize="8" fontFamily="monospace">
              T-042 @ CAM-01 (18:41:02)
            </text>

            <circle cx="480" cy="250" r="4" fill="#f59e0b" stroke="#ffffff" strokeWidth="1" />
            <text x="488" y="254" fill="#94a3b8" fontSize="8" fontFamily="monospace">
              T-042 @ CAM-02 (18:41:18)
            </text>

            <circle cx="730" cy="160" r="5" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" className="animate-pulse" />
            <text x="738" y="164" fill="#ef4444" fontSize="9" fontFamily="monospace" fontWeight="bold">
              ● T-042 BREACH RZ-01 @ CAM-03 (18:42:31)
            </text>
          </g>

          {/* Outpost Structures (BOPs and Checkposts) */}
          <g transform="translate(160, 220)">
            <rect width="20" height="14" fill="#0f172a" stroke="#06b6d4" strokeWidth="1" />
            <text x="24" y="11" fill="#cbd5e1" fontSize="8" fontFamily="monospace" fontWeight="bold">
              BOP-N01 (SECTOR ALPHA)
            </text>
          </g>

          <g transform="translate(460, 270)">
            <rect width="24" height="16" fill="#0f172a" stroke="#10b981" strokeWidth="1" />
            <text x="28" y="12" fill="#cbd5e1" fontSize="8" fontFamily="monospace" fontWeight="bold">
              CHECKPOINT-03 (GATE)
            </text>
          </g>

          <g transform="translate(710, 200)">
            <rect width="20" height="14" fill="#0f172a" stroke="#06b6d4" strokeWidth="1" />
            <text x="24" y="11" fill="#cbd5e1" fontSize="8" fontFamily="monospace" fontWeight="bold">
              BOP-N02 (CORRIDOR CHARLIE)
            </text>
          </g>

          {/* Watchtowers */}
          <g transform="translate(300, 110)">
            <circle cx="6" cy="6" r="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" />
            <text x="16" y="10" fill="#94a3b8" fontSize="8" fontFamily="monospace">
              WT-01 (NORTH TOWER)
            </text>
          </g>
          <g transform="translate(850, 100)">
            <circle cx="6" cy="6" r="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" />
            <text x="16" y="10" fill="#94a3b8" fontSize="8" fontFamily="monospace">
              WT-02 (RIDGELINE TOWER)
            </text>
          </g>
        </svg>

        {/* Camera Nodes with Coverage Sector Cones */}
        {cameras.map((cam) => {
          const coords = cameraMapCoords[cam.camera_id] || { x: 30, y: 50, angle: 0, zone: cam.location_code, sector: 'SECTOR' };
          const isSelected = selectedCameraId === cam.camera_id;
          const hasAlert = alerts.some((a) => a.camera_id === cam.camera_id && a.status === 'new');

          return (
            <div
              key={cam.camera_id}
              style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
              onClick={() => onSelectCamera(cam)}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 group"
            >
              {/* Field of View (FOV) Coverage Cone Visualizer */}
              <div
                className={`absolute top-1/2 left-1/2 w-28 h-28 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-opacity ${
                  isSelected ? 'opacity-90' : 'opacity-40 group-hover:opacity-75'
                }`}
                style={{
                  background: hasAlert
                    ? 'radial-gradient(circle at center, rgba(239, 68, 68, 0.45) 0%, transparent 65%)'
                    : 'radial-gradient(circle at center, rgba(6, 182, 212, 0.35) 0%, transparent 65%)',
                }}
              ></div>

              {/* Camera Icon Marker */}
              <div
                className={`relative flex items-center justify-center w-7 h-7 rounded-sm border transition-all ${
                  hasAlert
                    ? 'bg-red-950 border-red-500 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.6)]'
                    : isSelected
                    ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                    : 'bg-[var(--bg-panel)] border-[var(--border-tactical)] text-[var(--text-secondary)] group-hover:border-cyan-500 group-hover:text-[var(--text-primary)]'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                {hasAlert && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                )}
              </div>

              {/* Camera Metadata Label Tooltip */}
              <div className="absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] px-2 py-0.5 rounded text-[9px] text-[var(--text-primary)] shadow z-20">
                <span className="font-bold text-cyan-400">{cam.name.split(' ')[0]}</span>
                <span className="text-[8px] text-[var(--text-muted)] block">{coords.sector} • 25 FPS</span>
              </div>
            </div>
          );
        })}

        {/* Active Incident Pinpoint Badges */}
        {alerts
          .filter((a) => a.status === 'new')
          .slice(0, 3)
          .map((alert, idx) => {
            const coords = cameraMapCoords[alert.camera_id] || { x: 40 + idx * 15, y: 40 + idx * 10 };
            return (
              <div
                key={alert.alert_id}
                style={{ left: `${coords.x + 4}%`, top: `${coords.y - 7}%` }}
                onClick={() => onSelectAlert && onSelectAlert(alert)}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20"
              >
                <div className="flex items-center gap-1 bg-red-950 border border-red-500 text-red-200 px-2 py-0.5 rounded text-[10px] font-bold shadow hover:bg-red-900 transition-colors">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                  <span>{alert.alert_id} ({alert.rule.replace(/_/g, ' ')})</span>
                </div>
              </div>
            );
          })}

        {/* Map Information Overlays (Compass & Scale) */}
        <div className="absolute bottom-2.5 left-2.5 bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] px-2 py-1 rounded text-[9px] text-[var(--text-secondary)] flex items-center gap-2 select-none shadow z-10">
          <Navigation className="w-3 h-3 text-cyan-400" />
          <span>TRUE NORTH</span>
          <span className="text-[var(--border-tactical)]">|</span>
          <span>1 : 5,000 M</span>
        </div>

        {/* Legend Overlay */}
        <div className="absolute bottom-2.5 right-2.5 bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] p-1.5 rounded text-[9px] text-[var(--text-primary)] flex items-center gap-3 shadow z-10">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-cyan-500"></span>
            <span>CAMERA FOV</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-red-500"></span>
            <span>INCIDENT</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-0.5 bg-red-500"></span>
            <span>ZERO LINE</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-0.5 bg-cyan-500 border-dashed"></span>
            <span>TRACK T-042 PATH</span>
          </div>
        </div>
      </div>

      {/* 3. Interactive Modal for Saving Virtual Boundary (Section 5 Spec) */}
      {showZoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[var(--bg-panel)] border border-cyan-500 rounded p-3.5 space-y-3 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between border-b border-[var(--border-tactical)] pb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="font-bold text-[var(--text-primary)] uppercase text-xs">
                  CONFIGURE VIRTUAL RESTRICTED ZONE
                </h3>
              </div>
              <button
                onClick={handleCancelDrawing}
                className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] text-[var(--text-secondary)] mb-0.5 uppercase">ZONE NAME</label>
                  <input
                    type="text"
                    value={newZoneName}
                    onChange={(e) => setNewZoneName(e.target.value)}
                    className="w-full bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded px-2.5 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[9px] text-[var(--text-secondary)] mb-0.5 uppercase">ZONE CLASSIFICATION</label>
                  <select
                    value={newZoneType}
                    onChange={(e) => setNewZoneType(e.target.value as RuleType)}
                    className="w-full bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none cursor-pointer"
                  >
                    <option value="virtual_fence_breach">Restricted Entry / Fence Breach</option>
                    <option value="line_crossing">Line Crossing / Zero Line</option>
                    <option value="loitering">Loitering / Stationary Dwell</option>
                    <option value="unauthorized_vehicle">Unauthorized Vehicle Access</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] text-[var(--text-secondary)] mb-0.5 uppercase">PRIMARY CAMERA</label>
                  <select
                    value={newZoneCam}
                    onChange={(e) => setNewZoneCam(e.target.value)}
                    className="w-full bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none cursor-pointer"
                  >
                    {cameras.map((c) => (
                      <option key={c.camera_id} value={c.camera_id}>
                        {c.name.split(' ')[0]} ({c.location_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] text-[var(--text-secondary)] mb-0.5 uppercase">SEVERITY</label>
                  <select
                    value={newZoneSeverity}
                    onChange={(e) => setNewZoneSeverity(e.target.value as SeverityLevel)}
                    className="w-full bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none cursor-pointer"
                  >
                    <option value="high">HIGH (Immediate Dispatch)</option>
                    <option value="medium">MEDIUM (Warning)</option>
                    <option value="low">LOW (Audit)</option>
                  </select>
                </div>
              </div>

              {/* Rule Triggers Checkboxes */}
              <div className="p-2 rounded bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] space-y-1.5">
                <span className="block text-[9px] text-cyan-400 font-bold uppercase">SECURITY RULE TRIGGERS</span>
                <label className="flex items-center gap-2 text-[11px] text-[var(--text-primary)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rulePerson}
                    onChange={(e) => setRulePerson(e.target.checked)}
                    className="rounded border-[var(--border-tactical)] text-cyan-500 focus:ring-0"
                  />
                  <span>Person Entering Boundary</span>
                </label>
                <label className="flex items-center gap-2 text-[11px] text-[var(--text-primary)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ruleVehicle}
                    onChange={(e) => setRuleVehicle(e.target.checked)}
                    className="rounded border-[var(--border-tactical)] text-cyan-500 focus:ring-0"
                  />
                  <span>Vehicle / Transport Entering</span>
                </label>
                <label className="flex items-center gap-2 text-[11px] text-[var(--text-primary)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ruleLoiter}
                    onChange={(e) => setRuleLoiter(e.target.checked)}
                    className="rounded border-[var(--border-tactical)] text-cyan-500 focus:ring-0"
                  />
                  <span>Loitering / Stationary Dwell</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] text-[var(--text-secondary)] mb-0.5 uppercase">DWELL THRESHOLD (SEC)</label>
                  <input
                    type="number"
                    value={newZoneDwell}
                    onChange={(e) => setNewZoneDwell(Number(e.target.value))}
                    className="w-full bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] text-[var(--text-secondary)] mb-0.5 uppercase">ACTIVE WINDOW</label>
                  <input
                    type="text"
                    value={newZoneHours}
                    onChange={(e) => setNewZoneHours(e.target.value)}
                    className="w-full bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-tactical)]">
              <button
                onClick={handleCancelDrawing}
                className="px-3 py-1.5 rounded bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                CANCEL
              </button>
              <button
                onClick={handleConfirmSaveZone}
                className="flex items-center gap-1 px-3 py-1.5 rounded bg-cyan-950 border border-cyan-600 text-cyan-200 font-bold hover:bg-cyan-900 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>CREATE & PERSIST ZONE</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
