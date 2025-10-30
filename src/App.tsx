import { useState } from 'react';
import { getCurrentEvent, saveEvent } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import EventForm from '@/components/EventForm';
import TournamentTabs from '@/components/TournamentTabs';
import HalftoneWaves from '@/components/HalftoneWaves';
import BackgroundPaths from '@/components/BackgroundPaths';
import FloatingParticles from '@/components/common/FloatingParticles';
import MiamiGlass from '@/components/common/MiamiGlass';
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
    <div className="min-h-screen bg-gradient-to-br from-miami-navy via-miami-aqua to-miami-orange p-4 md:p-8 relative overflow-hidden">
      {/* Miami Background Effects */}
      <HalftoneWaves />
      <BackgroundPaths />
      <FloatingParticles density={30} speed={1} />
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <header className="mb-6">
          <MiamiGlass variant="foreground" className="rounded-lg p-6">
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
          </MiamiGlass>
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
          <MiamiGlass variant="foreground" className="rounded-lg p-12 text-center">
            <h2 className="text-xl font-semibold mb-2">
              Aucun événement actif
            </h2>
            <p className="text-muted-foreground mb-4">
              Créez un nouvel événement pour commencer à suivre les résultats
            </p>
            <Button variant="miami" onClick={() => setShowEventForm(true)}>
              Créer un événement
            </Button>
          </MiamiGlass>
        )}
      </div>
    </div>
  );
}

export default App;
