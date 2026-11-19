# Banter Frontend

The **Banter** demo client: React 19 + TypeScript + Vite, TanStack Query and SignalR, styled as a
Night Signal channel desk. The API lives in a separate repository:
[islam003007/Banter](https://github.com/islam003007/Banter).

## Run

Start the Banter API first (see the API repository). Then:

```bash
cd Banter.Web
npm install
npm run dev
# http://localhost:5173
```

The Vite proxy sends `/api` and `/hubs` to `http://localhost:8080`. For the API's `dotnet run`
profile on port 5261:

```bash
VITE_API_TARGET=http://localhost:5261 npm run dev
```

## Demo

- One-click seeded users: Ahmed, Sara, Mohamed, Nour, Omar and Fatma
- Standard email/password sign-in and registration are also available
- AI contacts Ada, Milo and Nova reply live
- Open a private window and continue as another user to see realtime messages

See `Banter.Web/README.md` for the realtime flow, build notes and production setup.

## Tags

The Night Signal design milestones are preserved as tags: `night-signal-v1`, `channel-desk-v1` and
`banter-final-look`.
