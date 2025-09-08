import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { Person } from '../models/types';
import { persons, meetings } from '../models/data';

const personsRouter = Router();

/**
 * @swagger
 * /persons:
 *   post:
 *     summary: Create a new person
 *     description: Create a person with a name and unique email.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Alice Smith"
 *               email:
 *                 type: string
 *                 example: "alice@example.com"
 *     responses:
 *       201:
 *         description: Person created
 *         content:
 *           application/json:
 *             example:
 *               id: "123e4567-e89b-12d3-a456-426614174000"
 *               name: "Alice Smith"
 *               email: "alice@example.com"
 *       400:
 *         description: Name and email required
 *       409:
 *         description: Email must be unique
 */
personsRouter.post('/', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email required' });
  if (persons.find(p => p.email === email)) return res.status(409).json({ error: 'Email must be unique' });
  const person: Person = { id: uuidv4(), name, email };
  persons.push(person);
  res.status(201).json(person);
});

/**
 * @swagger
 * /persons/{id}/schedule:
 *   get:
 *     summary: Get upcoming meetings for a person
 *     description: Show the schedule (upcoming meetings) for a given person.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of upcoming meetings
 *         content:
 *           application/json:
 *             example:
 *               - id: "meeting-1"
 *                 time: "2025-09-09T10:00:00.000Z"
 *                 participants: ["123e4567-e89b-12d3-a456-426614174000"]
 */
personsRouter.get('/:id/schedule', (req, res) => {
  const { id } = req.params;
  const upcoming = meetings.filter(m => m.participants.map(val => val.id).includes(id) && new Date(m.time) > new Date());
  res.json(upcoming);
});

export default personsRouter;
