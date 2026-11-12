import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  const dataDir = path.resolve(__dirname, 'data');
  const dbFile = path.resolve(dataDir, 'tournament_state.json');

  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
    } catch {
      // ignore
    }
  }

  // API Routes
  app.get('/api/tournament', (req, res) => {
    if (fs.existsSync(dbFile)) {
      try {
        const content = fs.readFileSync(dbFile, 'utf-8');
        return res.json(JSON.parse(content));
      } catch {
        // fallback
      }
    }
    return res.json({ default: true });
  });

  app.post('/api/tournament', (req, res) => {
    try {
      const data = req.body;
      fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf-8');
      return res.json({ success: true, state: data });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post('/api/tournament/reset', (req, res) => {
    try {
      if (fs.existsSync(dbFile)) {
        fs.unlinkSync(dbFile);
      }
      return res.json({ success: true, message: 'Đã reset dữ liệu' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // If in dev mode, mount Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve dist folder
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Tournament server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
