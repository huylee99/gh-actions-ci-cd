import express, { type ErrorRequestHandler } from 'express';
import { createUserStore } from './users.js';

export function createApp() {
  const app = express();
  const users = createUserStore();
  app.use(express.json());

  app.get('/', (_req, res) => res.json({ message: 'Welcome to the API' }));
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/users', (_req, res) => res.json(users.list()));
  app.get('/users/:id', (req, res) => {
    const user = users.get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  });
  app.post('/users', (req, res) => {
    const body: unknown = req.body;
    const name = body && typeof body === 'object' && 'name' in body ? body.name : undefined;
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name must be a non-empty string' });
    }
    const user = users.create(name);
    res.status(201).location(`/users/${user.id}`).json(user);
  });
  app.delete('/users/:id', (req, res) => {
    if (!users.delete(req.params.id)) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(204).end();
  });

  app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
  const errorHandler: ErrorRequestHandler = (err: unknown, _req, res, _next) => {
    if (err && typeof err === 'object' && 'type' in err && err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
    if (err && typeof err === 'object' && 'status' in err &&
        typeof err.status === 'number' && err.status >= 400 && err.status < 500) {
      return res.status(err.status).json({ error: 'Invalid request' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  };
  app.use(errorHandler);
  return app;
}
