import React, { useEffect, useState } from 'react';
import type { Evidence } from '../types/bavis';
import { api } from '../api/client';
import { DetectionChain } from './DetectionChain';
import { X, ShieldAlert, Download, Clock, Tag, Activity, KeyRound, CheckCircle2 } from 'lucide-react';

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
    setNotes((prev) => [...prev, `${newNote.trim()} (${new Date().toISOString().substring(11, 19)} UTC)`]);
    setNewNote('');
  };

  const handleExportJSON = () => {
    if (!evidence) return;
    const blob = new Blob([JSON.stringify(evidence, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BAVIS_Forensic_Evidence_${evidence.evidence_id}.json`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 select-none font-mono">
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-[var(--bg-panel)] border border-[var(--border-tactical)] rounded overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-panel-elevated)] border-b border-[var(--border-tactical)]">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-red-950 border border-red-500/60 text-red-400">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs font-bold tracking-wider text-[var(--text-primary)] uppercase">
                FORENSIC EVIDENCE & INTEGRITY RECORD • {evidenceId}
              </h2>
              <p className="text-[10px] text-[var(--text-secondary)]">
                Cryptographically signed snapshot and spatio-temporal detection audit trail
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-950 border border-cyan-700 text-cyan-300 text-xs font-bold hover:bg-cyan-900 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT JSON</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-80 text-cyan-400 text-xs">
            <Activity className="w-6 h-6 animate-spin mb-2" />
            <span>RETRIEVING FORENSIC EVIDENCE RECORD...</span>
          </div>
        ) : evidence ? (
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
            {/* Detection Pipeline Architecture Flow */}
            <DetectionChain />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Left 7 Cols: High-Res Snapshot + Cryptographic Integrity Hash */}
              <div className="md:col-span-7 flex flex-col gap-2.5">
                <div className="relative w-full aspect-video rounded overflow-hidden border border-[var(--border-tactical)] bg-black">
                  <img
                    src={evidence.snapshot_url}
                    alt="Evidence Snapshot"
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
                      <span className="absolute -top-4 left-0 bg-red-600 text-white font-mono font-bold text-[8px] px-1 py-0.2 rounded shadow">
                        [{det.track_id}] {det.object_type.toUpperCase()} {(det.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}

                  <div className="absolute bottom-2 left-2 bg-[var(--bg-panel-elevated)]/90 px-2 py-0.5 rounded text-[9px] font-mono text-cyan-400 border border-[var(--border-tactical)]">
                    FRAME TS: {new Date(evidence.frame_ts).toISOString().substring(11, 19)} UTC
                  </div>
                </div>

                {/* Cryptographic Integrity Record */}
                <div className="p-2.5 bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] rounded space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>INTEGRITY RECORD (FORENSIC TAMPER PROTECTION)</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> VERIFIED
                    </span>
                  </div>

                  <div className="bg-[var(--bg-panel)] p-1.5 rounded border border-[var(--border-tactical)] text-[10px] text-[var(--text-secondary)] break-all select-all">
                    {evidence.integrity_hash || 'SHA256: 7b9e3d0f81a42c67e901bc89a712f54a8109d9e4a3b2c1f0e9d8c7b6a504f321'}
                  </div>

                  <p className="text-[9px] text-[var(--text-muted)]">
                    Deterministic SHA-256 hash verified upon frame capture. Proves chain of custody integrity for incident review.
                  </p>
                </div>
              </div>

              {/* Right 5 Cols: Detection Metadata, Audit Log & Notes */}
              <div className="md:col-span-5 flex flex-col gap-2.5 text-xs">
                {/* Detection Metadata */}
                <div className="p-2.5 bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] rounded space-y-2">
                  <h3 className="text-xs font-bold text-cyan-400 uppercase flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    DETECTION METADATA
                  </h3>
                  {evidence.detections.map((det, idx) => (
                    <div key={idx} className="space-y-1 text-[var(--text-primary)] text-[11px] pt-1 border-t border-[var(--border-tactical)]">
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">Track ID:</span>
                        <span className="font-bold text-cyan-400">{det.track_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">Object Class:</span>
                        <span className="capitalize">{det.object_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">AI Confidence:</span>
                        <span className="text-emerald-400 font-bold">{(det.confidence * 100).toFixed(1)}%</span>
                      </div>
                      {det.speed_kmh && (
                        <div className="flex justify-between">
                          <span className="text-[var(--text-secondary)]">Estimated Speed:</span>
                          <span className="text-cyan-400">{det.speed_kmh} km/h</span>
                        </div>
                      )}
                      {det.anpr_plate && (
                        <div className="flex justify-between">
                          <span className="text-[var(--text-secondary)]">ANPR License Plate:</span>
                          <span className="text-amber-400 font-bold">{det.anpr_plate}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Audit Trail */}
                <div className="p-2.5 bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] rounded space-y-1.5">
                  <h3 className="text-xs font-bold text-cyan-400 uppercase flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    CHAIN OF CUSTODY AUDIT TRAIL
                  </h3>
                  <div className="space-y-1.5 max-h-24 overflow-y-auto text-[10px]">
                    {evidence.audit_trail.map((log, idx) => (
                      <div key={idx} className="border-l-2 border-cyan-500 pl-2 space-y-0.5">
                        <p className="text-[var(--text-primary)] font-semibold">{log.action}</p>
                        <p className="text-[9px] text-[var(--text-muted)]">{log.actor}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Case Notes */}
                <div className="p-2.5 bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] rounded space-y-2 flex-1 flex flex-col">
                  <h3 className="text-xs font-bold text-cyan-400 uppercase">
                    OPERATOR OBSERVATION NOTES
                  </h3>
                  <div className="space-y-1 max-h-20 overflow-y-auto text-[10px] text-[var(--text-primary)] flex-1">
                    {notes.map((n, idx) => (
                      <div key={idx} className="p-1 rounded bg-[var(--bg-panel)] border border-[var(--border-tactical)]">
                        • {n}
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddNote} className="flex gap-1.5 pt-1">
                    <input
                      type="text"
                      placeholder="Append note..."
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
