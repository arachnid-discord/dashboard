# Installation & Setup

Setting up Rift is straightforward. Follow this guide to ensure the bot has the necessary permissions to function correctly.

## 1. Invite the Bot

Click the button below to invite Rift to your server.

[**Invite Rift**](https://discord.com/oauth2/authorize?client_id=1329184069426348052&permissions=5076723787231222&integration_type=0&scope=bot)

!!! warning "Critical Permissions"
    Rift acts as a **Server Architect**. This means it needs to modify channels, manage roles, and delete messages. 
    
    Ensure you grant the **Administrator** permission when inviting. Without this, the `/wizard` and Moderation features will fail.

## 2. Verify Presence

Once the bot joins your server:

1.  Check that the bot is online.
2.  Ensure it has a role **higher** than the members it needs to moderate.
3.  Type `/` in any channel to verify that Slash Commands are registered.

!!! failure "Don't see commands?"
    If typing `/` does not show Rift's commands:
    
    1.  Go to **Server Settings > Integrations > Bots & Apps**.
    2.  Ensure Rift is listed.
    3.  If not, kick the bot and re-invite it using the link above.

## 3. Initial Configuration

Before opening your server to the public, run the **Architect Wizard**.

*   **Command:** `/wizard`
*   **Goal:** Create necessary channels (e.g., `mod-logs`, `music`, `general`).

[**Next: The Architect Wizard**](architect.md)
