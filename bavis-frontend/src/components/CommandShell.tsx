import React from 'react';
import { TopStatusBar } from './TopStatusBar';
import { CommandRail } from './CommandRail';
import type { ActiveTab } from './CommandRail';
import { TelemetryFooterBar } from './TelemetryFooterBar';

interface CommandShellProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  children: React.ReactNode;
}

export const CommandShell: React.FC<CommandShellProps> = ({ activeTab, setActiveTab, children }) => {
  return (
    <div className="min-h-screen bg-[#060a0f] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 h-screen overflow-hidden">
      {/* Top Command Bar */}
      <TopStatusBar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Primary Center Workspace with Left Command Rail */}
      <div className="flex flex-1 overflow-hidden relative">
        <CommandRail activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 overflow-y-auto bg-radar-grid p-3 md:p-4">
          {children}
        </main>
      </div>

      {/* Telemetry Footer */}
      <TelemetryFooterBar />
    </div>
  );
};
