import React, { useEffect, useState } from 'react';
import type { Evidence } from '../types/bavis';
import { api } from '../api/client';
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
    a.download = `BAVIS_Evidence_${evidence.evidence_id}.json`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-950 border border-cyan-500/40 rounded-2xl overflow-hidden glass-panel flex flex-col shadow-[0_0_40px_rgba(6,182,212,0.2)]">
        
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900/90 border-b border-cyan-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-950 border border-red-500/50 text-red-400">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-wider text-slate-100 uppercase">
                INCIDENT EVIDENCE DOSSIER • {evidenceId}
              </h2>
              <p className="text-xs font-mono text-cyan-400">
                FORENSIC CAPTURE REF: {evidence?.event_id || 'EVT-9001'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950 border border-cyan-700/60 text-cyan-300 text-xs font-mono font-bold hover:bg-cyan-900 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT REPORT</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-80 text-cyan-400 font-mono text-xs">
            <Activity className="w-8 h-8 animate-spin mb-2 text-cyan-400" />
            <span>DECRYPTING EVIDENCE SNAPSHOT & AI TELEMETRY...</span>
          </div>
        ) : evidence ? (
          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
            
            <div className="md:col-span-7 flex flex-col space-y-3">
              <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-cyan-900/50 bg-black group">
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
                    <span className="absolute -top-6 left-0 bg-red-600 text-white font-mono font-bold text-[10px] px-1.5 py-0.5 rounded shadow">
                      [{det.track_id}] {det.object_type.toUpperCase()} {Math.round(det.confidence * 100)}%
                    </span>
                  </div>
                ))}

                <div className="absolute bottom-2 left-2 bg-slate-950/80 px-2.5 py-1 rounded text-[10px] font-mono text-cyan-300 border border-slate-800">
                  SNAP TS: {new Date(evidence.frame_ts).toLocaleString()} IST
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-900/80 border border-slate-800 rounded-xl font-mono text-xs">
                <span className="text-slate-400">AI EVENT RISK EVALUATION SCORE:</span>
                <span className="text-base font-bold text-red-400 bg-red-950/80 border border-red-800 px-3 py-0.5 rounded">
                  {evidence.risk_score} / 100
                </span>
              </div>
            </div>

            <div className="md:col-span-5 flex flex-col space-y-4 font-mono text-xs">
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                <h3 className="text-xs font-bold text-cyan-300 uppercase flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-cyan-400" />
                  AI DETECTION TELEMETRY
                </h3>
                {evidence.detections.map((det, idx) => (
                  <div key={idx} className="space-y-1 text-slate-300 text-[11px] pt-1 border-t border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Track ID:</span>
                      <span className="font-bold text-cyan-400">{det.track_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Classification:</span>
                      <span className="capitalize">{det.object_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Confidence:</span>
                      <span className="text-emerald-400">{(det.confidence * 100).toFixed(1)}%</span>
                    </div>
                    {det.anpr_plate && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">ANPR License Plate:</span>
                        <span className="text-amber-400 font-bold">{det.anpr_plate}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                <h3 className="text-xs font-bold text-cyan-300 uppercase flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  AUTOMATED AUDIT TRAIL
                </h3>
                <div className="space-y-2 max-h-32 overflow-y-auto text-[11px]">
                  {evidence.audit_trail.map((log, idx) => (
                    <div key={idx} className="border-l-2 border-cyan-500 pl-2 space-y-0.5">
                      <p className="text-slate-200 font-semibold">{log.action}</p>
                      <p className="text-[10px] text-slate-500">{log.actor} • {new Date(log.timestamp).toLocaleTimeString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                <h3 className="text-xs font-bold text-cyan-300 uppercase flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  OPERATOR CASE NOTES
                </h3>
                <div className="space-y-1.5 max-h-24 overflow-y-auto text-[11px] text-slate-300">
                  {notes.map((n, idx) => (
                    <div key={idx} className="p-1.5 rounded bg-slate-950 border border-slate-800">
                      • {n}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddNote} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Add operational observation..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 rounded bg-cyan-950 border border-cyan-700 text-cyan-300 text-[11px] font-bold hover:bg-cyan-900"
                  >
                    ADD
                  </button>
                </form>
              </div>

            </div>

          </div>
        ) : null}

      </div>
    </div>
  );
};
