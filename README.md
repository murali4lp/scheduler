# Scheduler API

An expressjs based Scheduler API written in TypeScript for managing persons and meetings.

## Features
- Create persons with unique emails
- Create meetings (hour mark, exactly one hour, one or more persons)
- List upcoming meetings for a person
- Suggest available meeting timeslots for a group of persons
- **Interactive API docs at `/api-docs` using Swagger**

## Getting Started
1. Install dependencies: `npm install`
2. Run the server in development: `npm run dev`
3. View API docs locally: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
4. These api endpoints can be tested lcoally using these swagger docs.

## API Endpoints
- `POST /persons` - Create a person
- `POST /meetings` - Create a meeting
- `GET /persons/:id/schedule` - Get upcoming meetings for a person
- `POST /meetings/suggest` - Suggest available timeslots for a group
- `GET /api-docs` - Swagger UI interactive API docs

## Design Choice: Efficient Availability Lookup

To enable fast availability checks for any group of participants, the app uses:
- `Meeting.participants` as an array of person IDs (`string[]`), not full objects.
- An in-memory `personSchedules: Map<string, Set<string>>` mapping each person ID to a set of meeting time slots (ISO strings).

### Tradeoffs & Considerations
- **Performance:**
  - O(1) lookup for a person's scheduled times.
  - O(n) for group availability checks (n = group size), much faster than scanning all meetings.
- **Simplicity:**
  - Easy to update schedules when meetings are created or deleted.
  - Reduces complexity compared to nested objects or repeated scans.
- **Scalability:**
  - Works well for in-memory or small datasets. For very large or persistent data, we should consider using indexed database tables or caching.
- **Consistency:**
  - Requires careful updates to `personSchedules` whenever meetings are added/removed to avoid stale data.

This design ensures the scheduler API remains fast and responsive for group scheduling operations.

## License
MIT
