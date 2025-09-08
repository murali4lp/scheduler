import request from 'supertest';
import app from '../src/index';
import { persons, meetings } from '../src/models/data.js';

describe('Persons API', () => {
  beforeEach(() => { persons.length = 0; meetings.length = 0; });

  it('should create a person with unique email', async () => {
    const res = await request(app).post('/persons').send({ name: 'Alice', email: 'alice@example.com' });
    expect(res.status).toBe(201);
    expect(res.body.email).toBe('alice@example.com');
  });

  it('should not allow duplicate emails', async () => {
    await request(app).post('/persons').send({ name: 'Bob', email: 'bob@example.com' });
    const res = await request(app).post('/persons').send({ name: 'Bobby', email: 'bob@example.com' });
    expect(res.status).toBe(409);
  });
});

describe('Meetings API', () => {
  beforeEach(() => { persons.length = 0; meetings.length = 0; });

  it('should create a meeting at the hour mark', async () => {
    const p = await request(app).post('/persons').send({ name: 'Alice', email: 'alice@example.com' });
    const res = await request(app).post('/meetings').send({ time: '2025-09-09T10:00:00.000Z', participants: [p.body.id] });
    expect(res.status).toBe(201);
    expect(res.body.time).toBe('2025-09-09T10:00:00.000Z');
  });

  it('should reject meetings not at the hour mark', async () => {
    const p = await request(app).post('/persons').send({ name: 'Alice', email: 'alice@example.com' });
    const res = await request(app).post('/meetings').send({ time: '2025-09-09T10:30:00.000Z', participants: [p.body.id] });
    expect(res.status).toBe(400);
  });

  it('should show upcoming meetings for a person', async () => {
    const p = await request(app).post('/persons').send({ name: 'Alice', email: 'alice@example.com' });
    await request(app).post('/meetings').send({ time: '2025-09-09T10:00:00.000Z', participants: [p.body.id] });
    const res = await request(app).get(`/persons/${p.body.id}/schedule`);
    expect(res.body.length).toBe(1);
  });

  it('should suggest available timeslots for a group', async () => {
    const p1 = await request(app).post('/persons').send({ name: 'Alice', email: 'alice@example.com' });
    const p2 = await request(app).post('/persons').send({ name: 'Bob', email: 'bob@example.com' });
    await request(app).post('/meetings').send({ time: '2025-09-09T10:00:00.000Z', participants: [p1.body.id, p2.body.id] });
    const res = await request(app).post('/meetings/suggest').send({ participants: [p1.body.id, p2.body.id], from: '2025-09-09T09:00:00.000Z', to: '2025-09-09T12:00:00.000Z' });
    expect(res.body.slots).toContain('2025-09-09T09:00:00.000Z');
    expect(res.body.slots).not.toContain('2025-09-09T10:00:00.000Z');
  });
});
