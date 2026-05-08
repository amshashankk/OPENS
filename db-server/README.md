# opens-db-server

Tiny SQL-over-HTTP API that exposes the local `dev.db` SQLite file to the OPENS Next.js app over the network. Designed to be run on a laptop / Mac mini and tunneled to the public internet via Cloudflare Tunnel.

**Why it exists:** managed SQLite hosts (Turso, D1) meter rows-read, and the OPENS home page does a few `COUNT(*)` queries against a 1.24M-row table. That blows through monthly free quotas. Self-hosting the DB on hardware you already own removes the meter at the cost of needing the host to be online.

## Quick start

```bash
cd db-server
npm install
cp .env.example .env
# edit .env, set DB_TOKEN to a long random string
DB_TOKEN=$(grep ^DB_TOKEN .env | cut -d= -f2) npm start
```

Smoke test (in another terminal):

```bash
curl -s http://127.0.0.1:3001/health
# {"ok":true}

curl -s -X POST http://127.0.0.1:3001/query \
  -H "Authorization: Bearer $DB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sql":"SELECT COUNT(*) AS c FROM Asset"}'
# {"rows":[{"c":1239232}]}
```

## API

All endpoints require `Authorization: Bearer <DB_TOKEN>` except `/health`.

### `GET /health`
Returns `{ ok: true }`. No auth.

### `POST /query`
Body: `{ "sql": "<sql>", "args": [<bound params>] }`

- For SELECT/WITH/PRAGMA/EXPLAIN: returns `{ rows: [...] }`
- For others: returns `{ rows: [], rowsAffected: N, lastInsertRowid: N }`

### `POST /batch`
Body: `{ "stmts": [ { "sql": "...", "args": [...] }, ... ] }`

Runs all statements in a single SQLite transaction. Returns `{ results: [<one entry per stmt>] }`.

## Deploying behind Cloudflare Tunnel

1. `brew install cloudflared && cloudflared tunnel login`
2. `cloudflared tunnel create opens-db`
3. `cloudflared tunnel route dns opens-db db.your-domain.com`
4. Create `~/.cloudflared/config.yml`:
   ```yaml
   tunnel: <UUID-from-create>
   credentials-file: /Users/<you>/.cloudflared/<UUID>.json
   ingress:
     - hostname: db.your-domain.com
       service: http://127.0.0.1:3001
     - service: http_status:404
   ```
5. `cloudflared tunnel run opens-db`

Then in the Next.js app and on Netlify, set:

```
DATABASE_URL=https://db.your-domain.com
DB_TOKEN=<same token as the server>
```

The app's `src/lib/db.ts` should call `${DATABASE_URL}/query` with the `?` placeholder SQL it already uses. (See `db-server-client.example.ts` for a drop-in.)

## Auto-start on Mac login (optional)

`~/Library/LaunchAgents/com.opens.db.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>com.opens.db</string>
  <key>WorkingDirectory</key><string>/Users/<you>/opens-db-server</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/node</string>
    <string>server.mjs</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict><key>DB_TOKEN</key><string>YOUR_TOKEN_HERE</string></dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>StandardOutPath</key><string>/tmp/opens-db.log</string>
  <key>StandardErrorPath</key><string>/tmp/opens-db.err</string>
</dict></plist>
```

```bash
launchctl load ~/Library/LaunchAgents/com.opens.db.plist
```

For cloudflared as a service: `sudo cloudflared service install`.

## Caveats

- The site is up only while this Mac is on, awake, and online. Disable sleep when plugged in.
- The server runs SQL verbatim — only your Next.js app should know `DB_TOKEN`. Treat it like a database password.
- `better-sqlite3` is a native module compiled per platform. If you move the folder to a different machine, run `npm install` again to rebuild bindings.
