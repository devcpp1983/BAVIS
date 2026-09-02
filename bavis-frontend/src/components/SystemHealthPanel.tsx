import React from 'react';
import { Activity, Cpu, Server, Wifi, Video, ShieldCheck, AlertTriangle } from 'lucide-react';

export const SystemHealthPanel: React.FC = () => {
  const systemServices = [
    { name: 'REST BACKEND API', status: 'NOMINAL', latency: '12ms', uptime: '99.99%', icon: Server, color: 'text-emerald-500' },
    { name: 'ALERT STREAM WS', status: 'NOMINAL', latency: '14ms', uptime: '99.98%', icon: Wifi, color: 'text-emerald-500' },
    { name: 'AI INFERENCE ENGINE', status: 'NOMINAL', latency: '18ms', uptime: '99.95%', icon: Cpu, color: 'text-emerald-500' },
    { name: 'EVENT INGESTION PIPELINE', status: 'NOMINAL', latency: '9ms', uptime: '100.0%', icon: Activity, color: 'text-emerald-500' },
  ];

  const cameraFleetStatus = [
    { id: 'CAM-01', name: 'BOP Alpha Perimeter Fence', status: 'ONLINE', fps: 30, res: '1080p', ping: '4ms' },
    { id: 'CAM-02', name: 'Checkpost Bravo ANPR Gate', status: 'ONLINE', fps: 25, res: '1080p', ping: '6ms' },
    { id: 'CAM-03', name: 'BOP Charlie Night Patrol', status: 'ONLINE', fps: 30, res: '720p', ping: '5ms' },
    { id: 'CAM-04', name: 'Sector Delta Riverine Crossing', status: 'ONLINE', fps: 24, res: '1080p', ping: '8ms' },
    { id: 'CAM-14', name: 'Forward Observation Post 09', status: 'OFFLINE', fps: 0, res: 'N/A', ping: 'TIMEOUT (04:12 ago)' },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto space-y-4 select-none font-mono">
      {/* Header Banner */}
      <div className="flex items-center justify-between p-3 bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] rounded transition-colors">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-500" />
          <h2 className="text-xs font-bold tracking-wider text-[var(--text-primary)] uppercase">
            BAVIS SYSTEM HEALTH & INFRASTRUCTURE TELEMETRY
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-emerald-500 font-bold">OVERALL SYSTEM NOMINAL</span>
        </div>
      </div>

      {/* Core Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {systemServices.map((service, idx) => {
          const Icon = service.icon;
          return (
            <div key={idx} className="p-3 bg-[var(--bg-panel)] border border-[var(--border-tactical)] rounded flex flex-col justify-between space-y-2 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--text-secondary)] uppercase">{service.name}</span>
                <Icon className={`w-4 h-4 ${service.color}`} />
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-sm font-bold text-emerald-500">{service.status}</span>
                <span className="text-xs text-[var(--text-primary)]">RTT: {service.latency}</span>
              </div>

              <div className="pt-2 border-t border-[var(--border-tactical)] text-[10px] text-[var(--text-secondary)] flex justify-between">
                <span>UPTIME: {service.uptime}</span>
                <span className="text-emerald-500 font-bold">99.98% SLA</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Camera Fleet Network Status */}
      <div className="bg-[var(--bg-panel)] border border-[var(--border-tactical)] rounded p-3 space-y-3 transition-colors">
        <div className="flex items-center justify-between border-b border-[var(--border-tactical)] pb-2">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-cyan-500" />
            <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase">
              CAMERA SURVEILLANCE FLEET TELEMETRY (24 / 28 ONLINE)
            </h3>
          </div>

          <span className="text-[10px] text-amber-500 font-bold bg-amber-950/20 px-2 py-0.5 rounded border border-amber-800/40">
            1 CAMERA REQUIRES ATTENTION
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--bg-panel-elevated)] text-[var(--text-secondary)] text-[10px] uppercase">
              <tr>
                <th className="p-2">Camera ID</th>
                <th className="p-2">Location Name</th>
                <th className="p-2">Network Status</th>
                <th className="p-2">Frame Rate</th>
                <th className="p-2">Resolution</th>
                <th className="p-2">Ping Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-tactical)]">
              {cameraFleetStatus.map((cam) => (
                <tr key={cam.id} className="hover:bg-[var(--bg-panel-elevated)] transition-colors">
                  <td className="p-2 font-bold text-cyan-600">{cam.id}</td>
                  <td className="p-2 text-[var(--text-primary)]">{cam.name}</td>
                  <td className="p-2">
                    {cam.status === 'ONLINE' ? (
                      <span className="text-emerald-500 text-[10px] font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" /> ONLINE
                      </span>
                    ) : (
                      <span className="text-red-500 text-[10px] font-bold flex items-center gap-1 bg-red-950/20 px-1.5 py-0.2 rounded border border-red-800/60">
                        <AlertTriangle className="w-3 h-3 text-red-500" /> OFFLINE
                      </span>
                    )}
                  </td>
                  <td className="p-2 text-[var(--text-primary)]">{cam.fps} FPS</td>
                  <td className="p-2 text-[var(--text-secondary)]">{cam.res}</td>
                  <td className="p-2 text-[var(--text-secondary)]">{cam.ping}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
