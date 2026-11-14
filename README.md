# Ishmail Worlds

A cinematic, remote-controlled entertainment screen for the Nebula Mars 3 Air.
It opens with **WELCOME BACK, ISHMAIL.**, reveals three destinations and then glides into **GOTHAM**.
From there, LEFT and RIGHT take you between **GOTHAM**, **PORSCHE** and **BUSINESS & LIFESTYLE**.

## Using the remote

| Button | What it does |
|---|---|
| **◀ LEFT / RIGHT ▶** | Switch world: Gotham ⇄ Porsche ⇄ Business & Lifestyle (it wraps around) |
| **▲ UP / DOWN ▼** | Move between the screens in the world you're in, top to bottom |
| **OK** | Open the selected screen full-screen with sound. On a destination, show it. On *Sound*, turn sound on or off |
| **BACK** | Close the full-screen player → return to the main screen → (press twice) leave |
| **PLAY / PAUSE** | Pause or play the selected video (or the full-screen one) |
| **Volume** | Your projector's own volume, as normal |

In the full-screen player, LEFT and RIGHT move between its buttons (−10s, Pause, +10s, Sound, Close). Those are the only times LEFT and RIGHT control a video. Everywhere else they switch worlds.

You never need a keyboard, a mouse or menus. A small hint at the bottom shows what OK will do, then fades away.

## Your three reels (already built in)

| World | File | What it is |
|---|---|---|
| Gotham | `assets/videos/gotham/featured.mp4` | Alfred & Bruce Wayne (TikTok, @oev.aep) |
| Porsche | `assets/videos/porsche/featured.mp4` | 911 GT3 RS after dark (Instagram, @alexerwn) |
| Business & Lifestyle | `assets/videos/lifestyle/featured.mp4` | Night drive (Instagram) |

They play directly on the screen: no Instagram or TikTok app, no white bars, no QR codes.
If a featured file is ever missing, that screen falls back to the official embed and an **Open on Instagram / TikTok** button appears beneath it.

## Adding or replacing videos

Every screen has a fixed filename. Save an MP4 with that name in the matching folder and it replaces that screen automatically. You don't need to edit anything else.
Each folder contains a `PUT_VIDEOS_HERE.txt` listing its names:

```
assets/videos/gotham/      featured, background, feed-1 … feed-4
assets/videos/porsche/     featured, background, display-1 … display-4
assets/videos/lifestyle/   featured, background, collection-1 … collection-5,
                           dest-dubai, dest-maldives, dest-amalfi, dest-newyork, dest-london
```

Each screen tries, in order:
1. **Your file** in `assets/videos/…`
2. **Online footage**: free-licensed Pexels clips (needs internet)
3. **A built-in loop** from `assets/fallback/` (works offline), so nothing ever shows as a blank box

Tips: use MP4 (H.264). 720p or 1080p landscape works best. Labels, quotes and destination cities live in `js/config.js`.

## Running it

**On the laptop (private version with your reels):** double-click **`Launch Ishmail Worlds.bat`**. It opens Chrome full-screen with sound allowed. Press **Alt+F4** to close it. To show it on the projector, cast the screen, or connect by HDMI and use the projector as the display.

**On the projector's own browser:** open the web link in a TV browser (for example TV Bro or another Android TV browser), then press OK once. That first press turns on full-screen and sound, because browsers need one button press before they allow either.
The public web link doesn't include your three reels, because they belong to other creators. There, those screens use the official embeds.

**Projector performance:** on TV hardware the app automatically switches to a lighter mode. It plays up to 4 videos at once (the main screen, the one you've selected and the backdrop come first) and drops the heavier effects. Add `?full` to the address to force all effects, or `?lite` to force the light mode on a laptop.

## Sound
Rain and thunder in Gotham, an engine start when you arrive in Porsche, a warm room tone in Business & Lifestyle. All of it is generated live in the browser, so there are no audio files. Select **Sound** at the top (UP from the main screen) and press OK to turn it off. Your choice is remembered.

## Footage credits (Pexels, free licence)
Gotham: Giuseppe Paoletti, Evgenij Mikhailov, Ricky Esquivel, Altaf Shah, Jul L. G. ·
Porsche: Michael Pronin, Kampus Production, K, Taryn Elliott ·
Business & Lifestyle: Caleb Oquendo, Mohammed Resan, Emrul Kausar Emon, Mihaela Claudia Puscas, Sarowar Hussain, George Morina, Jourean van Beek, TR Studio, Yunus Terk, AP Vibes, Sergey Meshkov.
