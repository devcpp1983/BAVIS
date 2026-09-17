import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAlerts } from '../context/AlertContext';
import { Shield, Volume2, VolumeX, UserCheck, RotateCcw } from 'lucide-react';
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
  onlineCameraCount = 4,
  totalCameraCount = 4,
  activeTrackCount = 5,
}) => {
  const { role, setRole, user } = useAuth();
  const { unreadHighCount, soundEnabled, setSoundEnabled, resetDemoState } = useAlerts();

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
    <header className="sticky top-0 z-40 bg-[var(--bg-panel)] border-b border-[var(--border-tactical)] px-3 py-2 select-none">
      {/* Top Subtle Tricolor Border Line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-orange-600 via-slate-200 to-emerald-600"></div>

      <div className="flex items-center justify-between gap-3 mt-0.5">
        {/* Left Section: BAVIS Command Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded bg-[var(--bg-panel-elevated)] border border-[var(--border-highlight)] text-cyan-400">
              <Shield className="w-4 h-4 text-cyan-400" />
            </div>

            <div>
              <div className="flex items-center gap-2 leading-none">
                <span className="text-sm font-bold tracking-wider text-[var(--text-primary)] font-mono">
                  BAVIS
                </span>
                <span className="text-[10px] font-mono text-[var(--text-muted)] border-l border-[var(--border-tactical)] pl-2">
                  BORDER SURVEILLANCE NETWORK
                </span>
                <span className="hidden sm:inline text-[9px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 px-1.5 py-0.5 rounded">
                  OPERATIONAL COMMAND CONSOLE
                </span>
              </div>
              <p className="text-[10px] font-mono text-[var(--text-secondary)] tracking-tight mt-0.5">
                Border AI Video Intelligence System • <span className="text-[var(--text-primary)] font-semibold">Sector: Northern Border / BOP Network</span>
              </p>
            </div>
          </div>
        </div>

        {/* Center Section: Compact Telemetry Strip */}
        <div className="hidden md:flex items-center gap-3 bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] px-3 py-1 rounded font-mono text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-[var(--text-secondary)]">SYSTEM:</span>
            <span className="text-emerald-400 font-bold">ONLINE</span>
          </div>
          <span className="text-[var(--border-tactical)]">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-secondary)]">ACTIVE CAMERAS:</span>
            <span className="text-[var(--text-primary)] font-bold">{onlineCameraCount}/{totalCameraCount}</span>
          </div>
          <span className="text-[var(--border-tactical)]">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-secondary)]">TRACKS:</span>
            <span className="text-cyan-400 font-bold">{activeTrackCount}</span>
          </div>

          {unreadHighCount > 0 && (
            <>
              <span className="text-[var(--border-tactical)]">|</span>
              <button
                onClick={() => setActiveTab('incidents')}
                className="flex items-center gap-1 px-1.5 py-0.2 rounded bg-red-950/80 border border-red-600/70 text-red-300 text-[10px] font-bold cursor-pointer hover:bg-red-900"
              >
                <span>{unreadHighCount} HIGH INCIDENTS</span>
              </button>
            </>
          )}
        </div>

        {/* Right Section: Time, Demo Indicator, User Role */}
        <div className="flex items-center gap-2.5">
          {/* Subtle Demonstration Sensor Badge */}
          <div className="hidden lg:flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] text-[9px] font-mono text-[var(--text-muted)]">
            <span>SIMULATED SENSOR DATA</span>
          </div>

          {/* Real-time UTC & IST Clocks */}
          <div className="hidden sm:flex flex-col text-right font-mono text-[10px] leading-tight text-[var(--text-primary)] px-2 border-l border-r border-[var(--border-tactical)]">
            <span className="text-cyan-400 font-bold">{timeUtc}</span>
            <span className="text-[var(--text-secondary)]">{timeIst}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1.5 rounded border transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-cyan-950/60 border-cyan-700/60 text-cyan-400'
                : 'bg-[var(--bg-panel-elevated)] border-[var(--border-tactical)] text-[var(--text-secondary)]'
            }`}
            title={soundEnabled ? 'Mute Alert Sound' : 'Enable Alert Sound'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Reset Demo State Button */}
          <button
            onClick={() => {
              if (confirm('Reset BAVIS simulation to initial factory state?')) {
                resetDemoState();
              }
            }}
            className="p-1.5 rounded bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] text-[var(--text-secondary)] hover:text-cyan-400 hover:border-cyan-600 transition-all cursor-pointer"
            title="Reset Simulation State"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* User & Role Switcher */}
          <div className="flex items-center gap-1.5 bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] rounded px-2 py-1">
            <UserCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <div className="flex flex-col leading-none">
              <span className="text-[8px] font-mono text-[var(--text-muted)] uppercase">{user.badgeId}</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="bg-transparent text-[10px] font-bold font-mono text-[var(--text-primary)] focus:outline-none cursor-pointer pr-1 py-0.5"
              >
                <option value="operator" className="bg-[var(--bg-panel)] text-[var(--text-primary)]">
                  OPERATOR
                </option>
                <option value="supervisor" className="bg-[var(--bg-panel)] text-[var(--text-primary)]">
                  SUPERVISOR
                </option>
                <option value="admin" className="bg-[var(--bg-panel)] text-[var(--text-primary)]">
                  ADMIN / CMDT
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
