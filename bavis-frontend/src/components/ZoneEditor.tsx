import React, { useState, useEffect, useRef } from 'react';
import type { Camera, Zone, RuleType, SeverityLevel, Point2D } from '../types/bavis';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { VideoCanvasRenderer } from './VideoCanvasRenderer';
import { Map, Save, Trash2, ShieldAlert, CheckCircle, Lock, Clock } from 'lucide-react';

interface ZoneEditorProps {
  initialCamera?: Camera | null;
}

export const ZoneEditor: React.FC<ZoneEditorProps> = ({ initialCamera }) => {
  const { canEditZones, role } = useAuth();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);

  const [zoneName, setZoneName] = useState<string>('Zone North Restricted Buffer');
  const [ruleType, setRuleType] = useState<RuleType>('virtual_fence_breach');
  const [severity, setSeverity] = useState<SeverityLevel>('high');
  const [dwellThreshold, setDwellThreshold] = useState<number>(10);
  const [activeHours, setActiveHours] = useState<string>('24/7 ALL HOURS');
  const [points, setPoints] = useState<Point2D[]>([
    { x: 0.15, y: 0.3 },
    { x: 0.85, y: 0.3 },
    { x: 0.9, y: 0.8 },
    { x: 0.1, y: 0.8 },
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
        if (existing.active_hours) setActiveHours(existing.active_hours);
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
      setFeedback({ type: 'error', message: 'Permission Denied: Supervisor or Admin role required to deploy zones.' });
      return;
    }

    if (!selectedCamera) return;
    if (points.length < 3) {
      setFeedback({ type: 'error', message: 'At least 3 boundary vertices required to define a valid polygon zone.' });
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
        dwell_threshold_sec: dwellThreshold,
        active_hours: activeHours,
        points: points,
        active: true,
      };

      const saved = await api.createOrUpdateZone(payload);

      setZones((prev) => {
        const filtered = prev.filter((z) => z.zone_id !== saved.zone_id);
        return [saved, ...filtered];
      });

      setFeedback({
        type: 'success',
        message: `Zone "${saved.name}" successfully compiled and persisted to AI Intelligence Rule Engine!`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save zone rule.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 h-full overflow-hidden select-none font-mono">
      {/* Left 8 Cols: Interactive Camera Canvas */}
      <div className="lg:col-span-8 flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--bg-panel-elevated)] border border-[var(--border-tactical)] rounded mb-2">
          <div className="flex items-center gap-2">
            <Map className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-bold tracking-wider text-[var(--text-primary)] uppercase">
              VIRTUAL GEOFENCE & BEHAVIORAL RULE SPECIFIER
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[var(--text-secondary)]">FEED:</span>
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

              {/* Polygon SVG Overlay */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
                {points.length > 0 && (
                  <polygon
                    points={points.map((p) => `${p.x * 100}% ${p.y * 100}%`).join(' ')}
                    fill={severity === 'high' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)'}
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
                      r="5"
                      fill={severity === 'high' ? '#ef4444' : '#f59e0b'}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                    <text
                      x={`${p.x * 100}%`}
                      y={`${p.y * 100}%`}
                      dx="8"
                      dy="3"
                      fill="#ffffff"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      P{idx + 1}
                    </text>
                  </g>
                ))}
              </svg>

              <div className="absolute top-2 left-2 bg-[var(--bg-panel-elevated)]/90 border border-[var(--border-tactical)] rounded px-2 py-0.5 text-[9px] text-cyan-300 z-40">
                <span>{canEditZones ? 'CLICK FRAME TO PLACE POLYGON VERTICES' : 'READ-ONLY (SUPERVISOR ACCESS REQUIRED)'}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)] text-xs">
              Loading camera feed context...
            </div>
          )}
        </div>
      </div>

      {/* Right 4 Cols: Zone Specification Parameters */}
      <div className="lg:col-span-4 flex flex-col h-full bg-[var(--bg-panel)] border border-[var(--border-tactical)] rounded p-3 space-y-2.5">
        <div className="flex items-center justify-between pb-1.5 border-b border-[var(--border-tactical)]">
          <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wide">
            RULE PARAMETERS
          </h3>
          {!canEditZones && (
            <span className="flex items-center gap-1 text-[9px] bg-red-950 border border-red-800 text-red-300 px-1.5 py-0.2 rounded">
              <Lock className="w-3 h-3" />
              LOCKED ({role.toUpperCase()})
            </span>
          )}
        </div>

        {feedback && (
          <div
            className={`p-2 rounded border text-[10px] flex items-start gap-1.5 ${
              feedback.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                : 'bg-red-950/80 border-red-500 text-red-300'
            }`}
          >
            {feedback.type === 'success' ? <CheckCircle className="w-3.5 h-3.5 shrink-0" /> : <ShieldAlert className="w-3.5 h-3.5 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="space-y-2.5 flex-1 overflow-y-auto pr-1 text-xs">
          <div>
            <label className="block text-[9px] text-[var(--text-secondary)] mb-0.5 uppercase">ZONE IDENTIFIER / NAME</label>
            <input
              type="text"
              disabled={!canEditZones}
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
              className="w-full bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:border-cyan-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-[9px] text-[var(--text-secondary)] mb-0.5 uppercase">RULE EVALUATOR TYPE</label>
            <select
              disabled={!canEditZones}
              value={ruleType}
              onChange={(e) => setRuleType(e.target.value as RuleType)}
              className="w-full bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:border-cyan-500 disabled:opacity-50 cursor-pointer"
            >
              <option value="virtual_fence_breach">Virtual Fence Perimeter Breach</option>
              <option value="anpr_unlisted_vehicle">ANPR Checkpoint Plate Allowlist</option>
              <option value="dwell_time_exceeded">Dwell Time Threshold Exceeded</option>
              <option value="low_light_movement">Night Low-Light Intrusion</option>
            </select>
          </div>

          <div>
            <label className="block text-[9px] text-[var(--text-secondary)] mb-0.5 uppercase">SEVERITY LEVEL</label>
            <select
              disabled={!canEditZones}
              value={severity}
              onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
              className="w-full bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:border-cyan-500 disabled:opacity-50 cursor-pointer"
            >
              <option value="high">HIGH (Immediate Dispatch)</option>
              <option value="medium">MEDIUM (Operator Warning)</option>
              <option value="low">LOW (Audit Event)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] text-[var(--text-secondary)] mb-0.5 uppercase">DWELL LIMIT (SEC)</label>
              <input
                type="number"
                disabled={!canEditZones}
                value={dwellThreshold}
                onChange={(e) => setDwellThreshold(Number(e.target.value))}
                className="w-full bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:border-cyan-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-[9px] text-[var(--text-secondary)] mb-0.5 uppercase flex items-center gap-1">
                <Clock className="w-2.5 h-2.5 text-cyan-400" /> ACTIVE WINDOW
              </label>
              <input
                type="text"
                disabled={!canEditZones}
                value={activeHours}
                onChange={(e) => setActiveHours(e.target.value)}
                placeholder="22:00–05:00"
                className="w-full bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:border-cyan-500 disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[9px] text-[var(--text-secondary)] uppercase">VERTICES ({points.length})</label>
              {canEditZones && (
                <button
                  onClick={handleClearPoints}
                  className="text-[9px] text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> CLEAR
                </button>
              )}
            </div>
            <div className="bg-[var(--bg-panel-highlight)] border border-[var(--border-tactical)] rounded p-1.5 max-h-24 overflow-y-auto space-y-1 text-[9px] text-[var(--text-primary)]">
              {points.map((p, idx) => (
                <div key={idx} className="flex justify-between border-b border-[var(--border-tactical)] pb-0.5">
                  <span className="text-cyan-400">P{idx + 1}</span>
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
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-cyan-950 border border-cyan-600 text-cyan-200 text-xs font-bold hover:bg-cyan-900 transition-all disabled:opacity-40 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'COMPILING RULE...' : 'SAVE RULE'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
