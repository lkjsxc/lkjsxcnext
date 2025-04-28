// server.ts
import { createServer, IncomingMessage } from 'http'; // Import IncomingMessage
import { parse } from 'url';
import next from 'next';
import { initializeWebSocketServer } from './src/lib/websocketServer'; // Adjust path according to your environment
import type { WebSocket, WebSocketServer } from 'ws'; // Also import WebSocket type
import type { Duplex } from 'stream';    // Import type

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Get WebSocket server instance
const wss: WebSocketServer = initializeWebSocketServer();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling HTTP request', err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Handle WebSocket Upgrade requests
  server.on('upgrade', (req: IncomingMessage, socket: Duplex, head: Buffer) => {
    const { pathname } = parse(req.url || '', true);
    console.log(`HTTP server upgrade event received for path: ${pathname}`);

    // Delegate upgrade handling to the WebSocket server instance
    // The wss.handleUpgrade method will emit a 'connection' event on the wss
    // instance if the upgrade is successful, which is handled in src/lib/websocketServer.ts
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  });

  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });

  // SIGTERM handler (existing)
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing servers...');
    wss.close((err) => {
       if (err) {
           console.error('Error closing WebSocket server:', err);
       } else {
           console.log('WebSocket server closed.');
       }
       server.close(() => {
           console.log('HTTP server closed.');
           process.exit(0);
       });
    });
  });
});