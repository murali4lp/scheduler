# Scheduler API

An expressjs based Scheduler API written in TypeScript for managing persons and meetings.

## Features
- Create persons with unique emails
- Create meetings (hour mark, exactly one hour, multiple persons)
- List upcoming meetings for a person
- Suggest available meeting timeslots for a group
- **Interactive API docs at `/api-docs` using Swagger**

## Getting Started
1. Install dependencies: `npm install`
2. Run the server in development: `npm run dev`
3. View API docs: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

## API Endpoints
- `POST /persons` - Create a person
- `POST /meetings` - Create a meeting
- `GET /persons/:id/schedule` - Get upcoming meetings for a person
- `POST /meetings/suggest` - Suggest available timeslots for a group
- `GET /api-docs` - Swagger UI interactive API docs

## License
MIT
