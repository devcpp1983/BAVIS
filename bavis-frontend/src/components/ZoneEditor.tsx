import React, { useState, useEffect, useRef } from 'react';
import type { Camera, Zone, RuleType, SeverityLevel, Point2D } from '../types/bavis';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { VideoCanvasRenderer } from './VideoCanvasRenderer';
import { Map, Save, Trash2, ShieldAlert, CheckCircle, Lock } from 'lucide-react';

interface ZoneEditorProps {
  initialCamera?: Camera | null;
}

export const ZoneEditor: React.FC<ZoneEditorProps> = ({ initialCamera }) => {
  const { canEditZones, role } = useAuth();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);

  const [zoneName, setZoneName] = useState<string>('Perimeter Breach Zone Alpha');
  const [ruleType, setRuleType] = useState<RuleType>('virtual_fence_breach');
  const [severity, setSeverity] = useState<SeverityLevel>('high');
  const [dwellThreshold, setDwellThreshold] = useState<number>(15);
  const [points, setPoints] = useState<Point2D[]>([
    { x: 0.2, y: 0.2 },
    { x: 0.8, y: 0.2 },
    { x: 0.85, y: 0.8 },
    { x: 0.15, y: 0.8 },
  ]);

  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const camData = await api.getCameras();
        setCameras(camData);
        if (initialCamera) {
          setSelectedCamera(initialCamera);
        } else if (camData.length > 0) {
          setSelectedCamera(camData[0]);
        }

        const zoneData = await api.getZones();
        setZones(zoneData);
      } catch (err) {
        console.error('Failed to load zone editor data:', err);
      }
    };
    loadData();
  }, [initialCamera]);

  useEffect(() => {
    if (selectedCamera) {
      const existing = zones.find((z) => z.camera_id === selectedCamera.camera_id);
      if (existing) {
        setSelectedZone(existing);
        setZoneName(existing.name);
        setRuleType(existing.rule_type);
        setSeverity(existing.severity);
        setPoints(existing.points);
        if (existing.dwell_threshold_sec) setDwellThreshold(existing.dwell_threshold_sec);
      } else {
        setSelectedZone(null);
      }
    }
  }, [selectedCamera, zones]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canEditZones) return;
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;

    if (points.length < 8) {
      setPoints((prev) => [...prev, { x: Number(clickX.toFixed(3)), y: Number(clickY.toFixed(3)) }]);
    }
  };

  const handleClearPoints = () => {
    setPoints([]);
  };

  const handleSaveZone = async () => {
    if (!canEditZones) {
      setFeedback({ type: 'error', message: 'Permission Denied: Only Supervisors and Admins can save zones.' });
      return;
    }

    if (!selectedCamera) return;
    if (points.length < 3) {
      setFeedback({ type: 'error', message: 'At least 3 points required to define a valid polygon zone.' });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const payload: Partial<Zone> = {
        zone_id: selectedZone?.zone_id || `zone-${Date.now()}`,
        camera_id: selectedCamera.camera_id,
        name: zoneName,
        rule_type: ruleType,
        severity: severity,
        dwell_threshold_sec: ruleType === 'dwell_time_exceeded' ? dwellThreshold : undefined,
        points: points,
        active: true,
      };

      const saved = await api.createOrUpdateZone(payload);

      setZones((prev) => {
        const filtered = prev.filter((z) => z.zone_id !== saved.zone_id);
        return [saved, ...filtered];
      });

      setFeedback({ type: 'success', message: `Zone "${saved.name}" successfully saved and deployed to AI Rule Engine!` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save zone configuration.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-full overflow-hidden select-none font-mono">
      <div className="lg:col-span-8 flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] rounded mb-2.5 transition-colors">
          <div className="flex items-center gap-2">
            <Map className="w-4 h-4 text-cyan-500" />
            <h2 className="text-xs font-bold tracking-wider text-[var(--text-primary)] uppercase">
              VIRTUAL FENCE & RESTRICTED ZONE EDITOR
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[var(--text-secondary)]">SELECT FEED:</span>
            <select
              value={selectedCamera?.camera_id || ''}
              onChange={(e) => {
                const found = cameras.find((c) => c.camera_id === e.target.value);
                if (found) setSelectedCamera(found);
              }}
              className="bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded px-2 py-0.5 text-[var(--text-primary)] text-xs font-bold focus:outline-none cursor-pointer"
            >
              {cameras.map((cam) => (
                <option key={cam.camera_id} value={cam.camera_id}>
                  {cam.name} ({cam.location_code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative flex-1 bg-black border border-[var(--border-tactical)] rounded overflow-hidden">
          {selectedCamera ? (
            <div
              ref={containerRef}
              onClick={handleCanvasClick}
              className="relative w-full h-full cursor-crosshair select-none"
            >
              <VideoCanvasRenderer camera={selectedCamera} detections={[]} />

              <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
                {points.length > 0 && (
                  <polygon
                    points={points.map((p) => `${p.x * 100}% ${p.y * 100}%`).join(' ')}
                    fill={severity === 'high' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)'}
                    stroke={severity === 'high' ? '#ef4444' : '#f59e0b'}
                    strokeWidth="2"
                    strokeDasharray="5 3"
                  />
                )}

                {points.map((p, idx) => (
                  <g key={idx}>
                    <circle
                      cx={`${p.x * 100}%`}
                      cy={`${p.y * 100}%`}
                      r="6"
                      fill={severity === 'high' ? '#ef4444' : '#f59e0b'}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <text
                      x={`${p.x * 100}%`}
                      y={`${p.y * 100}%`}
                      dx="10"
                      dy="4"
                      fill="#ffffff"
                      fontSize="10"
                      fontFamily="monospace"
                    >
                      P{idx + 1} ({Math.round(p.x * 100)}%, {Math.round(p.y * 100)}%)
                    </text>
                  </g>
                ))}
              </svg>

              <div className="absolute top-2.5 left-2.5 bg-[#060a0f]/90 border border-[#1d2d3e] rounded px-2.5 py-1 text-[10px] text-cyan-300 z-40">
                <span>{canEditZones ? 'CLICK ON VIDEO FRAME TO PLACE BOUNDARY VERTICES' : 'VIEW ONLY MODE (SUPERVISOR REQUIRED)'}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)] text-xs">
              Loading camera feed context...
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-4 flex flex-col h-full bg-[var(--bg-panel)] border border-[var(--border-tactical)] rounded p-3 space-y-3 transition-colors">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-tactical)]">
          <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide">ZONE SPECIFICATION</h3>
          {!canEditZones && (
            <span className="flex items-center gap-1 text-[9px] bg-red-950 border border-red-800 text-red-300 px-1.5 py-0.2 rounded">
              <Lock className="w-3 h-3" />
              LOCKED ({role.toUpperCase()})
            </span>
          )}
        </div>

        {feedback && (
          <div
            className={`p-2 rounded border text-[11px] flex items-start gap-1.5 ${
              feedback.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                : 'bg-red-950/80 border-red-500/60 text-red-300'
            }`}
          >
            {feedback.type === 'success' ? <CheckCircle className="w-3.5 h-3.5 shrink-0" /> : <ShieldAlert className="w-3.5 h-3.5 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="space-y-3 flex-1 overflow-y-auto pr-1 text-xs">
          <div>
            <label className="block text-[10px] text-[var(--text-secondary)] mb-0.5 uppercase">ZONE NAME</label>
            <input
              type="text"
              disabled={!canEditZones}
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
              className="w-full bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded px-2.5 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:border-cyan-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-[10px] text-[var(--text-secondary)] mb-0.5 uppercase">RULE TYPE EVALUATOR</label>
            <select
              disabled={!canEditZones}
              value={ruleType}
              onChange={(e) => setRuleType(e.target.value as RuleType)}
              className="w-full bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded px-2.5 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:border-cyan-500 disabled:opacity-50 cursor-pointer"
            >
              <option value="virtual_fence_breach">Virtual Fence Perimeter Breach</option>
              <option value="anpr_unlisted_vehicle">ANPR Unlisted Vehicle Check</option>
              <option value="dwell_time_exceeded">Dwell Time Threshold Exceeded</option>
              <option value="low_light_movement">Night Low-Light Intrusion</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-[var(--text-secondary)] mb-0.5 uppercase">SEVERITY LEVEL</label>
            <select
              disabled={!canEditZones}
              value={severity}
              onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
              className="w-full bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded px-2.5 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:border-cyan-500 disabled:opacity-50 cursor-pointer"
            >
              <option value="high">HIGH (Critical Alert)</option>
              <option value="medium">MEDIUM (Operator Warning)</option>
              <option value="low">LOW (Audit Event)</option>
            </select>
          </div>

          {ruleType === 'dwell_time_exceeded' && (
            <div>
              <label className="block text-[10px] text-[var(--text-secondary)] mb-0.5 uppercase">DWELL TIME THRESHOLD (SEC)</label>
              <input
                type="number"
                disabled={!canEditZones}
                value={dwellThreshold}
                onChange={(e) => setDwellThreshold(Number(e.target.value))}
                className="w-full bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded px-2.5 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:border-cyan-500 disabled:opacity-50"
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] text-[var(--text-secondary)] uppercase">VERTICES ({points.length})</label>
              {canEditZones && (
                <button
                  onClick={handleClearPoints}
                  className="text-[10px] text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> CLEAR
                </button>
              )}
            </div>
            <div className="bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded p-1.5 max-h-28 overflow-y-auto space-y-1 text-[10px] text-[var(--text-primary)]">
              {points.map((p, idx) => (
                <div key={idx} className="flex justify-between border-b border-[var(--border-tactical)] pb-0.5">
                  <span className="text-cyan-500">P{idx + 1}</span>
                  <span>X: {p.x} | Y: {p.y}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-[var(--border-tactical)]">
          <button
            onClick={handleSaveZone}
            disabled={!canEditZones || saving}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-cyan-950 border border-cyan-600/70 text-cyan-200 text-xs font-bold hover:bg-cyan-900 transition-all disabled:opacity-40 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'SAVING TO ENGINE...' : 'SAVE ZONE (POST /zones)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
