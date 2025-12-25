# Music Player (HTML/CSS/JS)

A beginner-friendly, responsive web music player with:
- Light/Dark theme toggle (saved in localStorage)
- Song list + search
- Favorites (saved in localStorage)
- Playback controls (play/pause/next/prev, seek bar, time, volume)

## How to run locally
Option A (Recommended): VS Code + Live Server
1) Install VS Code
2) Install the “Live Server” extension
3) Right-click `index.html` → “Open with Live Server”

Option B: Simple Python server
1) Open a terminal inside the project folder
2) Run:
   - Python 3: `python -m http.server 5500`
3) Open: http://localhost:5500

## Add your own songs
1) Put audio files in: `assets/music/`
2) Open `app.js`
3) Update the `songs` array:
   - title
   - artist
   - src (example: `assets/music/my-song.mp3`)

## Favorites + Theme persistence
- Favorites are stored in `localStorage` as `mp_favorites`.
- Theme is stored in `localStorage` as `mp_theme`.
Note: localStorage is browser-specific; it does not sync to GitHub.

## Common beginner mistakes
- Audio not playing: check file paths match exactly (case-sensitive on many systems).
- Using `file://` directly: use Live Server or a local server instead.
- Changed filenames but not `songs` array: update `src` paths in `app.js`.


**********************************



