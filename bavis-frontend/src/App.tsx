import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { AlertProvider, useAlerts } from './context/AlertContext';
import { ThemeProvider } from './context/ThemeContext';
import { CommandShell } from './components/CommandShell';
import type { ActiveTab } from './components/CommandRail';
import { CommandOverview } from './components/CommandOverview';
import { LiveMatrix } from './components/LiveMatrix';
import { IncidentTimeline } from './components/IncidentTimeline';
import { EventSearch } from './components/EventSearch';
import { ZoneEditor } from './components/ZoneEditor';
import { EvidenceTab } from './components/EvidenceTab';
import { SystemHealthPanel } from './components/SystemHealthPanel';
import { AdminControls } from './components/AdminControls';
import { OperatorsPanel } from './components/OperatorsPanel';
import { AuditLogPanel } from './components/AuditLogPanel';
import { EvidenceViewer } from './components/EvidenceViewer';
import type { Camera, Alert } from './types/bavis';

function MainWorkspace() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [zoneCameraContext, setZoneCameraContext] = useState<Camera | null>(null);
  const [selectedIncidentContext, setSelectedIncidentContext] = useState<Alert | null>(null);
  const [selectedCameraContext, setSelectedCameraContext] = useState<Camera | null>(null);
  const { selectedEvidenceId, setSelectedEvidenceId } = useAlerts();

  const handleOpenZoneEditorForCam = (camera: Camera) => {
    setZoneCameraContext(camera);
    setActiveTab('zones');
  };

  const handleNavigateToIncidents = (alert?: Alert) => {
    if (alert) {
      setSelectedIncidentContext(alert);
    }
    setActiveTab('incidents');
  };

  const handleNavigateToMatrix = (camera?: Camera) => {
    if (camera) {
      setSelectedCameraContext(camera);
    }
    setActiveTab('matrix');
  };

  return (
    <CommandShell activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'overview' && (
        <CommandOverview
          onNavigateToCameraMatrix={handleNavigateToMatrix}
          onNavigateToIncidents={handleNavigateToIncidents}
          onOpenZoneEditorForCam={handleOpenZoneEditorForCam}
        />
      )}

      {activeTab === 'matrix' && (
        <LiveMatrix
          onOpenZoneEditor={handleOpenZoneEditorForCam}
          selectedCameraContext={selectedCameraContext}
        />
      )}

      {activeTab === 'incidents' && (
        <IncidentTimeline initialSelectedAlert={selectedIncidentContext} />
      )}

      {activeTab === 'search' && <EventSearch />}

      {activeTab === 'zones' && (
        <ZoneEditor initialCamera={zoneCameraContext} />
      )}

      {activeTab === 'evidence' && <EvidenceTab />}

      {activeTab === 'health' && <SystemHealthPanel />}

      {activeTab === 'admin' && <AdminControls />}

      {activeTab === 'operators' && <OperatorsPanel />}

      {activeTab === 'audit' && <AuditLogPanel />}

      {selectedEvidenceId && (
        <EvidenceViewer
          evidenceId={selectedEvidenceId}
          onClose={() => setSelectedEvidenceId(null)}
        />
      )}
    </CommandShell>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AlertProvider>
          <MainWorkspace />
        </AlertProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
