// Field-level schemas for the generic SettingsPage renderer. Every section
// key here must match a key in GUILD_SETTINGS_SECTIONS on the bot's
// web_server.py. Field types: boolean, text, textarea, number, channel, role.
// Anything the bot stores that isn't listed as a field is still preserved
// via the "Advanced (raw JSON)" editor on the page, so nothing here can
// accidentally drop data on save.

export const SETTINGS_SECTIONS = {
  automod: {
    title: "AutoMod",
    description: "Automatic filtering for links, caps, spam, and mass mentions.",
    fields: [
      { key: "anti_link", label: "Block invite/links", type: "boolean" },
      { key: "anti_caps", label: "Block excessive caps", type: "boolean" },
      { key: "anti_spam", label: "Block message spam", type: "boolean" },
      { key: "anti_mention", label: "Block mass mentions", type: "boolean" },
      {
        key: "bad_words",
        label: "Blocked words",
        type: "list",
        help: "One word or phrase per line.",
      },
    ],
  },
  antinuke: {
    title: "Anti-Nuke",
    description: "Detects and punishes mass-destructive actions from compromised staff/bots.",
    fields: [
      { key: "enabled", label: "Enabled", type: "boolean" },
      {
        key: "punishment",
        label: "Punishment",
        type: "select",
        options: ["striproles", "kick", "ban"],
      },
      { key: "default_threshold", label: "Default threshold", type: "number" },
    ],
  },
  antiraid: {
    title: "Anti-Raid",
    description: "Locks the server down automatically during a join-rate spike.",
    fields: [
      { key: "enabled", label: "Enabled", type: "boolean" },
      { key: "join_threshold", label: "Join threshold", type: "number" },
    ],
  },
  welcome: {
    title: "Welcome Messages",
    description: "Sent when a new member joins.",
    fields: [
      { key: "welcome_channel_id", label: "Welcome channel", type: "channel" },
      { key: "welcome_role_id", label: "Auto-role on join", type: "role" },
      {
        key: "welcome_message",
        label: "Welcome message",
        type: "textarea",
        help: "Supports {user} and {server}.",
      },
      { key: "leave_message", label: "Leave message", type: "textarea" },
      { key: "dm_message", label: "DM message", type: "textarea" },
    ],
  },
  goodbye: {
    title: "Goodbye Messages",
    description: "Sent when a member leaves the server.",
    fields: [{ key: "enabled", label: "Enabled", type: "boolean" }],
  },
  leveling: {
    title: "Leveling & XP",
    description: "Text-message XP, level-up announcements, and role rewards.",
    fields: [
      { key: "enabled", label: "Enabled", type: "boolean" },
      { key: "xp_per_message", label: "XP per message", type: "number" },
      { key: "xp_cooldown", label: "XP cooldown (seconds)", type: "number" },
      { key: "xp_formula_base", label: "Formula base", type: "number" },
      { key: "xp_formula_exponent", label: "Formula exponent", type: "number" },
      { key: "level_up_channel", label: "Level-up channel", type: "channel" },
      { key: "level_up_messages", label: "Announce level-ups", type: "boolean" },
      { key: "level_up_image", label: "Use level-up image cards", type: "boolean" },
    ],
  },
  voice_xp: {
    title: "Voice XP",
    description: "XP earned for time spent in voice channels.",
    fields: [
      { key: "enabled", label: "Enabled", type: "boolean" },
      { key: "xp_per_minute", label: "XP per minute", type: "number" },
      { key: "require_others", label: "Require another member in VC", type: "boolean" },
      { key: "ignore_muted", label: "Ignore muted members", type: "boolean" },
      { key: "ignore_deafened", label: "Ignore deafened members", type: "boolean" },
    ],
  },
  invites: {
    title: "Invite Tracking",
    description: "Track who invited who, and reward top inviters.",
    fields: [
      { key: "enabled", label: "Enabled", type: "boolean" },
      { key: "channel_id", label: "Join/leave log channel", type: "channel" },
      { key: "track_fake", label: "Flag fake joins", type: "boolean" },
      { key: "vanity_message", label: "Vanity join message", type: "textarea" },
      { key: "leave_message", label: "Leave message", type: "textarea" },
    ],
  },
  reports: {
    title: "Member Reports",
    description: "Let members report issues to a staff-only channel.",
    fields: [
      { key: "enabled", label: "Enabled", type: "boolean" },
      { key: "channel_id", label: "Reports channel", type: "channel" },
      { key: "panel_channel_id", label: "Report panel channel", type: "channel" },
      { key: "ping_role_id", label: "Staff role to ping", type: "role" },
    ],
  },
  counting: {
    title: "Counting Game",
    description: "Members count upward together, one number per message.",
    fields: [{ key: "channel_id", label: "Counting channel", type: "channel" }],
  },
  jail: {
    title: "Jail System",
    description: "Role and channel used by /jail to isolate a member.",
    fields: [
      { key: "role_id", label: "Jail role", type: "role" },
      { key: "channel_id", label: "Jail channel", type: "channel" },
    ],
  },
  vanity: {
    title: "Vanity Rewards",
    description: "Reward members who advertise your vanity URL in their status.",
    fields: [
      { key: "enabled", label: "Enabled", type: "boolean" },
      { key: "vanity_string", label: "Vanity string to match", type: "text" },
      { key: "strict", label: "Strict matching", type: "boolean" },
      { key: "reward_role_id", label: "Reward role", type: "role" },
      { key: "log_channel_id", label: "Log channel", type: "channel" },
      { key: "thank_you_channel_id", label: "Thank-you channel", type: "channel" },
      { key: "thank_you_message", label: "Thank-you message", type: "textarea" },
    ],
  },
  tickets: {
    title: "Ticket Auto-Delete",
    description: "Automatically delete closed ticket channels after a delay.",
    fields: [
      { key: "enabled", label: "Enabled", type: "boolean" },
      { key: "delay", label: "Delay (seconds)", type: "number" },
    ],
  },
  boost: {
    title: "Server Boost Messages",
    description: "Announcement posted when a member boosts the server.",
    fields: [{ key: "enabled", label: "Enabled", type: "boolean" }],
  },
};

// Read-only sections: the bot exposes a getter but the setter takes
// positional args rather than a config dict, so editing safely needs a
// bespoke endpoint. Shown for visibility, not editable, from this dashboard.
export const READONLY_SECTIONS = {
  starboard: { title: "Starboard", description: "Configure via /starboard in Discord." },
  logging: { title: "Logging", description: "Configure via /logging setup in Discord." },
  verification: {
    title: "Verification",
    description: "Configure via /setup_verification in Discord.",
  },
  modmail: { title: "ModMail", description: "Configure via the ModMail setup command in Discord." },
};
