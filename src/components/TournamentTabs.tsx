import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import ClubStats from '@/components/ClubStats';
import PlayerTable from '@/components/PlayerTable';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { parseFFePages, getListUrl } from '@/lib/parser';
import { saveEvent } from '@/lib/storage';
import type { Event, Tournament } from '@/types';

interface TournamentTabsProps {
  event: Event;
  onEventUpdate: (event: Event) => void;
}

export default function TournamentTabs({ event, onEventUpdate }: TournamentTabsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = async (tournament: Tournament) => {
    setLoading(tournament.id);
    setError(null);

    try {
      // FFE requires 2 pages: List (Ls) for clubs + Results (Ga) for data
      const listUrl = getListUrl(tournament.url);

      // Fetch both pages in parallel
      const [responseList, responseResults] = await Promise.all([
        fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: listUrl }),
        }),
        fetch('/api/scrape', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: tournament.url }),
        }),
      ]);

      if (!responseList.ok || !responseResults.ok) {
        throw new Error('Erreur lors du chargement des résultats FFE');
      }

      const [dataList, dataResults] = await Promise.all([
        responseList.json(),
        responseResults.json(),
      ]);

      // Parse both HTML pages
      const { players } = parseFFePages(
        dataList.html,
        dataResults.html
      );

      // Update tournament
      const updatedTournament: Tournament = {
        ...tournament,
        players,
        lastUpdate: new Date().toISOString(),
      };

      // Update event
      const updatedEvent: Event = {
        ...event,
        tournaments: event.tournaments.map(t =>
          t.id === tournament.id ? updatedTournament : t
        ),
      };

      // Save to storage
      saveEvent(updatedEvent);
      onEventUpdate(updatedEvent);
    } catch (err) {
      console.error('Error refreshing tournament:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(null);
    }
  };

  return (
    <Tabs defaultValue={event.tournaments[0]?.id} className="w-full">
      <TabsList className="miami-glass-foreground">
        {event.tournaments.map(tournament => (
          <TabsTrigger key={tournament.id} value={tournament.id}>
            {tournament.name}
          </TabsTrigger>
        ))}
      </TabsList>

      {event.tournaments.map(tournament => (
        <TabsContent key={tournament.id} value={tournament.id} className="space-y-4">
          {/* Stats and Refresh */}
          <Card className="miami-card">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {tournament.players.length > 0 && (
                  <ClubStats
                    players={tournament.players}
                    currentRound={tournament.players[0]?.results.length || 1}
                  />
                )}
                {tournament.players.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Aucune donnée. Cliquez sur Actualiser pour charger les résultats.
                  </p>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRefresh(tournament)}
                disabled={loading === tournament.id}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading === tournament.id ? 'animate-spin' : ''}`}
                />
                Actualiser
              </Button>
            </div>

            {tournament.lastUpdate && (
              <p className="text-xs text-muted-foreground mt-2">
                Dernière mise à jour :{' '}
                {new Date(tournament.lastUpdate).toLocaleString('fr-FR')}
              </p>
            )}
          </Card>

          {/* Error Message */}
          {error && loading === null && (
            <Card className="bg-red-50 border-red-200 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </Card>
          )}

          {/* Player Table */}
          {tournament.players.length > 0 && (
            <PlayerTable tournament={tournament} />
          )}

          {/* Empty State */}
          {tournament.players.length === 0 && !loading && (
            <Card className="miami-card text-center py-8">
              <p className="text-muted-foreground">
                Aucun joueur Hay Chess trouvé dans ce tournoi
              </p>
            </Card>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}
