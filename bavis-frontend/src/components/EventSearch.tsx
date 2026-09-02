import React, { useState, useEffect } from 'react';
import type { Alert, EventFilterParams, ObjectType, SeverityLevel, AlertStatus } from '../types/bavis';
import { api } from '../api/client';
import { useAlerts } from '../context/AlertContext';
import { EvidenceViewer } from './EvidenceViewer';
import { Download, RefreshCw, CheckCircle, Database } from 'lucide-react';

export const EventSearch: React.FC = () => {
  const { selectedEvidenceId, setSelectedEvidenceId } = useAlerts();

  const [filters, setFilters] = useState<EventFilterParams>({
    camera: 'all',
    type: 'all',
    severity: 'all',
    status: 'all',
    searchQuery: '',
  });

  const [events, setEvents] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchFilteredEvents = async () => {
    setLoading(true);
    try {
      const data = await api.getEvents(filters);
      setEvents(data);
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
    const headers = ['Alert ID', 'Event ID', 'Camera', 'Location', 'Severity', 'Rule', 'Status', 'Created At'];
    const rows = events.map((e) => [
      e.alert_id,
      e.event_id,
      e.camera_id,
      e.location_code || '',
      e.severity,
      e.rule,
      e.status,
      e.created_at,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BAVIS_Events_Export_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-3 select-none">
      {/* Search Header & Filter Bar */}
      <div className="flex flex-col space-y-2.5 p-3 bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] rounded transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono">
            <Database className="w-4 h-4 text-cyan-500" />
            <h2 className="text-xs font-bold tracking-wider text-[var(--text-primary)] uppercase">
              HISTORICAL EVENT INTELLIGENCE REPOSITORY
            </h2>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-950 border border-cyan-700/60 text-cyan-300 text-xs font-bold hover:bg-cyan-900 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT CSV</span>
            </button>
            <button
              onClick={fetchFilteredEvents}
              className="p-1 rounded bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] text-[var(--text-secondary)] hover:text-cyan-500 cursor-pointer"
              title="Refresh Search"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter Parameter Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 pt-2 border-t border-[var(--border-tactical)] text-xs font-mono">
          <div>
            <label className="block text-[9px] text-[var(--text-secondary)] mb-0.5 uppercase">KEYWORD SEARCH</label>
            <input
              type="text"
              placeholder="Filter keyword..."
              value={filters.searchQuery || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
              className="w-full bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded px-2 py-1 text-[var(--text-primary)] focus:outline-none focus:border-cyan-500 text-xs"
            />
          </div>

          <div>
            <label className="block text-[9px] text-[var(--text-secondary)] mb-0.5 uppercase">CAMERA SOURCE</label>
            <select
              value={filters.camera || 'all'}
              onChange={(e) => setFilters((prev) => ({ ...prev, camera: e.target.value }))}
              className="w-full bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded px-2 py-1 text-[var(--text-primary)] focus:outline-none cursor-pointer text-xs"
            >
              <option value="all">All Cameras</option>
              <option value="cam-01">BOP Alpha (cam-01)</option>
              <option value="cam-02">Checkpost Bravo (cam-02)</option>
              <option value="cam-03">BOP Charlie (cam-03)</option>
              <option value="cam-04">Sector Delta (cam-04)</option>
            </select>
          </div>

          <div>
            <label className="block text-[9px] text-[var(--text-secondary)] mb-0.5 uppercase">TARGET CLASS</label>
            <select
              value={filters.type || 'all'}
              onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value as ObjectType | 'all' }))}
              className="w-full bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded px-2 py-1 text-[var(--text-primary)] focus:outline-none cursor-pointer text-xs"
            >
              <option value="all">All Classes</option>
              <option value="person">Person</option>
              <option value="vehicle">Vehicle</option>
              <option value="face">Face</option>
            </select>
          </div>

          <div>
            <label className="block text-[9px] text-[var(--text-secondary)] mb-0.5 uppercase">SEVERITY LEVEL</label>
            <select
              value={filters.severity || 'all'}
              onChange={(e) => setFilters((prev) => ({ ...prev, severity: e.target.value as SeverityLevel | 'all' }))}
              className="w-full bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded px-2 py-1 text-[var(--text-primary)] focus:outline-none cursor-pointer text-xs"
            >
              <option value="all">All Severities</option>
              <option value="high">Critical Only</option>
              <option value="medium">Warning Only</option>
              <option value="low">Info Only</option>
            </select>
          </div>

          <div>
            <label className="block text-[9px] text-[var(--text-secondary)] mb-0.5 uppercase">STATUS</label>
            <select
              value={filters.status || 'all'}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value as AlertStatus | 'all' }))}
              className="w-full bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded px-2 py-1 text-[var(--text-primary)] focus:outline-none cursor-pointer text-xs"
            >
              <option value="all">All Statuses</option>
              <option value="new">Unacknowledged</option>
              <option value="acknowledged">Acknowledged</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="flex-1 bg-[var(--bg-panel)] border border-[var(--border-tactical)] rounded overflow-hidden flex flex-col transition-colors">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-[var(--bg-panel-elevated)] border-b border-[var(--border-tactical)] text-[var(--text-secondary)] uppercase text-[9px] sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2">Alert ID</th>
                <th className="px-3 py-2">Severity</th>
                <th className="px-3 py-2">Rule Breached</th>
                <th className="px-3 py-2">Camera Source</th>
                <th className="px-3 py-2">Timestamp</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Evidence Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-tactical)]">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-12 text-center text-[var(--text-muted)] font-mono">
                    NO SECURITY EVENTS FOUND MATCHING FILTERS
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.alert_id} className="hover:bg-[var(--bg-panel-elevated)] transition-colors cursor-pointer">
                    <td className="px-3 py-2 font-bold text-cyan-600">{event.alert_id}</td>
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
                    <td className="px-3 py-2 text-[var(--text-primary)] uppercase font-bold">
                      {event.rule.replace(/_/g, ' ')}
                    </td>
                    <td className="px-3 py-2 text-[var(--text-primary)]">
                      {event.camera_name || event.camera_id}{' '}
                      <span className="text-[9px] text-[var(--text-muted)]">({event.location_code})</span>
                    </td>
                    <td className="px-3 py-2 text-[var(--text-secondary)]">
                      {new Date(event.created_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      {event.status === 'acknowledged' ? (
                        <span className="text-emerald-500 text-[10px] flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> ACK
                        </span>
                      ) : (
                        <span className="text-amber-500 text-[10px] uppercase">{event.status}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {event.evidence_ref && (
                        <button
                          onClick={() => setSelectedEvidenceId(event.evidence_ref)}
                          className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700 text-cyan-300 text-[10px] hover:bg-cyan-900 font-bold cursor-pointer"
                        >
                          DOSSIER
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
