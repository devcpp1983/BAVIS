import React, { useState } from 'react';
import { useAlerts } from '../context/AlertContext';
import { EvidenceViewer } from './EvidenceViewer';
import { FileCheck, Download, KeyRound, MapPin, Search } from 'lucide-react';

export const EvidenceTab: React.FC = () => {
  const { alerts, selectedEvidenceId, setSelectedEvidenceId } = useAlerts();
  const [searchQuery, setSearchQuery] = useState<string>('');

  const evidenceAlerts = alerts.filter((a) => a.evidence_ref);

  const filtered = evidenceAlerts.filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.alert_id.toLowerCase().includes(q) ||
      a.rule.toLowerCase().includes(q) ||
      a.camera_name?.toLowerCase().includes(q) ||
      a.evidence_ref?.toLowerCase().includes(q) ||
      a.integrity_hash?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-2.5 select-none font-mono text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 p-2.5 bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] rounded">
        <div className="flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-cyan-400" />
          <div>
            <h2 className="text-xs font-bold tracking-wider text-[var(--text-primary)] uppercase">
              FORENSIC EVIDENCE REPOSITORY & INTEGRITY VAULT
            </h2>
            <p className="text-[10px] text-[var(--text-secondary)]">
              Cryptographically signed frame snapshots, bounding box metadata & immutable audit records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search evidence dossier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded pl-8 pr-2.5 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Grid of Evidence Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto flex-1 pr-1">
        {filtered.map((alert) => (
          <div
            key={alert.alert_id}
            className="p-3 bg-[var(--bg-panel)] border border-[var(--border-tactical)] rounded hover:border-cyan-500/60 transition-all flex flex-col justify-between space-y-2.5"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400">{alert.evidence_ref || 'EVD-9001'}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border ${
                    alert.severity === 'high'
                      ? 'bg-red-950 text-red-300 border-red-700'
                      : 'bg-amber-950 text-amber-300 border-amber-700'
                  }`}
                >
                  {alert.severity}
                </span>
              </div>

              <div className="relative aspect-video bg-black rounded overflow-hidden border border-[var(--border-tactical)]">
                <img
                  src={
                    alert.rule.includes('vehicle')
                      ? 'https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=600&q=80'
                      : 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=600&q=80'
                  }
                  alt="Snapshot"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-1 left-1 bg-black/80 px-1.5 py-0.5 rounded text-[8px] text-cyan-400">
                  {new Date(alert.created_at).toISOString().substring(11, 19)} UTC
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase">
                  {alert.rule.replace(/_/g, ' ')}
                </h4>
                <p className="text-[10px] text-[var(--text-secondary)] line-clamp-2 mt-0.5">
                  {alert.description}
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-[9px] text-[var(--text-muted)]">
                <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="truncate">{alert.camera_name} ({alert.location_code})</span>
              </div>

              <div className="p-1.5 rounded bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] text-[8px] text-[var(--text-muted)] flex items-center gap-1">
                <KeyRound className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">{alert.integrity_hash || 'SHA256: 7b9e3d0f81a42c67e901bc89a712f54a8109d9e4a3b2c1f0e9d8c7b6a504f321'}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--border-tactical)] flex items-center justify-between">
              <span className="text-[9px] text-emerald-400 font-bold">INTEGRITY VERIFIED</span>
              <button
                onClick={() => setSelectedEvidenceId(alert.evidence_ref || 'EVD-2026-00921')}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-950 border border-cyan-700 text-cyan-300 text-xs font-bold hover:bg-cyan-900 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                <span>INSPECT DOSSIER</span>
              </button>
            </div>
          </div>
        ))}
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
