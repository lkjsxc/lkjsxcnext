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

    if (pathname === '/api/memos/ws') {
      console.log('Handling upgrade for /api/memos/ws...');
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    } else if (pathname === '/api/ping/ws') { // ★ Handle Ping endpoint
      console.log('Handling upgrade for /api/ping/ws...');
      wss.handleUpgrade(req, socket, head, (ws: WebSocket) => { // ★ Explicitly type ws
        // Emit 'connection' event (if needed for common processing on the custom server side)
        // However, if the subsequent processing is completed here, it is not necessarily required to emit.
        wss.emit('connection', ws, req);

        console.log('Ping WebSocket client connected.');
        ws.send('Welcome to Ping WebSocket!');

        // ★ === ここから追加・変更 ===
        // Variable to store the timer ID for sending ping every 1 second
        let pingInterval: NodeJS.Timeout | null = null;

        // Start the timer
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
              ws.terminate(); // 接続を強制終了
            }
          } else {
            // If the connection is not OPEN (CLOSING or CLOSED), stop the timer
            console.log('Client connection is not OPEN. Stopping ping interval.');
            if (pingInterval) clearInterval(pingInterval);
          }
        }, 1000); // 1000ms = 1秒

        // Processing when receiving messages from the client (keep echo back as is)
        ws.on('message', (message) => {
          const messageString = message.toString();
          console.log(`Ping WS received: ${messageString}`);
          // Processing when receiving pong messages can be added here
          if (messageString === 'pong') {
            console.log('Received pong from client.');
            // Processing when receiving Pong (e.g., recording the last response time)
          } else {
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
        // ★ === ここまで追加・変更 ===
      });
    } else if (pathname === '/_next/webpack-hmr') {
       console.log('Ignoring upgrade for Next.js HMR.');
       // Next.js HMR is handled internally by Next.js, so do nothing here
    } else {
      console.log(`Upgrade request for path ${pathname} is not handled. Destroying socket.`);
      socket.destroy();
    }
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