import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { Meeting, Person } from '../models/types';
import { persons, meetings } from '../models/data';

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
 *                 example: ["123e4567-e89b-12d3-a456-426614174000"]
 *     responses:
 *       201:
 *         description: Meeting created
 *         content:
 *           application/json:
 *             example:
 *               id: "meeting-1"
 *               time: "2025-09-09T10:00:00.000Z"
 *               participants: ["123e4567-e89b-12d3-a456-426614174000"]
 *       400:
 *         description: Invalid input or not at hour mark
 *       409:
 *         description: Person has a conflict at this time
 */
meetingsRouter.post('/', (req, res) => {
  const { time, participants } = req.body;
  if (!time || !participants || !Array.isArray(participants) || participants.length === 0) {
    return res.status(400).json({ error: 'Time and participants required' });
  }
  if (!isHourMark(time)) return res.status(400).json({ error: 'Meeting must start at the hour mark' });
  for (const pid of participants) {
    if (!persons.find(p => p.id === pid)) return res.status(404).json({ error: `Person ${pid} not found` });
    if (meetings.some(m => m.time === time && m.participants.includes(pid))) {
      return res.status(409).json({ error: `Person ${pid} has a conflict at this time` });
    }
  }
  const meeting: Meeting = { id: uuidv4(), time, participants };
  meetings.push(meeting);
  res.status(201).json(meeting);
});

/**
 * @swagger
 * /meetings/suggest:
 *   post:
 *     summary: Suggest available timeslots
 *     description: Suggest one or more available timeslots for meetings given a group of persons.
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
 *               - to
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
 *               to:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-09-09T12:00:00.000Z"
 *     responses:
 *       200:
 *         description: List of available timeslots
 *         content:
 *           application/json:
 *             example:
 *               slots: ["2025-09-09T09:00:00.000Z", "2025-09-09T11:00:00.000Z"]
 */

// Helper: Check if time is valid (hour mark, ISO string)
function isHourMark(time: string): boolean {
  const date = new Date(time);
  return date.getMinutes() === 0 && date.getSeconds() === 0 && date.getMilliseconds() === 0;
}

export default meetingsRouter;
