# Server Architect Module

The **Server Architect** module transforms the process of setting up a server into a visual, interactive experience.

## The Blueprint System

When you run `/wizard`, you are creating a temporary **Blueprint**. This allows you to experiment with your server's layout without making any immediate changes.

### Components

*   **Categories:** The folders that hold your channels.
*   **Channels:** Text and Voice channels assigned to specific categories.
*   **Roles:** The permission hierarchy (e.g., Owner, Admin, Member).

## Automated Setup

The Wizard can automatically configure the infrastructure for other Rift modules.

| Feature | Created Channels | Purpose |
| :--- | :--- | :--- |
| **Community** | `#rules`, `#announcements` | Standard information channels. |
| **Logs** | `#mod-logs` | Private channel for moderation logs. |
| **Tickets** | (Configuration only) | Prepares the database for ticket systems. |