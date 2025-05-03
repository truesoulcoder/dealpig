import type { NextApiRequest, NextApiResponse } from 'next';

// In-memory event store (replace with Redis or DB for production)
let events: Array<{
  type: 'info' | 'error' | 'success';
  message: string;
  timestamp: number;
}> = [];

// Helper to add an event (call this from other API routes as needed)
export function logEvent(type: 'info' | 'error' | 'success', message: string) {
  events.push({ type, message, timestamp: Date.now() });
  // Keep only last 100 events
  if (events.length > 100) events = events.slice(-100);
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Return events from the last 10 minutes
    const since = Date.now() - 10 * 60 * 1000;
    res.status(200).json(events.filter(e => e.timestamp > since));
  } else if (req.method === 'POST') {
    // Allow posting a new event (for demo/testing)
    const { type, message } = req.body;
    logEvent(type, message);
    res.status(201).json({ ok: true });
  } else {
    res.status(405).end();
  }
}
