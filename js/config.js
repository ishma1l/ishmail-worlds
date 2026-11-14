/* =====================================================================
   ISHMAIL WORLDS — YOUR SETTINGS
   Edit this file to change videos, featured reels and quotes.
   Paths are relative to this folder (e.g. "media/city/my-clip.mp4").
   ===================================================================== */
window.WORLDS_CONFIG = {
  name: "ISHMAIL",

  /* ---------------- WORLD 1: DARK CITY ---------------- */
  city: {
    featured: {
      label: "FEATURED — THE BUTLER & THE HEIR",
      platform: "tiktok",
      url: "https://vm.tiktok.com/ZGdXxumXt/",
      // TikTok only embeds with the long number from the full link (…/video/<number>).
      tiktokId: "7541735536759786774",   // already filled in for you
      aspect: 600 / 576,
      // Optional: a copy of the clip saved on this computer plays offline instead of the embed.
      localFile: "media/featured/city_featured.mp4",
      qr: "media/qr/tiktok.png"
    },
    panels: [
      { id: "cam1", title: "CAM 01 · ROOFTOP SWEEP", src: "media/city/city_searchlight.mp4" },
      { id: "cam2", title: "CAM 04 · NORTH DISTRICT", src: "media/city/city_traffic.mp4" },
      { id: "radar", title: "THERMAL GRID", src: "media/city/city_radar.mp4" },
      // Your character edits — drop the files in media/city/ with these names (or change the names).
      { id: "edit1", title: "EDIT 01", src: "media/city/edit1.mp4", fallback: "media/city/city_rain.mp4" },
      { id: "edit2", title: "EDIT 02", src: "media/city/edit2.mp4", fallback: "media/city/city_searchlight.mp4" },
      { id: "edit3", title: "EDIT 03", src: "media/city/edit3.mp4", fallback: "media/city/city_radar.mp4" }
    ],
    background: "media/city/city_rain.mp4",
    // Replace with your own favourite lines.
    quotes: [
      { text: "The city never sleeps. Neither does the one who guards it.", by: "NIGHT FILE 01" },
      { text: "Fear is only a signal. Learn to read it.", by: "NIGHT FILE 02" },
      { text: "Every fall is training for the climb back up.", by: "NIGHT FILE 03" },
      { text: "Be the quiet in the storm.", by: "NIGHT FILE 04" }
    ]
  },

  /* ---------------- WORLD 2: DRIVE ---------------- */
  drive: {
    featured: {
      label: "FEATURED REEL",
      platform: "instagram",
      url: "https://www.instagram.com/reel/Dbi7uqvJABz/",
      aspect: 1028 / 720,   // shape of the video (width / height)
      crop: true,           // trims Instagram's header/footer so only the video shows (press C to toggle)
      localFile: "media/featured/drive_featured.mp4",
      qr: "media/qr/drive.png"
    },
    panels: [
      { id: "run", title: "NIGHT RUN", spec: "TUNNEL · 02:14", src: "media/drive/drive_tunnel.mp4" },
      { id: "rev", title: "REV RANGE", spec: "PRESS R TO REV", src: "media/drive/drive_gauge.mp4" },
      { id: "lights", title: "CITY LIGHTS", spec: "WET TARMAC", src: "media/drive/drive_bokeh.mp4" },
      { id: "car1", title: "YOUR CLIP 01", spec: "YOUR FOOTAGE", src: "media/drive/car1.mp4", fallback: "media/drive/drive_showroom.mp4" }
    ],
    background: "media/drive/drive_showroom.mp4",
    tagline: "Built for the long way home."
  },

  /* ---------------- WORLD 3: EMPIRE ---------------- */
  empire: {
    featured: {
      label: "Featured Reel",
      platform: "instagram",
      url: "https://www.instagram.com/reel/DeAEWPmNvNb/",
      aspect: 1276 / 718,
      crop: true,
      localFile: "media/featured/empire_featured.mp4",
      qr: "media/qr/empire.png"
    },
    panels: [
      { id: "coast", title: "The Coast", src: "media/empire/empire_ocean.mp4" },
      { id: "time", title: "Time", src: "media/empire/empire_watch.mp4" },
      { id: "form", title: "Form", src: "media/empire/empire_architecture.mp4" },
      { id: "life1", title: "Your Clip", src: "media/empire/life1.mp4", fallback: "media/empire/empire_golden.mp4" }
    ],
    background: "media/empire/empire_golden.mp4",
    quotes: [
      { text: "Build quietly. Let the work make the noise.", by: "On ambition" },
      { text: "Taste is a decision you make every single day.", by: "On craft" },
      { text: "Freedom is owning your mornings.", by: "On time" },
      { text: "Go where the view is worth the climb.", by: "On travel" }
    ]
  }
};
