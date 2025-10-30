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

// Get current event
export function getCurrentEvent(): Event | null {
  const data = getStorageData();
  if (!data.currentEventId) return null;
  return data.events.find(e => e.id === data.currentEventId) || null;
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
