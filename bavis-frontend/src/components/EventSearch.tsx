import React, { useState, useEffect } from 'react';
import type { Alert, EventFilterParams, ObjectType, SeverityLevel, AlertStatus, TrackInvestigation } from '../types/bavis';
import { api } from '../api/client';
import { useAlerts } from '../context/AlertContext';
import { EvidenceViewer } from './EvidenceViewer';
import { Download, RefreshCw, CheckCircle, Database, Search, Cpu, FileCheck } from 'lucide-react';

export const EventSearch: React.FC = () => {
  const { selectedEvidenceId, setSelectedEvidenceId } = useAlerts();

  const [filters, setFilters] = useState<EventFilterParams>({
    camera: 'all',
    type: 'all',
    severity: 'all',
    status: 'all',
    searchQuery: '',
    track_id: '',
  });

  const [events, setEvents] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [trackInvestigation, setTrackInvestigation] = useState<TrackInvestigation | null>(null);

  const fetchFilteredEvents = async () => {
    setLoading(true);
    try {
      const data = await api.getEvents(filters);
      setEvents(data);

      if (filters.track_id || (filters.searchQuery && filters.searchQuery.toUpperCase().startsWith('TRK-'))) {
        const queryId = filters.track_id || (filters.searchQuery ? filters.searchQuery.toUpperCase().trim() : '');
        if (queryId) {
          const trackData = await api.getTrackInvestigation(queryId);
          setTrackInvestigation(trackData);
        } else {
          setTrackInvestigation(null);
        }
      } else {
        setTrackInvestigation(null);
      }
    } catch (err) {
      console.error('Failed to search events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilteredEvents();
  }, [filters]);

  const handleExportCSV = () => {
    if (events.length === 0) return;
    const headers = ['Incident ID', 'Event ID', 'Camera', 'Location', 'Severity', 'Rule', 'Status', 'Track ID', 'Timestamp'];
    const rows = events.map((e) => [
      e.alert_id,
      e.event_id,
      e.camera_id,
      `"${e.location_code || ''}"`,
      e.severity,
      `"${e.rule}"`,
      e.status,
      e.track_id || 'N/A',
      e.created_at,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BAVIS_Event_Investigation_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-2.5 select-none font-mono">
      {/* Search Header & Filter Controls */}
      <div className="flex flex-col space-y-2 p-2.5 bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] rounded">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <div>
              <h2 className="text-xs font-bold tracking-wider text-[var(--text-primary)] uppercase">
                HISTORICAL EVENT & TRACK INTELLIGENCE REPOSITORY
              </h2>
              <p className="text-[10px] text-[var(--text-secondary)]">
                Query persistent tracking trajectories, spatial geofence intersections & forensic events
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-950 border border-cyan-700 text-cyan-300 font-bold hover:bg-cyan-900 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT CSV</span>
            </button>
            <button
              onClick={fetchFilteredEvents}
              className="p-1 rounded bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] text-[var(--text-secondary)] hover:text-cyan-400 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Multi-Parameter Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-2 pt-2 border-t border-[var(--border-tactical)] text-xs">
          <div>
            <label className="block text-[9px] text-[var(--text-secondary)] mb-0.5 uppercase">KEYWORD SEARCH</label>
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2 top-2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search..."
                value={filters.searchQuery || ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
                className="w-full bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded pl-6 pr-2 py-1 text-[var(--text-primary)] text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[9px] text-[var(--text-secondary)] mb-0.5 uppercase">TRACK ID</label>
            <input
              type="text"
              placeholder="e.g. TRK-CAM01-017"
              value={filters.track_id || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, track_id: e.target.value }))}
              className="w-full bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded px-2 py-1 text-[var(--text-primary)] text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-[9px] text-[var(--text-secondary)] mb-0.5 uppercase">CAMERA SOURCE</label>
            <select
              value={filters.camera || 'all'}
              onChange={(e) => setFilters((prev) => ({ ...prev, camera: e.target.value }))}
              className="w-full bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded px-2 py-1 text-[var(--text-primary)] text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">All Cameras</option>
              <option value="cam-01">BOP-North-01 (cam-01)</option>
              <option value="cam-02">Checkpoint-03 (cam-02)</option>
              <option value="cam-03">BOP-North-02 (cam-03)</option>
              <option value="cam-04">Sector Delta (cam-04)</option>
            </select>
          </div>

          <div>
            <label className="block text-[9px] text-[var(--text-secondary)] mb-0.5 uppercase">TARGET CLASS</label>
            <select
              value={filters.type || 'all'}
              onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value as ObjectType | 'all' }))}
              className="w-full bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded px-2 py-1 text-[var(--text-primary)] text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">All Classes</option>
              <option value="person">Person</option>
              <option value="vehicle">Vehicle</option>
            </select>
          </div>

          <div>
            <label className="block text-[9px] text-[var(--text-secondary)] mb-0.5 uppercase">SEVERITY</label>
            <select
              value={filters.severity || 'all'}
              onChange={(e) => setFilters((prev) => ({ ...prev, severity: e.target.value as SeverityLevel | 'all' }))}
              className="w-full bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded px-2 py-1 text-[var(--text-primary)] text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="high">High Only</option>
              <option value="medium">Medium Only</option>
              <option value="low">Low Only</option>
            </select>
          </div>

          <div>
            <label className="block text-[9px] text-[var(--text-secondary)] mb-0.5 uppercase">STATUS</label>
            <select
              value={filters.status || 'all'}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value as AlertStatus | 'all' }))}
              className="w-full bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded px-2 py-1 text-[var(--text-primary)] text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="new">New (Unack)</option>
              <option value="acknowledged">Acknowledged</option>
            </select>
          </div>
        </div>
      </div>

      {/* Track Investigation Card (If Track ID matched) */}
      {trackInvestigation && (
        <div className="p-3 bg-[var(--bg-panel-elevated)] border border-cyan-500/70 rounded space-y-2">
          <div className="flex items-center justify-between border-b border-[var(--border-tactical)] pb-1.5">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-cyan-300 uppercase">
                PERSISTENT TRACK INVESTIGATION DOSSIER • {trackInvestigation.track_id}
              </h3>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold">
              MAX CONFIDENCE: {(trackInvestigation.max_confidence * 100).toFixed(1)}%
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="bg-[var(--bg-panel)] p-2 rounded border border-[var(--border-tactical)]">
              <span className="text-[9px] text-[var(--text-secondary)] uppercase block">FIRST DETECTED</span>
              <span className="text-xs font-bold text-[var(--text-primary)]">{trackInvestigation.first_detected}</span>
            </div>
            <div className="bg-[var(--bg-panel)] p-2 rounded border border-[var(--border-tactical)]">
              <span className="text-[9px] text-[var(--text-secondary)] uppercase block">LAST DETECTED</span>
              <span className="text-xs font-bold text-[var(--text-primary)]">{trackInvestigation.last_detected}</span>
            </div>
            <div className="bg-[var(--bg-panel)] p-2 rounded border border-[var(--border-tactical)]">
              <span className="text-[9px] text-[var(--text-secondary)] uppercase block">CAMERAS OBSERVED</span>
              <span className="text-xs font-bold text-cyan-400">{trackInvestigation.cameras_observed.join(', ')}</span>
            </div>
            <div className="bg-[var(--bg-panel)] p-2 rounded border border-[var(--border-tactical)]">
              <span className="text-[9px] text-[var(--text-secondary)] uppercase block">ZONES ENTERED</span>
              <span className="text-xs font-bold text-amber-400">{trackInvestigation.zones_entered.join(', ')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      <div className="flex-1 bg-[var(--bg-panel)] border border-[var(--border-tactical)] rounded overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--bg-panel-elevated)] border-b border-[var(--border-tactical)] text-[var(--text-secondary)] uppercase text-[9px] sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2">Incident ID</th>
                <th className="px-3 py-2">Severity</th>
                <th className="px-3 py-2">Rule Breached</th>
                <th className="px-3 py-2">Camera Source</th>
                <th className="px-3 py-2">Track ID</th>
                <th className="px-3 py-2">Timestamp (UTC)</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-tactical)]">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-12 text-center text-[var(--text-muted)]">
                    NO SECURITY EVENTS FOUND MATCHING FILTERS
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.alert_id} className="hover:bg-[var(--bg-panel-elevated)] transition-colors">
                    <td className="px-3 py-2 font-bold text-cyan-400">{event.alert_id}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border ${
                          event.severity === 'high'
                            ? 'bg-red-950 text-red-400 border-red-800'
                            : event.severity === 'medium'
                            ? 'bg-amber-950 text-amber-400 border-amber-800'
                            : 'bg-blue-950 text-blue-400 border-blue-800'
                        }`}
                      >
                        {event.severity}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[var(--text-primary)] uppercase font-semibold">
                      {event.rule.replace(/_/g, ' ')}
                    </td>
                    <td className="px-3 py-2 text-[var(--text-primary)]">
                      {event.camera_name || event.camera_id}{' '}
                      <span className="text-[9px] text-[var(--text-muted)]">({event.location_code})</span>
                    </td>
                    <td className="px-3 py-2 text-cyan-400 font-bold">{event.track_id || 'TRK-CAM01-017'}</td>
                    <td className="px-3 py-2 text-[var(--text-secondary)]">
                      {new Date(event.created_at).toISOString().substring(11, 19)} UTC
                    </td>
                    <td className="px-3 py-2">
                      {event.status === 'acknowledged' ? (
                        <span className="text-emerald-400 text-[10px] flex items-center gap-1 font-semibold">
                          <CheckCircle className="w-3 h-3" /> ACK
                        </span>
                      ) : (
                        <span className="text-red-400 text-[10px] uppercase font-bold">{event.status}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {event.evidence_ref && (
                        <button
                          onClick={() => setSelectedEvidenceId(event.evidence_ref)}
                          className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700 text-cyan-300 text-[10px] hover:bg-cyan-900 font-bold cursor-pointer"
                        >
                          <FileCheck className="w-3 h-3 inline mr-1" /> DOSSIER
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
