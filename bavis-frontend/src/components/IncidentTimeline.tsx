import React, { useState } from 'react';
import { useAlerts } from '../context/AlertContext';
import { EvidenceViewer } from './EvidenceViewer';
import { Clock, ExternalLink, Calendar, MapPin, CheckCircle, Search } from 'lucide-react';
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
    <div className="flex flex-col h-[calc(100vh-4.5rem)] p-4 overflow-hidden space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-900/90 border border-cyan-900/40 rounded-xl glass-panel">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-black tracking-wider text-slate-100 uppercase">
            INCIDENT TIMELINE & EVIDENCE REPOSITORY
          </h2>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search breaches, cameras, plates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value as SeverityLevel | 'all')}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="all">Severity: All</option>
            <option value="high">High Severity Only</option>
            <option value="medium">Medium Only</option>
            <option value="low">Low Only</option>
          </select>
        </div>
      </div>

      {/* Timeline List View */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border border-dashed border-slate-800 rounded-xl p-8 text-center">
            <Clock className="w-12 h-12 text-slate-600 mb-3" />
            <p className="text-sm font-semibold text-slate-400">No incident evidence records match current filters</p>
          </div>
        ) : (
          filteredAlerts.map((alert, idx) => (
            <div
              key={alert.alert_id}
              className="relative flex items-start gap-4 p-4 rounded-xl bg-slate-950/80 border border-cyan-900/40 glass-panel glass-panel-hover"
            >
              <div className="flex flex-col items-center">
                <div
                  className={`w-3.5 h-3.5 rounded-full border-2 ${
                    alert.severity === 'high'
                      ? 'bg-red-500 border-red-300 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse'
                      : alert.severity === 'medium'
                      ? 'bg-amber-500 border-amber-300'
                      : 'bg-blue-500 border-blue-300'
                  }`}
                />
                {idx < filteredAlerts.length - 1 && (
                  <div className="w-0.5 h-full bg-slate-800 my-1 min-h-[4rem]" />
                )}
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
                
                <div className="md:col-span-8 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                        alert.severity === 'high'
                          ? 'bg-red-950 text-red-400 border-red-700'
                          : alert.severity === 'medium'
                          ? 'bg-amber-950 text-amber-400 border-amber-700'
                          : 'bg-blue-950 text-blue-400 border-blue-700'
                      }`}
                    >
                      {alert.severity} SEVERITY
                    </span>
                    <span className="text-xs font-bold text-slate-100 uppercase tracking-wide">
                      {alert.rule.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-900">
                      ID: {alert.alert_id}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    {alert.description || 'Security rule breach recorded.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-2 border-t border-slate-900">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{alert.camera_name || alert.camera_id}</span>
                      <span className="text-slate-500">({alert.location_code})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(alert.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-4 flex flex-col items-end justify-between space-y-2">
                  <div className="w-full h-24 rounded-lg bg-black overflow-hidden border border-slate-800 relative group cursor-pointer"
                    onClick={() => alert.evidence_ref && setSelectedEvidenceId(alert.evidence_ref)}>
                    <img
                      src="https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=600&q=80"
                      alt="Evidence Snapshot"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-cyan-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-[10px] font-mono font-bold text-cyan-200 bg-slate-950/90 px-2 py-1 rounded border border-cyan-500">
                        INSPECT DOSSIER
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full justify-end">
                    {alert.status === 'new' ? (
                      <button
                        onClick={() => acknowledgeAlert(alert.alert_id)}
                        className="px-3 py-1 rounded bg-emerald-950 border border-emerald-600/70 text-emerald-300 text-xs font-mono font-bold hover:bg-emerald-900 transition-all"
                      >
                        ACKNOWLEDGE
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-900/40">
                        <CheckCircle className="w-3.5 h-3.5" /> ACKNOWLEDGED
                      </span>
                    )}

                    {alert.evidence_ref && (
                      <button
                        onClick={() => setSelectedEvidenceId(alert.evidence_ref)}
                        className="flex items-center gap-1 px-3 py-1 rounded bg-cyan-950 border border-cyan-700/60 text-cyan-300 text-xs font-mono font-bold hover:bg-cyan-900 transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
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
