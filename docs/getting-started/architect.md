# The Architect Wizard

The **Architect Wizard** is Rift's signature feature. It allows you to visually design and build your server's infrastructure.

## Overview

The Wizard is an interactive "Blueprint" editor. You define what you want your server to look like, and Rift builds it for you.

<div class="mermaid">
graph TD
    A[Start Wizard] --> B{Design Blueprint}
    B --> C[Add Categories]
    B --> D[Add Channels]
    B --> E[Define Roles]
    B --> F[Toggle Features]
    F --> G[Build Server]
    G --> H[Finished Infrastructure]
</div>

## Using the Wizard

Run the command to open the interface:

```bash
/wizard
```

### 1. The Blueprint Menu
You will see a menu with several buttons:

*   **Add Category:** Creates a folder (e.g., "Welcome", "Gaming").
*   **Add Text:** Adds a text channel to a specific category.
*   **Add Voice:** Adds a voice channel to a specific category.
*   **Add Role:** Creates a role with preset permissions.

### 2. Feature Toggles
Enable built-in systems to have Archanid automatically create their required channels:

*   **Logs:** Creates `#mod-logs` for audit trails.
*   **Community:** Creates `#rules` and `#announcements`.

### 3. Build Process
Once your blueprint is ready, click **BUILD SERVER**. Archanid will create the channels, sort them, and assign permissions automatically.

!!! note "Note"
    The Wizard appends new channels to your server. It does not delete your existing channels.