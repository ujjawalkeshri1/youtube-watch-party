# Project Status

## Current state

- React/Vite client and Express/Socket.IO server are in place.
- PostgreSQL persistence is managed through Prisma.
- Host playback controls, synchronized seeking, participant permissions, live chat, room management, and responsive room layout are implemented.
- Production server startup supports the hosting platform's assigned port and public network binding.
- Production client requests use the deployed origin by default when no API URL is supplied.

## Validation commands

```bash
cd server && npx prisma validate
cd server && npm run build
cd ../client && npm run build
```

## Manual smoke test

1. Create a room as host.
2. Join the room from another browser window.
3. Test play, pause, back, forward, and both seek controls.
4. Verify participant playback follows the host.
5. Test chat and participant management.
6. Change the video and verify both clients update.
7. Confirm the room bottom ends with the final content and no unnecessary blank area.
