import React, { useState, useEffect } from 'react';
import type { Camera, Zone } from '../types/bavis';
import { api } from '../api/client';
import { useAlerts } from '../context/AlertContext';
import { OperationalMap } from './OperationalMap';
import { RealtimeAlertPanel } from './RealtimeAlertPanel';
import { CameraTile } from './CameraTile';
import { ShieldAlert, Video, Eye, ShieldCheck } from 'lucide-react';

interface CommandOverviewProps {
  onNavigateToCameraMatrix: () => void;
  onNavigateToIncidents: () => void;
  onOpenZoneEditorForCam: (camera: Camera) => void;
}

export const CommandOverview: React.FC<CommandOverviewProps> = ({
  onNavigateToCameraMatrix,
  onNavigateToIncidents,
  onOpenZoneEditorForCam,
}) => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);

  const { alerts, latestDetection } = useAlerts();

  useEffect(() => {
    const loadData = async () => {
      try {
        const camData = await api.getCameras();
        const zoneData = await api.getZones();
        setCameras(camData);
        setZones(zoneData);
        if (camData.length > 0) {
          setSelectedCamera(camData[0]);
        }
      } catch (err) {
        console.error('Failed to load COP data:', err);
      }
    };
    loadData();
  }, []);

  const activeDetections = latestDetection ? [latestDetection] : [];

  return (
    <div className="flex flex-col gap-3 h-full overflow-hidden select-none">
      
      {/* COP Operational Metric Header Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[var(--bg-panel)] border border-[var(--border-tactical)] p-2.5 rounded flex items-center justify-between transition-colors">
          <div>
            <span className="text-[10px] font-mono text-[var(--text-secondary)] block uppercase">CAMERAS ONLINE</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold font-mono text-[var(--text-primary)]">{cameras.length}</span>
              <span className="text-xs font-mono text-emerald-500 font-semibold">/ {cameras.length + 4} ACTIVE</span>
            </div>
          </div>
          <div className="p-2 rounded bg-emerald-950/20 border border-emerald-800/40 text-emerald-500">
            <Video className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[var(--bg-panel)] border border-[var(--border-tactical)] p-2.5 rounded flex items-center justify-between transition-colors">
          <div>
            <span className="text-[10px] font-mono text-[var(--text-secondary)] block uppercase">ACTIVE AI TRACKS</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold font-mono text-cyan-500">17</span>
              <span className="text-xs font-mono text-cyan-600">OBJECTS</span>
            </div>
          </div>
          <div className="p-2 rounded bg-cyan-950/20 border border-cyan-800/40 text-cyan-500">
            <Eye className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[var(--bg-panel)] border border-[var(--border-tactical)] p-2.5 rounded flex items-center justify-between transition-colors">
          <div>
            <span className="text-[10px] font-mono text-[var(--text-secondary)] block uppercase">OPEN BREACH ALERTS</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold font-mono text-red-500">
                {alerts.filter((a) => a.status === 'new').length}
              </span>
              <span className="text-xs font-mono text-red-600">PRIORITY</span>
            </div>
          </div>
          <div className="p-2 rounded bg-red-950/20 border border-red-800/40 text-red-500 animate-pulse">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[var(--bg-panel)] border border-[var(--border-tactical)] p-2.5 rounded flex items-center justify-between transition-colors">
          <div>
            <span className="text-[10px] font-mono text-[var(--text-secondary)] block uppercase">SYSTEM HEALTH INDEX</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold font-mono text-emerald-500">99.98%</span>
              <span className="text-xs font-mono text-emerald-600">NOMINAL</span>
            </div>
          </div>
          <div className="p-2 rounded bg-emerald-950/20 border border-emerald-800/40 text-emerald-500">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Center Grid: Map & Priority Alert Rail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0 overflow-hidden">
        
        {/* Left 8 Cols: Operational Tactical Schematic Map */}
        <div className="lg:col-span-8 flex flex-col h-full overflow-hidden">
          <OperationalMap
            cameras={cameras}
            alerts={alerts}
            selectedCameraId={selectedCamera?.camera_id}
            onSelectCamera={(cam) => setSelectedCamera(cam)}
            onSelectAlert={() => onNavigateToIncidents()}
          />
        </div>

        {/* Right 4 Cols: Priority Alert Rail */}
        <div className="lg:col-span-4 flex flex-col h-full overflow-hidden">
          <RealtimeAlertPanel />
        </div>

      </div>

      {/* Bottom Live Surveillance Camera Strip */}
      <div className="bg-[var(--bg-panel)] border border-[var(--border-tactical)] rounded p-2.5 flex flex-col gap-2 shrink-0 transition-colors">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Video className="w-3.5 h-3.5 text-cyan-500" />
            <h3 className="text-xs font-bold font-mono text-[var(--text-primary)] uppercase tracking-wider">
              LIVE SURVEILLANCE FEED STRIP
            </h3>
          </div>

          <button
            onClick={onNavigateToCameraMatrix}
            className="text-[11px] font-mono text-cyan-500 hover:text-cyan-600 font-bold underline cursor-pointer"
          >
            VIEW FULL SURVEILLANCE MATRIX →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {cameras.slice(0, 4).map((cam) => (
            <div key={cam.camera_id} className="h-48">
              <CameraTile
                camera={cam}
                detections={activeDetections}
                zones={zones}
                onOpenZoneEditor={onOpenZoneEditorForCam}
                onMaximize={(c) => {
                  setSelectedCamera(c);
                  onNavigateToCameraMatrix();
                }}
              />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
