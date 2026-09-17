import React, { useEffect, useRef, useState } from 'react';
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
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [videoLoaded, setVideoLoaded] = useState<boolean>(false);
  const [imgLoaded, setImgLoaded] = useState<boolean>(false);

  const visionMode = activeVisionMode || camera.vision_mode;

  const getEffectiveVideoSrc = (cam: Camera): string => {
    if (cam.stream_url && cam.stream_url.startsWith('/videos/')) {
      return cam.stream_url;
    }
    if (cam.camera_id === 'CAM-BOP-02' || cam.camera_id === 'cam-02') return '/videos/cam2.mp4';
    if (cam.camera_id === 'CAM-CHECKPOST-01' || cam.camera_id === 'cam-03') return '/videos/cam3.mp4';
    if (cam.camera_id === 'CAM-ROAD-NORTH' || cam.camera_id === 'cam-04') return '/videos/cam4.mp4';
    return '/videos/cam1.mp4';
  };

  const videoSrc = getEffectiveVideoSrc(camera);

  useEffect(() => {
    setVideoLoaded(false);
    setImgLoaded(false);
  }, [camera.stream_url, videoSrc]);

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

      // 1. Video Frame or Image or Synthetic Background Rendering
      if (videoRef.current && videoLoaded) {
        try {
          ctx.drawImage(videoRef.current, 0, 0, width, height);
        } catch {
          // Fallback if video draw fails
        }
      } else if (imgRef.current && imgLoaded) {
        try {
          ctx.drawImage(imgRef.current, 0, 0, width, height);
        } catch {
          // Fallback
        }
      } else {
        // High-Tech Tactical Synthetic Background
        if (visionMode === 'thermal') {
          const gradient = ctx.createLinearGradient(0, 0, width, height);
          gradient.addColorStop(0, '#040810');
          gradient.addColorStop(0.5, '#071220');
          gradient.addColorStop(1, '#03060c');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);

          // Thermal Heat Signature Blobs
          ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
          ctx.beginPath();
          ctx.ellipse(width * 0.5, height * 0.7, width * 0.4, height * 0.2, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (visionMode === 'night') {
          ctx.fillStyle = '#021206';
          ctx.fillRect(0, 0, width, height);

          const gradient = ctx.createRadialGradient(width * 0.5, height * 0.5, 50, width * 0.5, height * 0.5, width * 0.6);
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.15)');
          gradient.addColorStop(1, 'rgba(2, 18, 6, 0.95)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);
        } else {
          const gradient = ctx.createLinearGradient(0, 0, width, height);
          gradient.addColorStop(0, '#080d16');
          gradient.addColorStop(1, '#05080e');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);
        }

        // Draw Perspective Radar Lines
        ctx.strokeStyle = visionMode === 'night' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(6, 182, 212, 0.1)';
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
      }

      // 2. Vision Mode Tint Overlays
      if (visionMode === 'thermal') {
        ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
        ctx.fillRect(0, 0, width, height);
      } else if (visionMode === 'night') {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
        ctx.fillRect(0, 0, width, height);
      }

      // 3. Render Virtual Fence Restricted Zones
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
          ctx.lineWidth = 1.8;
          ctx.setLineDash([6, 4]);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = isHigh ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)';
          ctx.fill();

          ctx.fillStyle = isHigh ? '#ef4444' : '#f59e0b';
          ctx.font = 'bold 10px monospace';
          ctx.fillText(`[ZONE] ${zone.name.toUpperCase()}`, first.x * width + 4, first.y * height + 14);
        }
      });

      // 4. Render AI Detections (Person Tracking, Vehicle ANPR, Face Markers)
      const camDetections = detections.filter((d) => d.camera_id === camera.camera_id);
      const activeDetections: Detection[] = camDetections;

      activeDetections.forEach((det) => {
        const [x1, y1, x2, y2] = det.bbox;
        const boxX = (x1 > 1 ? x1 / 640 : x1) * width;
        const boxY = (y1 > 1 ? y1 / 360 : y1) * height;
        const boxW = Math.max(((x2 > 1 ? x2 / 640 : x2) - (x1 > 1 ? x1 / 640 : x1)) * width, 12);
        const boxH = Math.max(((y2 > 1 ? y2 / 360 : y2) - (y1 > 1 ? y1 / 360 : y1)) * height, 12);

        let boxColor = '#06b6d4';
        if (det.object_type === 'person') boxColor = '#ef4444';
        if (det.object_type === 'vehicle') boxColor = '#f59e0b';
        if (det.object_type === 'face') boxColor = '#10b981';
        if (visionMode === 'night') boxColor = '#10b981';

        ctx.strokeStyle = boxColor;
        ctx.lineWidth = 2;

        const bracketLen = 12;

        // Tactical Corner Bracket Bounding Box
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

        // Monospace Detection Label Box
        const labelText = `${det.object_type.toUpperCase()} #${det.track_id} (${Math.round(det.confidence * 100)}%)`;
        ctx.font = 'bold 10px monospace';
        const textWidth = ctx.measureText(labelText).width;

        ctx.fillStyle = boxColor;
        ctx.fillRect(boxX, Math.max(0, boxY - 16), textWidth + 8, 16);

        ctx.fillStyle = '#060a0f';
        ctx.fillText(labelText, boxX + 4, Math.max(12, boxY - 4));

        // License Plate Tag (ANPR)
        if (det.anpr_plate) {
          const plateText = `PLATE: ${det.anpr_plate}`;
          ctx.font = 'bold 10px monospace';
          const pWidth = ctx.measureText(plateText).width;

          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(boxX, boxY + boxH + 2, pWidth + 8, 16);

          ctx.fillStyle = '#000000';
          ctx.fillText(plateText, boxX + 4, boxY + boxH + 14);
        }
      });

      // 5. Technical Telemetry HUD Overlay Text
      ctx.fillStyle = 'rgba(6, 182, 212, 0.95)';
      ctx.font = 'bold 10px monospace';

      ctx.fillText(`CAM: ${camera.name.toUpperCase()}`, 10, 18);
      ctx.fillText(`LOC: ${camera.location_code}`, 10, 30);

      const nightStatus = visionMode === 'night' ? 'NIGHT ENHANCE: ON' : `MODE: ${visionMode.toUpperCase()}`;
      const modeTag = `[${nightStatus}] 30 FPS`;
      const modeWidth = ctx.measureText(modeTag).width;
      ctx.fillStyle = visionMode === 'night' ? '#10b981' : '#06b6d4';
      ctx.fillText(modeTag, width - modeWidth - 10, 18);

      // REC Live Pulsing Dot
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(width - 45, height - 14, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(226, 232, 240, 0.9)';
      ctx.fillText('LIVE', width - 36, height - 11);

      animationFrameId = requestAnimationFrame(renderFrame);
    };

    renderFrame();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [camera, detections, zones, visionMode, isFocused, videoLoaded, imgLoaded]);

  return (
    <div className="relative w-full h-full bg-[#060a0f] overflow-hidden scanline-overlay">
      {/* Hidden HTML5 Video element for playing custom MP4 files */}
      <video
        ref={videoRef}
        src={videoSrc}
        className="hidden"
        autoPlay
        loop
        muted
        playsInline
        onLoadedData={() => setVideoLoaded(true)}
        onError={() => setVideoLoaded(false)}
      />

      {/* Hidden HTML5 Image fallback */}
      {camera.stream_url && !videoLoaded && (
        <img
          ref={imgRef}
          src={camera.stream_url}
          alt={camera.name}
          className="hidden"
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgLoaded(false)}
        />
      )}

      {/* Canvas Overlay */}
      <canvas
        ref={canvasRef}
        width={640}
        height={360}
        className="relative z-10 w-full h-full object-cover block"
      />
    </div>
  );
};

