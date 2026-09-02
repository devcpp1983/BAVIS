import React from 'react';

export const TelemetryFooterBar: React.FC = () => {
  return (
    <footer className="bg-[var(--bg-panel)] border-t border-[var(--border-tactical)] px-3 py-1 flex items-center justify-between text-[10px] font-mono select-none transition-colors">
      {/* Left: Stream & Telemetry */}
      <div className="flex items-center gap-4 text-[var(--text-secondary)]">
        <div className="flex items-center gap-1.5">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-emerald-400 font-bold">WS STREAM NOMINAL</span>
        </div>

        <span className="hidden sm:inline text-[var(--border-tactical)]">|</span>

        <div className="hidden sm:flex items-center gap-2">
          <span>LAT: <span className="text-[var(--text-primary)]">31.1048° N</span></span>
          <span>LON: <span className="text-[var(--text-primary)]">77.1734° E</span></span>
          <span>ALT: <span className="text-[var(--text-primary)]">2150M</span></span>
        </div>
      </div>

      {/* Center: Indian Sovereign Identity & Classification Banner */}
      <div className="hidden md:flex items-center gap-2 text-[9px] uppercase tracking-wider text-[var(--text-secondary)]">
        <span className="text-amber-500 font-semibold">RESTRICTED</span>
        <span>•</span>
        <span>GOVERNMENT OF INDIA • MINISTRY OF HOME AFFAIRS</span>
        <span>•</span>
        <span className="text-emerald-400 font-semibold">CIBMS ISR NODE</span>
      </div>

      {/* Right: Telemetry Ping & Network */}
      <div className="flex items-center gap-3 text-[var(--text-secondary)]">
        <span>RTT: <span className="text-cyan-400 font-bold">14ms</span></span>
        <span>ENC: <span className="text-[var(--text-primary)]">AES-256</span></span>
      </div>
    </footer>
  );
};
