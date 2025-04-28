// src/lib/websocketServer.ts
import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http'; // Import type
import type { Duplex } from 'stream';       // Import type
import { parse } from 'url'; // Import parse
import { handlePingWebSocketConnection } from '../websocketHandlers/pingHandler'; // Import ping handler
import { handleMemoWebSocketConnection } from '../websocketHandlers/memoHandler'; // Import memo handler

let wss: WebSocketServer | null = null;

// ★Change: Remove server argument and use noServer: true
export const initializeWebSocketServer = (): WebSocketServer => {
  if (!wss) {
    // ★Change: Initialize with noServer: true. Disable automatic attachment to HTTP server
    wss = new WebSocketServer({ noServer: true });
    console.log('WebSocket server instance created (noServer: true)');

    // ★Delete: server.on('upgrade', ...) log is not needed in this file (handled in server.ts)

    // Add req to connection handler to check the path and delegate
    wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const clientIp = req.socket.remoteAddress || req.headers['x-forwarded-for'] || 'Unknown IP';
      const { pathname } = parse(req.url || '', true); // Parse URL here

      console.log(`Client connected from ${clientIp} to path: ${pathname}`); // Log which IP connected and path

      // Add keep-alive mechanism
      // @ts-ignore - Add property to WebSocket instance
      ws.isAlive = true;
      ws.on('pong', () => {
        // @ts-ignore
        ws.isAlive = true;
      });

      // Ping interval (e.g., every 30 seconds)
      const pingInterval = setInterval(() => {
        // @ts-ignore
        if (ws.isAlive === false) {
          console.log(`WebSocket connection to ${pathname} from ${clientIp} timed out. Terminating.`);
          return ws.terminate();
        }

        // @ts-ignore
        ws.isAlive = false;
        ws.ping();
      }, 30000); // Send ping every 30 seconds

      // Clear interval on close
      ws.on('close', () => {
        console.log(`WebSocket connection to ${pathname} from ${clientIp} closed.`);
        clearInterval(pingInterval);
      });


      // Delegate handling based on the path
      if (pathname === '/api/memos/ws') {
        console.log('Delegating connection to memo handler...');
        handleMemoWebSocketConnection(ws, req);
      } else if (pathname === '/api/ping/ws') {
        console.log('Delegating connection to ping handler...');
        // Call the ping handler function
        handlePingWebSocketConnection(ws, req);
      } else {
        console.warn(`No specific handler for path ${pathname}. Closing connection.`);
        ws.close(1000, 'No handler for this path');
      }

    });

    wss.on('error', (error: Error) => {
      console.error('WebSocket server error:', error);
    });
  }
  return wss;
};

export const getWebSocketServer = (): WebSocketServer | null => {
  return wss;
};

// ★Correction: Consider the possibility that message is not a string
export const broadcastMessage = (message: any) => {
  if (wss) {
    // Convert message to string (e.g., if it's an object)
    const messageString = typeof message === 'string' ? message : JSON.stringify(message);
    wss.clients.forEach((client: WebSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageString);
      }
    });
  } else {
    console.warn('WebSocket server not initialized. Cannot broadcast message.');
  }
};