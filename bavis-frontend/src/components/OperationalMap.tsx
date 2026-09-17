import React, { useState } from 'react';
import type { Camera, Alert } from '../types/bavis';
import { ShieldAlert, Video, Navigation, Crosshair } from 'lucide-react';

interface OperationalMapProps {
  cameras: Camera[];
  alerts: Alert[];
  selectedCameraId?: string;
  onSelectCamera: (cam: Camera) => void;
  onSelectAlert?: (alert: Alert) => void;
}

export const OperationalMap: React.FC<OperationalMapProps> = ({
  cameras,
  alerts,
  selectedCameraId,
  onSelectCamera,
  onSelectAlert,
}) => {
  const [mapMode, setMapMode] = useState<'schematic' | 'thermal' | 'grid'>('schematic');

  // Hardcoded coordinates for the northern border sector schematic
  const cameraMapCoords: Record<string, { x: number; y: number; angle: number; zone: string; sector: string }> = {
    'cam-01': { x: 24, y: 38, angle: 45, zone: 'Zone North Buffer', sector: 'BOP-N01' },
    'cam-02': { x: 50, y: 64, angle: -30, zone: 'Inspection Bay', sector: 'CHECKPOINT-03' },
    'cam-03': { x: 72, y: 32, angle: 120, zone: 'Patrol Corridor C', sector: 'BOP-N02' },
    'cam-04': { x: 84, y: 76, angle: -135, zone: 'Riverine Waterway', sector: 'SECTOR-DELTA' },
  };

  return (
    <div className="relative w-full h-full min-h-[360px] bg-[var(--bg-panel)] border border-[var(--border-tactical)] rounded flex flex-col overflow-hidden select-none font-mono">
      {/* Map Control Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--bg-panel-elevated)] border-b border-[var(--border-tactical)]">
        <div className="flex items-center gap-2 text-xs">
          <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold text-[var(--text-primary)] uppercase tracking-wider">
            BORDER SECTOR COMMON OPERATING PICTURE
          </span>
          <span className="text-[var(--text-muted)] text-[10px] hidden sm:inline">
            | SECTOR GRID: 44R-EQ-9921
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[10px]">
          <div className="flex items-center bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded p-0.5">
            <button
              onClick={() => setMapMode('schematic')}
              className={`px-2 py-0.5 rounded cursor-pointer ${
                mapMode === 'schematic'
                  ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-700/60'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              SCHEMATIC
            </button>
            <button
              onClick={() => setMapMode('thermal')}
              className={`px-2 py-0.5 rounded cursor-pointer ${
                mapMode === 'thermal'
                  ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-700/60'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              IR / HEAT
            </button>
            <button
              onClick={() => setMapMode('grid')}
              className={`px-2 py-0.5 rounded cursor-pointer ${
                mapMode === 'grid'
                  ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-700/60'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              TACTICAL GRID
            </button>
          </div>
        </div>
      </div>

      {/* Main Tactical Map SVG / Canvas */}
      <div className="relative flex-1 bg-[var(--bg-panel-elevated)] overflow-hidden">
        {/* Fine Subdued Grid Lines */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(14, 116, 144, 0.2) 1px, transparent 1px),
              linear-gradient(90deg, rgba(14, 116, 144, 0.2) 1px, transparent 1px)
            `,
            backgroundSize: '28px 28px',
          }}
        ></div>

        {/* Operational Border Schematics (Zero Line, Roads, Outposts) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
          {/* International Border Zero Line */}
          <path
            d="M 20 100 Q 250 40 480 130 T 820 90 T 1200 150"
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
            strokeDasharray="6 4"
            opacity="0.85"
          />
          <text x="140" y="65" fill="#ef4444" fontSize="10" fontFamily="monospace" fontWeight="bold">
            [ INTERNATIONAL ZERO LINE / BORDER WIRE ]
          </text>

          {/* BOP-N01 Restricted Buffer Polygon */}
          <polygon
            points="120,70 380,140 360,260 140,240"
            fill="rgba(239, 68, 68, 0.08)"
            stroke="#ef4444"
            strokeWidth="1.2"
            strokeDasharray="4 3"
          />
          <text x="170" y="210" fill="#f87171" fontSize="9" fontFamily="monospace" opacity="0.9">
            ZONE-101 (BUFFER CORRIDOR)
          </text>

          {/* BOP-N02 Night Dwell Polygon */}
          <polygon
            points="580,75 880,120 840,230 620,210"
            fill="rgba(245, 158, 11, 0.08)"
            stroke="#f59e0b"
            strokeWidth="1.2"
            strokeDasharray="4 3"
          />
          <text x="640" y="170" fill="#fbbf24" fontSize="9" fontFamily="monospace" opacity="0.9">
            ZONE-103 (NIGHT DWELL CORRIDOR)
          </text>

          {/* Patrol Road / Service Conduit */}
          <path
            d="M 40 300 L 280 270 L 520 310 L 780 260 L 1050 300"
            fill="none"
            stroke="#06b6d4"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            opacity="0.6"
          />
          <text x="320" y="295" fill="#06b6d4" fontSize="9" fontFamily="monospace">
            PATROL ROAD ALPHA (SERVICE CONDUIT)
          </text>

          {/* Outpost Base Structures */}
          <g transform="translate(180, 240)">
            <rect width="18" height="14" fill="#0e1722" stroke="#38bdf8" strokeWidth="1" />
            <text x="24" y="11" fill="#94a3b8" fontSize="8" fontFamily="monospace">
              BOP-N01
            </text>
          </g>

          <g transform="translate(480, 290)">
            <rect width="22" height="16" fill="#0e1722" stroke="#10b981" strokeWidth="1" />
            <text x="28" y="12" fill="#94a3b8" fontSize="8" fontFamily="monospace">
              CHECKPOINT-03
            </text>
          </g>

          <g transform="translate(740, 220)">
            <rect width="18" height="14" fill="#0e1722" stroke="#38bdf8" strokeWidth="1" />
            <text x="24" y="11" fill="#94a3b8" fontSize="8" fontFamily="monospace">
              BOP-N02
            </text>
          </g>
        </svg>

        {/* Camera Nodes with Vision Coverage Cones */}
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
              {/* Field of View (FOV) Coverage Arc */}
              <div
                className={`absolute top-1/2 left-1/2 w-24 h-24 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-opacity ${
                  isSelected ? 'opacity-80' : 'opacity-30 group-hover:opacity-60'
                }`}
                style={{
                  background: hasAlert
                    ? 'radial-gradient(circle at center, rgba(239, 68, 68, 0.4) 0%, transparent 65%)'
                    : 'radial-gradient(circle at center, rgba(6, 182, 212, 0.3) 0%, transparent 65%)',
                }}
              ></div>

              {/* Camera Marker */}
              <div
                className={`relative flex items-center justify-center w-7 h-7 rounded-sm border transition-all ${
                  hasAlert
                    ? 'bg-red-950/90 border-red-500 text-red-400'
                    : isSelected
                    ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                    : 'bg-[var(--bg-panel)] border-[var(--border-tactical)] text-[var(--text-secondary)] group-hover:border-cyan-500/60 group-hover:text-[var(--text-primary)]'
                }`}
              >
                <Video className="w-3.5 h-3.5" />

                {hasAlert && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                )}
              </div>

              {/* Camera Label */}
              <div className="absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] px-1.5 py-0.5 rounded text-[9px] font-mono text-[var(--text-primary)] shadow">
                <span className="font-bold text-cyan-400">{cam.name.split(' ')[0]}</span>
                <span className="text-[8px] text-[var(--text-muted)] block">{coords.sector}</span>
              </div>
            </div>
          );
        })}

        {/* Active Incident Pinpoint Badges */}
        {alerts
          .filter((a) => a.status === 'new')
          .slice(0, 3)
          .map((alert) => {
            const coords = cameraMapCoords[alert.camera_id] || { x: 45, y: 45 };
            return (
              <div
                key={alert.alert_id}
                style={{ left: `${coords.x + 3}%`, top: `${coords.y - 7}%` }}
                onClick={() => onSelectAlert && onSelectAlert(alert)}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20"
              >
                <div className="flex items-center gap-1 bg-red-950 border border-red-500 text-red-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold shadow hover:bg-red-900 transition-colors">
                  <ShieldAlert className="w-3 h-3 text-red-400" />
                  <span>{alert.alert_id}</span>
                </div>
              </div>
            );
          })}

        {/* Tactical Compass & Scale */}
        <div className="absolute bottom-2.5 left-2.5 bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] px-2 py-1 rounded text-[9px] font-mono text-[var(--text-secondary)] flex items-center gap-2 select-none shadow">
          <Navigation className="w-3 h-3 text-cyan-400" />
          <span>TRUE NORTH</span>
          <span className="text-[var(--border-tactical)]">|</span>
          <span>SCALE: 1 : 5,000 M</span>
        </div>

        {/* Legend Overlay */}
        <div className="absolute bottom-2.5 right-2.5 bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] p-1.5 rounded text-[9px] font-mono text-[var(--text-primary)] flex items-center gap-2.5 shadow">
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
        </div>
      </div>
    </div>
  );
};
