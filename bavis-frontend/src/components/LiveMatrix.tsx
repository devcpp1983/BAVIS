import React, { useState, useEffect } from 'react';
import type { Camera, Detection, Zone } from '../types/bavis';
import { api } from '../api/client';
import { useAlerts } from '../context/AlertContext';
import { CameraTile } from './CameraTile';
import { CameraDetailModal } from './CameraDetailModal';
import { RealtimeAlertPanel } from './RealtimeAlertPanel';
import { LayoutGrid, Grid, Square, Video } from 'lucide-react';

interface LiveMatrixProps {
  onOpenZoneEditor: (camera: Camera) => void;
  selectedCameraContext?: Camera | null;
}

export const LiveMatrix: React.FC<LiveMatrixProps> = ({ onOpenZoneEditor, selectedCameraContext }) => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [gridCount, setGridCount] = useState<1 | 4 | 9>(4);
  const [inspectCamera, setInspectCamera] = useState<Camera | null>(null);
  const { latestDetection } = useAlerts();

  const [activeDetections, setActiveDetections] = useState<Detection[]>([]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const camData = await api.getCameras();
        const zoneData = await api.getZones();
        setCameras(camData);
        setZones(zoneData);
        if (selectedCameraContext) {
          setInspectCamera(selectedCameraContext);
        }
      } catch (err) {
        console.error('Failed to load cameras or zones:', err);
      }
    };
    loadInitialData();
  }, [selectedCameraContext]);

  useEffect(() => {
    if (latestDetection) {
      setActiveDetections((prev) => {
        const filtered = prev.filter((d) => d.camera_id !== latestDetection.camera_id);
        return [latestDetection, ...filtered].slice(0, 15);
      });
    }
  }, [latestDetection]);

  const displayCameras = cameras.slice(0, gridCount);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 h-full overflow-hidden select-none font-mono">
      {/* Left 8 Cols: Multi-Camera Surveillance Matrix */}
      <div className="lg:col-span-8 flex flex-col h-full overflow-hidden">
        {/* Matrix Toolbar */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] rounded mb-2">
          <div className="flex items-center gap-2">
            <Video className="w-3.5 h-3.5 text-cyan-400" />
            <h2 className="text-xs font-bold tracking-wider text-[var(--text-primary)] uppercase">
              LIVE SURVEILLANCE FEED MATRIX
            </h2>
            <span className="text-[10px] text-cyan-400 font-semibold bg-cyan-950/80 px-1.5 py-0.2 rounded border border-cyan-800">
              {cameras.length} CAMERAS ONLINE
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded p-0.5">
              <button
                onClick={() => setGridCount(1)}
                className={`p-1.5 rounded cursor-pointer ${
                  gridCount === 1 ? 'bg-cyan-950 text-cyan-400 font-bold border border-cyan-800' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                title="Single Camera View"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setGridCount(4)}
                className={`p-1.5 rounded cursor-pointer ${
                  gridCount === 4 ? 'bg-cyan-950 text-cyan-400 font-bold border border-cyan-800' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                title="2x2 Quad Grid"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setGridCount(9)}
                className={`p-1.5 rounded cursor-pointer ${
                  gridCount === 9 ? 'bg-cyan-950 text-cyan-400 font-bold border border-cyan-800' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
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
          className={`flex-1 grid gap-2 overflow-y-auto ${
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
                onMaximize={(c) => setInspectCamera(c)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Right 4 Cols: Real-Time Alert Stream Panel */}
      <div className="lg:col-span-4 h-full overflow-hidden">
        <RealtimeAlertPanel />
      </div>

      {/* Camera Detail Operational Telemetry Modal */}
      {inspectCamera && (
        <CameraDetailModal
          camera={inspectCamera}
          detections={activeDetections}
          zones={zones}
          onClose={() => setInspectCamera(null)}
          onOpenZoneEditor={onOpenZoneEditor}
        />
      )}
    </div>
  );
};
