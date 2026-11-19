import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiRouter } from './server/routes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT ?? 3000);
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();

  const rateLimitWindowMs = 15 * 60 * 1000;
  const rateLimitMax = 300;
  const rateLimitHits = new Map<string, { count: number; resetAt: number }>();

  app.use('/api', (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const current = rateLimitHits.get(key);
    if (!current || current.resetAt <= now) {
      rateLimitHits.set(key, { count: 1, resetAt: now + rateLimitWindowMs });
    } else {
      current.count += 1;
      if (current.count > rateLimitMax) {
        res.setHeader('Retry-After', Math.ceil((current.resetAt - now) / 1000));
        res.status(429).json({
          error: 'Muitas requisições. Aguarde antes de tentar novamente.',
          code: 'RATE_LIMITED',
        });
        return;
      }
    }
    if (rateLimitHits.size > 5000) {
      for (const [hitKey, hit] of rateLimitHits) {
        if (hit.resetAt <= now) rateLimitHits.delete(hitKey);
      }
    }
    next();
  });

  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; base-uri 'self'; frame-ancestors 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' https://*.googleapis.com https://accounts.google.com; font-src 'self' data:"
    );
    next();
  });

  app.use(express.json({ limit: '1mb' }));

  app.use('/api', apiRouter);

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Central de Acionamentos — CMS rodando na porta ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Erro ao iniciar servidor:', err);
  process.exit(1);
});
