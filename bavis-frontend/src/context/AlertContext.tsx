import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { Alert, Detection } from '../types/bavis';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

interface AlertContextType {
  alerts: Alert[];
  unreadHighCount: number;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  latestDetection: Detection | null;
  selectedEvidenceId: string | null;
  setSelectedEvidenceId: (id: string | null) => void;
  triggerDemoAlert: (rule: 'virtual_fence_breach' | 'anpr_unlisted_vehicle' | 'dwell_time_exceeded' | 'low_light_movement', camId?: string, severity?: 'low' | 'medium' | 'high') => void;
  refreshAlerts: () => Promise<void>;
  resetDemoState: () => void;
  runScenario: (scenarioId: 1 | 2 | 3, onStepUpdate?: (step: any) => void) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [latestDetection, setLatestDetection] = useState<Detection | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Tactical Alert Beep
  const playTacticalAlarm = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1200, now + 0.1);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Ignore audio autoplay policies gracefully
    }
  }, [soundEnabled]);

  const refreshAlerts = useCallback(async () => {
    try {
      const data = await api.getAlerts();
      setAlerts(data);
    } catch (err) {
      console.error('Failed to load initial alerts:', err);
    }
  }, []);

  const resetDemoState = useCallback(() => {
    api.resetDemoState();
    refreshAlerts();
  }, [refreshAlerts]);

  useEffect(() => {
    refreshAlerts();

    const unsubscribe = api.subscribeAlertStream((data) => {
      if (data.type === 'ALERT') {
        const newAlert = data.payload as Alert;
        setAlerts((prev) => {
          const exists = prev.some((a) => a.alert_id === newAlert.alert_id);
          if (exists) {
            return prev.map((a) => (a.alert_id === newAlert.alert_id ? newAlert : a));
          }
          return [newAlert, ...prev];
        });

        if (newAlert.severity === 'high') {
          playTacticalAlarm();
        }
      } else if (data.type === 'DETECTION') {
        setLatestDetection(data.payload as Detection);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [refreshAlerts, playTacticalAlarm]);

  const acknowledgeAlert = async (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.alert_id === alertId
          ? {
              ...a,
              status: 'acknowledged',
              acknowledged_by: user.name,
              acknowledged_at: new Date().toISOString(),
            }
          : a
      )
    );

    try {
      await api.acknowledgeAlert(alertId, user.id);
    } catch (err) {
      console.error(`Failed to ack alert ${alertId}:`, err);
      refreshAlerts();
    }
  };

  const triggerDemoAlert = (
    rule: 'virtual_fence_breach' | 'anpr_unlisted_vehicle' | 'dwell_time_exceeded' | 'low_light_movement',
    _camId?: string,
    _severity?: 'low' | 'medium' | 'high'
  ) => {
    if (rule === 'virtual_fence_breach') {
      api.runScenario(1);
    } else if (rule === 'anpr_unlisted_vehicle') {
      api.runScenario(2);
    } else {
      api.runScenario(3);
    }
  };

  const runScenario = (scenarioId: 1 | 2 | 3, onStepUpdate?: (step: any) => void) => {
    api.runScenario(scenarioId, onStepUpdate);
  };

  const unreadHighCount = alerts.filter((a) => a.severity === 'high' && a.status === 'new').length;

  return (
    <AlertContext.Provider
      value={{
        alerts,
        unreadHighCount,
        soundEnabled,
        setSoundEnabled,
        acknowledgeAlert,
        latestDetection,
        selectedEvidenceId,
        setSelectedEvidenceId,
        triggerDemoAlert,
        refreshAlerts,
        resetDemoState,
        runScenario,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
};

export const useAlerts = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
};
