import React, { useState, useEffect } from 'react';
import type { Camera, Detection, Zone } from '../types/bavis';
import { api } from '../api/client';
import { useAlerts } from '../context/AlertContext';
import { CameraTile } from './CameraTile';
import { RealtimeAlertPanel } from './RealtimeAlertPanel';
import { LayoutGrid, Grid, Square, Video } from 'lucide-react';

interface LiveMatrixProps {
  onOpenZoneEditor: (camera: Camera) => void;
}

export const LiveMatrix: React.FC<LiveMatrixProps> = ({ onOpenZoneEditor }) => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [gridCount, setGridCount] = useState<1 | 4 | 9>(4);
  const [focusedCamera, setFocusedCamera] = useState<Camera | null>(null);
  const { latestDetection } = useAlerts();

  const [activeDetections, setActiveDetections] = useState<Detection[]>([]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const camData = await api.getCameras();
        const zoneData = await api.getZones();
        setCameras(camData);
        setZones(zoneData);
      } catch (err) {
        console.error('Failed to load cameras or zones:', err);
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    if (latestDetection) {
      setActiveDetections((prev) => {
        const filtered = prev.filter((d) => d.camera_id !== latestDetection.camera_id);
        return [latestDetection, ...filtered].slice(0, 15);
      });
    }
  }, [latestDetection]);

  const displayCameras = focusedCamera ? [focusedCamera] : cameras.slice(0, gridCount);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-full overflow-hidden select-none">
      {/* Left 8 Cols: Multi-Camera Surveillance Wall */}
      <div className="lg:col-span-8 flex flex-col h-full overflow-hidden">
        {/* Matrix Toolbar */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] rounded mb-2.5 transition-colors">
          <div className="flex items-center gap-2 font-mono">
            <Video className="w-3.5 h-3.5 text-cyan-500" />
            <h2 className="text-xs font-bold tracking-wider text-[var(--text-primary)] uppercase">
              LIVE SURVEILLANCE FEED MATRIX
            </h2>
            <span className="text-[11px] text-cyan-600 font-semibold">
              ({cameras.length} CAMERAS ONLINE)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {focusedCamera && (
              <button
                onClick={() => setFocusedCamera(null)}
                className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-600 text-cyan-300 text-[10px] font-mono font-bold hover:bg-cyan-900 transition-all cursor-pointer"
              >
                ← EXIT SINGLE FOCUS
              </button>
            )}

            <div className="flex items-center bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded p-0.5">
              <button
                onClick={() => {
                  setFocusedCamera(null);
                  setGridCount(1);
                }}
                className={`p-1.5 rounded cursor-pointer ${
                  gridCount === 1 && !focusedCamera ? 'bg-cyan-950 text-cyan-400 font-bold border border-cyan-800' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                title="Single Camera View"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setFocusedCamera(null);
                  setGridCount(4);
                }}
                className={`p-1.5 rounded cursor-pointer ${
                  gridCount === 4 && !focusedCamera ? 'bg-cyan-950 text-cyan-400 font-bold border border-cyan-800' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                title="2x2 Quad Grid"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setFocusedCamera(null);
                  setGridCount(9);
                }}
                className={`p-1.5 rounded cursor-pointer ${
                  gridCount === 9 && !focusedCamera ? 'bg-cyan-950 text-cyan-400 font-bold border border-cyan-800' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                title="3x3 Dense Grid"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Camera Grid Tiles Container */}
        <div
          className={`flex-1 grid gap-2.5 overflow-y-auto ${
            displayCameras.length === 1
              ? 'grid-cols-1'
              : displayCameras.length <= 4
              ? 'grid-cols-1 md:grid-cols-2'
              : 'grid-cols-1 md:grid-cols-3'
          }`}
        >
          {displayCameras.map((cam) => (
            <div key={cam.camera_id} className={displayCameras.length === 1 ? 'h-full' : 'h-64'}>
              <CameraTile
                camera={cam}
                detections={activeDetections}
                zones={zones}
                onOpenZoneEditor={onOpenZoneEditor}
                onMaximize={(c) => setFocusedCamera(c)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Right 4 Cols: Real-Time Alert Stream Panel */}
      <div className="lg:col-span-4 h-full overflow-hidden">
        <RealtimeAlertPanel />
      </div>
    </div>
  );
};
