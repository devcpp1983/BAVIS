import React, { useState } from 'react';
import { useAlerts } from '../context/AlertContext';
import { Zap, ShieldAlert, Car, Moon, ChevronUp, ChevronDown } from 'lucide-react';

export const DemoControlWidget: React.FC = () => {
  const { triggerDemoAlert } = useAlerts();
  const [expanded, setExpanded] = useState<boolean>(false);

  return (
    <div className="fixed bottom-4 right-4 z-50 font-mono text-xs">
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-950/90 border border-cyan-500/60 text-cyan-300 font-bold shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:bg-cyan-900 transition-all"
        >
          <Zap className="w-4 h-4 text-amber-400 animate-bounce" />
          <span>SIH DEMO CONTROLLER</span>
          <ChevronUp className="w-4 h-4 text-cyan-400" />
        </button>
      ) : (
        <div className="w-80 p-4 rounded-2xl bg-slate-950/95 border border-cyan-500/60 shadow-[0_0_30px_rgba(6,182,212,0.3)] glass-panel space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-cyan-900/40">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h3 className="font-black text-slate-100 uppercase">HACKATHON DEMO CONTROLLER</h3>
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="p-1 rounded text-slate-400 hover:text-slate-100"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-slate-400 font-sans leading-tight">
            Trigger real-time simulated AI events to test live WebSocket alert push, canvas bounding boxes, and evidence creation:
          </p>

          <div className="space-y-2">
            <button
              onClick={() => triggerDemoAlert('virtual_fence_breach', 'cam-01', 'high')}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-red-950/80 border border-red-500/60 text-red-200 text-xs font-bold hover:bg-red-900 transition-all"
            >
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>Breach Border Perimeter (cam-01)</span>
            </button>

            <button
              onClick={() => triggerDemoAlert('anpr_unlisted_vehicle', 'cam-02', 'high')}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-950/80 border border-amber-500/60 text-amber-200 text-xs font-bold hover:bg-amber-900 transition-all"
            >
              <Car className="w-4 h-4 text-amber-400" />
              <span>ANPR Unlisted Vehicle (cam-02)</span>
            </button>

            <button
              onClick={() => triggerDemoAlert('dwell_time_exceeded', 'cam-03', 'medium')}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs font-bold hover:bg-emerald-900 transition-all"
            >
              <Moon className="w-4 h-4 text-emerald-400" />
              <span>Night Dwell Intrusion (cam-03)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
