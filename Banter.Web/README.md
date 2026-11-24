# Banter Web

A portfolio demo client for the Banter chat API. React 19, TypeScript, Vite, TanStack Query,
React Router, and SignalR. The UI is custom CSS — no component library, no Tailwind.

The interface uses a near-black charcoal-green canvas, a channel rail and reading pane on desktop,
and a focus-managed channel drawer on mobile. Green and mint carry brand, presence, active
channels, and outbound messages; amber marks unread counts, bot typing, and transient attention;
ice blue carries links and focus. Manrope sets display and body type, IBM Plex Mono carries
metadata and channel indices. The UI is built around a live-channel metaphor: numbered channels,
transmission bands, uplink metadata, a live signal meter, and an AI operator roster.

## Structure

| Path | Responsibility |
| --- | --- |
| `src/app/` | Providers, query client, routes, render error boundary |
| `src/features/auth/` | Session provider, route guards, login/register pages and forms |
| `src/features/inbox/` | Welcome pane, channel rail, recent transmissions, AI operators |
| `src/features/conversation/` | Shared inbox/detail queries and conversation identity helpers |
| `src/features/chat/` | Chat page, message timeline, composer, send/read/scroll/typing hooks |
| `src/features/new-conversation/` | Debounced directory search, direct/group builder |
| `src/features/details/` | Channel details drawer, participants, focus trap, leave flow |
| `src/features/me/` | Session page |
| `src/lib/api/` | Transport, contracts, normalizers, ProblemDetails errors, API client |
| `src/lib/realtime/` | SignalR hub client, notification normalizers, cache updates, bot typing |
| `src/lib/format/` | Pure date/time and text helpers |
| `src/components/ui/` | Shared presentational primitives |
| `src/test/` | Vitest setup, MSW server, fixtures, query-client/render helpers |
| `e2e/` | Playwright smoke suite |

Page components stay thin: data lives in feature hooks, cache math lives in pure functions, and
presentational components receive plain props.

## Production API and hub URLs

Local development keeps the Vite proxy defaults. For a deployed build, set:

```env
VITE_API_BASE_URL=https://api.example.com
VITE_HUB_URL=https://api.example.com/hubs/chat
```

`VITE_API_BASE_URL` is the API origin only. The client appends `/api/v1`.
When both are unset, the client uses `/api/v1` and `/hubs/chat`.

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

Open `http://localhost:5173`. The dev server uses `strictPort: true`, so a port conflict fails
loudly instead of silently moving to another port.

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

## Testing

Unit and component tests use Vitest, jsdom, React Testing Library, user-event, and MSW. They run
entirely in-process and need no API, database, or Redis.

```bash
npm test               # one run
npm run test:watch     # watch mode
npm run test:coverage  # v8 coverage; writes coverage/
npm run typecheck      # tsc -b
npm run build          # typecheck + production bundle
```

Coverage focuses on behaviour rather than snapshots: API transport and normalization, date/text
formatting, message flattening/grouping, realtime cache updates and bot-typing expiry, composer
keyboard behaviour, message list states, inbox/channel rail states, directory search and group
builder rules, details focus trap/leave flow, auth guards, app routes, and the render boundary.

### End-to-end smoke

Playwright covers login, the inbox, an optimistic message send, starting a direct thread, and the
details drawer. The suite needs a running Banter API with the demo roster enabled (default target
`http://localhost:8080`, override with `VITE_API_TARGET`). Playwright starts Vite on port `5199`,
runs the tests, and stops it again; it does not leave a server behind.

```bash
# once per machine, if the browser is not installed
npx playwright install chromium

npm run test:e2e
```

Useful overrides:

```bash
E2E_PORT=5210 npm run test:e2e                  # web-server port
E2E_BASE_URL=http://localhost:5173 npm run test:e2e  # use an already-running frontend
```

`E2E_BASE_URL` disables Playwright's own web server, so that frontend must already proxy `/api`
and `/hubs` to a running API. The smoke send writes a message to the Ahmed ↔ Mohamed thread, and
the new-thread test may create or reuse the Ahmed ↔ Sara direct thread; run it against a
disposable demo database.

## Demo access

Open `/login`. The six seeded people appear as one-click session cards. Click **Continue as Ahmed**
to enter the populated workspace. No password is rendered, stored, or bundled by this app; sign-in
uses the API's seeded-user allowlist (`POST /api/v1/auth/demo-login`).

The email/password form below the roster uses regular cookie login. `/register` creates a real
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
| `/inbox` | Channel rail with unread counts, presence, last message, AI roster; welcome pane |
| `/c/:conversationId` | Cursor-paginated history, older-page loading with scroll anchoring, optimistic send, mark-read, details drawer, leave |
| `/new` | Debounced user search with cursor paging, direct-message and group builder |
| `/me` | Session sheet, connection state, logout |

On mobile, `/inbox` is the full welcome workspace, chat is the primary screen, and the rail is a
focus-managed drawer. The realtime state is shown as `live`, `linking`, `reconnecting`, or
`offline`, with a manual retry when the socket stops. A render error is caught by the app error
boundary instead of leaving a blank page.

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
invalidated so a newly created or newly active thread appears. Bot typing signals expire after 12
seconds so a dropped signal never leaves the indicator stuck.

## Notes

- No passwords or demo credentials are hard-coded in this client.
- The composer sends on Enter; Shift+Enter inserts a newline. The optimistic message is marked
  “sending” until the API returns its id.
- Direct threads cannot be left in the domain model; only group threads show the leave action.
- `npm run typecheck` is available in addition to `dev`, `build`, `preview`, and the test commands.
