import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getCurrentEvent, saveEvent, decodeEventFromURL, importEvent } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import EventForm from '@/components/EventForm';
import TournamentTabs from '@/components/TournamentTabs';
import EventsManager from '@/components/EventsManager';
import ShareButton from '@/components/ShareButton';
import HalftoneWaves from '@/components/HalftoneWaves';
import BackgroundPaths from '@/components/BackgroundPaths';
import FloatingParticles from '@/components/common/FloatingParticles';
import DuplicateEventDialog from '@/components/DuplicateEventDialog';
import { Toaster } from 'sonner';
// MiamiGlass removed - using .miami-glass-foreground class directly
import type { Event } from '@/types';
import type { ExportedEvent } from '@/lib/storage';

function App() {
  // Load current event on mount using lazy initialization
  const [currentEvent, setCurrentEvent] = useState<Event | null>(() => getCurrentEvent());
  const [showEventForm, setShowEventForm] = useState(() => !getCurrentEvent());
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<ExportedEvent | null>(null);

  // Check for shared event in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareParam = params.get('share');

    if (shareParam) {
      // Decode event from URL
      const exportedData = decodeEventFromURL(shareParam);

      if (exportedData) {
        // Check for duplicates
        const isDuplicate = exportedData.event && getCurrentEvent()?.id === exportedData.event.id;

        if (isDuplicate) {
          setPendingImport(exportedData);
          setDuplicateDialogOpen(true);
        } else {
          // Import directly
          const result = importEvent(exportedData);
          if (result.success) {
            toast.success(`Événement "${exportedData.event.name}" importé avec succès !`);
            setCurrentEvent(getCurrentEvent());
            setShowEventForm(false);
          } else {
            toast.error('Erreur lors de l\'import de l\'événement partagé');
          }
        }

        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
      } else {
        toast.error('Lien de partage invalide');
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, []);

  const handleEventCreated = (event: Event) => {
    saveEvent(event);
    setCurrentEvent(event);
    setShowEventForm(false);
  };

  const handleEventChange = () => {
    setCurrentEvent(getCurrentEvent());
    setShowEventForm(false);
  };

  const handleDuplicateReplace = () => {
    if (!pendingImport) return;

    const result = importEvent(pendingImport, { replaceIfExists: true });
    if (result.success) {
      toast.success(`Événement "${pendingImport.event.name}" remplacé avec succès !`);
      setCurrentEvent(getCurrentEvent());
      setShowEventForm(false);
    }

    setDuplicateDialogOpen(false);
    setPendingImport(null);
  };

  const handleDuplicateKeepBoth = () => {
    if (!pendingImport) return;

    const result = importEvent(pendingImport, { replaceIfExists: false, generateNewId: true });
    if (result.success) {
      toast.success(`Copie de "${pendingImport.event.name}" créée avec succès !`);
      setCurrentEvent(getCurrentEvent());
      setShowEventForm(false);
    }

    setDuplicateDialogOpen(false);
    setPendingImport(null);
  };

  const handleDuplicateCancel = () => {
    setDuplicateDialogOpen(false);
    setPendingImport(null);
    toast.info('Import annulé');
  };

  return (
    <div className="min-h-screen p-4 md:p-8 relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #008E97 0%, #013369 25%, #013369 75%, #008E97 100%)'
    }}>
      {/* Toast Notifications */}
      <Toaster position="top-right" richColors />
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
            <div className="flex items-center gap-2">
              <ShareButton />
              <EventsManager
                currentEventId={currentEvent?.id || ''}
                onEventChange={handleEventChange}
                onNewEventClick={() => setShowEventForm(true)}
              />
            </div>
          </div>
          </div>
        </header>

        {/* Event Form */}
        {showEventForm && (
          <div className="mb-6">
            <EventForm
              onEventCreated={handleEventCreated}
              onCancel={() => setShowEventForm(false)}
            />
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

        {/* Duplicate Event Dialog (for URL imports) */}
        <DuplicateEventDialog
          open={duplicateDialogOpen}
          eventName={pendingImport?.event.name || ''}
          onReplace={handleDuplicateReplace}
          onKeepBoth={handleDuplicateKeepBoth}
          onCancel={handleDuplicateCancel}
        />
      </div>
    </div>
  );
}

export default App;
