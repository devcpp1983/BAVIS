import React, { useState } from 'react';
import type { Camera, Detection, Zone, VisionMode } from '../types/bavis';
import { VideoCanvasRenderer } from './VideoCanvasRenderer';
import { Sun, Moon, Eye, Maximize2, MapPin, Activity, AlertTriangle } from 'lucide-react';
import { useAlerts } from '../context/AlertContext';

interface CameraTileProps {
  camera: Camera;
  detections: Detection[];
  zones?: Zone[];
  onOpenZoneEditor?: (camera: Camera) => void;
  onMaximize?: (camera: Camera) => void;
}

export const CameraTile: React.FC<CameraTileProps> = ({
  camera,
  detections,
  zones = [],
  onOpenZoneEditor,
  onMaximize,
}) => {
  const [currentMode, setCurrentMode] = useState<VisionMode>(camera.vision_mode);
  const { triggerDemoAlert } = useAlerts();

  const camDetections = detections.filter((d) => d.camera_id === camera.camera_id);

  return (
    <div className="group relative flex flex-col bg-[var(--bg-panel)] border border-[var(--border-tactical)] rounded overflow-hidden select-none h-full hover:border-[var(--border-highlight)] transition-all">
      {/* Tile Header Bar */}
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-[var(--bg-panel-elevated)] border-b border-[var(--border-tactical)] transition-colors">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold font-mono text-[var(--text-primary)] truncate">{camera.name}</span>
          <span className="text-[9px] font-mono text-cyan-600 bg-cyan-950/40 px-1 py-0.2 rounded border border-cyan-800/40">
            {camera.location_code}
          </span>
        </div>

        {/* Action Controls & Vision Mode Toggles */}
        <div className="flex items-center gap-1">
          <div className="flex items-center bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded p-0.5">
            <button
              onClick={() => setCurrentMode('day')}
              className={`p-1 rounded text-[9px] cursor-pointer ${
                currentMode === 'day' ? 'bg-amber-950 text-amber-400 font-bold border border-amber-800/50' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              title="Day Optical Mode"
            >
              <Sun className="w-3 h-3" />
            </button>
            <button
              onClick={() => setCurrentMode('night')}
              className={`p-1 rounded text-[9px] cursor-pointer ${
                currentMode === 'night' ? 'bg-emerald-950 text-emerald-400 font-bold border border-emerald-800/50' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              title="Night Vision Mode"
            >
              <Moon className="w-3 h-3" />
            </button>
            <button
              onClick={() => setCurrentMode('thermal')}
              className={`p-1 rounded text-[9px] cursor-pointer ${
                currentMode === 'thermal' ? 'bg-cyan-950 text-cyan-400 font-bold border border-cyan-800/50' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              title="Thermal IR Mode"
            >
              <Eye className="w-3 h-3" />
            </button>
          </div>

          {onOpenZoneEditor && (
            <button
              onClick={() => onOpenZoneEditor(camera)}
              className="p-1 rounded bg-[var(--bg-panel-highlight)] text-[var(--text-secondary)] hover:text-cyan-500 border border-[var(--border-tactical)] transition-colors cursor-pointer"
              title="Edit Virtual Zone"
            >
              <MapPin className="w-3 h-3" />
            </button>
          )}

          {onMaximize && (
            <button
              onClick={() => onMaximize(camera)}
              className="p-1 rounded bg-[var(--bg-panel-highlight)] text-[var(--text-secondary)] hover:text-cyan-500 border border-[var(--border-tactical)] transition-colors cursor-pointer"
              title="Focus Stream"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Surveillance Canvas Display */}
      <div className="relative flex-1 w-full bg-black min-h-0">
        <VideoCanvasRenderer camera={camera} detections={camDetections} zones={zones} activeVisionMode={currentMode} />

        {/* Quick Demo Trigger Overlay Button */}
        <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <button
            onClick={() =>
              triggerDemoAlert(
                camera.camera_id === 'cam-02' ? 'anpr_unlisted_vehicle' : 'virtual_fence_breach',
                camera.camera_id,
                'high'
              )
            }
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-950/90 border border-red-500/60 text-red-300 text-[10px] font-mono hover:bg-red-900 transition-all shadow-lg cursor-pointer"
          >
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <span>TEST BREACH</span>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between px-2.5 py-1 bg-[var(--bg-panel-elevated)] text-[10px] font-mono text-[var(--text-secondary)] border-t border-[var(--border-tactical)] transition-colors">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3 h-3 text-cyan-500" />
          <span>RES: {camera.resolution}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-cyan-500 font-bold">{camDetections.length || 1} TRACKS</span>
        </div>
      </div>
    </div>
  );
};
