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
  const [mapMode, setMapMode] = useState<'schematic' | 'thermal' | 'satellite'>('schematic');

  // Hardcoded map positions for standard cameras for schematic visualization
  const cameraMapCoords: Record<string, { x: number; y: number; angle: number; zone: string }> = {
    'cam-01': { x: 22, y: 35, angle: 45, zone: 'BOP-ALPHA-01' },
    'cam-02': { x: 48, y: 65, angle: -30, zone: 'CHECKPOST-BRAVO' },
    'cam-03': { x: 74, y: 28, angle: 120, zone: 'PATROL-CORRIDOR-C' },
    'cam-04': { x: 82, y: 72, angle: -135, zone: 'RIVERINE-DELTA' },
  };

  return (
    <div className="relative w-full h-full min-h-[380px] bg-[var(--bg-panel)] border border-[var(--border-tactical)] rounded flex flex-col overflow-hidden select-none transition-colors">
      {/* Map Control Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--bg-panel-elevated)] border-b border-[var(--border-tactical)]">
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <Crosshair className="w-3.5 h-3.5 text-cyan-500" />
          <span className="font-bold text-[var(--text-primary)] uppercase tracking-wider">SECTOR TACTICAL SCHEMATIC</span>
          <span className="text-[var(--text-muted)] text-[10px] hidden sm:inline">| GRID: 44R-EQ-9921</span>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[10px]">
          <div className="flex items-center bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded p-0.5">
            <button
              onClick={() => setMapMode('schematic')}
              className={`px-2 py-0.5 rounded cursor-pointer ${
                mapMode === 'schematic' ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-700/60' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              SCHEMATIC
            </button>
            <button
              onClick={() => setMapMode('thermal')}
              className={`px-2 py-0.5 rounded cursor-pointer ${
                mapMode === 'thermal' ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-700/60' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              IR HEAT
            </button>
            <button
              onClick={() => setMapMode('satellite')}
              className={`px-2 py-0.5 rounded cursor-pointer ${
                mapMode === 'satellite' ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-700/60' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              SATELLITE
            </button>
          </div>
        </div>
      </div>

      {/* Main Schematic Display Area */}
      <div className="relative flex-1 bg-[var(--bg-panel-elevated)] overflow-hidden transition-colors">
        {/* Vector Grid Background */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.15) 0%, transparent 70%),
              linear-gradient(rgba(30, 58, 138, 0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(30, 58, 138, 0.15) 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 30px 30px, 30px 30px',
          }}
        ></div>

        {/* Sector Fences & Border Line SVG */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
          {/* Border Line */}
          <path
            d="M 10 120 Q 200 40 400 160 T 800 100 T 1200 180"
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
            strokeDasharray="6 4"
            opacity="0.8"
          />
          <text x="120" y="70" fill="#ef4444" fontSize="10" fontFamily="monospace" fontWeight="bold">
            [ INTERNATIONAL BORDER FENCE LINE ]
          </text>

          {/* Buffer Zone Polygon */}
          <polygon
            points="150,80 450,180 750,110 650,280 250,260"
            fill="rgba(245, 158, 11, 0.08)"
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <text x="320" y="220" fill="#f59e0b" fontSize="10" fontFamily="monospace" fontWeight="bold">
            RESTRICTED BUFFER ZONE-A
          </text>

          {/* Secondary Patrol Path */}
          <path
            d="M 50 320 L 350 280 L 650 340 L 950 290"
            fill="none"
            stroke="#06b6d4"
            strokeWidth="1"
            strokeDasharray="2 2"
            opacity="0.5"
          />
        </svg>

        {/* Render Camera Nodes with FOV Cones */}
        {cameras.map((cam) => {
          const coords = cameraMapCoords[cam.camera_id] || { x: 30, y: 50, angle: 0, zone: cam.location_code };
          const isSelected = selectedCameraId === cam.camera_id;
          const hasAlert = alerts.some((a) => a.camera_id === cam.camera_id && a.status === 'new');

          return (
            <div
              key={cam.camera_id}
              style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
              onClick={() => onSelectCamera(cam)}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 group"
            >
              {/* Camera FOV Vision Cone Visualizer */}
              <div
                className={`absolute top-1/2 left-1/2 w-28 h-28 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-opacity ${
                  isSelected ? 'opacity-80' : 'opacity-30 group-hover:opacity-60'
                }`}
                style={{
                  background: hasAlert
                    ? 'radial-gradient(circle at center, rgba(239, 68, 68, 0.4) 0%, transparent 70%)'
                    : 'radial-gradient(circle at center, rgba(6, 182, 212, 0.3) 0%, transparent 70%)',
                }}
              ></div>

              {/* Camera Node Icon */}
              <div
                className={`relative flex items-center justify-center w-8 h-8 rounded-full border transition-all ${
                  hasAlert
                    ? 'bg-red-950/90 border-red-500 text-red-400 animate-pulse-critical'
                    : isSelected
                    ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                    : 'bg-[var(--bg-panel)] border-[var(--border-tactical)] text-[var(--text-secondary)] group-hover:border-cyan-500/60 group-hover:text-[var(--text-primary)]'
                }`}
              >
                <Video className="w-4 h-4" />

                {hasAlert && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                )}
              </div>

              {/* Camera ID Tooltip Label */}
              <div className="absolute top-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] px-2 py-0.5 rounded text-[10px] font-mono text-[var(--text-primary)] shadow-md">
                <span className="font-bold text-cyan-500">{cam.name}</span>
                <span className="text-[9px] text-[var(--text-secondary)] block">{coords.zone}</span>
              </div>
            </div>
          );
        })}

        {/* Active Threats Pinpoint Markers */}
        {alerts
          .filter((a) => a.status === 'new')
          .slice(0, 3)
          .map((alert, idx) => {
            const coords = cameraMapCoords[alert.camera_id] || { x: 40 + idx * 15, y: 40 + idx * 10 };
            return (
              <div
                key={alert.alert_id}
                style={{ left: `${coords.x + 4}%`, top: `${coords.y - 6}%` }}
                onClick={() => onSelectAlert && onSelectAlert(alert)}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 animate-bounce"
              >
                <div className="flex items-center gap-1 bg-red-950 border border-red-500 text-red-300 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shadow-lg">
                  <ShieldAlert className="w-3 h-3 text-red-400" />
                  <span>BREACH #{alert.alert_id.slice(-4)}</span>
                </div>
              </div>
            );
          })}

        {/* Compass & Scale Overlay */}
        <div className="absolute bottom-3 left-3 bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] px-2 py-1 rounded text-[10px] font-mono text-[var(--text-secondary)] flex items-center gap-2 select-none shadow">
          <Navigation className="w-3.5 h-3.5 text-cyan-500" />
          <span>N 0°0'0"</span>
          <span className="text-[var(--border-tactical)]">|</span>
          <span>1 : 5,000 M</span>
        </div>

        {/* Legend Overlay */}
        <div className="absolute bottom-3 right-3 bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] p-2 rounded text-[10px] font-mono text-[var(--text-primary)] flex items-center gap-3 shadow">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>ACTIVE CAM</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span>BREACH ALERT</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-amber-500"></span>
            <span>BUFFER ZONE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
