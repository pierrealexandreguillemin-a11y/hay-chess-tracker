import { Badge } from '@/components/ui/badge';
import { calculateClubStats } from '@/lib/parser';
import type { Player } from '@/types';

interface ClubStatsProps {
  players: Player[];
  currentRound: number;
}

export default function ClubStats({ players, currentRound }: ClubStatsProps) {
  const stats = calculateClubStats(players, currentRound);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-semibold">
          📊 Stats Club - Ronde {stats.round}
        </h3>
        <Badge variant="info">{players.length} joueurs</Badge>
      </div>

      <div className="flex gap-6 text-sm">
        <div>
          <span className="text-muted-foreground">Score total: </span>
          <span className="font-semibold">
            {stats.totalPoints} points
          </span>
        </div>

        <div>
          <span className="text-muted-foreground">Moyenne: </span>
          <span className="font-semibold">
            {stats.averagePoints} pts/joueur
          </span>
        </div>
      </div>
    </div>
  );
}
