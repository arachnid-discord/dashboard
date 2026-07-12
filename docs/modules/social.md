# Social & Leveling Module

Build engagement with Rift's social features. Rewarding activity creates a stickier community.

## Leveling System

Users earn **XP** (Experience Points) for chatting and being active in voice channels.

### Mechanics
*   **Chat XP:** 15-25 XP per message (1 minute cooldown to prevent spam).
*   **Voice XP:** 10 XP per 5 minutes in a non-AFK voice channel.

### Rewards
Admins can set up Role Rewards that are automatically assigned when a user reaches a specific level.

**Configuration:**
*   `/level config rewards add level:5 role:@Regular`
*   `/level config rewards add level:10 role:@Expert`
*   `/level config message <on/off>` (Toggle "Level Up" messages in chat).

---

## Profiles

Every user has a customizable profile card.

**Command:** `/profile`

**Displays:**
*   Global Rank
*   Server Level & XP
*   Economy Balance
*   Reputation Points
*   Custom Bio (`/profile setbio`)
*   Custom Background (`/profile setbg` - *Premium feature*)

---

## Reputation

A community-driven trust system.

*   **Give Rep:** `/rep @User`
*   **Cooldown:** 24 Hours.
*   **Purpose:** Shows how trusted/helpful a user is on their profile.

## Sticky Messages
Pin a message to the bottom of a channel so it's always visible, even as new messages come in.

*   **Command:** `/sticky set message:Read the rules!`
*   **Logic:** When a new message is sent, the bot deletes the old sticky message and reposts it at the bottom.
