import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, Plugin } from 'vite';

function tournamentApiPlugin(): Plugin {
  const dataDir = path.resolve(__dirname, 'data');
  const dbFile = path.resolve(dataDir, 'tournament_state.json');

  return {
    name: 'tournament-backend-api',
    configureServer(server) {
      if (!fs.existsSync(dataDir)) {
        try {
          fs.mkdirSync(dataDir, { recursive: true });
        } catch {
          // ignore
        }
      }

      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/tournament')) {
          return next();
        }

        const url = req.url.split('?')[0];

        // GET /api/tournament
        if (req.method === 'GET' && url === '/api/tournament') {
          res.setHeader('Content-Type', 'application/json');
          if (fs.existsSync(dbFile)) {
            try {
              const content = fs.readFileSync(dbFile, 'utf-8');
              res.statusCode = 200;
              return res.end(content);
            } catch {
              // fallback
            }
          }
          res.statusCode = 200;
          return res.end(JSON.stringify({ default: true }));
        }

        // POST /api/tournament/reset
        if (req.method === 'POST' && url === '/api/tournament/reset') {
          try {
            if (fs.existsSync(dbFile)) {
              fs.unlinkSync(dbFile);
            }
          } catch {
            // ignore
          }
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          return res.end(JSON.stringify({ success: true, message: 'Đã reset dữ liệu' }));
        }

        // POST /api/tournament (Save state)
        if (req.method === 'POST' && url === '/api/tournament') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body);
              fs.writeFileSync(dbFile, JSON.stringify(parsed, null, 2), 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              return res.end(JSON.stringify({ success: true, state: parsed }));
            } catch (err: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 400;
              return res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), tournamentApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
