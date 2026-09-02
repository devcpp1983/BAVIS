import React, { useEffect, useState } from 'react';
import type { Evidence } from '../types/bavis';
import { api } from '../api/client';
import { DetectionChain } from './DetectionChain';
import { X, ShieldAlert, FileText, Download, Clock, Tag, Activity } from 'lucide-react';

interface EvidenceViewerProps {
  evidenceId: string;
  onClose: () => void;
}

export const EvidenceViewer: React.FC<EvidenceViewerProps> = ({ evidenceId, onClose }) => {
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [newNote, setNewNote] = useState<string>('');
  const [notes, setNotes] = useState<string[]>([]);

  useEffect(() => {
    const fetchEvidence = async () => {
      setLoading(true);
      try {
        const data = await api.getEvidence(evidenceId);
        setEvidence(data);
        setNotes(data.notes || []);
      } catch (err) {
        console.error('Failed to load evidence:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvidence();
  }, [evidenceId]);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setNotes((prev) => [...prev, `${newNote.trim()} (${new Date().toLocaleTimeString()} IST)`]);
    setNewNote('');
  };

  const handleExportJSON = () => {
    if (!evidence) return;
    const blob = new Blob([JSON.stringify(evidence, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BAVIS_Evidence_Dossier_${evidence.evidence_id}.json`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-[var(--bg-panel)] border border-[var(--border-tactical)] rounded overflow-hidden flex flex-col shadow-2xl transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--bg-panel-elevated)] border-b border-[var(--border-tactical)]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-red-950 border border-red-500/60 text-red-400">
              <ShieldAlert className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xs font-bold font-mono tracking-wider text-[var(--text-primary)] uppercase">
                INCIDENT INVESTIGATION DOSSIER • {evidenceId}
              </h2>
              <p className="text-[10px] font-mono text-cyan-600">
                FORENSIC CAPTURE REF: {evidence?.event_id || 'EVT-9001'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-950 border border-cyan-700/60 text-cyan-300 text-xs font-mono font-bold hover:bg-cyan-900 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT EVIDENCE</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-80 text-cyan-500 font-mono text-xs">
            <Activity className="w-6 h-6 animate-spin mb-2 text-cyan-500" />
            <span>DECRYPTING FORENSIC EVIDENCE & AI TELEMETRY...</span>
          </div>
        ) : evidence ? (
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            
            {/* Top Pipeline Detection Chain Story */}
            <DetectionChain />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              
              {/* Left 7 Cols: High-Res Evidence Snapshot & Risk Score */}
              <div className="md:col-span-7 flex flex-col gap-3">
                <div className="relative w-full aspect-video rounded overflow-hidden border border-[var(--border-tactical)] bg-black">
                  <img
                    src={evidence.snapshot_url}
                    alt="Incident Snapshot"
                    className="w-full h-full object-cover"
                  />

                  {evidence.detections.map((det, idx) => (
                    <div
                      key={idx}
                      className="absolute border-2 border-red-500 bg-red-500/10 rounded-sm"
                      style={{
                        left: `${(det.bbox[0] / 1920) * 100}%`,
                        top: `${(det.bbox[1] / 1080) * 100}%`,
                        width: `${((det.bbox[2] - det.bbox[0]) / 1920) * 100}%`,
                        height: `${((det.bbox[3] - det.bbox[1]) / 1080) * 100}%`,
                      }}
                    >
                      <span className="absolute -top-5 left-0 bg-red-600 text-white font-mono font-bold text-[9px] px-1 py-0.2 rounded shadow">
                        [{det.track_id}] {det.object_type.toUpperCase()} {Math.round(det.confidence * 100)}%
                      </span>
                    </div>
                  ))}

                  <div className="absolute bottom-2 left-2 bg-[var(--bg-panel-elevated)]/90 px-2 py-0.5 rounded text-[10px] font-mono text-cyan-600 border border-[var(--border-tactical)]">
                    SNAP TS: {new Date(evidence.frame_ts).toLocaleString()} IST
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] rounded font-mono text-xs">
                  <span className="text-[var(--text-secondary)]">AI INCIDENT RISK ASSESSMENT SCORE:</span>
                  <span className="text-sm font-bold text-red-500 bg-red-950/20 border border-red-800/60 px-2.5 py-0.5 rounded">
                    {evidence.risk_score} / 100 (CRITICAL THREAT)
                  </span>
                </div>
              </div>

              {/* Right 5 Cols: Detection Telemetry, Audit Trail & Notes */}
              <div className="md:col-span-5 flex flex-col gap-3 font-mono text-xs">
                
                {/* AI Telemetry */}
                <div className="p-3 bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] rounded space-y-2">
                  <h3 className="text-xs font-bold text-cyan-600 uppercase flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-cyan-500" />
                    DETECTION METADATA
                  </h3>
                  {evidence.detections.map((det, idx) => (
                    <div key={idx} className="space-y-1 text-[var(--text-primary)] text-[11px] pt-1.5 border-t border-[var(--border-tactical)]">
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">Track ID:</span>
                        <span className="font-bold text-cyan-600">{det.track_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">Object Class:</span>
                        <span className="capitalize">{det.object_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">AI Confidence:</span>
                        <span className="text-emerald-600">{(det.confidence * 100).toFixed(1)}%</span>
                      </div>
                      {det.anpr_plate && (
                        <div className="flex justify-between">
                          <span className="text-[var(--text-secondary)]">ANPR License Plate:</span>
                          <span className="text-amber-600 font-bold">{det.anpr_plate}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Audit Trail */}
                <div className="p-3 bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] rounded space-y-2">
                  <h3 className="text-xs font-bold text-cyan-600 uppercase flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-500" />
                    AUTOMATED FORENSIC AUDIT TRAIL
                  </h3>
                  <div className="space-y-1.5 max-h-28 overflow-y-auto text-[10px]">
                    {evidence.audit_trail.map((log, idx) => (
                      <div key={idx} className="border-l-2 border-cyan-500 pl-2 space-y-0.5">
                        <p className="text-[var(--text-primary)] font-semibold">{log.action}</p>
                        <p className="text-[9px] text-[var(--text-muted)]">{log.actor} • {new Date(log.timestamp).toLocaleTimeString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Case Notes */}
                <div className="p-3 bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] rounded space-y-2">
                  <h3 className="text-xs font-bold text-cyan-600 uppercase flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-cyan-500" />
                    OPERATOR LOG NOTES
                  </h3>
                  <div className="space-y-1 max-h-20 overflow-y-auto text-[10px] text-[var(--text-primary)]">
                    {notes.map((n, idx) => (
                      <div key={idx} className="p-1 rounded bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)]">
                        • {n}
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddNote} className="flex gap-1.5 pt-1">
                    <input
                      type="text"
                      placeholder="Add observation note..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="flex-1 bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded px-2 py-1 text-[10px] text-[var(--text-primary)] focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 rounded bg-cyan-950 border border-cyan-700 text-cyan-300 text-[10px] font-bold hover:bg-cyan-900 cursor-pointer"
                    >
                      ADD
                    </button>
                  </form>
                </div>

              </div>

            </div>

          </div>
        ) : null}

      </div>
    </div>
  );
};
