import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAlerts } from '../context/AlertContext';
import { useTheme } from '../context/ThemeContext';
import { ShieldAlert, Volume2, VolumeX, UserCheck, Radio, Activity, Cpu, Sun, Moon } from 'lucide-react';
import type { UserRole } from '../types/bavis';

interface TopStatusBarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  onlineCameraCount?: number;
  totalCameraCount?: number;
  activeTrackCount?: number;
}

export const TopStatusBar: React.FC<TopStatusBarProps> = ({
  activeTab: _activeTab,
  setActiveTab,
  onlineCameraCount = 24,
  totalCameraCount = 28,
  activeTrackCount = 17,
}) => {
  const { role, setRole, user } = useAuth();
  const { unreadHighCount, soundEnabled, setSoundEnabled } = useAlerts();
  const { theme, toggleTheme } = useTheme();

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
    <header className="sticky top-0 z-40 bg-[var(--bg-panel)] border-b border-[var(--border-tactical)] px-3 py-1.5 select-none transition-colors">
      {/* Top Subtle Tricolor Accent */}
      <div className="absolute top-0 left-0 right-0 tricolor-stripe"></div>

      <div className="flex items-center justify-between gap-2 mt-0.5">
        
        {/* Left Section: BAVIS Command Brand & Sector Telemetry */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-8 h-8 rounded bg-[var(--bg-panel-elevated)] border border-cyan-500/40 text-cyan-400">
              <ShieldAlert className="w-5 h-5 text-cyan-400" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-sm font-black tracking-widest text-[var(--text-primary)] uppercase">
                  BAVIS <span className="text-cyan-400 font-mono text-[10px] bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/60 ml-1">C2 / ISR</span>
                </span>
                <span className="text-[10px] font-mono text-[var(--text-secondary)] border-l border-[var(--border-tactical)] pl-1.5">
                  SIH26187
                </span>
              </div>
              <p className="text-[10px] font-mono text-[var(--text-secondary)] tracking-tight mt-0.5">
                BORDER AI VIDEO INTELLIGENCE SYSTEM • <span className="text-emerald-400 font-semibold">SECTOR ALPHA (BOP 14)</span>
              </p>
            </div>
          </div>

          {/* Operational Readiness Status Badge */}
          <div className="hidden xl:flex items-center gap-3 pl-3 border-l border-[var(--border-tactical)]">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] text-[11px] font-mono">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span className="text-[var(--text-primary)]">SYSTEM NOMINAL</span>
            </div>

            {unreadHighCount > 0 ? (
              <button
                onClick={() => setActiveTab('incidents')}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-950/80 border border-red-500/60 text-red-300 text-[11px] font-mono animate-pulse-critical cursor-pointer hover:bg-red-900/60 transition-colors"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                <span className="font-bold">{unreadHighCount} BREACH ALERTS</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] text-[11px] font-mono text-[var(--text-secondary)]">
                <ShieldAlert className="w-3 h-3 text-slate-500" />
                <span>NO THREAT BREACHES</span>
              </div>
            )}
          </div>
        </div>

        {/* Center Section: Live Counters & Status Telemetry Strip */}
        <div className="hidden md:flex items-center gap-4 bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] px-3 py-1 rounded font-mono text-[11px]">
          <div className="flex items-center gap-1.5 text-[var(--text-primary)]">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[var(--text-secondary)]">CAMERAS:</span>
            <span className="text-[var(--text-primary)] font-bold">{onlineCameraCount}/{totalCameraCount}</span>
          </div>
          <span className="text-[var(--border-tactical)]">|</span>
          <div className="flex items-center gap-1.5 text-[var(--text-primary)]">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[var(--text-secondary)]">TRACKS:</span>
            <span className="text-emerald-400 font-bold">{activeTrackCount} LIVE</span>
          </div>
          <span className="text-[var(--border-tactical)]">|</span>
          <div className="flex items-center gap-1.5 text-[var(--text-primary)]">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-[var(--text-secondary)]">AI INFERENCE:</span>
            <span className="text-emerald-400 font-bold">14ms</span>
          </div>
        </div>

        {/* Right Section: Theme Toggle, Audio Control, Real-Time Clocks & Operator Role Access */}
        <div className="flex items-center gap-2">
          
          {/* Dedicated Theme Toggle Bar Button */}
          <div className="flex items-center bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] rounded p-0.5">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-2 py-1 rounded font-mono text-[11px] font-bold transition-all cursor-pointer text-[var(--text-primary)] hover:bg-[var(--bg-panel-highlight)]"
              title={theme === 'dark' ? 'Switch to Tactical Light Mode' : 'Switch to Tactical Dark Mode'}
            >
              {theme === 'dark' ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline text-cyan-300 text-[10px]">DARK C2</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden sm:inline text-amber-600 text-[10px]">LIGHT C2</span>
                </>
              )}
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1.5 rounded border transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-cyan-950/60 border-cyan-700/60 text-cyan-400 hover:bg-cyan-900/60'
                : 'bg-[var(--bg-panel-elevated)] border-[var(--border-tactical)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title={soundEnabled ? 'Mute Alert Sound' : 'Enable Alert Sound'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Real-time IST / UTC Clocks */}
          <div className="hidden lg:flex flex-col text-right font-mono text-[10px] leading-tight text-[var(--text-primary)] px-2 border-l border-r border-[var(--border-tactical)]">
            <span className="text-cyan-400 font-bold tracking-tight">{timeIst}</span>
            <span className="text-[var(--text-secondary)] tracking-tight">{timeUtc}</span>
          </div>

          {/* User & Role Switcher */}
          <div className="flex items-center gap-1.5 bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] rounded px-2 py-1">
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            <div className="flex flex-col leading-none">
              <span className="text-[9px] font-mono text-[var(--text-secondary)] uppercase tracking-tighter">{user.badgeId}</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="bg-transparent text-[11px] font-bold text-[var(--text-primary)] focus:outline-none cursor-pointer pr-1 py-0.5"
              >
                <option value="operator" className="bg-[var(--bg-panel)] text-[var(--text-primary)]">
                  Operator
                </option>
                <option value="supervisor" className="bg-[var(--bg-panel)] text-[var(--text-primary)]">
                  Supervisor
                </option>
                <option value="admin" className="bg-[var(--bg-panel)] text-[var(--text-primary)]">
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
