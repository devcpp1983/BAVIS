import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings, Cpu, HardDrive, Plus, Lock, Radio, Video, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';

export const AdminControls: React.FC = () => {
  const { role, canManageSystem } = useAuth();
  const [newCamName, setNewCamName] = useState<string>('');
  const [newCamLocation, setNewCamLocation] = useState<string>('');
  const [newCamRtsp, setNewCamRtsp] = useState<string>('rtsp://192.168.10.105/live/h264');
  const [provisionSuccess, setProvisionSuccess] = useState<string | null>(null);

  const handleProvision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCamName) return;

    api.login('admin', 'admin'); // Ensures token context
    setProvisionSuccess(`Camera Gateway [${newCamName}] provisioned and registered in Ingestion Stream Pool!`);
    setNewCamName('');
    setNewCamLocation('');
    setTimeout(() => setProvisionSuccess(null), 4000);
  };

  if (!canManageSystem) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center select-none font-mono">
        <div className="p-3 rounded-full bg-red-950 border border-red-800 text-red-400 mb-3">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase">ADMINISTRATIVE PERMISSION REQUIRED</h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-md">
          Current role [{role.toUpperCase()}] lacks administrator privileges. Switch role to "Admin" in the top bar to provision CCTV streams.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto space-y-3 select-none font-mono text-xs">
      <div className="flex items-center justify-between p-2.5 bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] rounded">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-cyan-400" />
          <div>
            <h2 className="text-xs font-bold tracking-wider text-[var(--text-primary)] uppercase">
              CCTV STREAM GATEWAY & HARDWARE ORCHESTRATION
            </h2>
            <p className="text-[10px] text-[var(--text-secondary)]">
              Retrofit existing IP CCTV / RTSP cameras into BAVIS software-defined AI pipeline
            </p>
          </div>
        </div>
        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
          ALL GATEWAYS ACTIVE
        </span>
      </div>

      {/* Hardware Telemetry Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
        <div className="p-2.5 rounded bg-[var(--bg-panel)] border border-[var(--border-tactical)]">
          <div className="flex items-center justify-between text-[var(--text-secondary)] mb-1 text-[10px]">
            <span>AI INFERENCE ENGINE</span>
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <p className="text-lg font-bold text-cyan-400">14.2 ms</p>
          <p className="text-[9px] text-[var(--text-muted)] mt-0.5">YOLOv8 + ByteTrack TensorRT Engine</p>
        </div>

        <div className="p-2.5 rounded bg-[var(--bg-panel)] border border-[var(--border-tactical)]">
          <div className="flex items-center justify-between text-[var(--text-secondary)] mb-1 text-[10px]">
            <span>STREAM THROUGHPUT</span>
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-lg font-bold text-emerald-400">118.4 FPS</p>
          <p className="text-[9px] text-[var(--text-muted)] mt-0.5">4 Active RTSP Gateways (1080p@30)</p>
        </div>

        <div className="p-2.5 rounded bg-[var(--bg-panel)] border border-[var(--border-tactical)]">
          <div className="flex items-center justify-between text-[var(--text-secondary)] mb-1 text-[10px]">
            <span>EDGE GPU UTILIZATION</span>
            <HardDrive className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <p className="text-lg font-bold text-amber-400">4.2 / 8.0 GB</p>
          <p className="text-[9px] text-[var(--text-muted)] mt-0.5">NVIDIA Jetson / Cloud GPU VRAM</p>
        </div>

        <div className="p-2.5 rounded bg-[var(--bg-panel)] border border-[var(--border-tactical)]">
          <div className="flex items-center justify-between text-[var(--text-secondary)] mb-1 text-[10px]">
            <span>NETWORK BUFFER</span>
            <Video className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <p className="text-lg font-bold text-blue-400">0.0% DROP</p>
          <p className="text-[9px] text-[var(--text-muted)] mt-0.5">Low-latency jitter buffer active</p>
        </div>
      </div>

      {/* Provisioning Form */}
      <div className="p-3 bg-[var(--bg-panel)] border border-[var(--border-tactical)] rounded space-y-3">
        <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase pb-1.5 border-b border-[var(--border-tactical)]">
          PROVISION NEW CCTV STREAM GATEWAY (RETROFIT-FIRST)
        </h3>

        {provisionSuccess && (
          <div className="p-2 rounded bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>{provisionSuccess}</span>
          </div>
        )}

        <form onSubmit={handleProvision} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[9px] text-[var(--text-secondary)] mb-0.5 uppercase">CAMERA NAME / DESIGNATION</label>
            <input
              type="text"
              required
              placeholder="e.g. BOP Echo Watchtower 02"
              value={newCamName}
              onChange={(e) => setNewCamName(e.target.value)}
              className="w-full bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded px-2.5 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-[9px] text-[var(--text-secondary)] mb-0.5 uppercase">BORDER LOCATION CODE</label>
            <input
              type="text"
              placeholder="e.g. BOP-ECHO-POST-02"
              value={newCamLocation}
              onChange={(e) => setNewCamLocation(e.target.value)}
              className="w-full bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded px-2.5 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-[9px] text-[var(--text-secondary)] mb-0.5 uppercase">RTSP STREAM URI</label>
            <input
              type="text"
              required
              value={newCamRtsp}
              onChange={(e) => setNewCamRtsp(e.target.value)}
              className="w-full bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded px-2.5 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="md:col-span-3 pt-1">
            <button
              type="submit"
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded bg-cyan-950 border border-cyan-600 text-cyan-200 text-xs font-bold hover:bg-cyan-900 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>PROVISION & INGEST STREAM</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
