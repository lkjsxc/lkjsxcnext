// src/websocketHandlers/pingHandler.ts
import type { WebSocket } from 'ws';
import type { IncomingMessage } from 'http';

/**
 * Handles a new WebSocket connection for the /api/ping/ws endpoint.
 * Manages sending periodic ping messages and handling client responses.
 * @param ws The WebSocket instance for the new connection.
 * @param req The incoming HTTP request associated with the upgrade.
 */
export const handlePingWebSocketConnection = (ws: WebSocket, req: IncomingMessage) => {
  console.log('Ping WebSocket client connected.');
  ws.send('Welcome to Ping WebSocket!');

  let pingInterval: NodeJS.Timeout | null = null;

  // Start the timer to send ping every 1 second
  pingInterval = setInterval(() => {
    // Check if WebSocket is still connected (OPEN)
    if (ws.readyState === ws.OPEN) {
      try {
        console.log('Sending ping to client');
        ws.send('ping'); // Send the string "ping"
      } catch (error) {
        console.error('Failed to send ping:', error);
        // Consider stopping the timer and closing the connection even on send errors
        if (pingInterval) clearInterval(pingInterval);
      }
    }
  }, 1000); // 1000ms = 1 second

  // Processing when receiving messages from the client
  ws.on('message', (message) => {
    const messageString = message.toString();
    console.log(`Ping WS received: ${messageString}`);
    // Processing when receiving pong messages
    if (messageString === 'pong') {
      console.log('Received pong from client.');
      // Processing when receiving Pong (e.g., recording the last response time)
    } else {
      // Echo back other messages
      ws.send(`Echo: ${messageString}`);
    }
  });

  // Processing when client disconnects
  ws.on('close', (code, reason) => {
    console.log(`Ping WebSocket client disconnected. Code: ${code}, Reason: ${reason.toString()}. Clearing ping interval.`);
    // Stop the timer if it is set
    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null; // Indicate that it has been cleared
    }
  });

  // Processing when an error occurs
  ws.on('error', (error) => {
    console.error('Ping WebSocket error:', error);
    // Stop the timer even if an error occurs
    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
    }
    // The 'close' event usually follows when an error occurs,
    // so it may overlap with clearing in the close handler, but clear here just in case.
  });
};