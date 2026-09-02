import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings, Cpu, HardDrive, ShieldCheck, Plus, Lock, Radio } from 'lucide-react';

export const AdminControls: React.FC = () => {
  const { role, canManageSystem } = useAuth();
  const [newCamName, setNewCamName] = useState<string>('');
  const [newCamLocation, setNewCamLocation] = useState<string>('');
  const [newCamRtsp, setNewCamRtsp] = useState<string>('rtsp://192.168.10.105/live/h264');

  if (!canManageSystem) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center select-none font-mono">
        <div className="p-3 rounded-full bg-red-950 border border-red-800 text-red-400 mb-3">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-[var(--text-primary)] uppercase">ADMINISTRATIVE PERMISSION REQUIRED</h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-md">
          Current role [{role.toUpperCase()}] lacks administrative access. Switch role access to "Admin" in the top status bar to view system health and camera gateway configs.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto space-y-3 select-none font-mono text-xs">
      <div className="flex items-center justify-between p-3 bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] rounded transition-colors">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-cyan-500" />
          <h2 className="text-xs font-bold tracking-wider text-[var(--text-primary)] uppercase">
            BAVIS SYSTEM & CAMERA FLEET GATEWAY (ADMIN ROLE)
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-emerald-500 font-bold">ALL GATEWAYS OPERATIONAL</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded bg-[var(--bg-panel)] border border-[var(--border-tactical)] transition-colors">
          <div className="flex items-center justify-between text-[var(--text-secondary)] mb-1 text-[10px]">
            <span>AI INFERENCE ENGINE</span>
            <Cpu className="w-3.5 h-3.5 text-cyan-500" />
          </div>
          <p className="text-xl font-bold text-cyan-600">14.2 ms</p>
          <p className="text-[9px] text-[var(--text-muted)] mt-0.5">YOLOv8 + ByteTrack TensorRT Engine</p>
        </div>

        <div className="p-3 rounded bg-[var(--bg-panel)] border border-[var(--border-tactical)] transition-colors">
          <div className="flex items-center justify-between text-[var(--text-secondary)] mb-1 text-[10px]">
            <span>STREAM THROUGHPUT</span>
            <Radio className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-emerald-500">118.4 FPS</p>
          <p className="text-[9px] text-[var(--text-muted)] mt-0.5">4 Active RTSP Gateways (1080p@30)</p>
        </div>

        <div className="p-3 rounded bg-[var(--bg-panel)] border border-[var(--border-tactical)] transition-colors">
          <div className="flex items-center justify-between text-[var(--text-secondary)] mb-1 text-[10px]">
            <span>EDGE GPU MEMORY</span>
            <HardDrive className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-amber-500">4.2 / 8.0 GB</p>
          <p className="text-[9px] text-[var(--text-muted)] mt-0.5">NVIDIA Orin / RTX Server Utilization</p>
        </div>

        <div className="p-3 rounded bg-[var(--bg-panel)] border border-[var(--border-tactical)] transition-colors">
          <div className="flex items-center justify-between text-[var(--text-secondary)] mb-1 text-[10px]">
            <span>EVIDENCE STORAGE</span>
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <p className="text-xl font-bold text-blue-500">42.8 GB</p>
          <p className="text-[9px] text-[var(--text-muted)] mt-0.5">MinIO S3 Snapshot Retention (30 Days)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1">
        <div className="lg:col-span-5 p-3 bg-[var(--bg-panel)] border border-[var(--border-tactical)] rounded flex flex-col space-y-2.5 transition-colors">
          <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase pb-1.5 border-b border-[var(--border-tactical)]">
            PROVISION NEW CCTV STREAM GATEWAY
          </h3>

          <div>
            <label className="block text-[9px] text-[var(--text-secondary)] mb-0.5 uppercase">CAMERA IDENTIFIER / NAME</label>
            <input
              type="text"
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
              value={newCamRtsp}
              onChange={(e) => setNewCamRtsp(e.target.value)}
              className="w-full bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded px-2.5 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            onClick={() => alert(`Camera Stream Gateway [${newCamName || 'New Camera'}] provisioned successfully!`)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-cyan-950 border border-cyan-600 text-cyan-300 font-bold hover:bg-cyan-900 transition-all mt-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>PROVISION GATEWAY</span>
          </button>
        </div>

        <div className="lg:col-span-7 p-3 bg-[var(--bg-panel)] border border-[var(--border-tactical)] rounded flex flex-col space-y-2.5 transition-colors">
          <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase pb-1.5 border-b border-[var(--border-tactical)]">
            SYSTEM SECURITY AUDIT LOGS
          </h3>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-[10px]">
            <div className="p-2 rounded bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] flex justify-between">
              <div>
                <span className="text-emerald-500 font-bold">[AUTH]</span> Inspector A. Sharma logged in (Role: Supervisor)
              </div>
              <span className="text-[var(--text-muted)]">15:04:12 IST</span>
            </div>
            <div className="p-2 rounded bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] flex justify-between">
              <div>
                <span className="text-cyan-500 font-bold">[ZONE]</span> Polygon zone [Restricted Border Buffer] deployed for cam-01
              </div>
              <span className="text-[var(--text-muted)]">14:32:00 IST</span>
            </div>
            <div className="p-2 rounded bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] flex justify-between">
              <div>
                <span className="text-amber-500 font-bold">[ALERT]</span> High breach alert alt_9001 acknowledged by Constable R. Kumar
              </div>
              <span className="text-[var(--text-muted)]">14:18:45 IST</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
