import { useState } from 'react';
import { Trash2, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getAllEvents, setCurrentEvent, deleteEvent } from '@/lib/storage';
import type { Event } from '@/types';

interface EventsManagerProps {
  currentEventId: string;
  onEventChange: () => void;
  onNewEventClick: () => void;
}

export default function EventsManager({ currentEventId, onEventChange, onNewEventClick }: EventsManagerProps) {
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const events = getAllEvents();

  const handleSwitchEvent = (eventId: string) => {
    if (eventId !== currentEventId) {
      setCurrentEvent(eventId);
      onEventChange();
      setOpen(false);
    }
  };

  const handleDeleteClick = (eventId: string) => {
    setEventToDelete(eventId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (eventToDelete) {
      deleteEvent(eventToDelete);
      onEventChange();
      setDeleteDialogOpen(false);
      setEventToDelete(null);

      // Close main dialog if no events left
      if (events.length <= 1) {
        setOpen(false);
      }
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="miami-glass-foreground border-miami-aqua/30 text-miami-navy hover:bg-miami-aqua/10">
            Gérer les événements
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] miami-card border-miami-aqua/30">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-miami-aqua to-miami-navy bg-clip-text text-transparent">
                  Événements
                </DialogTitle>
                <DialogDescription className="text-miami-navy/70">
                  Sélectionnez un événement ou supprimez ceux que vous ne souhaitez plus suivre.
                </DialogDescription>
              </div>
              <Button
                variant="miami"
                onClick={() => {
                  setOpen(false);
                  onNewEventClick();
                }}
              >
                Nouvel événement
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {events.length === 0 ? (
              <div className="text-center py-8 text-miami-navy/60">
                Aucun événement créé
              </div>
            ) : (
              events.map((event: Event) => {
                const isCurrent = event.id === currentEventId;
                return (
                  <Card
                    key={event.id}
                    className={`p-4 cursor-pointer transition-all ${
                      isCurrent
                        ? 'bg-gradient-to-r from-miami-aqua/20 to-miami-navy/10 border-miami-aqua/50 shadow-lg'
                        : 'miami-glass-foreground hover:border-miami-aqua/30 hover:shadow-md'
                    }`}
                    onClick={() => handleSwitchEvent(event.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg text-miami-navy">{event.name}</h3>
                          {isCurrent && (
                            <Badge className="bg-miami-aqua text-white">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Actif
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-miami-navy/60 space-y-1">
                          <div>{event.tournaments.length} tournoi(s)</div>
                          <div className="text-xs">
                            Créé le {new Date(event.createdAt).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(event.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="miami-card border-miami-aqua/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-miami-navy">
              Supprimer l'événement ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-miami-navy/70">
              Cette action est irréversible. Tous les tournois et données associés seront supprimés définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-miami-navy/30">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
