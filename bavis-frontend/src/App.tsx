import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { AlertProvider } from './context/AlertContext';
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
import { DemoControlWidget } from './components/DemoControlWidget';
import type { Camera } from './types/bavis';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [zoneCameraContext, setZoneCameraContext] = useState<Camera | null>(null);

  const handleOpenZoneEditorForCam = (camera: Camera) => {
    setZoneCameraContext(camera);
    setActiveTab('zones');
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <AlertProvider>
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

            <DemoControlWidget />
          </CommandShell>
        </AlertProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
