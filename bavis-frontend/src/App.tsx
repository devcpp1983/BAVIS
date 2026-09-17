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
import { SystemHealthPanel } from './components/SystemHealthPanel';
import { AdminControls } from './components/AdminControls';
import { EvidenceViewer } from './components/EvidenceViewer';
import { DemoControlWidget } from './components/DemoControlWidget';
import type { Camera } from './types/bavis';

function MainWorkspace() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [zoneCameraContext, setZoneCameraContext] = useState<Camera | null>(null);
  const { selectedEvidenceId, setSelectedEvidenceId } = useAlerts();

  const handleOpenZoneEditorForCam = (camera: Camera) => {
    setZoneCameraContext(camera);
    setActiveTab('zones');
  };

  return (
    <CommandShell activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'overview' && (
        <CommandOverview
          onNavigateToCameraMatrix={() => setActiveTab('matrix')}
          onNavigateToIncidents={() => setActiveTab('incidents')}
          onOpenZoneEditorForCam={handleOpenZoneEditorForCam}
        />
      )}

      {activeTab === 'matrix' && (
        <LiveMatrix onOpenZoneEditor={handleOpenZoneEditorForCam} />
      )}

      {activeTab === 'incidents' && <IncidentTimeline />}

      {activeTab === 'search' && <EventSearch />}

      {activeTab === 'zones' && (
        <ZoneEditor initialCamera={zoneCameraContext} />
      )}

      {activeTab === 'health' && <SystemHealthPanel />}

      {activeTab === 'admin' && <AdminControls />}

      {selectedEvidenceId && (
        <EvidenceViewer
          evidenceId={selectedEvidenceId}
          onClose={() => setSelectedEvidenceId(null)}
        />
      )}

      <DemoControlWidget />
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
