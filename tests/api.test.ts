import request from 'supertest';
import app from '../src/index';
import { persons, meetings, personSchedules } from '../src/models/data';

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
  beforeEach(() => {
    persons.length = 0;
    meetings.length = 0;
    personSchedules.clear();
  });

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
    // Use a guaranteed future hour mark
    const now = new Date();
    now.setUTCHours(now.getUTCHours() + 1, 0, 0, 0);
    const futureTime = now.toISOString();
    await request(app).post('/meetings').send({ time: futureTime, participants: [p.body.id] });
    const res = await request(app).get(`/persons/${p.body.id}/schedule`);
    expect(res.body.length).toBe(1);
  });

  it('should suggest available timeslots for a group', async () => {
    const p1 = await request(app).post('/persons').send({ name: 'Alice', email: 'alice@example.com' });
    const p2 = await request(app).post('/persons').send({ name: 'Bob', email: 'bob@example.com' });
    // Use a future hour mark for 'from'
    const now = new Date();
    now.setUTCHours(now.getUTCHours() + 1, 0, 0, 0);
    const from = now.toISOString();
    await request(app).post('/meetings').send({ time: from, participants: [p1.body.id, p2.body.id] });
    const res = await request(app).post('/meetings/suggest').send({ participants: [p1.body.id, p2.body.id], from });
    // The first slot should be unavailable, the next should be available
    expect(res.body.slots).not.toContain(from);
    // Check that at least one slot is available in the next 24 hours
    expect(res.body.slots.length).toBeGreaterThan(0);
  });

  it('should return 404 if meeting is created with non-existent participant', async () => {
    const p = await request(app).post('/persons').send({ name: 'Alice', email: 'alice@example.com' });
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app).post('/meetings').send({ time: '2025-09-09T10:00:00.000Z', participants: [p.body.id, fakeId] });
    expect(res.status).toBe(404);
  });

  it('should return 409 if meeting is created with a participant who has a conflict', async () => {
    const p = await request(app).post('/persons').send({ name: 'Alice', email: 'alice@example.com' });
    await request(app).post('/meetings').send({ time: '2025-09-09T10:00:00.000Z', participants: [p.body.id] });
    const res = await request(app).post('/meetings').send({ time: '2025-09-09T10:00:00.000Z', participants: [p.body.id] });
    expect(res.status).toBe(409);
  });

  it('should suggest timeslots when one participant has multiple conflicts', async () => {
    const p1 = await request(app).post('/persons').send({ name: 'Alice', email: 'alice@example.com' });
    const p2 = await request(app).post('/persons').send({ name: 'Bob', email: 'bob@example.com' });
    const now = new Date();
    now.setUTCHours(now.getUTCHours() + 1, 0, 0, 0);
    const from = now.toISOString();
    // p1 has two meetings in the next 24 hours
    await request(app).post('/meetings').send({ time: from, participants: [p1.body.id] });
    const nextHour = new Date(now);
    nextHour.setUTCHours(now.getUTCHours() + 1, 0, 0, 0);
    await request(app).post('/meetings').send({ time: nextHour.toISOString(), participants: [p1.body.id] });
    const res = await request(app).post('/meetings/suggest').send({ participants: [p1.body.id, p2.body.id], from });
    expect(res.body.slots).not.toContain(from);
    expect(res.body.slots).not.toContain(nextHour.toISOString());
    expect(res.body.slots.length).toBeGreaterThan(0);
  });

  it('should return 404 for schedule lookup of non-existent person', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app).get(`/persons/${fakeId}/schedule`);
    expect(res.status).toBe(404);
  });

  it('should return 400 for creating person with missing fields', async () => {
    const res = await request(app).post('/persons').send({ name: 'NoEmail' });
    expect(res.status).toBe(400);
  });

  it('should return 400 for creating meeting with missing fields', async () => {
    const p = await request(app).post('/persons').send({ name: 'Alice', email: 'alice@example.com' });
    const res = await request(app).post('/meetings').send({ participants: [p.body.id] });
    expect(res.status).toBe(400);
  });

  it('should return 400 for suggesting timeslots with missing fields', async () => {
    const p = await request(app).post('/persons').send({ name: 'Alice', email: 'alice@example.com' });
    const res = await request(app).post('/meetings/suggest').send({ participants: [p.body.id] });
    expect(res.status).toBe(400);
  });
});
