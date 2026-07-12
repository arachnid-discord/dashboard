# Moderation Module

The Moderation module provides security, logging, and automated enforcement. It is designed to be "Set and Forget".

## Automated Systems

### Auto-Moderation (AutoMod)
Rift filters chat in real-time.

**Command:** `/automod toggle <feature>`

| Feature | Description |
| :--- | :--- |
| **Anti-Spam** | Prevents sending messages too quickly. |
| **Anti-Invite** | Deletes Discord invite links (ignores invites to the current server). |
| **Anti-Links** | Deletes all HTTP links (configurable whitelists). |
| **Caps-Lock** | Deletes messages with >70% capital letters. |

### Verification Gate
Prevent raid bots from entering your server.

1.  **Setup:** `/verification setup channel:#verify role:@Member`
2.  **Flow:**
    *   New user joins -> Sees only `#verify`.
    *   User clicks "Verify" button.
    *   Bot checks account age/flags.
    *   **Success:** Bot gives `@Member` role.
    *   **Fail:** Bot kicks user.

---

## Manual Actions

All manual actions are logged to the configured log channel.

### Punishments

*   `/ban <user> [reason] [time]`
    *   Example: `/ban @User "Raiding" 7d` (Bans for 7 days).
*   `/kick <user> [reason]`
*   `/mute <user> [time] [reason]`
    *   Uses Discord's native "Timeout" feature.
*   `/warn <user> [reason]`
    *   Adds a strike to the user's record. 3 strikes = Kick (Configurable).

### Utilities

*   `/lock` - Locks the current channel (denies `@everyone` Send Messages).
*   `/unlock` - Unlocks the channel.
*   `/purge <amount>` - Bulk deletes messages.
    *   `/purge user:@User 10` (Delete only 10 messages from specific user).
*   `/slowmode <seconds>` - Sets channel rate limit.

---

## Logging

Rift logs all actions to a dedicated channel.

**Setup:**
1.  Create a channel (e.g., `#mod-logs`).
2.  Run `/settings logchannel #mod-logs`.

**What is logged?**
*   Command usage (Mod actions).
*   Message edits/deletes.
*   Member join/leave.
*   Voice channel activity (Join/Move/Leave).
