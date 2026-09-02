import React, { useState } from 'react';
import { useAlerts } from '../context/AlertContext';
import { Zap, ShieldAlert, Car, Moon, ChevronUp, ChevronDown } from 'lucide-react';

export const DemoControlWidget: React.FC = () => {
  const { triggerDemoAlert } = useAlerts();
  const [expanded, setExpanded] = useState<boolean>(false);

  return (
    <div className="fixed bottom-8 right-3 z-50 font-mono text-xs select-none">
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded bg-cyan-950/90 border border-cyan-500/60 text-cyan-300 font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:bg-cyan-900 transition-all cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>TACTICAL DEMO CONTROLLER</span>
          <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
        </button>
      ) : (
        <div className="w-72 p-3 rounded bg-[var(--bg-panel)] border border-cyan-500/60 shadow-2xl space-y-2.5 transition-colors">
          <div className="flex items-center justify-between pb-1.5 border-b border-[var(--border-tactical)]">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <h3 className="font-bold text-[var(--text-primary)] uppercase text-[11px]">HACKATHON DEMO CONTROLLER</h3>
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="p-0.5 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[10px] text-[var(--text-secondary)] font-sans leading-tight">
            Trigger real-time simulated AI events to verify live WebSocket alert stream, bounding boxes, and evidence creation:
          </p>

          <div className="space-y-1.5">
            <button
              onClick={() => triggerDemoAlert('virtual_fence_breach', 'cam-01', 'high')}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded bg-red-950/80 border border-red-500/60 text-red-200 text-[11px] font-bold hover:bg-red-900 transition-all cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>Breach Border Perimeter (cam-01)</span>
            </button>

            <button
              onClick={() => triggerDemoAlert('anpr_unlisted_vehicle', 'cam-02', 'high')}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded bg-amber-950/80 border border-amber-500/60 text-amber-200 text-[11px] font-bold hover:bg-amber-900 transition-all cursor-pointer"
            >
              <Car className="w-3.5 h-3.5 text-amber-400" />
              <span>ANPR Unlisted Vehicle (cam-02)</span>
            </button>

            <button
              onClick={() => triggerDemoAlert('dwell_time_exceeded', 'cam-03', 'medium')}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-[11px] font-bold hover:bg-emerald-900 transition-all cursor-pointer"
            >
              <Moon className="w-3.5 h-3.5 text-emerald-400" />
              <span>Night Dwell Intrusion (cam-03)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
