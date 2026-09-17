import React from 'react';
import { ShieldAlert, Cpu } from 'lucide-react';
import type { Detection } from '../types/bavis';

interface AiDetectionStreamProps {
  latestDetection?: Detection | null;
}

export const AiDetectionStream: React.FC<AiDetectionStreamProps> = ({ latestDetection }) => {
  const deterministicEvents = [
    { time: '18:42:31', type: 'PERSON', cam: 'CAM-03 (BOP-N02)', track: 'T-042', conf: '94.2%', speed: '4.8 km/h', zone: 'RZ-01 (NORTH BUFFER)', alert: true },
    { time: '18:42:27', type: 'VEHICLE', cam: 'CAM-02 (CHECKPOINT)', track: 'V-017', conf: '91.4%', speed: '22.1 km/h', anpr: 'UP16-AB-8849', alert: true },
    { time: '18:42:12', type: 'ZONE_ENTRY', cam: 'CAM-01 (BOP-N01)', track: 'T-039', conf: '96.0%', zone: 'RZ-01 (NORTH BUFFER)', alert: false },
    { time: '18:41:58', type: 'PERSON', cam: 'CAM-01 (BOP-N01)', track: 'T-039', conf: '89.5%', speed: '3.2 km/h', alert: false },
    { time: '18:41:44', type: 'ANPR', cam: 'CAM-02 (CHECKPOINT)', track: 'V-014', conf: '93.2%', anpr: 'DL04-C-9912', alert: false },
    { time: '18:41:15', type: 'MOTION', cam: 'CAM-04 (RIVERINE)', track: 'W-009', conf: '88.0%', speed: '12.4 km/h', alert: false },
  ];

  return (
    <div className="bg-[var(--bg-panel)] border border-[var(--border-tactical)] rounded p-2 font-mono select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-1.5 pb-1.5 border-b border-[var(--border-tactical)] mb-1.5">
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
            AI DETECTION & STRUCTURED EVENT STREAM (LIVE INGESTION)
          </h3>
        </div>

        <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)]">
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            STREAM INGESTION ACTIVE
          </span>
          <span className="text-[var(--border-tactical)]">|</span>
          <span>THROUGHPUT: 118.4 FPS</span>
        </div>
      </div>

      {/* Live Stream Ticker / Compact Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-1.5 text-[11px]">
        {latestDetection && (
          <div className="p-1.5 rounded bg-cyan-950/60 border border-cyan-500/70 text-cyan-200 flex flex-col justify-between animate-pulse">
            <div className="flex items-center justify-between text-[9px]">
              <span className="text-cyan-400 font-bold">{new Date(latestDetection.frame_ts).toISOString().substring(11, 19)}</span>
              <span className="px-1 rounded bg-cyan-800 text-white font-bold">{latestDetection.object_type.toUpperCase()}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold text-[var(--text-primary)] mt-0.5">
              <span>{latestDetection.track_id}</span>
              <span className="text-emerald-400">{(latestDetection.confidence * 100).toFixed(0)}%</span>
            </div>
            <span className="text-[8px] text-[var(--text-secondary)] truncate">{latestDetection.camera_id}</span>
          </div>
        )}

        {deterministicEvents.slice(0, latestDetection ? 5 : 6).map((evt, idx) => (
          <div
            key={idx}
            className={`p-1.5 rounded border flex flex-col justify-between transition-colors ${
              evt.alert
                ? 'bg-red-950/20 border-red-900/50 text-[var(--text-primary)]'
                : 'bg-[var(--bg-panel-elevated)] border-[var(--border-tactical)] text-[var(--text-primary)]'
            }`}
          >
            <div className="flex items-center justify-between text-[9px]">
              <span className="text-[var(--text-muted)]">{evt.time}</span>
              <span
                className={`px-1 rounded text-[8px] font-bold uppercase ${
                  evt.type === 'PERSON'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    : evt.type === 'VEHICLE' || evt.type === 'ANPR'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}
              >
                {evt.type}
              </span>
            </div>

            <div className="flex items-center justify-between text-[10px] font-bold mt-0.5">
              <span className="text-[var(--text-primary)]">{evt.track}</span>
              <span className="text-emerald-400">{evt.conf}</span>
            </div>

            <div className="flex items-center justify-between text-[8px] text-[var(--text-secondary)] truncate mt-0.5">
              <span className="truncate">{evt.cam.split(' ')[0]}</span>
              {evt.anpr && <span className="text-amber-400 font-bold">{evt.anpr}</span>}
              {evt.alert && <ShieldAlert className="w-2.5 h-2.5 text-red-400 shrink-0" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
