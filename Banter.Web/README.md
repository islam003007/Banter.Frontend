# Banter Web

A portfolio demo client for the Banter chat API. React 19, TypeScript, Vite, TanStack Query,
React Router, and SignalR. The UI is custom CSS — no component library, no Tailwind.

The app is designed as a warm paper “signal desk”: a conversation rail and reading pane on
desktop, a live chat with a conversation drawer on mobile. Cream canvas, charcoal ink, acid-lime
connection signals, and coral unread/send accents. Fraunces sets the display type, Instrument Sans
carries the body, and IBM Plex Mono handles metadata.

## Run it

Prerequisites:

- Node.js 22 or newer.
- The Banter API, with a development database and Redis, running and reachable.
- `Demo:Enabled` must be `true` on the API for the one-click demo picker. It is enabled by default in
  `appsettings.Development.json`.

From the repository root:

```bash
# Terminal 1 — API and infrastructure
cd Banter
cp .env.example .env
# fill the secrets in .env, then:
docker compose up -d

# If the API was published on an ephemeral host port:
docker compose port api 8080
```

From this directory:

```bash
cd Banter.Web
npm install
npm run dev
```

Open `http://localhost:5173`.

The Vite dev proxy forwards `/api` and `/hubs` to `http://localhost:8080`, including the websocket
upgrade. Override the API target when needed:

```bash
VITE_API_TARGET=http://localhost:5261 npm run dev
```

`http://localhost:5261` is the API's `dotnet run` profile. If Compose published the API on a random
port, use the value printed by `docker compose port api 8080`. Put the same target in `.env` if you
prefer not to prefix the command.

### Production build

```bash
npm run build
npm run preview
```

`preview` runs the built app on `http://localhost:4173` with the same `/api` and `/hubs` proxy. For a
real deployment, serve `dist/` from any static host and reverse-proxy `/api` and `/hubs` to the API
on the same origin, with websocket upgrades enabled. Cookie authentication expects same-origin
requests; no CORS configuration is needed.

## Demo access

Open `/login`. The six seeded people appear as one-click session cards. Click **Continue as Ahmed**
to enter the populated workspace. No password is rendered, stored, or bundled by this app; sign-in
uses the API's seeded-user allowlist (`POST /api/v1/auth/demo-login`).

A labelled “Use email and password” link opens the regular cookie login. `/register` creates a real
ASP.NET Identity account and signs in immediately (email confirmation is disabled in the demo API).

To see realtime:

1. Sign in as **Ahmed** in the normal browser window.
2. Open the same URL in a private window.
3. Continue as **Sara** there.
4. Send a message from either window. The other receives it over SignalR, and the rail’s unread
   count updates.

The demo password stays server-side in the API configuration (`DataSeed:UsersPassword`). It is not
part of this frontend.

## Screens and flows

| Route | What it does |
| --- | --- |
| `/login` | One-click demo roster, standard email/password sign-in, private-window note |
| `/register` | Secondary account form; auto signs in on success |
| `/inbox` | Conversation rail with unread counts, presence, last message, and empty state; welcome pane on desktop |
| `/c/:conversationId` | Cursor-paginated history, older-page loading with scroll anchoring, optimistic send, mark-read, details drawer, leave |
| `/new` | Debounced user search with cursor paging, direct-message and group builder |
| `/me` | Session sheet, connection state, logout |

On mobile, `/inbox` is the full conversation list; chat is the primary screen, with the rail
available as a focus-managed drawer. The realtime state is shown as `live`, `linking`,
`reconnecting`, or `offline`, with a manual retry when the socket stops.

## API contract used

All REST calls go to `/api/v1` with `credentials: 'include'`. SignalR connects to `/hubs/chat` with
`withCredentials: true` and automatic reconnect, then calls `Heartbeat` every 25 seconds.

The client targets the endpoints documented in
`docs/superpowers/specs/2026-11-18-banter-demo-frontend-design.md` and the live API:

- `GET /auth/me` → `{ id, email, displayName, profilePictureUrl }`
- `GET /auth/demo-users` → array of demo users (the client also tolerates a `{ users }` wrapper)
- `POST /auth/demo-login` `{ userId }`
- `POST /auth/login` `{ email, password }` and `POST /auth/logout`
- `POST /users/register` `{ email, displayName, profilePictureUrl, password, passwordConfirm }`
- `GET /conversations?pageSize=50` → conversations with `unreadCount` and nullable last-message
  fields. Both `nextCursor` and the existing `nextcursor` spelling are accepted.
- `GET /conversations/{id}` → `{ conversationId, title, isGroup, participants[{ userId,
  displayName, profilePictureUrl, isOnline }] }`
- `GET /conversations/{id}/messages?cursor=&pageSize=30` → newest-first messages plus
  `nextCursor`, `hasMore`, `lastSeenMessageId`
- `POST /conversations/{id}/messages` `{ content }`
- `POST /conversations/{id}/mark-as-read`
- `DELETE /conversations/{id}/participants/me`
- `POST /conversations` `{ participantsIds, groupTitle }` (the API's spelling)
- `GET /users/search?searchTerm=&cursor=&pageSize=20`

Realtime `ReceiveMessage` is expected to include `content`, `senderDisplayName`,
`senderProfilePictureUrl`, `conversationId`, and `createdAt`. Incoming messages update the open feed
and the inbox cache immediately. If a conversation is not in the inbox cache, the inbox is
invalidated so a newly created or newly active thread appears.

## Notes

- No passwords or demo credentials are hard-coded in this client.
- The composer sends on Enter; Shift+Enter inserts a newline. The optimistic message is marked
  “sending” until the API returns its id.
- Direct threads cannot be left in the domain model; only group threads show the leave action.
- `npm run typecheck` is available in addition to `dev`, `build`, and `preview`.
