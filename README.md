# Arachnid Dashboard

A web dashboard for managing the Arachnid Discord bot: moderation, AutoMod,
anti-nuke/anti-raid, welcome messages, leveling, voice XP, invites, reports,
tickets, counting, jail, vanity rewards, boosts, music, prefix, and disabled
commands — all backed by the bot's real database, not a mock.

It's a separate app from the marketing site (`clh-main/`) and from the bot
itself (`arachnid-main/`), living in its own folder so it can be deployed
independently.

## How it talks to the bot

The bot already runs a small web server (`arachnid-main/cogs/web_server.py`,
a `Quart` app on port `25739` by default) for things like the stats API and
music control. This dashboard adds to it:

- `GET  /api/guild/<id>/info` — name, icon, member count, channel list, role list, prefix
- `GET  /api/guild/<id>/settings/<section>` — read one settings section
- `POST /api/guild/<id>/settings/<section>` — write one settings section

Every settings section maps directly to the same `Database` getter/setter
pair the bot's slash commands already use (see `GUILD_SETTINGS_SECTIONS` in
`web_server.py`), so changes made here take effect immediately — there's no
separate config store to keep in sync.

Auth works the same way the existing mod endpoints already do: the frontend
signs the user in with Discord's OAuth2 **implicit grant** (no client secret
needed, so this can stay a static frontend), gets a Discord access token, and
sends it as `Authorization: Bearer <token>` on every API call. The bot
verifies the token against `discord.com/api/v10/users/@me` and checks the
user actually has `Manage Server` in the target guild before allowing reads
or writes.

## Setup

1. **Discord application** — reuse the bot's existing application in the
   [Discord Developer Portal](https://discord.com/developers/applications).
   Under OAuth2 → Redirects, add the URL this dashboard will be served from
   plus `/callback` (e.g. `http://localhost:5174/callback` for local dev).

2. **Environment** —
   ```
   cp .env.example .env
   ```
   Fill in `VITE_DISCORD_CLIENT_ID` (same app as the bot), `VITE_API_BASE`
   (wherever `web_server.py` is reachable), and `VITE_DISCORD_REDIRECT_URI`
   (must exactly match what you added in the Developer Portal).

3. **Install & run** —
   ```
   npm install
   npm run dev
   ```

4. **Bot side** — nothing extra to run; the new endpoints are part of the
   existing `WebServer` cog and start with the bot as normal.

## Troubleshooting

**404 right after logging in with Discord.** Discord does a hard browser
redirect to your `redirect_uri` — if that lands on a deep link like
`/callback` and whatever's serving the app doesn't rewrite unknown paths to
`index.html`, the browser 404s before React Router ever loads. This mostly
hits `vite preview` and static hosts (a plain `npx serve dist`, S3, etc.);
`vite dev` handles it automatically. Two ways to fix it:

- **Preferred:** point `VITE_DISCORD_REDIRECT_URI` at the root (`.../`)
  instead of `.../callback`, and update the same URL in the Discord
  Developer Portal's OAuth2 redirect list. The root route always resolves,
  so this sidesteps the problem entirely.
- **Or:** keep `/callback`, but make sure your host rewrites unknown paths
  to `index.html`. A Netlify `_redirects` and a `vercel.json` rewrite are
  already included for those two hosts; other static hosts need the
  equivalent SPA-fallback rule.

## Notes / known limits

- A handful of sections (**Starboard, Logging, Verification, ModMail**) are
  shown read-only. Their `Database` setters take individual positional
  arguments rather than a config dict, so editing them safely needs a
  purpose-built endpoint rather than the generic dispatcher — left as a
  follow-up rather than guessed at.
- The ticket **panel** itself (category, embed title/color) is stored by
  `cogs/tickets.py` in its own `data/tickets_config.json` file, separate
  from the SQLite `Database` class. Only **ticket auto-delete** (which *is*
  in the database) is editable here for now.
- Every settings page has a "raw JSON" toggle, so any field the bot stores
  that isn't in the form yet is still visible and round-trips correctly on
  save — nothing gets silently dropped.
