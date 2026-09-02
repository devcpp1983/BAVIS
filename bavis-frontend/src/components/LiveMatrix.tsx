import React, { useState, useEffect } from 'react';
import type { Camera, Detection, Zone } from '../types/bavis';
import { api } from '../api/client';
import { useAlerts } from '../context/AlertContext';
import { CameraTile } from './CameraTile';
import { RealtimeAlertPanel } from './RealtimeAlertPanel';
import { LayoutGrid, Grid, Square } from 'lucide-react';

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-4.5rem)] p-4 overflow-hidden">
      {/* Left / Main Section: Multi-Camera Grid */}
      <div className="lg:col-span-8 flex flex-col h-full overflow-hidden">
        {/* Matrix Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border border-cyan-900/40 rounded-xl mb-3 glass-panel">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-black tracking-wider text-slate-100 uppercase">
              LIVE SURVEILLANCE FEED MATRIX
            </h2>
            <span className="text-[11px] font-mono text-cyan-400">
              ({cameras.length} CAMERAS ONLINE)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {focusedCamera && (
              <button
                onClick={() => setFocusedCamera(null)}
                className="px-2.5 py-1 rounded bg-cyan-950 border border-cyan-600 text-cyan-300 text-xs font-mono font-bold hover:bg-cyan-900 transition-all"
              >
                ← EXIT FOCUS VIEW
              </button>
            )}

            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => {
                  setFocusedCamera(null);
                  setGridCount(1);
                }}
                className={`p-1.5 rounded ${
                  gridCount === 1 && !focusedCamera ? 'bg-cyan-950 text-cyan-400 font-bold' : 'text-slate-500 hover:text-slate-300'
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
                className={`p-1.5 rounded ${
                  gridCount === 4 && !focusedCamera ? 'bg-cyan-950 text-cyan-400 font-bold' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="2x2 Grid View"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setFocusedCamera(null);
                  setGridCount(9);
                }}
                className={`p-1.5 rounded ${
                  gridCount === 9 && !focusedCamera ? 'bg-cyan-950 text-cyan-400 font-bold' : 'text-slate-500 hover:text-slate-300'
                }`}
                title="3x3 Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Camera Grid Tiles Container */}
        <div
          className={`flex-1 grid gap-3 overflow-y-auto ${
            displayCameras.length === 1
              ? 'grid-cols-1'
              : displayCameras.length <= 4
              ? 'grid-cols-1 md:grid-cols-2'
              : 'grid-cols-1 md:grid-cols-3'
          }`}
        >
          {displayCameras.map((cam) => (
            <CameraTile
              key={cam.camera_id}
              camera={cam}
              detections={activeDetections}
              zones={zones}
              onOpenZoneEditor={onOpenZoneEditor}
              onMaximize={(c) => setFocusedCamera(c)}
            />
          ))}
        </div>
      </div>

      {/* Right Section: Real-Time Alert Stream Panel */}
      <div className="lg:col-span-4 h-full overflow-hidden">
        <RealtimeAlertPanel />
      </div>
    </div>
  );
};
