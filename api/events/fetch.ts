import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDatabase } from '../../src/lib/mongodb';
import type { Event, ValidationState } from '../../src/types';

/**
 * GET /api/events/fetch
 * Fetch all events from MongoDB
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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await getDatabase();

    // Fetch all events
    const eventsCollection = db.collection<Event>('events');
    const events = await eventsCollection.find({}).toArray();

    // Fetch validations
    const validationsCollection = db.collection('validations');
    const validationsDoc = await validationsCollection.findOne({ _id: 'global' });
    const validations: ValidationState = validationsDoc?.validations || {};

    // Fetch current event ID
    const settingsCollection = db.collection('settings');
    const settingsDoc = await settingsCollection.findOne({ _id: 'global' });
    const currentEventId = settingsDoc?.currentEventId || '';

    // Remove MongoDB _id from events
    const cleanEvents = events.map(({ _id, ...event }) => event);

    return res.status(200).json({
      success: true,
      data: {
        events: cleanEvents,
        validations,
        currentEventId,
      },
    });
  } catch (error) {
    console.error('Fetch error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
