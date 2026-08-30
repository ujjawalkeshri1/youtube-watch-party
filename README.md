# YouTube Watch Party

A production-minded synchronized YouTube watch party built with React/Vite, Express, Socket.IO, PostgreSQL, and Prisma.

## What is included

- Host-controlled synchronized YouTube playback.
- Host play, pause, seek, 10-second back/forward controls, and video switching.
- Native YouTube seeking is synchronized back to the room when the host drags the YouTube timeline.
- Participants cannot issue playback commands; playback state comes from the server/host.
- Participant and chat panels stay together in a sticky utility rail beside the player on desktop.
- Responsive single-column layout on smaller screens.
- Room header, invite link, participant management, live chat, and room lifecycle handling.
- PostgreSQL-backed room state with Prisma migrations.
- Docker Compose configuration for a reliable local PostgreSQL environment.

## Architecture

- `client` renders the room UI and YouTube IFrame player.
- `server` owns room state, authorization, playback clock, participant roles, and Socket.IO broadcasts.
- PostgreSQL stores rooms and participants through Prisma.
- Socket.IO events are validated with Zod and authorized on the server before playback or participant state changes are broadcast.

## Local setup

### 1. Start PostgreSQL

From the repository root:

```powershell
docker compose up -d postgres
docker ps
```

The included Compose file exposes PostgreSQL on `localhost:5432` and creates the `watchparty` database.

### 2. Configure the server

```powershell
cd server
Copy-Item .env.example .env
```

Set the local database URL in `server/.env`:

```env
DATABASE_URL="postgresql://watchparty:watchparty@localhost:5432/watchparty"
PORT=5000
CLIENT_URL="http://localhost:5173"
NODE_ENV="development"
```

### 3. Install dependencies

```powershell
cd server
npm install

cd ..\client
npm install
```

### 4. Initialize the database

For a fresh checkout using the committed migrations:

```powershell
cd ..\server
npx prisma generate
npx prisma migrate deploy
```

For future schema development, use `npx prisma migrate dev` only when intentionally creating a new migration.

### 5. Start the backend

```powershell
cd server
npm run dev
```

The API and Socket.IO server listen on `http://localhost:5000` by default.

### 6. Start the frontend

In a second terminal:

```powershell
cd client
npm run dev
```

Open `http://localhost:5173`.

## Final playback rules

### Host

The host controls the shared playback state. Host controls include:

- Play / pause.
- YouTube timeline seeking.
- Custom 10-second back / forward controls.
- Host playback slider.
- Changing the current YouTube video.

### Participant

Participants do not control playback. Their player follows the server's authoritative room clock and automatically corrects drift. Keyboard playback shortcuts are disabled and the player is shielded from pointer interaction.

The embedded player is configured with YouTube's fullscreen control disabled so there is no redundant fullscreen control in the room UI.

## Verification checklist

Run these checks before deployment:

```powershell
cd server
npx prisma validate
npx prisma migrate status
npm run build

cd ..\client
npm run build
```

Then manually verify:

1. Create a new room.
2. Open the room as the host.
3. Open the same room in an incognito window as a participant.
4. Host play/pause updates the participant.
5. Host 10-second forward/back updates both screens.
6. Host custom slider seeking updates both screens.
7. Dragging the native YouTube timeline as host updates the room and participant.
8. Participant cannot play, pause, or seek.
9. Changing the video as host updates the participant.
10. Participant and chat panels remain aligned beside the player while scrolling.
11. A new room opens at the top of the page.
12. Leaving as host ends the room for the remaining users.

## Production deployment

Build the client and server separately and provide the production environment values to the server:

```env
DATABASE_URL="<managed-postgresql-connection-string>"
PORT="5000"
CLIENT_URL="<deployed-client-origin>"
NODE_ENV="production"
```

Deploy the database first, then run the committed Prisma migrations:

```bash
npx prisma migrate deploy
```

Build and start the server:

```bash
npm run build
npm start
```

Build the client with:

```bash
npm run build
```

Serve the generated `client/dist` directory from your static hosting provider. Configure the frontend's API base URL according to the existing client environment configuration before deployment.

## Notes

- YouTube embedding still depends on the individual video's embedding permissions.
- Browser autoplay policies can prevent a programmatic play; the host can start playback through the player UI.
- The local Docker PostgreSQL container is intended for development. Use a managed PostgreSQL instance or equivalent persistent database for production.
