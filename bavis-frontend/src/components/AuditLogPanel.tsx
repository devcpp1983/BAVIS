import React, { useState, useEffect } from 'react';
import type { AuditLogEntry } from '../types/bavis';
import { api } from '../api/client';
import { ClipboardList, Download, RefreshCw, ShieldCheck, AlertCircle } from 'lucide-react';

export const AuditLogPanel: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [filterResult, setFilterResult] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (filterResult !== 'all' && log.result !== filterResult) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        log.operator.toLowerCase().includes(q) ||
        log.resource.toLowerCase().includes(q) ||
        log.source.toLowerCase().includes(q) ||
        log.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['ID', 'Timestamp', 'Operator', 'Role', 'Action', 'Resource', 'Result', 'Source'];
    const rows = logs.map((l) => [l.id, l.timestamp, l.operator, l.role, `"${l.action}"`, `"${l.resource}"`, l.result, `"${l.source}"`]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BAVIS_Security_Audit_Log_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="flex flex-col h-full overflow-hidden space-y-3 select-none font-mono">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] rounded">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-cyan-400" />
          <div>
            <h2 className="text-xs font-bold tracking-wider text-[var(--text-primary)] uppercase">
              SECURITY AUDIT & OPERATIONAL IMMUTABLE LOG
            </h2>
            <p className="text-[10px] text-[var(--text-secondary)]">
              Real-time accountability trail for operator interactions, AI rules & access events
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search audit actions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-48 bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded px-2.5 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:border-cyan-500"
          />

          <select
            value={filterResult}
            onChange={(e) => setFilterResult(e.target.value)}
            className="bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none cursor-pointer"
          >
            <option value="all">Result: All</option>
            <option value="SUCCESS">Success Only</option>
            <option value="FLAGGED">Flagged Only</option>
            <option value="DENIED">Denied Only</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-950 border border-cyan-700/60 text-cyan-300 font-bold hover:bg-cyan-900 cursor-pointer"
            title="Export Audit CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">EXPORT</span>
          </button>

          <button
            onClick={fetchLogs}
            className="p-1 rounded bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] text-[var(--text-secondary)] hover:text-cyan-400 cursor-pointer"
            title="Refresh Logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="flex-1 bg-[var(--bg-panel)] border border-[var(--border-tactical)] rounded overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--bg-panel-elevated)] border-b border-[var(--border-tactical)] text-[var(--text-secondary)] uppercase text-[9px] sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2">Log ID</th>
                <th className="px-3 py-2">Time (UTC)</th>
                <th className="px-3 py-2">Operator / Entity</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Resource</th>
                <th className="px-3 py-2">Result</th>
                <th className="px-3 py-2">Origin / Subsystem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-tactical)]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-12 text-center text-[var(--text-muted)]">
                    NO AUDIT LOG RECORDS FOUND
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--bg-panel-elevated)] transition-colors">
                    <td className="px-3 py-2 text-[10px] text-cyan-500 font-bold">{log.id}</td>
                    <td className="px-3 py-2 text-[var(--text-secondary)]">{log.timestamp}</td>
                    <td className="px-3 py-2 text-[var(--text-primary)] font-medium">
                      {log.operator}
                      <span className="text-[9px] text-[var(--text-muted)] ml-1">({log.role})</span>
                    </td>
                    <td className="px-3 py-2 text-[var(--text-primary)] font-semibold">{log.action}</td>
                    <td className="px-3 py-2 text-[var(--text-secondary)]">{log.resource}</td>
                    <td className="px-3 py-2">
                      {log.result === 'SUCCESS' ? (
                        <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-500" /> SUCCESS
                        </span>
                      ) : log.result === 'FLAGGED' ? (
                        <span className="text-amber-400 text-[10px] font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-500" /> FLAGGED
                        </span>
                      ) : (
                        <span className="text-red-400 text-[10px] font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-red-500" /> DENIED
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-[var(--text-muted)] text-[10px]">{log.source}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
