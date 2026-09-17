import React, { useState } from 'react';
import type { Camera, Detection, Zone, VisionMode } from '../types/bavis';
import { VideoCanvasRenderer } from './VideoCanvasRenderer';
import { X, Cpu, MapPin, Sun, Moon, Eye, ShieldCheck, Tag } from 'lucide-react';

interface CameraDetailModalProps {
  camera: Camera;
  detections: Detection[];
  zones: Zone[];
  onClose: () => void;
  onOpenZoneEditor?: (camera: Camera) => void;
}

export const CameraDetailModal: React.FC<CameraDetailModalProps> = ({
  camera,
  detections,
  zones,
  onClose,
  onOpenZoneEditor,
}) => {
  const [activeVisionMode, setActiveVisionMode] = useState<VisionMode>(camera.vision_mode);

  const mockDetectionsLog = [
    { time: '18:41:28', class: 'PERSON', track: 'TRK-CAM01-017', conf: '94.2%', speed: '4.8 km/h' },
    { time: '18:41:25', class: 'VEHICLE', track: 'TRK-CAM01-021', conf: '91.0%', speed: '24.1 km/h' },
    { time: '18:41:22', class: 'PERSON', track: 'TRK-CAM01-017', conf: '95.6%', speed: '5.1 km/h' },
    { time: '18:39:10', class: 'PERSON', track: 'TRK-CAM01-014', conf: '89.4%', speed: '3.6 km/h' },
    { time: '18:35:44', class: 'VEHICLE', track: 'TRK-CAM01-009', conf: '93.1%', speed: '18.2 km/h' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 select-none font-mono">
      <div className="relative w-full max-w-6xl max-h-[92vh] bg-[var(--bg-panel)] border border-[var(--border-tactical)] rounded overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-panel-elevated)] border-b border-[var(--border-tactical)]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h2 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
              CAMERA TELEMETRY & CV ANALYTICS CONSOLE • {camera.name}
            </h2>
            <span className="text-[10px] text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              {camera.location_code}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Vision Mode Toggles */}
            <div className="flex items-center bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded p-0.5 text-xs">
              <button
                onClick={() => setActiveVisionMode('day')}
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  activeVisionMode === 'day' ? 'bg-amber-950 text-amber-300 font-bold border border-amber-700/60' : 'text-[var(--text-secondary)]'
                }`}
              >
                <Sun className="w-3 h-3 inline mr-1" /> DAY
              </button>
              <button
                onClick={() => setActiveVisionMode('night')}
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  activeVisionMode === 'night' ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-700/60' : 'text-[var(--text-secondary)]'
                }`}
              >
                <Moon className="w-3 h-3 inline mr-1" /> NIGHT
              </button>
              <button
                onClick={() => setActiveVisionMode('thermal')}
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  activeVisionMode === 'thermal' ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-700/60' : 'text-[var(--text-secondary)]'
                }`}
              >
                <Eye className="w-3 h-3 inline mr-1" /> THERMAL
              </button>
            </div>

            {onOpenZoneEditor && (
              <button
                onClick={() => {
                  onClose();
                  onOpenZoneEditor(camera);
                }}
                className="px-2.5 py-1 rounded bg-cyan-950 border border-cyan-700 text-cyan-300 text-xs font-bold hover:bg-cyan-900 cursor-pointer"
              >
                <MapPin className="w-3 h-3 inline mr-1" /> EDIT GEOFENCE
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1 rounded bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
          {/* Left 8 Cols: Large Surveillance Stream */}
          <div className="lg:col-span-8 flex flex-col gap-2">
            <div className="relative w-full aspect-video rounded bg-black overflow-hidden border border-[var(--border-tactical)]">
              <VideoCanvasRenderer
                camera={camera}
                detections={detections}
                zones={zones}
                activeVisionMode={activeVisionMode}
              />
            </div>

            {/* Bottom Stream Metric Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] p-2 rounded">
                <span className="text-[9px] text-[var(--text-secondary)] uppercase block">RESOLUTION / FPS</span>
                <span className="text-xs font-bold text-[var(--text-primary)]">{camera.resolution} @ {camera.fps} FPS</span>
              </div>
              <div className="bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] p-2 rounded">
                <span className="text-[9px] text-[var(--text-secondary)] uppercase block">STREAM LATENCY</span>
                <span className="text-xs font-bold text-emerald-400">{camera.latency_ms || 18} ms (OPTIMAL)</span>
              </div>
              <div className="bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] p-2 rounded">
                <span className="text-[9px] text-[var(--text-secondary)] uppercase block">ACTIVE ZONE</span>
                <span className="text-xs font-bold text-cyan-400 truncate block">{camera.current_zone_name || 'Zone North Buffer'}</span>
              </div>
              <div className="bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] p-2 rounded">
                <span className="text-[9px] text-[var(--text-secondary)] uppercase block">ENHANCEMENT</span>
                <span className="text-xs font-bold text-[var(--text-primary)]">DYNAMIC CLAHE ON</span>
              </div>
            </div>
          </div>

          {/* Right 4 Cols: AI Analytics Breakdown & Recent Detection Stream */}
          <div className="lg:col-span-4 flex flex-col gap-2.5 text-xs">
            {/* AI Analytics Counts */}
            <div className="p-2.5 bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] rounded space-y-2">
              <div className="flex items-center justify-between border-b border-[var(--border-tactical)] pb-1.5">
                <h3 className="text-xs font-bold text-cyan-400 uppercase flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" />
                  AI VISION TELEMETRY
                </h3>
                <span className="text-[9px] text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> TRACKER ACTIVE
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-[var(--bg-panel)] p-1.5 rounded border border-[var(--border-tactical)]">
                  <span className="text-[9px] text-[var(--text-secondary)] uppercase block">PERSON DETECTIONS</span>
                  <span className="text-sm font-bold text-cyan-400">03 ACTIVE</span>
                </div>
                <div className="bg-[var(--bg-panel)] p-1.5 rounded border border-[var(--border-tactical)]">
                  <span className="text-[9px] text-[var(--text-secondary)] uppercase block">VEHICLE DETECTIONS</span>
                  <span className="text-sm font-bold text-amber-400">02 ACTIVE</span>
                </div>
                <div className="bg-[var(--bg-panel)] p-1.5 rounded border border-[var(--border-tactical)]">
                  <span className="text-[9px] text-[var(--text-secondary)] uppercase block">ANPR OCR ENGINE</span>
                  <span className="text-sm font-bold text-emerald-400">01 READY</span>
                </div>
                <div className="bg-[var(--bg-panel)] p-1.5 rounded border border-[var(--border-tactical)]">
                  <span className="text-[9px] text-[var(--text-secondary)] uppercase block">LOW LIGHT FILTER</span>
                  <span className="text-sm font-bold text-cyan-400">ENABLED</span>
                </div>
              </div>
            </div>

            {/* Timestamped Recent Detections List */}
            <div className="p-2.5 bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] rounded flex-1 flex flex-col min-h-[180px]">
              <div className="flex items-center justify-between border-b border-[var(--border-tactical)] pb-1.5 mb-2">
                <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-cyan-400" />
                  RECENT DETECTIONS (LIVE HUD)
                </h3>
                <span className="text-[9px] text-[var(--text-secondary)]">PAST 5 MIN</span>
              </div>

              <div className="space-y-1.5 flex-1 overflow-y-auto pr-1 text-[11px]">
                {mockDetectionsLog.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-1.5 rounded bg-[var(--bg-panel)] border border-[var(--border-tactical)] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[var(--text-secondary)]">{item.time}</span>
                      <span
                        className={`px-1 rounded text-[9px] font-bold ${
                          item.class === 'PERSON' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {item.class}
                      </span>
                      <span className="font-bold text-[var(--text-primary)]">{item.track}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)]">
                      <span>{item.conf}</span>
                      <span className="text-emerald-400">{item.speed}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
