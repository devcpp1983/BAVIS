import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useAlerts } from '../context/AlertContext';
import {
  LayoutDashboard,
  Video,
  ShieldAlert,
  Search,
  Map,
  FileCheck,
  Activity,
  Settings,
  Users,
  ClipboardList,
} from 'lucide-react';

export type ActiveTab =
  | 'overview'
  | 'matrix'
  | 'incidents'
  | 'search'
  | 'zones'
  | 'evidence'
  | 'health'
  | 'admin'
  | 'operators'
  | 'audit';

interface CommandRailProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const CommandRail: React.FC<CommandRailProps> = ({ activeTab, setActiveTab }) => {
  const { canManageSystem } = useAuth();
  const { unreadHighCount } = useAlerts();

  const operationsNav = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'matrix' as const, label: 'Live Surveillance', icon: Video },
    { id: 'incidents' as const, label: 'Incidents', icon: ShieldAlert, badge: unreadHighCount },
    { id: 'search' as const, label: 'Event Search', icon: Search },
  ];

  const analyticsNav = [
    { id: 'zones' as const, label: 'Zones & Rules', icon: Map },
    { id: 'evidence' as const, label: 'Evidence', icon: FileCheck },
    { id: 'health' as const, label: 'System Health', icon: Activity },
  ];

  const adminNav = [
    { id: 'admin' as const, label: 'Cameras', icon: Settings, adminOnly: true },
    { id: 'operators' as const, label: 'Operators / Access', icon: Users, adminOnly: true },
    { id: 'audit' as const, label: 'Audit Log', icon: ClipboardList, adminOnly: false },
  ];

  return (
    <aside className="w-16 md:w-52 bg-[var(--bg-panel)] border-r border-[var(--border-tactical)] flex flex-col justify-between select-none shrink-0 h-full">
      {/* Top Nav List */}
      <div className="flex flex-col py-3 gap-3.5 overflow-y-auto">
        {/* OPERATIONS SECTION */}
        <div className="flex flex-col gap-0.5 px-2">
          <span className="hidden md:block px-2.5 pb-1 text-[9px] font-mono font-bold tracking-wider text-[var(--text-muted)] uppercase">
            OPERATIONS
          </span>

          {operationsNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={item.label}
                className={`relative flex items-center gap-2.5 px-2.5 py-2 rounded text-xs font-mono transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel-elevated)]'
                }`}
              >
                {isActive && <div className="absolute left-0 top-1 bottom-1 w-1 bg-cyan-400 rounded-r"></div>}
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-[var(--text-secondary)]'}`} />
                <span className="hidden md:inline truncate">{item.label}</span>

                {item.badge && item.badge > 0 ? (
                  <span className="ml-auto flex items-center justify-center h-4 min-w-4 px-1 rounded bg-red-600 text-white text-[9px] font-mono font-bold">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* ANALYTICS SECTION */}
        <div className="flex flex-col gap-0.5 px-2">
          <span className="hidden md:block px-2.5 pb-1 text-[9px] font-mono font-bold tracking-wider text-[var(--text-muted)] uppercase">
            ANALYTICS
          </span>

          {analyticsNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={item.label}
                className={`relative flex items-center gap-2.5 px-2.5 py-2 rounded text-xs font-mono transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel-elevated)]'
                }`}
              >
                {isActive && <div className="absolute left-0 top-1 bottom-1 w-1 bg-cyan-400 rounded-r"></div>}
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-[var(--text-secondary)]'}`} />
                <span className="hidden md:inline truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* ADMIN SECTION */}
        <div className="flex flex-col gap-0.5 px-2">
          <span className="hidden md:block px-2.5 pb-1 text-[9px] font-mono font-bold tracking-wider text-[var(--text-muted)] uppercase">
            ADMINISTRATION
          </span>

          {adminNav
            .filter((item) => !item.adminOnly || canManageSystem)
            .map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  className={`relative flex items-center gap-2.5 px-2.5 py-2 rounded text-xs font-mono transition-all cursor-pointer ${
                    isActive
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-semibold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel-elevated)]'
                  }`}
                >
                  {isActive && <div className="absolute left-0 top-1 bottom-1 w-1 bg-cyan-400 rounded-r"></div>}
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-[var(--text-secondary)]'}`} />
                  <span className="hidden md:inline truncate">{item.label}</span>
                </button>
              );
            })}
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className="p-2 border-t border-[var(--border-tactical)] bg-[var(--bg-panel)]">
        <div className="p-1.5 rounded bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] text-[9px] font-mono text-[var(--text-muted)]">
          <span className="hidden md:block truncate">BAVIS C2 v2.4 (MHA)</span>
          <span className="hidden md:block text-[8px] text-cyan-500">SSB POLICE II DIV</span>
        </div>
      </div>
    </aside>
  );
};
