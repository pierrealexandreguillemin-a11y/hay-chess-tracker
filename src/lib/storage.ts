import type { Event, StorageData, ValidationState } from '@/types';

const STORAGE_KEY = 'hay-chess-tracker';

// Get all storage data
export function getStorageData(): StorageData {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return {
        currentEventId: '',
        events: [],
        validations: {},
      };
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return {
      currentEventId: '',
      events: [],
      validations: {},
    };
  }
}

// Save all storage data
export function setStorageData(data: StorageData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error writing to localStorage:', error);
    throw new Error('Failed to save data. Storage might be full.');
  }
}

// Get all events
export function getAllEvents(): Event[] {
  const data = getStorageData();
  return data.events;
}

// Get current event
export function getCurrentEvent(): Event | null {
  const data = getStorageData();
  if (!data.currentEventId) return null;
  return data.events.find(e => e.id === data.currentEventId) || null;
}

// Set current event (switch between events)
export function setCurrentEvent(eventId: string): void {
  const data = getStorageData();
  const event = data.events.find(e => e.id === eventId);

  if (!event) {
    throw new Error(`Event with id ${eventId} not found`);
  }

  data.currentEventId = eventId;
  setStorageData(data);
}

// Save event
export function saveEvent(event: Event): void {
  const data = getStorageData();
  const existingIndex = data.events.findIndex(e => e.id === event.id);

  if (existingIndex >= 0) {
    data.events[existingIndex] = event;
  } else {
    data.events.push(event);
  }

  data.currentEventId = event.id;
  setStorageData(data);
}

// Delete event
export function deleteEvent(eventId: string): void {
  const data = getStorageData();
  data.events = data.events.filter(e => e.id !== eventId);

  if (data.currentEventId === eventId) {
    data.currentEventId = data.events[0]?.id || '';
  }

  // Clean up validations for this event
  const event = data.events.find(e => e.id === eventId);
  if (event) {
    event.tournaments.forEach(t => {
      delete data.validations[t.id];
    });
  }

  setStorageData(data);
}

// Get validation state
export function getValidationState(): ValidationState {
  const data = getStorageData();
  return data.validations;
}

// Set validation for a player/round
export function setValidation(
  tournamentId: string,
  playerName: string,
  round: number,
  isValid: boolean
): void {
  const data = getStorageData();

  if (!data.validations[tournamentId]) {
    data.validations[tournamentId] = {};
  }

  if (!data.validations[tournamentId][playerName]) {
    data.validations[tournamentId][playerName] = {};
  }

  data.validations[tournamentId][playerName][`round_${round}`] = isValid;
  setStorageData(data);
}

// Get validation for a player/round
export function getValidation(
  tournamentId: string,
  playerName: string,
  round: number
): boolean {
  const data = getStorageData();
  return data.validations[tournamentId]?.[playerName]?.[`round_${round}`] || false;
}

// Clear all data
export function clearAllData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
}

// Export data as JSON (for backup)
export function exportData(): string {
  const data = getStorageData();
  return JSON.stringify(data, null, 2);
}

// Import data from JSON (for restore)
export function importData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString) as StorageData;
    setStorageData(data);
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
}

// ========================================
// TOURNAMENT CRUD OPERATIONS
// ========================================

/**
 * Get all tournaments across all events
 */
export function getAllTournaments() {
  const data = getStorageData();
  return data.events.flatMap(event =>
    event.tournaments.map(tournament => ({
      ...tournament,
      eventId: event.id,
      eventName: event.name,
    }))
  );
}

/**
 * Get tournaments for a specific event
 */
export function getTournamentsByEvent(eventId: string) {
  const data = getStorageData();
  const event = data.events.find(e => e.id === eventId);
  return event?.tournaments || [];
}

/**
 * Get a single tournament by ID
 */
export function getTournamentById(tournamentId: string) {
  const data = getStorageData();
  for (const event of data.events) {
    const tournament = event.tournaments.find(t => t.id === tournamentId);
    if (tournament) {
      return {
        ...tournament,
        eventId: event.id,
        eventName: event.name,
      };
    }
  }
  return null;
}

/**
 * Create a new tournament in an event
 */
export function createTournament(
  eventId: string,
  tournament: Omit<import('@/types').Tournament, 'id' | 'lastUpdate' | 'players'>
) {
  const data = getStorageData();
  const event = data.events.find(e => e.id === eventId);

  if (!event) {
    throw new Error(`Event with id ${eventId} not found`);
  }

  const newTournament: import('@/types').Tournament = {
    id: `tournament_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: tournament.name,
    url: tournament.url,
    lastUpdate: new Date().toISOString(),
    players: [],
  };

  event.tournaments.push(newTournament);
  setStorageData(data);

  return newTournament;
}

/**
 * Update an existing tournament
 */
export function updateTournament(
  tournamentId: string,
  updates: Partial<Omit<import('@/types').Tournament, 'id'>>
) {
  const data = getStorageData();

  for (const event of data.events) {
    const tournamentIndex = event.tournaments.findIndex(t => t.id === tournamentId);

    if (tournamentIndex >= 0) {
      event.tournaments[tournamentIndex] = {
        ...event.tournaments[tournamentIndex],
        ...updates,
        lastUpdate: new Date().toISOString(),
      };

      setStorageData(data);
      return event.tournaments[tournamentIndex];
    }
  }

  throw new Error(`Tournament with id ${tournamentId} not found`);
}

/**
 * Delete a tournament
 */
export function deleteTournament(tournamentId: string): boolean {
  const data = getStorageData();

  for (const event of data.events) {
    const initialLength = event.tournaments.length;
    event.tournaments = event.tournaments.filter(t => t.id !== tournamentId);

    if (event.tournaments.length < initialLength) {
      // Clean up validations for this tournament
      delete data.validations[tournamentId];

      setStorageData(data);
      return true;
    }
  }

  return false;
}

/**
 * Update tournament players (typically after parsing FFE data)
 */
export function updateTournamentPlayers(
  tournamentId: string,
  players: import('@/types').Player[]
) {
  return updateTournament(tournamentId, { players });
}

/**
 * Search tournaments by name
 */
export function searchTournaments(query: string) {
  const allTournaments = getAllTournaments();
  const lowerQuery = query.toLowerCase();

  return allTournaments.filter(tournament =>
    tournament.name.toLowerCase().includes(lowerQuery) ||
    tournament.eventName.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get tournament statistics
 */
export function getTournamentStats(tournamentId: string) {
  const tournament = getTournamentById(tournamentId);

  if (!tournament) {
    return null;
  }

  const totalPlayers = tournament.players.length;
  const hayChessPlayers = tournament.players.filter(p =>
    p.club.toLowerCase().includes('hay chess')
  );

  const totalPoints = hayChessPlayers.reduce((sum, p) => sum + p.currentPoints, 0);
  const averagePoints = totalPlayers > 0 ? totalPoints / hayChessPlayers.length : 0;

  const validatedRounds = tournament.players.flatMap(p =>
    p.validated.map((v, i) => ({ player: p.name, round: i + 1, validated: v }))
  ).filter(v => v.validated);

  return {
    tournamentId: tournament.id,
    tournamentName: tournament.name,
    eventName: tournament.eventName,
    totalPlayers,
    hayChessPlayerCount: hayChessPlayers.length,
    totalPoints,
    averagePoints: Math.round(averagePoints * 100) / 100,
    lastUpdate: tournament.lastUpdate,
    validatedRoundsCount: validatedRounds.length,
  };
}
