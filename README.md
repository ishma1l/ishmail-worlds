# Ishmail Worlds

A cinematic, three-world entertainment screen for the Nebula Mars 3 Air (or any 16:9 screen).
It's plain HTML, CSS and JavaScript. Nothing to install, no subscriptions, no hosting.

```
WELCOME BACK, ISHMAIL.  →  choose a portal  →  DARK CITY · DRIVE · EMPIRE
```

## 1. Launch it

**Easiest (Windows):** double-click **`Launch Ishmail Worlds.bat`**.
It opens Chrome full-screen with sound allowed to start straight away, using its own small Chrome profile so your normal Chrome isn't affected.

**Manual:** open `index.html` in Chrome and press **F** for fullscreen. Without the launcher, Chrome keeps sound off until your first key press or click. That's normal.

## 2. Get it on the projector

The Mars 3 Air has Chromecast built in. With the laptop and projector on the same Wi-Fi:

1. Launch Ishmail Worlds in Chrome.
2. Open Chrome's **⋮ menu → Cast, save and share → Cast…**
3. Under **Sources**, pick **Cast tab** (sends picture and sound), then pick the Mars 3 Air.

You can also connect the laptop by **HDMI**, which gives the smoothest playback.
Control everything from the laptop keyboard.

## 3. Controls

| Key | What it does |
|---|---|
| **Enter** / click | Skip the intro · enter a world · enlarge the selected panel |
| **← → ↑ ↓** | Move between portals or between media panels |
| **1 2 3** | Jump to Dark City / Drive / Empire from anywhere |
| **Esc** (or Backspace / H) | Close a panel, or go back to world selection |
| **O** | Open the featured reel on TikTok / Instagram |
| **C** | Instagram reels: show just the video ↔ the full Instagram post |
| **Space** | Pause / play every video in the current world |
| **M** | Sound on / off |
| **F** | Fullscreen |
| **Q** | Next quote |
| **L** | Lightning strike (Dark City) |
| **R** | Rev the engine (Drive) |
| **?** | Show all controls |

All sound (rain, thunder, the six-cylinder engine, the Empire pad and chimes) is generated live in the browser. There are no audio files.

## 4. The three worlds

| | Dark City | Drive | Empire |
|---|---|---|---|
| Feel | Rain-soaked night city, surveillance | Dark showroom, signal red | Golden hour, luxury, calm |
| Type | Oswald + JetBrains Mono | Saira (wide, technical) | Cormorant Garamond + Jost |
| Layout | HUD columns of CCTV feeds around a "case file" | One huge floating display + 2×2 garage bays + shift-light rev strip | Arched centrepiece, quote column, round watch dial |
| Live effects | Canvas rain + splashes, searchlights, lightning + thunder, typed "intercept" quotes, ticker | Light sweep, engine start-up, R-to-rev with LEDs and shake | Drifting gold dust, word-by-word quotes, warm pad |
| Featured | Your TikTok (Alfred / Bruce Wayne clip) | Your Instagram reel `Dbi7uqvJABz` | Your Instagram reel `DeAEWPmNvNb` |

## 5. Featured reels and blocked embeds

Each featured slot tries three things, in order:

1. **A local copy.** If `media/featured/city_featured.mp4` (or `drive_featured.mp4` / `empire_featured.mp4`) exists, it plays from your computer. This works **offline** and is the most reliable.
2. **The official embed.** Your TikTok and Instagram links are embedded live. The TikTok number is already filled in (`7541735536759786774`). Instagram embeds usually need a click on the video to start. With **C** on (the default), Instagram's header and footer are trimmed off so only the video shows. If the picture ever looks misaligned, press **C** to see the full post, or set `crop: false` in `js/config.js`.
3. **A clear fallback.** If you're offline or the platform refuses to play, the slot shows a QR code to watch on your phone and an **Open original** button (or press **O**). It never swaps in unrelated footage.

Tested: I confirmed in a real browser that all three reels exist and play on TikTok's and Instagram's own embed players. I could **not** test them playing *inside this page*: my test machine has no internet, and the Claude app's browser blocks third-party frames. If one stays blank on your laptop, use **O** or add a local copy.

## 6. Add or replace videos

All media lives in `media/`, and all settings live in **`js/config.js`**. That's the only file you need to edit.

- **Your character edits (Dark City):** save clips as `media/city/edit1.mp4`, `edit2.mp4`, `edit3.mp4`. They replace the placeholder loops automatically.
- **Your car clip (Drive):** `media/drive/car1.mp4`
- **Your lifestyle clip (Empire):** `media/empire/life1.mp4`
- **Swap any other panel:** change its `src` in `js/config.js`, e.g. `src: "media/drive/my-911.mp4"`. Images (`.jpg`, `.png`, `.webp`) work too.
- **Background of a world:** change `background:` for that world.
- **Quotes:** edit the `quotes:` lists. These are written for this app; replace them with your own favourites.
- **Name on the intro:** `name: "ISHMAIL"` at the top of the file.

Tips: use **MP4 (H.264)**. 1080p or 720p at a modest bitrate keeps several videos playing smoothly at once. Panels play muted. Press **Enter** on a panel to watch it large, with sound if **M** is on.

A panel whose file is missing shows a small yellow "Add your clip →" note and plays a built-in loop instead, so nothing ever shows as a broken box.

## 7. What's included

- `index.html`: the experience
- `css/`: one stylesheet per world, plus the intro and hub styles
- `js/config.js`: **your settings**
- `js/app.js`: navigation, transitions, media handling
- `js/audio.js`: synthesised sound
- `js/effects.js`: rain, dust and intro particles
- `media/`: 12 original looping videos (rendered for this project, so you own them), QR codes, and the `featured/` folder for offline copies
- `fonts/`: open-source fonts, bundled so everything works offline

The built-in loops are stand-ins with an original design. Real footage of your own (Batman edits, car films, travel clips) makes the biggest difference. Drop it in and it takes over.
