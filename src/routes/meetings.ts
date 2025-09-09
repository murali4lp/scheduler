import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { Meeting, Person } from '../models/types';
import { persons, meetings, personSchedules } from '../models/data';
import { isHourMark } from '../utils/utils';

const meetingsRouter = Router();

/**
 * @swagger
 * /meetings:
 *   post:
 *     summary: Create a meeting
 *     description: Create a meeting involving one or more persons at a given time slot. Meeting must start at the hour mark and last exactly one hour.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - time
 *               - participants
 *             properties:
 *               time:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-09-09T10:00:00.000Z"
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["123e4567-e89b-12d3-a456-426614174000", "123e4567-e89b-12d3-a456-426614174001"]
 *     responses:
 *       201:
 *         description: Meeting created
 *         content:
 *           application/json:
 *             example:
 *               id: "meeting-1"
 *               time: "2025-09-09T10:00:00.000Z"
 *               participants: ["123e4567-e89b-12d3-a456-426614174000", "123e4567-e89b-12d3-a456-426614174001"]
 *       400:
 *         description: Invalid input or not at hour mark
 *       409:
 *         description: Person has a conflict at this time
 */
meetingsRouter.post('/', (req, res) => {
  const { time, participants } = req.body;
  if (!time || !participants || !Array.isArray(participants) || participants.length === 0) {
    return res.status(400).json({ error: 'Time and participants are required' });
  }
  
  if (!isHourMark(time)) {
    return res.status(400).json({ error: 'Meeting must start at the hour mark' });
  }

  for (const pid of participants) {
    if (!persons.find(p => p.id === pid)) return res.status(404).json({ error: `Person ${pid} not found` });
    if (personSchedules.get(pid)?.has(time)) {
      return res.status(409).json({ error: `Person ${pid} has a conflict at this time` });
    }
  }

  const meeting: Meeting = { id: uuidv4(), time, participants };
  meetings.push(meeting);
  // Update schedule map
  for (const pid of participants) {
    if (!personSchedules.has(pid)) personSchedules.set(pid, new Set());
    personSchedules.get(pid)!.add(time);
  }
  res.status(201).json(meeting);
});

/**
 * @swagger
 * /meetings/suggest:
 *   post:
 *     summary: Suggest available timeslots
 *     description: Suggest available one-hour timeslots for meetings for a group of persons, starting from the specified 'from' time. Returns up to the next 24 available hour slots. Each slot is at the hour mark in UTC and lasts exactly one hour. The 'to' parameter is not required; suggestions are always for the next 24 hours from 'from'.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - participants
 *               - from
 *             properties:
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["123e4567-e89b-12d3-a456-426614174000", "456e7890-e12b-34d5-c678-526614174111"]
 *               from:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-09-09T09:00:00.000Z"
 *     responses:
 *       200:
 *         description: List of available timeslots (next 24 hour slots from 'from')
 *         content:
 *           application/json:
 *             example:
 *               slots: ["2025-09-09T09:00:00.000Z", "2025-09-09T11:00:00.000Z"]
 */
meetingsRouter.post('/suggest', (req, res) => {
  const { participants, from } = req.body;
  if (!participants || !Array.isArray(participants) || participants.length === 0 || !from) {
    return res.status(400).json({ error: 'Participants and from are required' });
  }
  const start = new Date(from);
  const slots: string[] = [];
  
  // Suggest next 24 hour slots from 'from'
  for (let i = 0; i < 24; i++) {
    const d = new Date(start);
    d.setUTCHours(start.getUTCHours() + i, 0, 0, 0);
    const slot = d.toISOString();
    const conflict = participants.some(pid => personSchedules.get(pid)?.has(slot));
    if (!conflict) slots.push(slot);
  }
  res.json({ slots });
});


export default meetingsRouter;
