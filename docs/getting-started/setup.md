# Setup Guide

Welcome to the **Rift** setup guide. This page will walk you through the process of inviting the bot, configuring its initial permissions, and using the **Server Architect** to build your community in seconds.

## 1. Inviting the Bot

To get started, you need to invite Rift to your server.

!!! tip "Permissions"
    Rift requires **Administrator** permissions to function correctly as a "Server Architect". It needs to create channels, manage roles, and moderate users.

[**Click here to Invite Rift**](https://discord.com/oauth2/authorize?client_id=1329184069426348052&permissions=5076723787231222&integration_type=0&scope=bot){ .md-button .md-button--primary }

1.  Select your server from the dropdown menu.
2.  Click **Authorize**.
3.  Complete the Captcha.

---

## 2. The Server Architect (First Run)

Once Rift joins, the most powerful feature at your disposal is the **Server Architect**. This tool allows you to design your server's layout (Categories, Channels, Roles) visually and then builds it for you automatically.

### Running the Wizard
Type the following command in any channel:

```bash
/wizard
```

!!! warning "Requirement"
    You must be an **Administrator** to use this command.

### Using the Interface
The Wizard will open an interactive blueprint menu.

1.  **Add Category:** Click this to create a folder (e.g., "General", "Staff", "Gaming").
2.  **Add Text/Voice Channel:** Click these buttons to add channels to your categories. You will be asked which Category they belong to.
3.  **Add Role:** Define your server's hierarchy (e.g., "Owner", "Moderator", "Member").
4.  **Toggle Features:** Enable built-in systems like **Leveling**, **Tickets**, or **Logging** to have the bot automatically set up the necessary channels for them.

### Building
Once you are happy with your blueprint, click the green **BUILD SERVER** button.

> **Rift will now:**
>
> *   Create all the Roles you defined.
> *   Create the Categories.
> *   Create Text and Voice channels inside those categories.
> *   Set up permissions automatically.

---

## 3. Post-Setup Checklist

After the Architect finishes, your server structure is ready. Here are the next recommended steps:

*   **Set the Prefix:** If you prefer text commands, set a custom prefix.
    ```bash
    /prefix new_prefix:?
    ```
*   **Configure Logs:** If you enabled the Logging feature, ensure the `mod-logs` channel is private.
*   **Test Music:** Join a voice channel and try playing a song to ensure audio permissions are correct.
    ```bash
    /music play query:lofi hip hop
    ```

## Troubleshooting

??? question "The Wizard isn't creating channels?"
    Ensure Rift has the **Administrator** permission and that its role is **higher** than the roles it is trying to manage in the Server Settings > Roles list.

??? question "I can't see the slash commands?"
    If slash commands aren't appearing, try re-inviting the bot or checking your User Settings > Text & Images > "Use Slash Commands".
