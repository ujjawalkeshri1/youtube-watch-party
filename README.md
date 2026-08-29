# YouTube Watch Party

A production-minded watch party app with a Vite/React client and an Express + Socket.IO + Prisma backend.

## Architecture

- `client` renders the YouTube player experience and listens for room state changes.
- `server` owns room playback state and participant permissions in PostgreSQL via Prisma.
- Socket.IO events are validated and authorized on the server before room state is broadcast.
- Room creators are hosts; moderators and participants inherit permissions based on role assignments.

## Local setup

1. Start PostgreSQL locally and create a database named `watchparty`.
2. In `server`, copy `.env.example` to `.env` and set `DATABASE_URL` to your local PostgreSQL connection string.
3. Run `npm install` in both `server` and `client`.
4. In `server`, run `npx prisma migrate dev --name init` to initialize the schema.
5. In one terminal, run `cd server && npm run dev`.
6. In another terminal, run `cd client && npm run dev`.

The backend listens on `http://localhost:5000`, and the frontend dev server runs on `http://localhost:5173` by default.

## Verification

These are the current commands used to validate the project:

- `cd server && npx prisma validate`
- `cd server && npm run build`
- `cd client && npm run build`
- `curl http://localhost:5000/api/health`
