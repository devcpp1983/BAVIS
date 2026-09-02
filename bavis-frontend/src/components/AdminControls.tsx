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
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4.5rem)] p-6 text-center">
        <div className="p-4 rounded-full bg-red-950 border border-red-800 text-red-400 mb-3">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black text-slate-100 uppercase">ADMINISTRATIVE PERMISSION REQUIRED</h2>
        <p className="text-xs font-mono text-slate-400 mt-1 max-w-md">
          Current role [{role.toUpperCase()}] lacks administrative access. Please switch role access to "Admin" in the top bar to view system health and camera gateway configs.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] p-4 overflow-hidden space-y-4 font-mono text-xs">
      <div className="flex items-center justify-between p-4 bg-slate-900/90 border border-cyan-900/40 rounded-xl glass-panel">
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-black tracking-wider text-slate-100 uppercase">
            BAVIS SYSTEM & GATEWAY MANAGEMENT (ADMIN ROLE)
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-emerald-400 font-bold">ALL SERVICES OPERATIONAL</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-900/40 glass-panel">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span>AI INFERENCE LATENCY</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-cyan-300">14.2 ms</p>
          <p className="text-[10px] text-slate-500 mt-1">YOLOv8 + ByteTrack TensorRT Engine</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-900/40 glass-panel">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span>STREAM THROUGHPUT</span>
            <Radio className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">118.4 FPS</p>
          <p className="text-[10px] text-slate-500 mt-1">4 Active RTSP Gateways (1080p@30)</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-900/40 glass-panel">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span>EDGE GPU MEMORY</span>
            <HardDrive className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400">4.2 / 8.0 GB</p>
          <p className="text-[10px] text-slate-500 mt-1">NVIDIA Orin / RTX Server Utilization</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-900/40 glass-panel">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span>EVIDENCE DB STORAGE</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-blue-400">42.8 GB</p>
          <p className="text-[10px] text-slate-500 mt-1">MinIO S3 Snapshot Retention (30 Days)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 overflow-hidden">
        <div className="lg:col-span-5 p-4 bg-slate-950/80 border border-cyan-900/40 rounded-xl glass-panel flex flex-col space-y-3">
          <h3 className="text-xs font-bold text-slate-100 uppercase pb-2 border-b border-slate-800">
            REGISTER NEW CCTV STREAM GATEWAY
          </h3>

          <div>
            <label className="block text-[10px] text-slate-400 mb-1">CAMERA IDENTIFIER / NAME</label>
            <input
              type="text"
              placeholder="e.g. BOP Echo Watchtower 02"
              value={newCamName}
              onChange={(e) => setNewCamName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 mb-1">BORDER LOCATION CODE</label>
            <input
              type="text"
              placeholder="e.g. BOP-ECHO-POST-02"
              value={newCamLocation}
              onChange={(e) => setNewCamLocation(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 mb-1">RTSP STREAM URI</label>
            <input
              type="text"
              value={newCamRtsp}
              onChange={(e) => setNewCamRtsp(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            onClick={() => alert(`Camera Stream Gateway [${newCamName || 'New Camera'}] provisioned successfully!`)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded bg-cyan-950 border border-cyan-600 text-cyan-300 font-bold hover:bg-cyan-900 transition-all mt-auto"
          >
            <Plus className="w-4 h-4" />
            <span>PROVISION CAMERA STREAM</span>
          </button>
        </div>

        <div className="lg:col-span-7 p-4 bg-slate-950/80 border border-cyan-900/40 rounded-xl glass-panel flex flex-col space-y-3 overflow-hidden">
          <h3 className="text-xs font-bold text-slate-100 uppercase pb-2 border-b border-slate-800">
            SYSTEM SECURITY AUDIT LOGS
          </h3>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-[11px]">
            <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
              <div>
                <span className="text-emerald-400 font-bold">[AUTH]</span> Inspector A. Sharma logged in (Role: Supervisor)
              </div>
              <span className="text-slate-500">15:04:12 IST</span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
              <div>
                <span className="text-cyan-400 font-bold">[ZONE]</span> Polygon zone [Restricted Border Buffer] deployed for cam-01
              </div>
              <span className="text-slate-500">14:32:00 IST</span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
              <div>
                <span className="text-amber-400 font-bold">[ALERT]</span> High breach alert alt_9001 acknowledged by Constable R. Kumar
              </div>
              <span className="text-slate-500">14:18:45 IST</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
