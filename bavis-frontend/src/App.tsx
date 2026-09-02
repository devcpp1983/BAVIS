import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { AlertProvider } from './context/AlertContext';
import { Header } from './components/Header';
import { LiveMatrix } from './components/LiveMatrix';
import { ZoneEditor } from './components/ZoneEditor';
import { IncidentTimeline } from './components/IncidentTimeline';
import { EventSearch } from './components/EventSearch';
import { AdminControls } from './components/AdminControls';
import { DemoControlWidget } from './components/DemoControlWidget';
import type { Camera } from './types/bavis';

export function App() {
  const [activeTab, setActiveTab] = useState<'matrix' | 'zones' | 'timeline' | 'search' | 'admin'>('matrix');
  const [zoneCameraContext, setZoneCameraContext] = useState<Camera | null>(null);

  const handleOpenZoneEditorForCam = (camera: Camera) => {
    setZoneCameraContext(camera);
    setActiveTab('zones');
  };

  return (
    <AuthProvider>
      <AlertProvider>
        <div className="min-h-screen bg-radar-grid text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
          <Header activeTab={activeTab} setActiveTab={setActiveTab} />

          <main className="flex-1 overflow-hidden">
            {activeTab === 'matrix' && (
              <LiveMatrix onOpenZoneEditor={handleOpenZoneEditorForCam} />
            )}
            {activeTab === 'zones' && (
              <ZoneEditor initialCamera={zoneCameraContext} />
            )}
            {activeTab === 'timeline' && <IncidentTimeline />}
            {activeTab === 'search' && <EventSearch />}
            {activeTab === 'admin' && <AdminControls />}
          </main>

          <DemoControlWidget />
        </div>
      </AlertProvider>
    </AuthProvider>
  );
}

export default App;
