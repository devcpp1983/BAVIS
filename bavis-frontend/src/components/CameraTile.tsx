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
    <div className="group relative flex flex-col bg-slate-950/90 border border-cyan-900/40 rounded-xl overflow-hidden glass-panel glass-panel-hover">
      {/* Tile Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-cyan-900/30">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-slate-100 truncate">{camera.name}</span>
          <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-900/50">
            {camera.location_code}
          </span>
        </div>

        {/* Action Controls & Vision Mode Toggles */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded p-0.5">
            <button
              onClick={() => setCurrentMode('day')}
              className={`p-1 rounded text-[10px] ${
                currentMode === 'day' ? 'bg-amber-950 text-amber-400 font-bold' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Day Optical Mode"
            >
              <Sun className="w-3 h-3" />
            </button>
            <button
              onClick={() => setCurrentMode('night')}
              className={`p-1 rounded text-[10px] ${
                currentMode === 'night' ? 'bg-emerald-950 text-emerald-400 font-bold' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Night Vision Mode"
            >
              <Moon className="w-3 h-3" />
            </button>
            <button
              onClick={() => setCurrentMode('thermal')}
              className={`p-1 rounded text-[10px] ${
                currentMode === 'thermal' ? 'bg-cyan-950 text-cyan-400 font-bold' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Thermal IR Mode"
            >
              <Eye className="w-3 h-3" />
            </button>
          </div>

          {onOpenZoneEditor && (
            <button
              onClick={() => onOpenZoneEditor(camera)}
              className="p-1 rounded bg-slate-800/80 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 text-[10px] transition-colors"
              title="Edit Virtual Zone"
            >
              <MapPin className="w-3.5 h-3.5" />
            </button>
          )}

          {onMaximize && (
            <button
              onClick={() => onMaximize(camera)}
              className="p-1 rounded bg-slate-800/80 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 text-[10px] transition-colors"
              title="Focus Stream"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Surveillance Canvas Display */}
      <div className="relative w-full aspect-video bg-black">
        <VideoCanvasRenderer camera={camera} detections={camDetections} zones={zones} activeVisionMode={currentMode} />

        {/* Quick Demo Overlay Button */}
        <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <button
            onClick={() =>
              triggerDemoAlert(
                camera.camera_id === 'cam-02' ? 'anpr_unlisted_vehicle' : 'virtual_fence_breach',
                camera.camera_id,
                'high'
              )
            }
            className="flex items-center gap-1 px-2 py-1 rounded bg-red-950/90 border border-red-500/60 text-red-300 text-[10px] font-mono hover:bg-red-900 transition-all shadow-lg"
          >
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <span>TEST BREACH</span>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950 text-[11px] font-mono text-slate-400 border-t border-slate-900">
        <div className="flex items-center gap-2">
          <Activity className="w-3 h-3 text-cyan-400" />
          <span>RES: {camera.resolution}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-semibold">{camDetections.length || 1} OBJECTS TRACKED</span>
        </div>
      </div>
    </div>
  );
};
