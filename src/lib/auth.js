const TOKEN_KEY = "arachnid_dashboard_token";

export const CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID || "";
// Points at the app root rather than a deep link like /callback: a hard
// browser redirect (which is what Discord does) to a deep link 404s on any
// host that isn't rewriting unknown paths to index.html (e.g. `vite preview`
// or a static host without SPA fallback configured). "/" always resolves.
export const REDIRECT_URI =
  import.meta.env.VITE_DISCORD_REDIRECT_URI || `${window.location.origin}/`;

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function buildLoginUrl() {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "token",
    scope: "identify guilds",
  });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

// Same permission set the bot's own `/utility invite` command generates —
// keep these in sync if that ever changes.
const BOT_INVITE_PERMISSIONS = "5076723787231222";

export function buildInviteUrl(guildId) {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    permissions: BOT_INVITE_PERMISSIONS,
    scope: "bot applications.commands",
    guild_id: guildId,
    disable_guild_select: "true",
  });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

// Discord's implicit-grant flow returns the token in the URL fragment
// (#access_token=...&token_type=...), not a query string.
export function parseTokenFromHash(hash) {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  return params.get("access_token");
}

const MANAGE_GUILD = 0x20;
const ADMINISTRATOR = 0x8;

export function canManageGuild(guild) {
  if (guild.owner) return true;
  const perms = BigInt(guild.permissions || 0);
  return (perms & BigInt(MANAGE_GUILD)) !== 0n || (perms & BigInt(ADMINISTRATOR)) !== 0n;
}

export async function fetchDiscordUser(token) {
  const res = await fetch("https://discord.com/api/v10/users/@me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to load Discord identity");
  return res.json();
}

export async function fetchDiscordGuilds(token) {
  const res = await fetch("https://discord.com/api/v10/users/@me/guilds", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to load your servers");
  return res.json();
}
