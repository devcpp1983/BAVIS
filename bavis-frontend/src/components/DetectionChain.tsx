import React from 'react';
import { Eye, ShieldAlert, Cpu, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import type { Alert } from '../types/bavis';

interface DetectionChainProps {
  alert?: Alert | null;
}

export const DetectionChain: React.FC<DetectionChainProps> = ({ alert }) => {
  const steps = [
    {
      id: 1,
      title: 'OBJECT DETECTED',
      desc: alert?.object_type ? `${alert.object_type.toUpperCase()} Confidence 96%` : 'PERSON Confidence 96%',
      time: '15:41:06 IST',
      status: 'completed',
      icon: Eye,
      color: 'text-cyan-500',
    },
    {
      id: 2,
      title: 'TRACK CREATED',
      desc: alert?.object_type === 'vehicle' ? 'TRACK ID: TR-4401 (UP16-AB-8849)' : 'TRACK ID: P-014 Persistent',
      time: '15:41:07 IST',
      status: 'completed',
      icon: Cpu,
      color: 'text-cyan-500',
    },
    {
      id: 3,
      title: 'ZONE BOUNDARY CROSSED',
      desc: 'Restricted Border Buffer Zone-A',
      time: '15:41:09 IST',
      status: 'completed',
      icon: AlertTriangle,
      color: 'text-amber-500',
    },
    {
      id: 4,
      title: 'RULE ENGINE TRIGGERED',
      desc: alert?.rule ? alert.rule.toUpperCase().replace(/_/g, ' ') : 'VIRTUAL FENCE BREACH',
      time: '15:41:09 IST',
      status: 'completed',
      icon: ShieldAlert,
      color: 'text-red-500',
    },
    {
      id: 5,
      title: 'OPERATOR ACKNOWLEDGEMENT',
      desc: alert?.status === 'acknowledged' ? `Acknowledged by ${alert.acknowledged_by || 'Operator'}` : 'Pending Operator Action',
      time: alert?.acknowledged_at ? new Date(alert.acknowledged_at).toLocaleTimeString() : '15:41:18 IST',
      status: alert?.status === 'acknowledged' ? 'completed' : 'pending',
      icon: CheckCircle,
      color: alert?.status === 'acknowledged' ? 'text-emerald-500' : 'text-[var(--text-muted)]',
    },
  ];

  return (
    <div className="bg-[var(--bg-panel)] border border-[var(--border-tactical)] rounded p-3 select-none transition-colors">
      <div className="flex items-center gap-2 mb-3 font-mono border-b border-[var(--border-tactical)] pb-2">
        <Cpu className="w-4 h-4 text-cyan-500" />
        <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
          AI DETECTION & INTELLIGENCE PIPELINE CHAIN
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-2 relative">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={step.id} className="relative flex flex-col bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] p-2 rounded transition-colors">
              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-[var(--text-muted)]">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              )}

              <div className="flex items-center justify-between mb-1 text-[10px] font-mono">
                <span className="text-[var(--text-muted)]">STEP 0{step.id}</span>
                <span className="text-[var(--text-secondary)]">{step.time}</span>
              </div>

              <div className="flex items-center gap-1.5 mb-1">
                <Icon className={`w-3.5 h-3.5 ${step.color}`} />
                <span className="text-[11px] font-bold font-mono text-[var(--text-primary)] truncate">{step.title}</span>
              </div>

              <p className="text-[10px] font-mono text-[var(--text-secondary)] truncate">{step.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
