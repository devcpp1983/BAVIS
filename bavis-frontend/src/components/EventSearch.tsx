import React, { useState, useEffect } from 'react';
import type { Alert, EventFilterParams, ObjectType, SeverityLevel, AlertStatus } from '../types/bavis';
import { api } from '../api/client';
import { useAlerts } from '../context/AlertContext';
import { EvidenceViewer } from './EvidenceViewer';
import { Search, Download, RefreshCw, CheckCircle } from 'lucide-react';

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
    <div className="flex flex-col h-[calc(100vh-4.5rem)] p-4 overflow-hidden space-y-4">
      {/* Search Header & Filter Bar */}
      <div className="flex flex-col space-y-3 p-4 bg-slate-900/90 border border-cyan-900/40 rounded-xl glass-panel">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-black tracking-wider text-slate-100 uppercase">
              HISTORICAL EVENT DEEP SEARCH (GET /events)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950 border border-cyan-700/60 text-cyan-300 text-xs font-mono font-bold hover:bg-cyan-900 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT CSV</span>
            </button>
            <button
              onClick={fetchFilteredEvents}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-cyan-400"
              title="Refresh Search"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter Parameter Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2 border-t border-slate-800 text-xs font-mono">
          <div>
            <label className="block text-[10px] text-slate-400 mb-1">SEARCH QUERY</label>
            <input
              type="text"
              placeholder="Filter keyword..."
              value={filters.searchQuery || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 mb-1">CAMERA SOURCE</label>
            <select
              value={filters.camera || 'all'}
              onChange={(e) => setFilters((prev) => ({ ...prev, camera: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Cameras</option>
              <option value="cam-01">BOP Alpha (cam-01)</option>
              <option value="cam-02">Checkpost Bravo (cam-02)</option>
              <option value="cam-03">BOP Charlie (cam-03)</option>
              <option value="cam-04">Sector Delta (cam-04)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 mb-1">TARGET CLASS</label>
            <select
              value={filters.type || 'all'}
              onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value as ObjectType | 'all' }))}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Target Classes</option>
              <option value="person">Person</option>
              <option value="vehicle">Vehicle</option>
              <option value="face">Face</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 mb-1">SEVERITY LEVEL</label>
            <select
              value={filters.severity || 'all'}
              onChange={(e) => setFilters((prev) => ({ ...prev, severity: e.target.value as SeverityLevel | 'all' }))}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Severities</option>
              <option value="high">High Only</option>
              <option value="medium">Medium Only</option>
              <option value="low">Low Only</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 mb-1">STATUS</label>
            <select
              value={filters.status || 'all'}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value as AlertStatus | 'all' }))}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="new">Unacknowledged</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="flex-1 bg-slate-950/80 border border-cyan-900/40 rounded-xl overflow-hidden glass-panel flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-slate-900/90 border-b border-cyan-900/40 text-slate-400 uppercase text-[10px] sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3">Alert ID</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Rule Breached</th>
                <th className="px-4 py-3">Camera Source</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500 font-sans">
                    No security events found matching the specified search parameters.
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.alert_id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="px-4 py-3 font-bold text-cyan-400">{event.alert_id}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
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
                    <td className="px-4 py-3 text-slate-200 uppercase font-semibold">
                      {event.rule.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {event.camera_name || event.camera_id}{' '}
                      <span className="text-[10px] text-slate-500">({event.location_code})</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(event.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {event.status === 'acknowledged' ? (
                        <span className="text-emerald-400 text-[10px] flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> ACK
                        </span>
                      ) : (
                        <span className="text-amber-400 text-[10px] uppercase">{event.status}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {event.evidence_ref && (
                        <button
                          onClick={() => setSelectedEvidenceId(event.evidence_ref)}
                          className="px-2.5 py-1 rounded bg-cyan-950 border border-cyan-700 text-cyan-300 text-[10px] hover:bg-cyan-900 font-bold"
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
