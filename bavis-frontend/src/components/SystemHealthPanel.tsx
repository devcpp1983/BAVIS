import { Activity, Cpu, Server, Video, HardDrive, ShieldCheck } from 'lucide-react';

export const SystemHealthPanel: React.FC = () => {
  const cameraFleet = [
    { id: 'cam-01', name: 'BOP-North-01 Perimeter Fence', status: 'ONLINE', latency: '14 ms', fps: 30, drop: '0.0%', mode: 'Thermal IR' },
    { id: 'cam-02', name: 'Checkpoint-03 ANPR Inspection Bay', status: 'ONLINE', latency: '18 ms', fps: 25, drop: '0.0%', mode: 'Day Optical' },
    { id: 'cam-03', name: 'BOP-North-02 Night Corridor', status: 'ONLINE', latency: '12 ms', fps: 30, drop: '0.0%', mode: 'Night Vision' },
    { id: 'cam-04', name: 'Sector Delta Riverine Crossing', status: 'ONLINE', latency: '22 ms', fps: 24, drop: '0.1%', mode: 'Thermal IR' },
  ];

  const aiEngineMetrics = [
    { label: 'OBJECT DETECTOR (YOLOv8)', value: '14.2 ms / frame', status: 'ACCELERATED' },
    { label: 'MULTI-OBJECT TRACKER (ByteTrack)', value: '3.1 ms / update', status: 'SYNCHRONIZED' },
    { label: 'ANPR OCR MODEL (CRNN)', value: '18.4 ms / plate', status: 'READY' },
    { label: 'NIGHT CLAHE ENHANCER', value: '4.0 ms / frame', status: 'ACTIVE' },
  ];

  const backendServices = [
    { name: 'FastAPI Ingestion Gateway', port: ':8001', status: 'NOMINAL', latency: '4 ms' },
    { name: 'Event Intelligence Engine', port: ':8003', status: 'NOMINAL', latency: '6 ms' },
    { name: 'WebSocket Alert Stream', port: ':8000/alerts/stream', status: 'STREAMING', latency: '2 ms' },
    { name: 'SQLite / PostgreSQL Event DB', port: ':5432', status: 'CONNECTED', latency: '1 ms' },
  ];

  const storageSubsystems = [
    { name: 'MinIO S3 Evidence Vault', capacity: '42.8 / 500 GB', retention: '30-Day Auto Retention', status: 'HEALTHY' },
    { name: 'Structured Event Database', records: '24,912 Records', indexStatus: 'B-Tree Optimized', status: 'HEALTHY' },
    { name: 'In-Memory Track Cache', active: '5 Active Tracks', size: '1.2 MB', status: 'NOMINAL' },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto space-y-3 select-none font-mono text-xs">
      {/* 1. Header Banner */}
      <div className="flex items-center justify-between p-2.5 bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] rounded">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <div>
            <h2 className="text-xs font-bold tracking-wider text-[var(--text-primary)] uppercase">
              BAVIS INFRASTRUCTURE HEALTH & SUBSYSTEM TELEMETRY
            </h2>
            <p className="text-[10px] text-[var(--text-secondary)]">
              Real-time monitoring across Camera Network, AI Inference, Event Engine & Storage Vault
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 font-bold text-xs">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>ALL SUBSYSTEMS NOMINAL (99.4% SLA)</span>
        </div>
      </div>

      {/* 2. Grid: AI Engine Telemetry & Backend Gateways */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        {/* AI Engine Subsystem */}
        <div className="p-3 bg-[var(--bg-panel)] border border-[var(--border-tactical)] rounded space-y-2">
          <div className="flex items-center justify-between border-b border-[var(--border-tactical)] pb-1.5">
            <h3 className="text-xs font-bold text-cyan-400 uppercase flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              AI VISION & INFERENCE ENGINE
            </h3>
            <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800">
              CUDA / TENSORRT READY
            </span>
          </div>

          <div className="space-y-1.5">
            {aiEngineMetrics.map((m, idx) => (
              <div
                key={idx}
                className="p-1.5 rounded bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] text-[var(--text-secondary)] block">{m.label}</span>
                  <span className="text-xs font-bold text-[var(--text-primary)]">{m.value}</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-400">{m.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Backend & Event Pipeline Subsystem */}
        <div className="p-3 bg-[var(--bg-panel)] border border-[var(--border-tactical)] rounded space-y-2">
          <div className="flex items-center justify-between border-b border-[var(--border-tactical)] pb-1.5">
            <h3 className="text-xs font-bold text-cyan-400 uppercase flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5" />
              BACKEND API & EVENT ENGINE
            </h3>
            <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800">
              LOW-LATENCY BUS
            </span>
          </div>

          <div className="space-y-1.5">
            {backendServices.map((s, idx) => (
              <div
                key={idx}
                className="p-1.5 rounded bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-[var(--text-primary)]">{s.name}</span>
                  <span className="text-[9px] text-[var(--text-muted)] block">{s.port}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-emerald-400 block">{s.status}</span>
                  <span className="text-[9px] text-[var(--text-secondary)]">{s.latency} RTT</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Camera Fleet Telemetry Table */}
      <div className="bg-[var(--bg-panel)] border border-[var(--border-tactical)] rounded p-3 space-y-2">
        <div className="flex items-center justify-between border-b border-[var(--border-tactical)] pb-1.5">
          <h3 className="text-xs font-bold text-cyan-400 uppercase flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5" />
            CAMERA NETWORK FLEET TELEMETRY (4 / 4 ONLINE)
          </h3>
          <span className="text-[10px] text-emerald-400">0 PACKET LOSS DETECTED</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)] text-[9px] uppercase">
              <tr>
                <th className="p-2">Camera ID</th>
                <th className="p-2">Name / Location</th>
                <th className="p-2">Status</th>
                <th className="p-2">Mode</th>
                <th className="p-2">Throughput</th>
                <th className="p-2">Stream Latency</th>
                <th className="p-2">Frame Drop</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-tactical)]">
              {cameraFleet.map((cam) => (
                <tr key={cam.id} className="hover:bg-[var(--bg-panel-elevated)] transition-colors">
                  <td className="p-2 font-bold text-cyan-400">{cam.id}</td>
                  <td className="p-2 text-[var(--text-primary)]">{cam.name}</td>
                  <td className="p-2">
                    <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> ONLINE
                    </span>
                  </td>
                  <td className="p-2 text-[var(--text-secondary)]">{cam.mode}</td>
                  <td className="p-2 text-[var(--text-primary)]">{cam.fps} FPS</td>
                  <td className="p-2 text-emerald-400 font-bold">{cam.latency}</td>
                  <td className="p-2 text-[var(--text-muted)]">{cam.drop}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Evidence Storage & Database Telemetry */}
      <div className="p-3 bg-[var(--bg-panel)] border border-[var(--border-tactical)] rounded space-y-2">
        <div className="flex items-center justify-between border-b border-[var(--border-tactical)] pb-1.5">
          <h3 className="text-xs font-bold text-cyan-400 uppercase flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5" />
            EVIDENCE STORAGE & DATABASE INTEGRITY
          </h3>
          <span className="text-[9px] text-[var(--text-muted)]">IMMUTABLE RETENTION</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {storageSubsystems.map((sub, idx) => (
            <div key={idx} className="p-2 rounded bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] space-y-1">
              <span className="text-xs font-bold text-[var(--text-primary)] block">{sub.name}</span>
              <div className="flex justify-between text-[10px] text-[var(--text-secondary)]">
                <span>{sub.capacity || sub.records || sub.active}</span>
                <span className="text-emerald-400 font-bold">{sub.status}</span>
              </div>
              <span className="text-[9px] text-[var(--text-muted)] block">{sub.retention || sub.indexStatus || sub.size}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
