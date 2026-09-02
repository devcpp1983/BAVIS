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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-4.5rem)] p-4 overflow-hidden">
      <div className="lg:col-span-8 flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border border-cyan-900/40 rounded-xl mb-3 glass-panel">
          <div className="flex items-center gap-3">
            <Map className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-black tracking-wider text-slate-100 uppercase">
              VIRTUAL FENCE & RESTRICTED ZONE EDITOR
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">SELECT FEED:</span>
            <select
              value={selectedCamera?.camera_id || ''}
              onChange={(e) => {
                const found = cameras.find((c) => c.camera_id === e.target.value);
                if (found) setSelectedCamera(found);
              }}
              className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 text-xs font-bold font-mono focus:outline-none"
            >
              {cameras.map((cam) => (
                <option key={cam.camera_id} value={cam.camera_id}>
                  {cam.name} ({cam.location_code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative flex-1 bg-black border border-cyan-900/50 rounded-xl overflow-hidden glass-panel">
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
                    fill={severity === 'high' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)'}
                    stroke={severity === 'high' ? '#ef4444' : '#f59e0b'}
                    strokeWidth="3"
                    strokeDasharray="6 4"
                  />
                )}

                {points.map((p, idx) => (
                  <g key={idx}>
                    <circle
                      cx={`${p.x * 100}%`}
                      cy={`${p.y * 100}%`}
                      r="7"
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

              <div className="absolute top-3 left-3 bg-slate-950/80 border border-slate-800 rounded px-3 py-1.5 text-[11px] font-mono text-cyan-300 z-40">
                <span>{canEditZones ? 'CLICK ON VIDEO FRAME TO PLACE BOUNDARY VERTICES' : 'VIEW ONLY MODE (SUPERVISOR REQUIRED)'}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 font-mono text-sm">
              Loading camera feed context...
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-4 flex flex-col h-full bg-slate-950/90 border border-cyan-900/40 rounded-xl overflow-hidden glass-panel p-4 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">ZONE SPECIFICATION</h3>
          {!canEditZones && (
            <span className="flex items-center gap-1 text-[10px] font-mono bg-red-950/80 border border-red-800/80 text-red-300 px-2 py-0.5 rounded">
              <Lock className="w-3 h-3" />
              LOCKED ({role.toUpperCase()})
            </span>
          )}
        </div>

        {feedback && (
          <div
            className={`p-3 rounded-lg border text-xs font-mono flex items-start gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                : 'bg-red-950/80 border-red-500/60 text-red-300'
            }`}
          >
            {feedback.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <ShieldAlert className="w-4 h-4 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="space-y-3.5 flex-1 overflow-y-auto pr-1">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">ZONE IDENTIFIER / NAME</label>
            <input
              type="text"
              disabled={!canEditZones}
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">RULE TYPE EVALUATOR</label>
            <select
              disabled={!canEditZones}
              value={ruleType}
              onChange={(e) => setRuleType(e.target.value as RuleType)}
              className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 disabled:opacity-50"
            >
              <option value="virtual_fence_breach">Virtual Fence Perimeter Breach</option>
              <option value="anpr_unlisted_vehicle">ANPR Unlisted Vehicle Check</option>
              <option value="dwell_time_exceeded">Dwell Time Threshold Exceeded</option>
              <option value="low_light_movement">Night Low-Light Intrusion</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">ALERT SEVERITY LEVEL</label>
            <select
              disabled={!canEditZones}
              value={severity}
              onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
              className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 disabled:opacity-50"
            >
              <option value="high">HIGH (Immediate QRT Dispatch)</option>
              <option value="medium">MEDIUM (Operator Warning)</option>
              <option value="low">LOW (Audit Event)</option>
            </select>
          </div>

          {ruleType === 'dwell_time_exceeded' && (
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">DWELL TIME THRESHOLD (SECONDS)</label>
              <input
                type="number"
                disabled={!canEditZones}
                value={dwellThreshold}
                onChange={(e) => setDwellThreshold(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 disabled:opacity-50"
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-mono text-slate-400">BOUNDARY POINTS ({points.length})</label>
              {canEditZones && (
                <button
                  onClick={handleClearPoints}
                  className="text-[10px] font-mono text-red-400 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> CLEAR
                </button>
              )}
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded p-2 max-h-32 overflow-y-auto space-y-1 font-mono text-[11px] text-slate-300">
              {points.map((p, idx) => (
                <div key={idx} className="flex justify-between border-b border-slate-800/50 pb-0.5">
                  <span className="text-cyan-400">Vertex P{idx + 1}</span>
                  <span>X: {p.x} | Y: {p.y}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 space-y-2">
          <button
            onClick={handleSaveZone}
            disabled={!canEditZones || saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-950 border border-cyan-600/70 text-cyan-200 text-xs font-mono font-bold hover:bg-cyan-900 transition-all disabled:opacity-40 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'SAVING TO ENGINE...' : 'DEPLOY ZONE TO AI ENGINE (POST /zones)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
