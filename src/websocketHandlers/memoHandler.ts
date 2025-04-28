import { WebSocket } from 'ws';
import type { IncomingMessage } from 'http';

export const handleMemoWebSocketConnection = (ws: WebSocket, req: IncomingMessage) => {
  console.log('Memo WebSocket connection established.');

  ws.on('message', (message: Buffer | string) => {
    const messageString = message.toString();
    console.log(`Received memo message: ${messageString}`);
    // TODO: Implement memo-specific message handling
    ws.send(`Echo: ${messageString}`); // Simple echo for now
  });

  ws.on('close', (code, reason) => {
    const reasonString = reason instanceof Buffer ? reason.toString() : 'No reason given';
    console.log(`Memo WebSocket disconnected. Code: ${code}, Reason: ${reasonString}`);
  });

  ws.on('error', (error: Error) => {
    console.error('Memo WebSocket error:', error);
  });
};