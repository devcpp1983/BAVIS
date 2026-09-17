import React, { useState } from 'react';
import { api } from '../api/client';
import { Play, ShieldAlert, Car, Moon, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import type { Alert } from '../types/bavis';

interface ScenarioRunnerBarProps {
  onScenarioComplete?: (incident: Alert) => void;
}

export const ScenarioRunnerBar: React.FC<ScenarioRunnerBarProps> = ({ onScenarioComplete }) => {
  const [runningScenario, setRunningScenario] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState<{ stepNumber: number; totalSteps: number; title: string; detail: string } | null>(null);

  const handleRunScenario = (id: 1 | 2 | 3) => {
    setRunningScenario(id);
    setCurrentStep({ stepNumber: 1, totalSteps: id === 1 ? 5 : id === 2 ? 4 : 3, title: 'INITIALIZING SIMULATION...', detail: 'Connecting simulated CCTV sensor feed' });

    api.runScenario(id, (step) => {
      setCurrentStep({
        stepNumber: step.stepNumber,
        totalSteps: step.totalSteps,
        title: step.title,
        detail: step.detail,
      });

      if (step.stepNumber === step.totalSteps) {
        setTimeout(() => {
          if (step.incidentCreated && onScenarioComplete) {
            onScenarioComplete(step.incidentCreated);
          }
          setRunningScenario(null);
        }, 1500);
      }
    });
  };

  return (
    <div className="bg-[var(--bg-panel)] border border-[var(--border-tactical)] rounded p-2.5 font-mono select-none">
      {/* Header & Scenario Buttons */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-cyan-950 border border-cyan-700/60 text-cyan-400">
            <Play className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider block">
              OPERATIONAL ISR SCENARIO RUNNER
            </span>
            <span className="text-[10px] text-[var(--text-secondary)]">
              Execute deterministic surveillance workflows to test AI vision, spatial geofence & intelligence correlation:
            </span>
          </div>
        </div>

        {/* 3 Scenario Launch Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            disabled={runningScenario !== null}
            onClick={() => handleRunScenario(1)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-bold border transition-all cursor-pointer disabled:opacity-50 ${
              runningScenario === 1
                ? 'bg-red-950 text-red-200 border-red-500'
                : 'bg-[var(--bg-panel-elevated)] border-[var(--border-tactical)] text-[var(--text-primary)] hover:border-red-500/70 hover:text-red-300'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span>01: PERIMETER INTRUSION</span>
          </button>

          <button
            disabled={runningScenario !== null}
            onClick={() => handleRunScenario(2)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-bold border transition-all cursor-pointer disabled:opacity-50 ${
              runningScenario === 2
                ? 'bg-amber-950 text-amber-200 border-amber-500'
                : 'bg-[var(--bg-panel-elevated)] border-[var(--border-tactical)] text-[var(--text-primary)] hover:border-amber-500/70 hover:text-amber-300'
            }`}
          >
            <Car className="w-3.5 h-3.5 text-amber-400" />
            <span>02: UNLISTED VEHICLE (ANPR)</span>
          </button>

          <button
            disabled={runningScenario !== null}
            onClick={() => handleRunScenario(3)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-bold border transition-all cursor-pointer disabled:opacity-50 ${
              runningScenario === 3
                ? 'bg-cyan-950 text-cyan-200 border-cyan-500'
                : 'bg-[var(--bg-panel-elevated)] border-[var(--border-tactical)] text-[var(--text-primary)] hover:border-cyan-500/70 hover:text-cyan-300'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-cyan-400" />
            <span>03: NIGHT MOVEMENT</span>
          </button>
        </div>
      </div>

      {/* Live Active Scenario Execution Timeline Progress */}
      {currentStep && (
        <div className="mt-2.5 pt-2 border-t border-[var(--border-tactical)] bg-[var(--bg-panel-elevated)] p-2 rounded flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            {runningScenario !== null ? (
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-cyan-400 font-bold">
                  STEP {currentStep.stepNumber}/{currentStep.totalSteps}:
                </span>
                <span className="text-[var(--text-primary)] font-bold">{currentStep.title}</span>
              </div>
              <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{currentStep.detail}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-cyan-400 bg-cyan-950/80 px-2 py-1 rounded border border-cyan-800 shrink-0">
            <span>DETECTION</span>
            <ArrowRight className="w-3 h-3" />
            <span>TRACK</span>
            <ArrowRight className="w-3 h-3" />
            <span>ZONE</span>
            <ArrowRight className="w-3 h-3" />
            <span>CORRELATION</span>
            <ArrowRight className="w-3 h-3" />
            <span>ALERT</span>
          </div>
        </div>
      )}
    </div>
  );
};
