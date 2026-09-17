import React, { useState } from 'react';
import { useAlerts } from '../context/AlertContext';
import { EvidenceViewer } from './EvidenceViewer';
import {
  ShieldAlert,
  Search,
  CheckCircle,
  FileCheck,
  MapPin,
  Clock,
  Shield,
  Activity,
  Layers,
  ChevronRight,
} from 'lucide-react';
import type { Alert, SeverityLevel } from '../types/bavis';

interface IncidentTimelineProps {
  initialSelectedAlert?: Alert | null;
}

export const IncidentTimeline: React.FC<IncidentTimelineProps> = ({ initialSelectedAlert }) => {
  const { alerts, selectedEvidenceId, setSelectedEvidenceId, acknowledgeAlert } = useAlerts();
  const [filterSeverity, setFilterSeverity] = useState<SeverityLevel | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIncident, setSelectedIncident] = useState<Alert | null>(initialSelectedAlert || (alerts.length > 0 ? alerts[0] : null));

  const filteredAlerts = alerts.filter((alert) => {
    if (filterSeverity !== 'all' && alert.severity !== filterSeverity) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        alert.rule.toLowerCase().includes(q) ||
        alert.camera_name?.toLowerCase().includes(q) ||
        alert.location_code?.toLowerCase().includes(q) ||
        alert.description?.toLowerCase().includes(q) ||
        alert.alert_id.toLowerCase().includes(q) ||
        alert.track_id?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-2.5 select-none font-mono">
      {/* 1. Top Filter & Search Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 p-2.5 bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] rounded">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-cyan-400" />
          <div>
            <h2 className="text-xs font-bold tracking-wider text-[var(--text-primary)] uppercase">
              SECURITY INCIDENT MANAGEMENT & EXPLAINABLE REASONING CONSOLE
            </h2>
            <p className="text-[10px] text-[var(--text-secondary)]">
              Multi-sensor temporal correlation, behavioral rule verification & forensic audit
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto text-xs">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search incidents, tracks, rules..."
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
            <option value="high">Critical / High</option>
            <option value="medium">Warning / Medium</option>
            <option value="low">Info / Low</option>
          </select>
        </div>
      </div>

      {/* 2. Main Content Split: Incident Table (Left) + Detailed Intelligence & Timeline Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 flex-1 min-h-0 overflow-hidden">
        {/* Left 7 Cols: Structured Incident Table */}
        <div className="lg:col-span-7 bg-[var(--bg-panel)] border border-[var(--border-tactical)] rounded flex flex-col overflow-hidden">
          <div className="px-3 py-1.5 bg-[var(--bg-panel-elevated)] border-b border-[var(--border-tactical)] flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-primary)] uppercase">
              RECORDED SECURITY INCIDENTS ({filteredAlerts.length})
            </span>
            <span className="text-[10px] text-[var(--text-secondary)]">SELECT INCIDENT TO INSPECT INTELLIGENCE REASONING</span>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-panel-elevated)] border-b border-[var(--border-tactical)] text-[var(--text-secondary)] uppercase text-[9px] sticky top-0 z-10">
                <tr>
                  <th className="px-2.5 py-2">Time</th>
                  <th className="px-2.5 py-2">Incident ID</th>
                  <th className="px-2.5 py-2">Camera / Location</th>
                  <th className="px-2.5 py-2">Rule / Type</th>
                  <th className="px-2.5 py-2">Severity</th>
                  <th className="px-2.5 py-2">Status</th>
                  <th className="px-2.5 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-tactical)]">
                {filteredAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-10 text-center text-[var(--text-muted)]">
                      NO SECURITY INCIDENTS FOUND
                    </td>
                  </tr>
                ) : (
                  filteredAlerts.map((alert) => {
                    const isSelected = selectedIncident?.alert_id === alert.alert_id;
                    return (
                      <tr
                        key={alert.alert_id}
                        onClick={() => setSelectedIncident(alert)}
                        className={`hover:bg-[var(--bg-panel-elevated)] transition-colors cursor-pointer ${
                          isSelected ? 'bg-cyan-950/60 border-l-2 border-cyan-400' : ''
                        }`}
                      >
                        <td className="px-2.5 py-2 text-[var(--text-secondary)] whitespace-nowrap text-[11px]">
                          {new Date(alert.created_at).toISOString().substring(11, 19)}
                        </td>
                        <td className="px-2.5 py-2 font-bold text-cyan-400 whitespace-nowrap">
                          {alert.alert_id}
                        </td>
                        <td className="px-2.5 py-2 text-[var(--text-primary)]">
                          <span className="font-semibold block">{alert.camera_name || alert.camera_id}</span>
                          <span className="text-[9px] text-[var(--text-muted)]">{alert.location_code}</span>
                        </td>
                        <td className="px-2.5 py-2 text-[var(--text-primary)] uppercase text-[11px]">
                          {alert.rule.replace(/_/g, ' ')}
                        </td>
                        <td className="px-2.5 py-2">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border ${
                              alert.severity === 'high'
                                ? 'bg-red-950 text-red-400 border-red-800'
                                : alert.severity === 'medium'
                                ? 'bg-amber-950 text-amber-400 border-amber-800'
                                : 'bg-blue-950 text-blue-400 border-blue-800'
                            }`}
                          >
                            {alert.severity}
                          </span>
                        </td>
                        <td className="px-2.5 py-2">
                          {alert.status === 'acknowledged' ? (
                            <span className="text-emerald-400 text-[10px] flex items-center gap-1 font-bold">
                              <CheckCircle className="w-3 h-3" /> ACK
                            </span>
                          ) : (
                            <span className="text-red-400 text-[10px] font-bold uppercase">NEW</span>
                          )}
                        </td>
                        <td className="px-2.5 py-2 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {alert.status === 'new' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  acknowledgeAlert(alert.alert_id);
                                }}
                                className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-600 text-emerald-300 text-[10px] font-bold hover:bg-emerald-900 cursor-pointer"
                              >
                                ACK
                              </button>
                            )}
                            <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-[var(--text-muted)]'}`} />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 5 Cols: Incident Detail & Explainable Reasoning Engine */}
        <div className="lg:col-span-5 bg-[var(--bg-panel)] border border-[var(--border-tactical)] rounded flex flex-col overflow-y-auto p-3 space-y-3">
          {selectedIncident ? (
            <>
              {/* Header Info */}
              <div className="border-b border-[var(--border-tactical)] pb-2.5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400">{selectedIncident.alert_id}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                      selectedIncident.severity === 'high'
                        ? 'bg-red-950 text-red-300 border-red-600'
                        : 'bg-amber-950 text-amber-300 border-amber-600'
                    }`}
                  >
                    {selectedIncident.severity} SEVERITY
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase">
                  {selectedIncident.classification || selectedIncident.rule.replace(/_/g, ' ')}
                </h3>

                <p className="text-[11px] text-[var(--text-secondary)]">
                  {selectedIncident.description}
                </p>

                <div className="flex items-center gap-3 pt-1 text-[10px] text-[var(--text-muted)]">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-cyan-400" />
                    {selectedIncident.camera_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    {new Date(selectedIncident.created_at).toISOString().substring(11, 19)} UTC
                  </span>
                </div>
              </div>

              {/* 1. Explainable Reasoning Chain (WHY WAS THIS ALERT GENERATED?) */}
              <div className="p-2.5 rounded bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] space-y-2">
                <div className="flex items-center justify-between border-b border-[var(--border-tactical)] pb-1.5">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    EXPLAINABLE REASONING CHAIN (WHY ALERT FIRED)
                  </h4>
                </div>

                <p className="text-[10px] text-[var(--text-secondary)]">
                  BAVIS converts raw bounding boxes into verified security intelligence via compound temporal rules:
                </p>

                <div className="space-y-1.5 pt-1">
                  {(selectedIncident.reasoning_chain || [
                    { label: 'OBJECT DETECTED', description: 'Visual class: Person (YOLOv8 deep detector)', highlight: false },
                    { label: 'TRACK PERSISTED', description: 'Kalman tracker established spatio-temporal continuity', highlight: false },
                    { label: 'RESTRICTED ZONE ENTERED', description: 'Crossed polygon geofence boundary', highlight: true },
                    { label: 'DWELL TIME > THRESHOLD', description: 'Occupancy exceeded configured threshold limit', highlight: true },
                    { label: 'CORRELATED SECURITY EVENT', description: 'Evaluated breach threat score at 94/100', highlight: true },
                  ]).map((step, idx) => (
                    <div
                      key={idx}
                      className={`p-1.5 rounded border text-[10px] flex items-center justify-between ${
                        step.highlight
                          ? 'bg-red-950/40 border-red-800/70 text-red-200'
                          : 'bg-[var(--bg-panel)] border-[var(--border-tactical)] text-[var(--text-primary)]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-cyan-400 font-mono">0{idx + 1}.</span>
                        <span className="font-bold">{step.label}</span>
                      </div>
                      <span className="text-[9px] text-[var(--text-secondary)]">{step.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Detection Timeline */}
              <div className="p-2.5 rounded bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] space-y-2">
                <div className="flex items-center justify-between border-b border-[var(--border-tactical)] pb-1.5">
                  <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    DETECTION & INFERENCE TIMELINE
                  </h4>
                </div>

                <div className="space-y-2 pt-1 text-[10px]">
                  {(selectedIncident.detection_timeline || [
                    { time: '18:41:52', title: 'PERSON DETECTED', detail: 'Class isolated at perimeter boundary.', status: 'completed' },
                    { time: '18:41:55', title: 'TRACK CREATED', detail: 'ByteTrack Kalman tracker initialized.', status: 'completed' },
                    { time: '18:42:01', title: 'ZONE ENTERED', detail: 'Crossed Polygon Zone North Buffer.', status: 'completed' },
                    { time: '18:42:07', title: 'DWELL THRESHOLD EXCEEDED', detail: 'Target persisted inside zone > 10s.', status: 'completed' },
                    { time: '18:42:11', title: 'HIGH ALERT GENERATED', detail: 'Incident dispatched with SHA256 snapshot.', status: 'completed' },
                  ]).map((t, idx) => (
                    <div key={idx} className="flex items-start gap-2 border-l-2 border-cyan-500 pl-2">
                      <span className="text-cyan-400 font-bold shrink-0">{t.time}</span>
                      <div>
                        <span className="text-[var(--text-primary)] font-bold block">{t.title}</span>
                        <span className="text-[9px] text-[var(--text-secondary)]">{t.detail}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Actions & Evidence Dossier Button */}
              <div className="pt-1 flex items-center gap-2">
                {selectedIncident.status === 'new' ? (
                  <button
                    onClick={() => acknowledgeAlert(selectedIncident.alert_id)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-emerald-950 border border-emerald-600 text-emerald-300 text-xs font-bold hover:bg-emerald-900 cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>ACKNOWLEDGE INCIDENT</span>
                  </button>
                ) : (
                  <div className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded bg-emerald-950/40 border border-emerald-900 text-emerald-400 text-xs font-bold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>ACKNOWLEDGED BY {selectedIncident.acknowledged_by || 'OPERATOR'}</span>
                  </div>
                )}

                {selectedIncident.evidence_ref && (
                  <button
                    onClick={() => setSelectedEvidenceId(selectedIncident.evidence_ref)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded bg-cyan-950 border border-cyan-600 text-cyan-300 text-xs font-bold hover:bg-cyan-900 cursor-pointer"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>INSPECT EVIDENCE</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-[var(--text-muted)] p-6">
              <Shield className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-xs">Select an incident from the table to view explainable intelligence chain</p>
            </div>
          )}
        </div>
      </div>

      {/* Evidence Viewer Modal */}
      {selectedEvidenceId && (
        <EvidenceViewer
          evidenceId={selectedEvidenceId}
          onClose={() => setSelectedEvidenceId(null)}
        />
      )}
    </div>
  );
};
