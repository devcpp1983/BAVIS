import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAlerts } from '../context/AlertContext';
import { ShieldAlert, Video, Map, Volume2, VolumeX, UserCheck, Search, FileText, Settings, Radio } from 'lucide-react';
import type { UserRole } from '../types/bavis';

interface HeaderProps {
  activeTab: 'matrix' | 'zones' | 'timeline' | 'search' | 'admin';
  setActiveTab: (tab: 'matrix' | 'zones' | 'timeline' | 'search' | 'admin') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const { role, setRole, canEditZones, canManageSystem } = useAuth();
  const { unreadHighCount, soundEnabled, setSoundEnabled } = useAlerts();

  const [timeUtc, setTimeUtc] = useState<string>('');
  const [timeIst, setTimeIst] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeUtc(now.toISOString().substring(11, 19) + ' UTC');
      setTimeIst(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' IST'
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-cyan-900/40 px-4 py-2.5">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              <ShieldAlert className="w-6 h-6 animate-pulse text-cyan-400" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-wider text-slate-100 uppercase">
                  BAVIS <span className="text-cyan-400 text-xs font-semibold px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-700/50 ml-1">SIH26187</span>
                </h1>
              </div>
              <p className="text-[11px] font-medium text-slate-400 tracking-wide">
                Border AI Video Intelligence System • <span className="text-cyan-400 font-mono">SSB POLICE II</span>
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-slate-800">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-slate-900/90 border border-slate-800 text-xs font-mono">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="text-slate-300">DEFCON 2 • ACTIVE</span>
            </div>

            {unreadHighCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-950/80 border border-red-500/50 text-red-300 text-xs font-mono animate-pulse-high">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                <span className="font-bold">{unreadHighCount} BREACH ALERTS</span>
              </div>
            )}
          </div>
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'matrix'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>LIVE MATRIX</span>
          </button>

          <button
            onClick={() => setActiveTab('zones')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'zones'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>ZONE EDITOR</span>
            {!canEditZones && <span className="text-[9px] bg-slate-800 text-slate-500 px-1 rounded">VIEW ONLY</span>}
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'timeline'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>TIMELINE & EVIDENCE</span>
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'search'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>EVENT SEARCH</span>
          </button>

          {canManageSystem && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'admin'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>ADMIN</span>
            </button>
          )}
        </nav>

        {/* Right: Audio Toggle, Clocks & Role Switcher */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-lg border transition-all ${
              soundEnabled
                ? 'bg-cyan-950/60 border-cyan-700/50 text-cyan-400 hover:bg-cyan-900/50'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title={soundEnabled ? 'Mute Alert Sound' : 'Enable Alert Sound'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <div className="hidden xl:flex flex-col text-right font-mono text-[11px] leading-tight text-slate-300">
            <span className="text-cyan-400 font-semibold">{timeIst}</span>
            <span className="text-slate-400">{timeUtc}</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-1">
            <UserCheck className="w-4 h-4 text-cyan-400 pl-1" />
            <div className="flex flex-col">
              <span className="text-[10px] font-mono text-slate-400 uppercase leading-none">Role Access</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer pr-1"
              >
                <option value="operator" className="bg-slate-900 text-slate-200">
                  Operator
                </option>
                <option value="supervisor" className="bg-slate-900 text-slate-200">
                  Supervisor
                </option>
                <option value="admin" className="bg-slate-900 text-slate-200">
                  Admin
                </option>
              </select>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
};
