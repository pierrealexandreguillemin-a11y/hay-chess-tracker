import { useState } from 'react';
import { getCurrentEvent, saveEvent } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import EventForm from '@/components/EventForm';
import TournamentTabs from '@/components/TournamentTabs';
import HalftoneWaves from '@/components/HalftoneWaves';
import BackgroundPaths from '@/components/BackgroundPaths';
import FloatingParticles from '@/components/common/FloatingParticles';
// MiamiGlass removed - using .miami-glass-foreground class directly
import type { Event } from '@/types';

function App() {
  // Load current event on mount using lazy initialization
  const [currentEvent, setCurrentEvent] = useState<Event | null>(() => getCurrentEvent());
  const [showEventForm, setShowEventForm] = useState(() => !getCurrentEvent());

  const handleEventCreated = (event: Event) => {
    saveEvent(event);
    setCurrentEvent(event);
    setShowEventForm(false);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #008E97 0%, #013369 25%, #013369 75%, #008E97 100%)'
    }}>
      {/* Miami Background Effects */}
      <HalftoneWaves />
      <BackgroundPaths />
      <FloatingParticles density={30} speed={1} />
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <header className="mb-6">
          <div className="rounded-lg p-6" style={{
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(15px) saturate(130%)',
            WebkitBackdropFilter: 'blur(15px) saturate(130%)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 16px rgba(0,0,0,0.15)'
          }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-miami-aqua to-miami-navy bg-clip-text text-transparent">
                HAY CHESS TRACKER
              </h1>
              {currentEvent && (
                <p className="text-sm text-muted-foreground mt-1">
                  {currentEvent.name}
                </p>
              )}
            </div>
            <Button
              variant="miami"
              onClick={() => setShowEventForm(!showEventForm)}
            >
              {showEventForm ? 'Annuler' : 'Nouvel événement'}
            </Button>
          </div>
          </div>
        </header>

        {/* Event Form */}
        {showEventForm && (
          <div className="mb-6">
            <EventForm onEventCreated={handleEventCreated} />
          </div>
        )}

        {/* Tournament Tabs */}
        {currentEvent && !showEventForm && (
          <TournamentTabs event={currentEvent} onEventUpdate={setCurrentEvent} />
        )}

        {/* Empty State */}
        {!currentEvent && !showEventForm && (
          <div className="rounded-lg p-12 text-center" style={{
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(15px) saturate(130%)',
            WebkitBackdropFilter: 'blur(15px) saturate(130%)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 16px rgba(0,0,0,0.15)'
          }}>
            <h2 className="text-xl font-semibold mb-2">
              Aucun événement actif
            </h2>
            <p className="text-muted-foreground mb-4">
              Créez un nouvel événement pour commencer à suivre les résultats
            </p>
            <Button variant="miami" onClick={() => setShowEventForm(true)}>
              Créer un événement
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
