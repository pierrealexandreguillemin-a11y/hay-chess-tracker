import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDatabase } from '../../src/lib/mongodb';
import type { StorageData } from '../../src/types';

/**
 * POST /api/events/sync
 * Sync events from client to MongoDB
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { events, validations, currentEventId } = req.body as Partial<StorageData>;

    if (!events || !Array.isArray(events)) {
      return res.status(400).json({ error: 'Invalid events data' });
    }

    const db = await getDatabase();
    const collection = db.collection('events');

    // Upsert each event (update if exists, insert if new)
    const bulkOps = events.map(event => ({
      updateOne: {
        filter: { id: event.id },
        update: {
          $set: {
            ...event,
            updatedAt: new Date().toISOString(),
          },
        },
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) {
      await collection.bulkWrite(bulkOps);
    }

    // Store validations separately for easier querying
    if (validations && Object.keys(validations).length > 0) {
      const validationsCollection = db.collection('validations');
      await validationsCollection.updateOne(
        { _id: 'global' },
        { $set: { validations, updatedAt: new Date().toISOString() } },
        { upsert: true }
      );
    }

    // Store current event ID
    if (currentEventId) {
      const settingsCollection = db.collection('settings');
      await settingsCollection.updateOne(
        { _id: 'global' },
        { $set: { currentEventId, updatedAt: new Date().toISOString() } },
        { upsert: true }
      );
    }

    return res.status(200).json({
      success: true,
      synced: events.length,
    });
  } catch (error) {
    console.error('Sync error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
