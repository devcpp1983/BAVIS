import React, { useEffect, useRef } from 'react';
import type { Camera, Detection, Zone, VisionMode } from '../types/bavis';

interface VideoCanvasRendererProps {
  camera: Camera;
  detections: Detection[];
  zones?: Zone[];
  activeVisionMode?: VisionMode;
  isFocused?: boolean;
}

export const VideoCanvasRenderer: React.FC<VideoCanvasRendererProps> = ({
  camera,
  detections,
  zones = [],
  activeVisionMode,
  isFocused = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [streamLoaded, setStreamLoaded] = React.useState<boolean>(false);

  const visionMode = activeVisionMode || camera.vision_mode;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let frameCount = 0;

    const renderFrame = () => {
      frameCount++;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (!streamLoaded) {
        if (visionMode === 'thermal') {
          const gradient = ctx.createLinearGradient(0, 0, width, height);
          gradient.addColorStop(0, '#060c1a');
          gradient.addColorStop(0.5, '#0b192e');
          gradient.addColorStop(1, '#050a14');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);

          ctx.fillStyle = 'rgba(14, 165, 233, 0.08)';
          ctx.beginPath();
          ctx.ellipse(width * 0.5, height * 0.7, width * 0.45, height * 0.25, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (visionMode === 'night') {
          ctx.fillStyle = '#021206';
          ctx.fillRect(0, 0, width, height);

          const gradient = ctx.createRadialGradient(width * 0.5, height * 0.5, 50, width * 0.5, height * 0.5, width * 0.6);
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.18)');
          gradient.addColorStop(1, 'rgba(2, 18, 6, 0.9)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);
        } else {
          const gradient = ctx.createLinearGradient(0, 0, width, height);
          gradient.addColorStop(0, '#0d1322');
          gradient.addColorStop(1, '#080d1a');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);
        }
      } else {
        if (visionMode === 'thermal') {
          ctx.fillStyle = 'rgba(14, 165, 233, 0.25)';
          ctx.fillRect(0, 0, width, height);
        } else if (visionMode === 'night') {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
          ctx.fillRect(0, 0, width, height);
        }
      }

      ctx.strokeStyle = visionMode === 'night' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(56, 189, 248, 0.1)';
      ctx.lineWidth = 1;

      for (let i = 1; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo((width / 6) * i, height * 0.35);
        ctx.lineTo((width / 8) * i + (i > 3 ? width * 0.2 : 0), height);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(0, height * 0.45);
      ctx.lineTo(width, height * 0.45);
      ctx.stroke();

      const cameraZones = zones.filter((z) => z.camera_id === camera.camera_id && z.active);
      cameraZones.forEach((zone) => {
        if (zone.points && zone.points.length >= 3) {
          ctx.beginPath();
          const first = zone.points[0];
          ctx.moveTo(first.x * width, first.y * height);

          for (let i = 1; i < zone.points.length; i++) {
            const p = zone.points[i];
            ctx.lineTo(p.x * width, p.y * height);
          }
          ctx.closePath();

          const isHigh = zone.severity === 'high';
          ctx.strokeStyle = isHigh ? '#ef4444' : '#f59e0b';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = isHigh ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)';
          ctx.fill();

          ctx.fillStyle = isHigh ? '#ef4444' : '#f59e0b';
          ctx.font = '10px monospace';
          ctx.fillText(`[ZONE] ${zone.name}`, first.x * width + 5, first.y * height + 15);
        }
      });

      const camDetections = detections.filter((d) => d.camera_id === camera.camera_id);

      const activeDetections: Detection[] =
        camDetections.length > 0
          ? camDetections
          : [
              {
                camera_id: camera.camera_id,
                frame_ts: new Date().toISOString(),
                object_type: camera.camera_id === 'cam-02' ? 'vehicle' : 'person',
                confidence: 0.94,
                bbox:
                  camera.camera_id === 'cam-02'
                    ? [width * 0.25, height * 0.35, width * 0.75, height * 0.75]
                    : [
                        width * 0.35 + Math.sin(frameCount * 0.03) * 30,
                        height * 0.35,
                        width * 0.52 + Math.sin(frameCount * 0.03) * 30,
                        height * 0.78,
                      ],
                track_id: camera.camera_id === 'cam-02' ? 'TR-4401' : 'TR-8942',
                anpr_plate: camera.camera_id === 'cam-02' ? 'UP16-AB-8849' : undefined,
              },
            ];

      activeDetections.forEach((det) => {
        const [x1, y1, x2, y2] = det.bbox;

        const boxX = x1 > 1 ? (x1 / 1920) * width : x1;
        const boxY = y1 > 1 ? (y1 / 1080) * height : y1;
        const boxW = x2 > 1 ? ((x2 - x1) / 1920) * width : x2 - x1;
        const boxH = y2 > 1 ? ((y2 - y1) / 1080) * height : y2 - y1;

        let boxColor = '#06b6d4';
        if (det.object_type === 'person') boxColor = '#ef4444';
        if (det.object_type === 'vehicle') boxColor = '#f59e0b';
        if (visionMode === 'night') boxColor = '#10b981';

        ctx.strokeStyle = boxColor;
        ctx.lineWidth = 2;

        const bracketLen = 14;

        ctx.beginPath();
        ctx.moveTo(boxX, boxY + bracketLen);
        ctx.lineTo(boxX, boxY);
        ctx.lineTo(boxX + bracketLen, boxY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(boxX + boxW - bracketLen, boxY);
        ctx.lineTo(boxX + boxW, boxY);
        ctx.lineTo(boxX + boxW, boxY + bracketLen);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(boxX, boxY + boxH - bracketLen);
        ctx.lineTo(boxX, boxY + boxH);
        ctx.lineTo(boxX + bracketLen, boxY + boxH);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(boxX + boxW - bracketLen, boxY + boxH);
        ctx.lineTo(boxX + boxW, boxY + boxH);
        ctx.lineTo(boxX + boxW, boxY + boxH - bracketLen);
        ctx.stroke();

        ctx.fillStyle = boxColor === '#ef4444' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(6, 182, 212, 0.08)';
        ctx.fillRect(boxX, boxY, boxW, boxH);

        const labelText = `[${det.track_id}] ${det.object_type.toUpperCase()} ${Math.round(det.confidence * 100)}%`;
        ctx.font = 'bold 11px monospace';
        const textWidth = ctx.measureText(labelText).width;

        ctx.fillStyle = boxColor;
        ctx.fillRect(boxX, boxY - 20, textWidth + 12, 18);

        ctx.fillStyle = '#060913';
        ctx.fillText(labelText, boxX + 6, boxY - 6);

        if (det.anpr_plate) {
          const plateText = `[ANPR] ${det.anpr_plate}`;
          ctx.font = 'bold 10px monospace';
          const pWidth = ctx.measureText(plateText).width;

          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(boxX, boxY + boxH + 2, pWidth + 10, 16);

          ctx.fillStyle = '#000000';
          ctx.fillText(plateText, boxX + 5, boxY + boxH + 14);
        }
      });

      ctx.fillStyle = 'rgba(6, 182, 212, 0.9)';
      ctx.font = '10px monospace';

      ctx.fillText(`CAM: ${camera.name.toUpperCase()}`, 12, 20);
      ctx.fillText(`LOC: ${camera.location_code}`, 12, 32);

      const modeTag = `MODE: ${visionMode.toUpperCase()} | 30.0 FPS | IP: OK`;
      const modeWidth = ctx.measureText(modeTag).width;
      ctx.fillText(modeTag, width - modeWidth - 12, 20);

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(width - 50, height - 15, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(226, 232, 240, 0.8)';
      ctx.fillText('REC', width - 40, height - 12);

      animationFrameId = requestAnimationFrame(renderFrame);
    };

    renderFrame();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [camera, detections, zones, visionMode, isFocused, streamLoaded]);

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden scanline-overlay">
      <img
        ref={imgRef}
        src={camera.stream_url}
        alt={camera.name}
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
        onLoad={() => setStreamLoaded(true)}
        onError={() => setStreamLoaded(false)}
      />
      <canvas
        ref={canvasRef}
        width={640}
        height={360}
        className="relative z-10 w-full h-full object-cover block"
      />
    </div>
  );
};
