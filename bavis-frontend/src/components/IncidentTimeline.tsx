import React, { useState } from 'react';
import { useAlerts } from '../context/AlertContext';
import { EvidenceViewer } from './EvidenceViewer';
import { Clock, ExternalLink, Calendar, MapPin, CheckCircle, Search, ShieldAlert } from 'lucide-react';
import type { SeverityLevel } from '../types/bavis';

export const IncidentTimeline: React.FC = () => {
  const { alerts, selectedEvidenceId, setSelectedEvidenceId, acknowledgeAlert } = useAlerts();
  const [filterSeverity, setFilterSeverity] = useState<SeverityLevel | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredAlerts = alerts.filter((alert) => {
    if (filterSeverity !== 'all' && alert.severity !== filterSeverity) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        alert.rule.toLowerCase().includes(q) ||
        alert.camera_name?.toLowerCase().includes(q) ||
        alert.location_code?.toLowerCase().includes(q) ||
        alert.description?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-3 select-none">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 py-2 bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] rounded transition-colors">
        <div className="flex items-center gap-2 font-mono">
          <Clock className="w-4 h-4 text-cyan-500" />
          <h2 className="text-xs font-bold tracking-wider text-[var(--text-primary)] uppercase">
            INCIDENT INVESTIGATION & EVIDENCE TIMELINE
          </h2>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto font-mono text-xs">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search breaches, cameras, plates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded pl-8 pr-2.5 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value as SeverityLevel | 'all')}
            className="bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none cursor-pointer"
          >
            <option value="all">Severity: All</option>
            <option value="high">Critical Only</option>
            <option value="medium">Warning Only</option>
            <option value="low">Info Only</option>
          </select>
        </div>
      </div>

      {/* Timeline List View */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border border-dashed border-[var(--border-tactical)] rounded p-8 text-center">
            <ShieldAlert className="w-10 h-10 text-[var(--text-muted)] mb-2" />
            <p className="text-xs font-mono font-semibold text-[var(--text-secondary)]">NO INCIDENT EVIDENCE RECORDS MATCHING FILTERS</p>
          </div>
        ) : (
          filteredAlerts.map((alert, idx) => (
            <div
              key={alert.alert_id}
              className="relative flex items-start gap-3 p-3 rounded bg-[var(--bg-panel)] border border-[var(--border-tactical)] hover:border-[var(--border-highlight)] transition-all"
            >
              <div className="flex flex-col items-center pt-1">
                <div
                  className={`w-3 h-3 rounded-full border ${
                    alert.severity === 'high'
                      ? 'bg-red-500 border-red-300 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse'
                      : alert.severity === 'medium'
                      ? 'bg-amber-500 border-amber-300'
                      : 'bg-blue-500 border-blue-300'
                  }`}
                />
                {idx < filteredAlerts.length - 1 && (
                  <div className="w-0.5 h-full bg-[var(--border-tactical)] my-1 min-h-[3rem]" />
                )}
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3">
                
                <div className="md:col-span-8 space-y-1.5 font-mono">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border ${
                        alert.severity === 'high'
                          ? 'bg-red-950 text-red-400 border-red-700'
                          : alert.severity === 'medium'
                          ? 'bg-amber-950 text-amber-400 border-amber-700'
                          : 'bg-blue-950 text-blue-400 border-blue-700'
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide">
                      {alert.rule.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-cyan-600 bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-900">
                      ID: {alert.alert_id}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-primary)] font-sans leading-relaxed">
                    {alert.description || 'Security rule breach recorded.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[10px] text-[var(--text-secondary)] pt-1.5 border-t border-[var(--border-tactical)]">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-cyan-500" />
                      <span>{alert.camera_name || alert.camera_id}</span>
                      <span className="text-[var(--text-muted)]">({alert.location_code})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[var(--text-secondary)]" />
                      <span>{new Date(alert.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-4 flex flex-col items-end justify-between space-y-2">
                  <div
                    className="w-full h-20 rounded bg-black overflow-hidden border border-[var(--border-tactical)] relative group cursor-pointer"
                    onClick={() => alert.evidence_ref && setSelectedEvidenceId(alert.evidence_ref)}
                  >
                    <img
                      src="https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=600&q=80"
                      alt="Evidence Snapshot"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-cyan-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-[10px] font-mono font-bold text-cyan-200 bg-[var(--bg-panel-elevated)] px-2 py-0.5 rounded border border-cyan-500">
                        INSPECT DOSSIER
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full justify-end font-mono">
                    {alert.status === 'new' ? (
                      <button
                        onClick={() => acknowledgeAlert(alert.alert_id)}
                        className="px-2.5 py-0.5 rounded bg-emerald-950 border border-emerald-600/70 text-emerald-300 text-xs font-bold hover:bg-emerald-900 transition-all cursor-pointer"
                      >
                        ACKNOWLEDGE
                      </button>
                    ) : (
                      <span className="text-[10px] text-emerald-500 flex items-center gap-1 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/40">
                        <CheckCircle className="w-3 h-3" /> ACKNOWLEDGED
                      </span>
                    )}

                    {alert.evidence_ref && (
                      <button
                        onClick={() => setSelectedEvidenceId(alert.evidence_ref)}
                        className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-cyan-950 border border-cyan-700/60 text-cyan-300 text-xs font-bold hover:bg-cyan-900 transition-all cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>EVIDENCE</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>
          ))
        )}
      </div>

      {selectedEvidenceId && (
        <EvidenceViewer
          evidenceId={selectedEvidenceId}
          onClose={() => setSelectedEvidenceId(null)}
        />
      )}
    </div>
  );
};
