-- BAVIS Database Schema Initialization Script (Workstream D)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cameras Table
CREATE TABLE IF NOT EXISTS cameras (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    location VARCHAR(256) NOT NULL,
    rtsp_url VARCHAR(512) NOT NULL,
    status VARCHAR(32) DEFAULT 'active',
    resolution VARCHAR(32) DEFAULT '1080p',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Detections Table
CREATE TABLE IF NOT EXISTS detections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    camera_id VARCHAR(64) REFERENCES cameras(id) ON DELETE CASCADE,
    frame_ts TIMESTAMP WITH TIME ZONE NOT NULL,
    object_type VARCHAR(64) NOT NULL,
    confidence FLOAT NOT NULL,
    bbox JSONB NOT NULL,
    track_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Virtual Zones & Fences Table
CREATE TABLE IF NOT EXISTS zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    camera_id VARCHAR(64) REFERENCES cameras(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    zone_type VARCHAR(64) NOT NULL, -- e.g., virtual_fence, restricted_area
    polygon_coords JSONB NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Alerts / Events Table
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id VARCHAR(128) NOT NULL UNIQUE,
    camera_id VARCHAR(64) REFERENCES cameras(id) ON DELETE CASCADE,
    severity VARCHAR(32) NOT NULL, -- low, medium, high, critical
    rule VARCHAR(128) NOT NULL, -- e.g., virtual_fence_breach, night_movement
    status VARCHAR(32) DEFAULT 'new', -- new, acknowledged, resolved
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    acknowledged_by VARCHAR(128),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    evidence_ref VARCHAR(512)
);

-- Evidence Media Storage Table
CREATE TABLE IF NOT EXISTS evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
    camera_id VARCHAR(64) REFERENCES cameras(id) ON DELETE CASCADE,
    file_path VARCHAR(512) NOT NULL,
    media_type VARCHAR(32) NOT NULL, -- snapshot, video_clip
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs Table (Security & RBAC compliance)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(128) NOT NULL,
    user_role VARCHAR(64) NOT NULL,
    action VARCHAR(128) NOT NULL,
    resource VARCHAR(256) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Demo Cameras
INSERT INTO cameras (id, name, location, rtsp_url, status) VALUES
    ('cam_bop_01', 'North Gate Fence', 'Sector 4 - BOP Alpha', 'rtsp://ingestion:8001/stream/cam_01', 'active'),
    ('cam_bop_02', 'East Checkpoint', 'Sector 4 - Checkpost Bravo', 'rtsp://ingestion:8001/stream/cam_02', 'active'),
    ('cam_bop_03', 'Perimeter Road', 'Sector 4 - Border Road South', 'rtsp://ingestion:8001/stream/cam_03', 'active')
ON CONFLICT (id) DO NOTHING;

-- Seed Initial Virtual Zone
INSERT INTO zones (camera_id, name, zone_type, polygon_coords, active) VALUES
    ('cam_bop_01', 'Restricted Border Zone A', 'virtual_fence', '[{"x": 100, "y": 200}, {"x": 500, "y": 200}, {"x": 500, "y": 600}, {"x": 100, "y": 600}]'::jsonb, true)
ON CONFLICT DO NOTHING;
