import React, { useState } from 'react';
import { useAlerts } from '../context/AlertContext';
import type { SeverityLevel, AlertStatus } from '../types/bavis';
import { ShieldAlert, CheckCircle, Clock, ExternalLink, Filter, AlertOctagon, AlertTriangle, Info } from 'lucide-react';

interface RealtimeAlertPanelProps {
  onSelectEvidence?: (evidenceId: string) => void;
}

export const RealtimeAlertPanel: React.FC<RealtimeAlertPanelProps> = ({ onSelectEvidence }) => {
  const { alerts, acknowledgeAlert, setSelectedEvidenceId } = useAlerts();
  const [filterSeverity, setFilterSeverity] = useState<SeverityLevel | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<AlertStatus | 'all'>('all');

  const filteredAlerts = alerts.filter((alert) => {
    if (filterSeverity !== 'all' && alert.severity !== filterSeverity) return false;
    if (filterStatus !== 'all' && alert.status !== filterStatus) return false;
    return true;
  });

  const getSeverityBadge = (severity: SeverityLevel) => {
    switch (severity) {
      case 'high':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-950/80 border border-red-500/60 text-red-400 text-[10px] font-mono font-bold animate-pulse-high">
            <AlertOctagon className="w-3 h-3" />
            HIGH BREACH
          </span>
        );
      case 'medium':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/60 text-amber-400 text-[10px] font-mono font-bold">
            <AlertTriangle className="w-3 h-3" />
            MEDIUM
          </span>
        );
      case 'low':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-950/80 border border-blue-500/60 text-blue-400 text-[10px] font-mono font-bold">
            <Info className="w-3 h-3" />
            LOW
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/90 border border-cyan-900/40 rounded-xl overflow-hidden glass-panel">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-cyan-900/40">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />
          <h2 className="text-sm font-black tracking-wider text-slate-100 uppercase">
            REAL-TIME ALERT STREAM
          </h2>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold">
            {alerts.length}
          </span>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value as SeverityLevel | 'all')}
            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs font-mono cursor-pointer focus:outline-none"
          >
            <option value="all">Severity: All</option>
            <option value="high">High Only</option>
            <option value="medium">Medium Only</option>
            <option value="low">Low Only</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as AlertStatus | 'all')}
            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs font-mono cursor-pointer focus:outline-none"
          >
            <option value="all">Status: All</option>
            <option value="new">Unacknowledged</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Alert Feed Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-6 border border-dashed border-slate-800 rounded-lg">
            <ShieldAlert className="w-10 h-10 text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-400">No active alerts matching criteria</p>
            <p className="text-xs text-slate-500 font-mono mt-1">Live WebSocket listener active...</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.alert_id}
              className={`p-3 rounded-lg border transition-all ${
                alert.status === 'new'
                  ? alert.severity === 'high'
                    ? 'bg-red-950/40 border-red-600/60 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                    : 'bg-slate-900/90 border-amber-600/40'
                  : 'bg-slate-900/40 border-slate-800 opacity-80'
              }`}
            >
              {/* Alert Header Row */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  {getSeverityBadge(alert.severity)}
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                    {alert.rule.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  <span>{new Date(alert.created_at).toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Description & Camera */}
              <p className="text-xs text-slate-300 font-sans mb-2 leading-relaxed">
                {alert.description || `Rule breach detected on camera [${alert.camera_id}].`}
              </p>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  <span className="text-cyan-400 font-semibold">{alert.camera_name || alert.camera_id}</span>
                  <span>•</span>
                  <span className="text-slate-400">{alert.location_code}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {alert.evidence_ref && (
                    <button
                      onClick={() => {
                        setSelectedEvidenceId(alert.evidence_ref);
                        if (onSelectEvidence) onSelectEvidence(alert.evidence_ref!);
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-cyan-950 border border-cyan-700/50 text-cyan-300 text-[11px] font-mono hover:bg-cyan-900 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>EVIDENCE</span>
                    </button>
                  )}

                  {alert.status === 'new' ? (
                    <button
                      onClick={() => acknowledgeAlert(alert.alert_id)}
                      className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-950 border border-emerald-600/60 text-emerald-300 text-[11px] font-mono font-bold hover:bg-emerald-900 transition-all shadow-sm"
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span>ACKNOWLEDGE</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/40">
                      <CheckCircle className="w-3 h-3" />
                      ACK BY {alert.acknowledged_by || 'Operator'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
