import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useAlerts } from '../context/AlertContext';
import { LayoutDashboard, Video, ShieldAlert, Search, Map, Activity, Settings, HelpCircle } from 'lucide-react';

export type ActiveTab = 'overview' | 'matrix' | 'incidents' | 'search' | 'zones' | 'health' | 'admin';

interface CommandRailProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const CommandRail: React.FC<CommandRailProps> = ({ activeTab, setActiveTab }) => {
  const { canManageSystem } = useAuth();
  const { unreadHighCount } = useAlerts();

  const navItems: Array<{ id: ActiveTab; label: string; icon: React.FC<{ className?: string }>; category: 'COMMAND' | 'INTELLIGENCE' | 'ADMIN'; badge?: number; adminOnly?: boolean }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, category: 'COMMAND' },
    { id: 'matrix', label: 'Surveillance', icon: Video, category: 'COMMAND' },
    { id: 'incidents', label: 'Incidents', icon: ShieldAlert, category: 'COMMAND', badge: unreadHighCount },
    { id: 'health', label: 'Health', icon: Activity, category: 'COMMAND' },

    { id: 'search', label: 'Events', icon: Search, category: 'INTELLIGENCE' },
    { id: 'zones', label: 'Zones', icon: Map, category: 'INTELLIGENCE' },

    { id: 'admin', label: 'Admin', icon: Settings, category: 'ADMIN', adminOnly: true },
  ];

  return (
    <aside className="w-16 md:w-48 bg-[var(--bg-panel)] border-r border-[var(--border-tactical)] flex flex-col justify-between select-none shrink-0 h-full transition-colors">
      {/* Top Nav List */}
      <div className="flex flex-col py-3 gap-4 overflow-y-auto">
        
        {/* COMMAND SECTION */}
        <div className="flex flex-col gap-1 px-2">
          <span className="hidden md:block px-2 text-[9px] font-mono font-bold tracking-wider text-[var(--text-muted)] uppercase">
            COMMAND
          </span>

          {navItems
            .filter((item) => item.category === 'COMMAND' && (!item.adminOnly || canManageSystem))
            .map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  className={`relative flex items-center gap-3 px-3 py-2 rounded text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 shadow-[inset_0_0_8px_rgba(6,182,212,0.2)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel-elevated)]'
                  }`}
                >
                  {isActive && <div className="absolute left-0 top-1 bottom-1 w-1 bg-cyan-400 rounded-r"></div>}
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-[var(--text-secondary)]'}`} />
                  <span className="hidden md:inline truncate">{item.label}</span>

                  {item.badge && item.badge > 0 ? (
                    <span className="ml-auto flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-red-600 text-white text-[9px] font-mono font-bold animate-pulse">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
        </div>

        {/* INTELLIGENCE SECTION */}
        <div className="flex flex-col gap-1 px-2">
          <span className="hidden md:block px-2 text-[9px] font-mono font-bold tracking-wider text-[var(--text-muted)] uppercase">
            INTELLIGENCE
          </span>

          {navItems
            .filter((item) => item.category === 'INTELLIGENCE' && (!item.adminOnly || canManageSystem))
            .map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  className={`relative flex items-center gap-3 px-3 py-2 rounded text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 shadow-[inset_0_0_8px_rgba(6,182,212,0.2)]'
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

        {/* ADMINISTRATION SECTION */}
        {canManageSystem && (
          <div className="flex flex-col gap-1 px-2">
            <span className="hidden md:block px-2 text-[9px] font-mono font-bold tracking-wider text-[var(--text-muted)] uppercase">
              ADMINISTRATION
            </span>

            {navItems
              .filter((item) => item.category === 'ADMIN' && (!item.adminOnly || canManageSystem))
              .map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    title={item.label}
                    className={`relative flex items-center gap-3 px-3 py-2 rounded text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/60 shadow-[inset_0_0_8px_rgba(6,182,212,0.2)]'
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
        )}

      </div>

      {/* Bottom Footer Item */}
      <div className="p-2 border-t border-[var(--border-tactical)] bg-[var(--bg-panel)]">
        <div className="flex items-center gap-2 p-1.5 rounded bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] text-[10px] font-mono text-[var(--text-secondary)]">
          <HelpCircle className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0" />
          <span className="hidden md:inline truncate">ISR PROTOCOL v2.4</span>
        </div>
      </div>
    </aside>
  );
};
