# Hi-Fi Music Module

Rift's music module is designed for audiophiles. It supports high-fidelity streaming, seamless Spotify bridging, and advanced DSP (Digital Signal Processing) filters.

## Supported Sources

| Source | Icon | Support Type | Quality |
| :--- | :--- | :--- | :--- |
| **YouTube** | :material-youtube: | Search, URL, Playlist | 128-160kbps (Opus) |
| **SoundCloud** | :material-soundcloud: | Search, URL | 128-256kbps |
| **Bandcamp** | :material-album: | URL | High (Source dependent) |
| **Spotify** | :material-spotify: | URL (Bridge) | High (Bridge dependent) |
| **Twitch** | :material-twitch: | Stream URL | Live Audio |

---

## Commands

### Playback Control

=== "User Commands"

    *   `/play <query>` - Join VC and play a song.
    *   `/pause` - Pause playback.
    *   `/resume` - Resume playback.
    *   `/skip` - Vote to skip the current song.
    *   `/queue` - Show the upcoming songs.
    *   `/nowplaying` - Show current song info + progress bar.

=== "DJ Commands"

    *(Requires `DJ` role or Admin)*

    *   `/stop` - Stop playback and clear queue.
    *   `/force skip` - Skip without voting.
    *   `/volume <0-100>` - Change volume.
    *   `/seek <timestamp>` - Jump to a specific time (e.g., `1:30`).

### Audio Filters

Apply real-time effects to the audio stream.

**Usage:** `/filter set <filter_name>`

*   `nightcore`: Faster, higher pitch. Anime vibe.
*   `vaporwave`: Slower, lower pitch. Retro vibe.
*   `bassboost`: +10dB to low frequencies.
*   `8d`: Rotates audio around the stereo field.
*   `karaoke`: Attempts to remove vocals (Mid-Side cancellation).

---

## Features Explained

### The Spotify Bridge
When you paste a Spotify link, Rift does **not** stream from Spotify (this is technically impossible for bots).

1.  Bot reads track metadata: *Artist - Title*.
2.  Bot searches YouTube Music/SoundCloud for the best audio match.
3.  Bot streams the matched audio.

### Last.fm Integration
Track your listening habits.

1.  Create a [Last.fm](https://www.last.fm/) account.
2.  Run `/fm login` and authorize the bot.
3.  **Scrobble:** Every song you listen to is added to your Last.fm profile.
4.  **Flex:** Use `/fm chart` to generate a 3x3 grid of your top albums.

### AI Recommendations
If the queue is empty, enable Autoplay to have Rift guess what you want to hear next.

*   **Command:** `/autoplay toggle`
*   **Logic:** Uses your listening history + current song genre to queue similar tracks.
