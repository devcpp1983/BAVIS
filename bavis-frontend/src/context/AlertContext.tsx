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
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [latestDetection, setLatestDetection] = useState<Detection | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play Web Audio Tactical Beep for High severity alerts
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
      const osc1 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.setValueAtTime(1200, now + 0.1);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc1.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.3);
    } catch {
      // Ignore audio autoplay restrictions gracefully
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
    camId?: string,
    severity?: 'low' | 'medium' | 'high'
  ) => {
    api.triggerDemoAlert(rule, camId, severity);
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
