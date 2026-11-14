/* =====================================================================
   ISHMAIL WORLDS — SETTINGS
   ---------------------------------------------------------------------
   HOW VIDEOS ARE CHOSEN (for every screen in the app):
     1. Your own file in assets/videos/<world>/<slot>.mp4  ← always wins
     2. Online footage (free licensed Pexels stock, listed below)
     3. A built-in fallback loop in assets/fallback/ (works offline)
   So to replace any screen, just save an MP4 with the slot's name, e.g.
     assets/videos/porsche/display-2.mp4
   Nothing else needs editing.
   ===================================================================== */
window.IW = {
  name: "ISHMAIL",
  autoEnterWorld: "gotham",     // where the welcome sequence lands
  autoEnterAfter: 9,            // seconds before it enters automatically

  worlds: {
    /* ------------------------------------------------ GOTHAM */
    gotham: {
      title: "GOTHAM",
      featured: {
        slot: "featured",                         // assets/videos/gotham/featured.mp4
        caption: "Alfred & Bruce Wayne",
        original: "https://vm.tiktok.com/ZGdXxumXt/",
        platform: "TikTok",
        tiktokId: "7541735536759786774",          // used only if the local file is missing
        aspect: 600 / 576
      },
      background: { slot: "background", stock: "38421529/16316166_1280_720_25fps.mp4", fallback: "city_rain.mp4" },
      screens: [
        { slot: "feed-1", label: "Street level",  stock: "40863419/17464675_960_540_60fps.mp4",   fallback: "city_traffic.mp4" },
        { slot: "feed-2", label: "Downpour",      stock: "12570193/12570193-sd_960_540_24fps.mp4", fallback: "city_rain.mp4" },
        { slot: "feed-3", label: "From above",    stock: "9331341/9331341-sd_960_540_30fps.mp4",  fallback: "city_searchlight.mp4" },
        { slot: "feed-4", label: "The storm",     stock: "39766683/16958216_960_540_30fps.mp4",   fallback: "city_searchlight.mp4" }
      ]
    },

    /* ------------------------------------------------ PORSCHE */
    porsche: {
      title: "PORSCHE",
      featured: {
        slot: "featured",                         // assets/videos/porsche/featured.mp4
        caption: "911 GT3 RS · after dark",
        original: "https://www.instagram.com/reel/Dbi7uqvJABz/",
        platform: "Instagram",
        aspect: 1028 / 720,
        // shown only if featured.mp4 is missing (Instagram embeds add white bars, so we never embed them)
        standin: { label: "Night detail", stock: "29498807/12698160_1018_540_24fps.mp4", fallback: "drive_showroom.mp4" }
      },
      background: { slot: "background", stock: "29498824/12698131_1356_720_24fps.mp4", fallback: "drive_showroom.mp4" },
      screens: [
        { slot: "display-1", label: "911 Cabriolet",   stock: "8630304/8630304-sd_960_540_25fps.mp4", fallback: "drive_tunnel.mp4" },
        { slot: "display-2", label: "356 Speedster",   stock: "31220482/13335333_960_540_24fps.mp4", fallback: "drive_bokeh.mp4" },
        { slot: "display-3", label: "Rear wing",       stock: "5309344/5309344-sd_960_540_25fps.mp4", fallback: "drive_gauge.mp4" },
        { slot: "display-4", label: "Coast road",      stock: "8630301/8630301-sd_960_540_25fps.mp4", fallback: "drive_tunnel.mp4" }
      ]
    },

    /* ------------------------------------------------ BUSINESS & LIFESTYLE */
    lifestyle: {
      title: "BUSINESS & LIFESTYLE",
      featured: {
        slot: "featured",                         // assets/videos/lifestyle/featured.mp4
        caption: "Night drive",
        original: "https://www.instagram.com/reel/DeAEWPmNvNb/",
        platform: "Instagram",
        aspect: 1080 / 608,
        standin: { label: "Grand touring", stock: "5309351/5309351-sd_960_540_25fps.mp4", fallback: "empire_golden.mp4" }
      },
      background: { slot: "background", stock: "34555902/14641676_1366_720_24fps.mp4", fallback: "empire_golden.mp4" },
      // Destinations: the clock beside each one is the real local time there.
      destinations: [
        { slot: "dest-dubai",     name: "Dubai",     tz: "Asia/Dubai",       stock: "34529274/14629592_960_540_60fps.mp4",   fallback: "empire_golden.mp4" },
        { slot: "dest-maldives",  name: "Maldives",  tz: "Indian/Maldives",  stock: "32192415/13728753_960_540_30fps.mp4",   fallback: "empire_ocean.mp4" },
        { slot: "dest-amalfi",    name: "Amalfi",    tz: "Europe/Rome",      stock: "32778735/13972723_960_540_30fps.mp4",   fallback: "empire_ocean.mp4" },
        { slot: "dest-newyork",   name: "New York",  tz: "America/New_York", stock: "12630512/12630512-sd_960_540_30fps.mp4", fallback: "empire_golden.mp4" },
        { slot: "dest-london",    name: "London",    tz: "Europe/London",    stock: "5823343/5823343-sd_960_540_30fps.mp4",  fallback: "empire_golden.mp4" }
      ],
      screens: [
        { slot: "collection-1", label: "Horology",       stock: "39108088/16639003_960_540_25fps.mp4",  fallback: "empire_watch.mp4" },
        { slot: "collection-2", label: "Residence",      stock: "29466011/12684176_960_540_60fps.mp4",  fallback: "empire_architecture.mp4" },
        { slot: "collection-3", label: "At sea",         stock: "37524012/15898409_960_540_60fps.mp4",  fallback: "empire_ocean.mp4" },
        { slot: "collection-4", label: "Private aviation", stock: "28586474/12427473_960_540_24fps.mp4", fallback: "empire_architecture.mp4" },
        { slot: "collection-5", label: "The city",       stock: "8477689/8477689-sd_960_540_30fps.mp4", fallback: "empire_architecture.mp4" }
      ],
      quotes: [
        "Build quietly. Let the work make the noise.",
        "Taste is a decision you make every single day.",
        "Freedom is owning your mornings.",
        "Go where the view is worth the climb."
      ]
    }
  },

  stockBase: "https://videos.pexels.com/video-files/"
};
