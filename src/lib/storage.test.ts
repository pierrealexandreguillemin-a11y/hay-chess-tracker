import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getStorageData,
  setStorageData,
  getCurrentEvent,
  saveEvent,
  deleteEvent,
  getValidationState,
  setValidation,
  getValidation,
  clearAllData,
  exportData,
  importData,
} from './storage';
import type { Event, StorageData } from '@/types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('storage.ts', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('getStorageData', () => {
    it('returns default data when localStorage is empty', () => {
      const data = getStorageData();

      expect(data).toEqual({
        currentEventId: '',
        events: [],
        validations: {},
      });
    });

    it('returns parsed data from localStorage', () => {
      const mockData: StorageData = {
        currentEventId: 'event-1',
        events: [
          {
            id: 'event-1',
            name: 'Test Event',
            tournaments: [],
          },
        ],
        validations: {},
      };

      localStorage.setItem('hay-chess-tracker', JSON.stringify(mockData));

      const data = getStorageData();
      expect(data).toEqual(mockData);
    });

    it('handles corrupted JSON gracefully', () => {
      localStorage.setItem('hay-chess-tracker', 'invalid json{');

      const data = getStorageData();

      expect(data).toEqual({
        currentEventId: '',
        events: [],
        validations: {},
      });
    });
  });

  describe('setStorageData', () => {
    it('saves data to localStorage', () => {
      const data: StorageData = {
        currentEventId: 'event-1',
        events: [
          {
            id: 'event-1',
            name: 'Test Event',
            tournaments: [],
          },
        ],
        validations: {},
      };

      setStorageData(data);

      const saved = JSON.parse(localStorage.getItem('hay-chess-tracker')!);
      expect(saved).toEqual(data);
    });
  });

  describe('getCurrentEvent', () => {
    it('returns null when no current event', () => {
      const event = getCurrentEvent();
      expect(event).toBeNull();
    });

    it('returns the current event', () => {
      const mockEvent: Event = {
        id: 'event-1',
        name: 'Test Event',
        tournaments: [],
      };

      const data: StorageData = {
        currentEventId: 'event-1',
        events: [mockEvent],
        validations: {},
      };

      setStorageData(data);

      const event = getCurrentEvent();
      expect(event).toEqual(mockEvent);
    });

    it('returns null when current event not found in events', () => {
      const data: StorageData = {
        currentEventId: 'nonexistent',
        events: [],
        validations: {},
      };

      setStorageData(data);

      const event = getCurrentEvent();
      expect(event).toBeNull();
    });
  });

  describe('saveEvent', () => {
    it('adds new event and sets it as current', () => {
      const event: Event = {
        id: 'event-1',
        name: 'New Event',
        tournaments: [],
      };

      saveEvent(event);

      const data = getStorageData();
      expect(data.events).toHaveLength(1);
      expect(data.events[0]).toEqual(event);
      expect(data.currentEventId).toBe('event-1');
    });

    it('updates existing event', () => {
      const event1: Event = {
        id: 'event-1',
        name: 'Event 1',
        tournaments: [],
      };

      saveEvent(event1);

      const event1Updated: Event = {
        id: 'event-1',
        name: 'Event 1 Updated',
        tournaments: [
          {
            id: 'tournament-1',
            name: 'Tournament',
            url: 'http://test.com',
            players: [],
            lastUpdated: new Date().toISOString(),
          },
        ],
      };

      saveEvent(event1Updated);

      const data = getStorageData();
      expect(data.events).toHaveLength(1);
      expect(data.events[0].name).toBe('Event 1 Updated');
      expect(data.events[0].tournaments).toHaveLength(1);
    });
  });

  describe('deleteEvent', () => {
    it('deletes event and cleans up validations', () => {
      const event: Event = {
        id: 'event-1',
        name: 'Event 1',
        tournaments: [
          {
            id: 'tournament-1',
            name: 'Tournament',
            url: 'http://test.com',
            players: [],
            lastUpdated: new Date().toISOString(),
          },
        ],
      };

      saveEvent(event);
      setValidation('tournament-1', 'Player 1', 1, true);

      deleteEvent('event-1');

      const data = getStorageData();
      expect(data.events).toHaveLength(0);
      expect(data.currentEventId).toBe('');
    });

    it('sets next event as current when deleting current event', () => {
      const event1: Event = {
        id: 'event-1',
        name: 'Event 1',
        tournaments: [],
      };

      const event2: Event = {
        id: 'event-2',
        name: 'Event 2',
        tournaments: [],
      };

      saveEvent(event1);
      saveEvent(event2);
      // Now event-2 is current

      // Delete event-2
      deleteEvent('event-2');

      const data = getStorageData();
      expect(data.events).toHaveLength(1);
      expect(data.currentEventId).toBe('event-1');
    });
  });

  describe('validation functions', () => {
    it('sets and gets validation correctly', () => {
      setValidation('tournament-1', 'Player 1', 1, true);

      const isValid = getValidation('tournament-1', 'Player 1', 1);
      expect(isValid).toBe(true);
    });

    it('returns false for non-existent validation', () => {
      const isValid = getValidation('tournament-1', 'Player 1', 1);
      expect(isValid).toBe(false);
    });

    it('getValidationState returns all validations', () => {
      setValidation('tournament-1', 'Player 1', 1, true);
      setValidation('tournament-1', 'Player 2', 1, false);
      setValidation('tournament-2', 'Player 3', 1, true);

      const state = getValidationState();

      expect(state).toEqual({
        'tournament-1': {
          'Player 1': {
            round_1: true,
          },
          'Player 2': {
            round_1: false,
          },
        },
        'tournament-2': {
          'Player 3': {
            round_1: true,
          },
        },
      });
    });
  });

  describe('clearAllData', () => {
    it('removes all data from localStorage', () => {
      const event: Event = {
        id: 'event-1',
        name: 'Event 1',
        tournaments: [],
      };

      saveEvent(event);

      clearAllData();

      const data = getStorageData();
      expect(data.events).toHaveLength(0);
      expect(data.currentEventId).toBe('');
    });
  });

  describe('exportData and importData', () => {
    it('exports data as JSON string', () => {
      const event: Event = {
        id: 'event-1',
        name: 'Event 1',
        tournaments: [],
      };

      saveEvent(event);

      const exported = exportData();
      const parsed = JSON.parse(exported);

      expect(parsed.events).toHaveLength(1);
      expect(parsed.events[0].id).toBe('event-1');
    });

    it('imports data from JSON string', () => {
      const mockData: StorageData = {
        currentEventId: 'event-2',
        events: [
          {
            id: 'event-2',
            name: 'Imported Event',
            tournaments: [],
          },
        ],
        validations: {},
      };

      const jsonString = JSON.stringify(mockData);
      const success = importData(jsonString);

      expect(success).toBe(true);

      const data = getStorageData();
      expect(data.events).toHaveLength(1);
      expect(data.events[0].name).toBe('Imported Event');
      expect(data.currentEventId).toBe('event-2');
    });

    it('returns false for invalid JSON on import', () => {
      const success = importData('invalid json{');
      expect(success).toBe(false);
    });
  });
});
