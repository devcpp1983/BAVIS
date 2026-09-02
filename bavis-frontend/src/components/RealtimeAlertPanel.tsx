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
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-950/80 border border-red-500/60 text-red-400 text-[10px] font-mono font-bold animate-pulse-critical">
            <AlertOctagon className="w-3 h-3" />
            CRITICAL
          </span>
        );
      case 'medium':
        return (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/60 text-amber-400 text-[10px] font-mono font-bold">
            <AlertTriangle className="w-3 h-3" />
            WARNING
          </span>
        );
      case 'low':
        return (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-500/60 text-blue-400 text-[10px] font-mono font-bold">
            <Info className="w-3 h-3" />
            INFO
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-panel)] border border-[var(--border-tactical)] rounded overflow-hidden select-none transition-colors">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-panel-elevated)] border-b border-[var(--border-tactical)]">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
          <h2 className="text-xs font-bold font-mono tracking-wider text-[var(--text-primary)] uppercase">
            PRIORITY ALERT RAIL
          </h2>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold">
            {alerts.length}
          </span>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <Filter className="w-3 h-3 text-[var(--text-secondary)]" />
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value as SeverityLevel | 'all')}
            className="bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded px-1.5 py-0.5 text-[var(--text-primary)] text-[10px] cursor-pointer focus:outline-none"
          >
            <option value="all">Severity: All</option>
            <option value="high">Critical Only</option>
            <option value="medium">Warning Only</option>
            <option value="low">Info Only</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as AlertStatus | 'all')}
            className="bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded px-1.5 py-0.5 text-[var(--text-primary)] text-[10px] cursor-pointer focus:outline-none"
          >
            <option value="all">Status: All</option>
            <option value="new">New / Unack</option>
            <option value="acknowledged">Acknowledged</option>
          </select>
        </div>
      </div>

      {/* Alert Feed Container */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-6 border border-dashed border-[var(--border-tactical)] rounded">
            <ShieldAlert className="w-8 h-8 text-[var(--text-muted)] mb-2" />
            <p className="text-xs font-mono font-semibold text-[var(--text-secondary)]">NO ACTIVE INCIDENT ALERTS</p>
            <p className="text-[10px] text-[var(--text-muted)] font-mono mt-1">Listening to real-time WebSocket alert stream...</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.alert_id}
              className={`p-2.5 rounded border transition-all ${
                alert.status === 'new'
                  ? alert.severity === 'high'
                    ? 'bg-red-950/20 border-red-600/60 shadow-[inset_0_0_8px_rgba(239,68,68,0.15)]'
                    : 'bg-[var(--bg-panel-elevated)] border-amber-600/40'
                  : 'bg-[var(--bg-panel-elevated)] border-[var(--border-tactical)] opacity-75'
              }`}
            >
              {/* Alert Header Row */}
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5">
                  {getSeverityBadge(alert.severity)}
                  <span className="text-[11px] font-bold font-mono text-[var(--text-primary)] uppercase tracking-tight truncate">
                    {alert.rule.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[10px] font-mono text-[var(--text-secondary)] shrink-0">
                  <Clock className="w-3 h-3 text-cyan-500" />
                  <span>{new Date(alert.created_at).toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Description & Camera */}
              <p className="text-[11px] text-[var(--text-primary)] font-sans mb-2 leading-tight">
                {alert.description || `Security rule breach on camera [${alert.camera_id}].`}
              </p>

              <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-secondary)] pt-1.5 border-t border-[var(--border-tactical)]">
                <div className="flex items-center gap-1">
                  <span className="text-cyan-600 font-semibold">{alert.camera_name || alert.camera_id}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  {alert.evidence_ref && (
                    <button
                      onClick={() => {
                        setSelectedEvidenceId(alert.evidence_ref);
                        if (onSelectEvidence) onSelectEvidence(alert.evidence_ref!);
                      }}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-700/60 text-cyan-300 text-[10px] font-mono hover:bg-cyan-900 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>INSPECT</span>
                    </button>
                  )}

                  {alert.status === 'new' ? (
                    <button
                      onClick={() => acknowledgeAlert(alert.alert_id)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-600/60 text-emerald-300 text-[10px] font-mono font-bold hover:bg-emerald-900 transition-all cursor-pointer"
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span>ACK</span>
                    </button>
                  ) : (
                    <span className="text-[9px] text-emerald-500 font-mono flex items-center gap-1 bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-900/40">
                      <CheckCircle className="w-3 h-3" />
                      ACK BY {alert.acknowledged_by || 'OP'}
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
