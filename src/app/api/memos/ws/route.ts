import { NextRequest, NextResponse } from 'next/server';
import { getWebSocketServer } from '@/lib/websocketServer';

export async function GET(req: NextRequest) {
  // This route is not intended for direct HTTP access.
  // It's used by the custom server.ts to handle WebSocket connections
  // via the initialized ws server.
  return new Response('WebSocket endpoint - not for direct HTTP access', { status: 400 });
}

// This function is not directly used by Next.js API routes for ws.
// The ws server handles connections internally when attached to the HTTP server.
// However, if you needed to access the ws server instance within an API route
// for other purposes (e.g., sending messages from an API endpoint), you could
// use the getWebSocketServer function.