# Configuration

Rift offers advanced configuration options for bot owners and server administrators. This section covers managing bot ownership, privileged users, and global settings.

## Bot Owners

Bot owners have absolute control over the bot, including access to the `eval` command and the ability to manage privileged users.

!!! danger "Security Warning"
    **NEVER** add a stranger as a bot owner. They can execute arbitrary code on your host machine.

### Managing Owners
Only the original application owner (the Discord account that created the bot) can add new owners initially.

*   **Add Owner:**
    ```bash
    /settings add_owner user:@username
    ```
*   **Remove Owner:**
    ```bash
    /settings remove_owner user:@username
    ```
*   **List Owners:**
    ```bash
    /settings list_owners
    ```

---

## Privileged Users

Privileged users are trusted members who are granted access to specific restricted features without being full bot owners. This is useful for giving a friend access to the music system's admin controls without giving them shell access.

### Granting Privileges
Use the `/settings add_privileged_user` command. You can assign multiple privileges by separating them with commas.

**Syntax:**
```bash
/settings add_privileged_user user:@username privileges:music,gamble
```

### Available Privileges

| Privilege | Description |
| :--- | :--- |
| `music` | Bypass music voting requirements, force skip, and manage the player. |
| `gamble` | Access restricted economy/gambling admin tools. |
| `media` | Access advanced image processing features that might be resource-heavy. |
| `lastfm` | Access restricted Last.fm management tools. |
| `all` | Full access to all restricted user commands. |

### Managing Privileges
*   **Remove Privileges:**
    ```bash
    /settings remove_privileged_user user:@username
    ```
*   **List Privileged Users:**
    ```bash
    /settings list_privileged_users
    ```

---

## Server Settings

### Custom Prefix
While Rift is designed for Slash Commands (`/`), it also supports legacy text commands. You can change the prefix for your server.

**Command:**
```bash
/prefix new_prefix:!
```
*   **Default:** `!`
*   **Example:** `/prefix ?` will change the bot to respond to `?help`.
