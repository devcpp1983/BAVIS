import React, { useRef, useState, useEffect } from 'react';
import type { Camera, Detection, Zone, VisionMode } from '../types/bavis';

interface VideoCanvasRendererProps {
  camera: Camera;
  detections?: Detection[];
  zones?: Zone[];
  activeVisionMode?: VisionMode;
}

export const VideoCanvasRenderer: React.FC<VideoCanvasRendererProps> = ({
  camera,
  detections = [],
  zones = [],
  activeVisionMode,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoError, setVideoError] = useState<boolean>(false);

  const visionMode = activeVisionMode || camera.vision_mode;

  const getVideoSrc = (cam: Camera): string => {
    if (cam.stream_url && cam.stream_url.startsWith('/videos/')) {
      return cam.stream_url;
    }
    if (cam.camera_id === 'cam-02') return '/videos/cam2.mp4';
    if (cam.camera_id === 'cam-03') return '/videos/cam3.mp4';
    if (cam.camera_id === 'cam-04') return '/videos/cam4.mp4';
    return '/videos/cam1.mp4';
  };

  const videoSrc = getVideoSrc(camera);

  // Deterministic mock bounding boxes per camera if live detections array is empty
  const defaultDetections: Record<string, Detection[]> = {
    'cam-01': [
      {
        camera_id: 'cam-01',
        frame_ts: new Date().toISOString(),
        object_type: 'person',
        confidence: 0.942,
        bbox: [320, 310, 520, 750],
        track_id: 'T-042',
        speed_kmh: 4.8,
      },
    ],
    'cam-02': [
      {
        camera_id: 'cam-02',
        frame_ts: new Date().toISOString(),
        object_type: 'vehicle',
        confidence: 0.914,
        bbox: [220, 240, 780, 680],
        track_id: 'V-017',
        anpr_plate: 'UP16-AB-8849',
        speed_kmh: 22.1,
      },
    ],
    'cam-03': [
      {
        camera_id: 'cam-03',
        frame_ts: new Date().toISOString(),
        object_type: 'person',
        confidence: 0.88,
        bbox: [360, 280, 580, 720],
        track_id: 'T-039',
        speed_kmh: 2.4,
      },
    ],
    'cam-04': [
      {
        camera_id: 'cam-04',
        frame_ts: new Date().toISOString(),
        object_type: 'vehicle',
        confidence: 0.89,
        bbox: [280, 340, 680, 640],
        track_id: 'W-009',
        speed_kmh: 12.4,
      },
    ],
  };

  const activeDetections = detections.length > 0 ? detections : (defaultDetections[camera.camera_id] || []);
  const cameraZones = zones.filter((z) => z.camera_id === camera.camera_id);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay policy fallback handled gracefully
      });
    }
  }, [videoSrc]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden select-none font-mono">
      {/* 1. Underlying Surveillance Video Stream */}
      {!videoError ? (
        <video
          ref={videoRef}
          src={videoSrc}
          autoPlay
          muted
          loop
          playsInline
          onError={() => setVideoError(true)}
          className={`w-full h-full object-cover transition-all ${
            visionMode === 'thermal'
              ? 'hue-rotate-180 contrast-125 invert-25'
              : visionMode === 'night'
              ? 'sepia-100 hue-rotate-50 contrast-150 brightness-90'
              : ''
          }`}
        />
      ) : (
        /* Fallback synthetic video surface if local file missing */
        <div className="w-full h-full bg-slate-950 flex items-center justify-center text-[var(--text-muted)] text-xs">
          <span>RTSP STREAM RECONNECTING...</span>
        </div>
      )}

      {/* 2. Tactical Video HUD Scanlines & Filter Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-black/40 z-10"></div>

      {/* 3. Render Polygon Geofences on Camera Frame */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
        {cameraZones.map((z) => {
          if (!z.points || z.points.length < 3) return null;
          const pointsStr = z.points.map((p) => `${p.x * 100}% ${p.y * 100}%`).join(' ');
          const isHigh = z.severity === 'high';
          return (
            <g key={z.zone_id}>
              <polygon
                points={pointsStr}
                fill={isHigh ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)'}
                stroke={isHigh ? '#ef4444' : '#f59e0b'}
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <text
                x={`${z.points[0].x * 100 + 1}%`}
                y={`${z.points[0].y * 100 + 3}%`}
                fill={isHigh ? '#f87171' : '#fbbf24'}
                fontSize="8"
                fontFamily="monospace"
                fontWeight="bold"
              >
                [{z.name.toUpperCase()}]
              </text>
            </g>
          );
        })}
      </svg>

      {/* 4. Overlaid Computer Vision Bounding Boxes */}
      <div className="absolute inset-0 pointer-events-none z-30">
        {activeDetections.map((det, idx) => {
          const isVehicle = det.object_type === 'vehicle';
          const leftPercent = (det.bbox[0] / 1920) * 100;
          const topPercent = (det.bbox[1] / 1080) * 100;
          const widthPercent = ((det.bbox[2] - det.bbox[0]) / 1920) * 100;
          const heightPercent = ((det.bbox[3] - det.bbox[1]) / 1080) * 100;

          return (
            <div
              key={idx}
              className={`absolute border transition-all ${
                isVehicle
                  ? 'border-amber-400 bg-amber-400/10'
                  : 'border-cyan-400 bg-cyan-400/10'
              }`}
              style={{
                left: `${leftPercent}%`,
                top: `${topPercent}%`,
                width: `${widthPercent}%`,
                height: `${heightPercent}%`,
              }}
            >
              {/* Corner Reticles */}
              <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white"></div>
              <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-white"></div>
              <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-white"></div>
              <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-white"></div>

              {/* Tag Monospace Label */}
              <div
                className={`absolute -top-5 left-0 px-1 py-0.2 rounded-sm text-[9px] font-bold text-black flex items-center gap-1 shadow ${
                  isVehicle ? 'bg-amber-400' : 'bg-cyan-400'
                }`}
              >
                <span>{det.object_type.toUpperCase()}</span>
                <span>{det.track_id}</span>
                <span>{Math.round(det.confidence * 100)}%</span>
              </div>

              {/* ANPR Plate Badge */}
              {det.anpr_plate && (
                <div className="absolute -bottom-5 left-0 px-1.5 py-0.2 rounded-sm text-[8px] font-bold bg-amber-950 text-amber-300 border border-amber-500 shadow">
                  PLATE: [{det.anpr_plate}]
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 5. Live Feed Status OSD Overlay (Top Right & Bottom Left) */}
      <div className="absolute top-1.5 right-1.5 flex items-center gap-1.5 z-40">
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/80 border border-[var(--border-tactical)] text-[9px] text-emerald-400 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          LIVE {camera.fps} FPS
        </span>
      </div>

      <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1.5 text-[8px] text-[var(--text-secondary)] z-40 bg-black/70 px-1.5 py-0.5 rounded border border-white/10">
        <span className="text-cyan-400 font-bold">{camera.camera_id.toUpperCase()}</span>
        <span>•</span>
        <span>{visionMode.toUpperCase()} MODE</span>
        <span>•</span>
        <span>{camera.resolution}</span>
      </div>
    </div>
  );
};
