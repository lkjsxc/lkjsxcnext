// server.ts
import { createServer, IncomingMessage } from 'http'; // Import IncomingMessage
import { parse } from 'url';
import next from 'next';
import type { Duplex } from 'stream';    // Import type

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

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

  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });

  // SIGTERM handler (existing)
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing servers...');
    server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
    });
  });
});