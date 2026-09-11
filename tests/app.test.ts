import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

describe('API routes', () => {
  let app: ReturnType<typeof createApp>;
  beforeEach(() => { app = createApp(); });

  it('serves a welcome message', async () => {
    await request(app).get('/').expect(200, { message: 'Welcome to the API' });
  });
  it('reports health', async () => {
    await request(app).get('/health').expect(200, { status: 'ok' });
  });
  it('lists an empty collection', async () => {
    await request(app).get('/users').expect(200, []);
  });
  it('creates, lists, retrieves, and deletes a user', async () => {
    const { body: user } = await request(app).post('/users')
      .send({ name: ' Ada ' }).expect(201).expect('Location', '/users/1');
    expect(user).toEqual({ id: '1', name: 'Ada' });
    await request(app).get('/users').expect(200, [user]);
    await request(app).get(`/users/${user.id}`).expect(200, user);
    await request(app).delete(`/users/${user.id}`).expect(204, '');
    await request(app).get('/users').expect(200, []);
    await request(app).get(`/users/${user.id}`).expect(404, { error: 'User not found' });
  });
  it.each([{}, { name: '' }, { name: '  ' }, { name: 42 }, { name: null }])(
    'rejects invalid user input %j', async (body) => {
      await request(app).post('/users').send(body).expect(400, {
        error: 'Name must be a non-empty string',
      });
    },
  );
  it('rejects missing request bodies', async () => {
    await request(app).post('/users').expect(400);
  });
  it('returns JSON for malformed JSON input', async () => {
    await request(app).post('/users').set('Content-Type', 'application/json')
      .send('{').expect(400, { error: 'Invalid JSON' });
  });
  it('returns 404 for missing users and unknown routes', async () => {
    await request(app).get('/users/missing').expect(404, { error: 'User not found' });
    await request(app).delete('/users/missing').expect(404, { error: 'User not found' });
    await request(app).get('/missing').expect(404, { error: 'Route not found' });
  });
});
