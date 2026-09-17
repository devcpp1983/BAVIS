import React, { useState, useEffect } from 'react';
import type { Camera, Zone, Alert } from '../types/bavis';
import { api } from '../api/client';
import { useAlerts } from '../context/AlertContext';
import { OperationalMap } from './OperationalMap';
import { RealtimeAlertPanel } from './RealtimeAlertPanel';
import { CameraTile } from './CameraTile';
import { ScenarioRunnerBar } from './ScenarioRunnerBar';
import { Video, ShieldAlert, Cpu, Activity, Clock, ShieldCheck } from 'lucide-react';

interface CommandOverviewProps {
  onNavigateToCameraMatrix: (cam?: Camera) => void;
  onNavigateToIncidents: (alert?: Alert) => void;
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
  const openIncidentsCount = alerts.filter((a) => a.status === 'new').length;
  const lastAlertTime = alerts.length > 0 ? new Date(alerts[0].created_at).toISOString().substring(11, 19) + ' UTC' : '18:42:11 UTC';

  return (
    <div className="flex flex-col gap-2.5 h-full overflow-y-auto select-none font-mono">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-[var(--bg-panel)] border border-[var(--border-tactical)] rounded">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
              BORDER SURVEILLANCE — COMMON OPERATING PICTURE
            </h1>
            <span className="text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-800/60 px-1.5 py-0.2 rounded font-semibold">
              SECTOR: NORTHERN BORDER / BOP NETWORK
            </span>
          </div>
          <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
            Automated sensor correlation, multi-camera tracking & virtual geofence rule evaluation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            NETWORK OPERATIONAL
          </span>
        </div>
      </div>

      {/* 2. Compact Operational Status Strip (Restrained, Information Dense) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
        <div className="bg-[var(--bg-panel)] border border-[var(--border-tactical)] px-2.5 py-1.5 rounded flex items-center justify-between">
          <div>
            <span className="text-[9px] text-[var(--text-secondary)] uppercase block">CAMERAS ONLINE</span>
            <span className="text-sm font-bold text-[var(--text-primary)]">{cameras.length} / {cameras.length}</span>
          </div>
          <Video className="w-3.5 h-3.5 text-cyan-400" />
        </div>

        <div className="bg-[var(--bg-panel)] border border-[var(--border-tactical)] px-2.5 py-1.5 rounded flex items-center justify-between">
          <div>
            <span className="text-[9px] text-[var(--text-secondary)] uppercase block">ACTIVE TRACKS</span>
            <span className="text-sm font-bold text-cyan-400">05 LIVE</span>
          </div>
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
        </div>

        <div className="bg-[var(--bg-panel)] border border-[var(--border-tactical)] px-2.5 py-1.5 rounded flex items-center justify-between">
          <div>
            <span className="text-[9px] text-[var(--text-secondary)] uppercase block">OPEN INCIDENTS</span>
            <span className="text-sm font-bold text-red-400">{openIncidentsCount} PRIORITY</span>
          </div>
          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
        </div>

        <div className="bg-[var(--bg-panel)] border border-[var(--border-tactical)] px-2.5 py-1.5 rounded flex items-center justify-between">
          <div>
            <span className="text-[9px] text-[var(--text-secondary)] uppercase block">SYSTEM HEALTH</span>
            <span className="text-sm font-bold text-emerald-400">99.4% NOMINAL</span>
          </div>
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
        </div>

        <div className="col-span-2 sm:col-span-1 bg-[var(--bg-panel)] border border-[var(--border-tactical)] px-2.5 py-1.5 rounded flex items-center justify-between">
          <div>
            <span className="text-[9px] text-[var(--text-secondary)] uppercase block">LAST EVENT</span>
            <span className="text-sm font-bold text-[var(--text-primary)]">{lastAlertTime}</span>
          </div>
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
        </div>
      </div>

      {/* 3. Scenario Runner Execution Bar */}
      <ScenarioRunnerBar
        onScenarioComplete={(incident) => {
          onNavigateToIncidents(incident);
        }}
      />

      {/* 4. Main Center Grid: Tactical Map & Priority Alert Rail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 flex-1 min-h-[380px]">
        {/* Left 8 Cols: Operational Tactical Schematic Map */}
        <div className="lg:col-span-8 flex flex-col h-full overflow-hidden">
          <OperationalMap
            cameras={cameras}
            alerts={alerts}
            selectedCameraId={selectedCamera?.camera_id}
            onSelectCamera={(cam) => setSelectedCamera(cam)}
            onSelectAlert={(alert) => onNavigateToIncidents(alert)}
          />
        </div>

        {/* Right 4 Cols: Priority Alert Rail */}
        <div className="lg:col-span-4 flex flex-col h-full overflow-hidden">
          <RealtimeAlertPanel />
        </div>
      </div>

      {/* 5. Bottom Live Surveillance Camera Strip */}
      <div className="bg-[var(--bg-panel)] border border-[var(--border-tactical)] rounded p-2.5 flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Video className="w-3.5 h-3.5 text-cyan-400" />
            <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
              SECTOR SURVEILLANCE FEED STRIP
            </h3>
          </div>

          <button
            onClick={() => onNavigateToCameraMatrix()}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-bold underline cursor-pointer"
          >
            VIEW FULL SURVEILLANCE MATRIX →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
          {cameras.slice(0, 4).map((cam) => (
            <div key={cam.camera_id} className="h-44">
              <CameraTile
                camera={cam}
                detections={activeDetections}
                zones={zones}
                onOpenZoneEditor={onOpenZoneEditorForCam}
                onMaximize={(c) => {
                  setSelectedCamera(c);
                  onNavigateToCameraMatrix(c);
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
