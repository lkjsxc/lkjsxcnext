// src/lib/websocketServer.ts
import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'http'; // Import type
import type { Duplex } from 'stream';       // Import type

let wss: WebSocketServer | null = null;

// ★Change: Remove server argument and use noServer: true
export const initializeWebSocketServer = (): WebSocketServer => {
  if (!wss) {
    // ★Change: Initialize with noServer: true. Disable automatic attachment to HTTP server
    wss = new WebSocketServer({ noServer: true });
    console.log('WebSocket server instance created (noServer: true)');

    // ★Delete: server.on('upgrade', ...) log is not needed in this file (handled in server.ts)

    // ★Change: Add req to connection handler (optional for IP logging etc.)
    wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const clientIp = req.socket.remoteAddress || req.headers['x-forwarded-for'] || 'Unknown IP';
      console.log(`Client connected from ${clientIp}`); // Log which IP connected

      ws.on('message', (message: Buffer | string) => { // message might be a Buffer
         // Convert Buffer to string
         const messageString = message.toString();
         console.log(`Received message => ${messageString}`);
         // Handle incoming messages from clients if needed
      });

      ws.on('close', (code, reason) => {
        // reason might be a Buffer, so convert to string
        const reasonString = reason instanceof Buffer ? reason.toString() : 'No reason given';
        console.log(`Client disconnected. Code: ${code}, Reason: ${reasonString}`);
      });

      ws.on('error', (error: Error) => {
        console.error('WebSocket client connection error:', error);
      });
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