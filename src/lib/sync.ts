import { getStorageData, setStorageData } from './storage';
import type { StorageData } from '@/types';

const SYNC_INTERVAL = 5000; // 5 seconds
const API_BASE = window.location.origin;

/**
 * Sync local storage to MongoDB
 */
export async function syncToMongoDB(): Promise<boolean> {
  try {
    const data = getStorageData();

    const response = await fetch(`${API_BASE}/api/events/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error('Sync to MongoDB failed:', response.statusText);
      return false;
    }

    const result = await response.json();
    console.log('Synced to MongoDB:', result.synced, 'events');
    return true;
  } catch (error) {
    console.error('Sync to MongoDB error:', error);
    return false;
  }
}

/**
 * Fetch data from MongoDB and merge with local storage
 */
export async function fetchFromMongoDB(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/events/fetch`);

    if (!response.ok) {
      console.error('Fetch from MongoDB failed:', response.statusText);
      return false;
    }

    const result = await response.json();
    const remoteData: StorageData = result.data;

    // Get local data
    const localData = getStorageData();

    // Merge logic: MongoDB is source of truth
    // But keep local changes if newer
    const mergedEvents = [...remoteData.events];

    // Add local events that don't exist remotely (new creations not yet synced)
    localData.events.forEach(localEvent => {
      const existsRemotely = mergedEvents.some(e => e.id === localEvent.id);
      if (!existsRemotely) {
        mergedEvents.push(localEvent);
      }
    });

    // Merge validations (union of both)
    const mergedValidations = {
      ...remoteData.validations,
      ...localData.validations,
    };

    // Use remote current event ID if set, otherwise keep local
    const mergedCurrentEventId = remoteData.currentEventId || localData.currentEventId;

    const mergedData: StorageData = {
      events: mergedEvents,
      validations: mergedValidations,
      currentEventId: mergedCurrentEventId,
    };

    // Save merged data to localStorage
    setStorageData(mergedData);

    console.log('Fetched from MongoDB:', mergedEvents.length, 'events');
    return true;
  } catch (error) {
    console.error('Fetch from MongoDB error:', error);
    return false;
  }
}

/**
 * Start auto-sync service
 */
export function startAutoSync(): () => void {
  let syncInterval: NodeJS.Timeout;
  let fetchInterval: NodeJS.Timeout;

  // Initial sync
  syncToMongoDB();

  // Sync local changes to MongoDB every 5s
  syncInterval = setInterval(() => {
    syncToMongoDB();
  }, SYNC_INTERVAL);

  // Fetch remote changes every 5s
  fetchInterval = setInterval(() => {
    fetchFromMongoDB();
  }, SYNC_INTERVAL);

  // Return cleanup function
  return () => {
    clearInterval(syncInterval);
    clearInterval(fetchInterval);
  };
}
