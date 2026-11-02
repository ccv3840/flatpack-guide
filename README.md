# Flatpack Guide

An installable iPhone web app (PWA) with animated 3D assembly guides for flat-pack furniture, hands-free voice control, and Claude-powered help for any step or any unfamiliar manual.

Unofficial and for personal use. Not affiliated with any furniture brand. The guides are simplified; when a guide and your paper manual disagree, the manual wins.

## What's in it

- **3D step-by-step guides** for LACK side table, KALLAX 2×2 and BILLY 80×202. Every panel, dowel, bolt, cam, pin and nail animates into place, and the current step's parts are highlighted. You can drag to orbit, pinch to zoom, and tap a part to see its name.
- **Parts list** per product: panels, hardware totals and tools.
- **Voice control.** Tap *Voice*, then say "next", "back", "repeat", "read", "parts", "help, which way does this face?", or "stop listening". Steps and answers are read aloud. English and German are supported.
- **Ask.** Chat with Claude about the current step. It knows the whole guide and which step you're on, and you can attach a photo of your parts.
- **Help with any manual** (home screen). Photograph a page of any wordless manual and ask what it means.
- Works offline once loaded, except for AI help.

## Install on iPhone

1. Open the app's URL in **Safari** (see *Hosting* below).
2. Tap **Share**, then **Add to Home Screen**.
3. Open it from the home screen. Tap the gear on the home screen and paste your Anthropic API key (from console.anthropic.com). The key is stored only on your phone.

Voice notes: the first tap on *Voice* asks for microphone permission. If voice doesn't respond in the home-screen app, open the same URL in Safari; iOS has at times limited speech recognition in home-screen apps.

## Hosting

The app is plain static files, with no build step.

- **GitHub Pages:** the included workflow (`.github/workflows/pages.yml`) deploys on every push to `main`. Go to *Settings → Pages* and set *Source* to **GitHub Actions**. Pages on a **private** repo needs a paid GitHub plan.
- **Free alternative for a private repo:** connect the repo to Cloudflare Pages, Netlify or Vercel. Use no build command and set the output directory to `/`.
- **Local test:** `python3 -m http.server 8000` and open http://localhost:8000. Voice and install require HTTPS, so test those on the hosted version.

## Project layout

```
index.html, styles.css      app shell
js/app.js                   screens, navigation, chat, settings
js/viewer.js                Three.js scene, poses, step animations
js/catalog.js               hardware and tool definitions and icons
js/voice.js                 speech commands and read-aloud
js/ai.js                    Claude API calls and prompts
products/*.js               one data file per product
vendor/                     Three.js r170 (vendored for offline use)
sw.js                       offline cache (bump VERSION when files change)
```

## Adding a product

Each product is a data file in `products/`. Units are centimetres; the origin is the floor centre, with +y up and +z the front.

```js
export default {
  id: 'malm6', name: 'MALM', kind: '6-drawer chest', size: '80 × 48 × 123 cm',
  minutes: 90, people: 2, level: 'Hard', silhouette: 'bookcase',
  fastenerScale: 2,                       // enlarge small hardware so it's visible
  view: { az: 35, el: 28 },               // default camera angle
  note: 'Shown on the first step.',
  parts: [ { id: 'side', label: 'Side panel', size: [w, h, d], pos: [x, y, z], mat: 'board' } ],
  steps: [{
    title: 'Short imperative title',
    pose: 'upright' | 'upsideDown' | 'onSide' | 'faceDown' | 'onBack',   // carries over to later steps
    add: [{ id: 'side', from: [dx, dy, dz], spin: 0 }],                   // parts introduced this step
    fix: [{ t: 'cambolt', at: [x, y, z], dir: [1, 0, 0] }],               // hardware, dir = insertion direction
    tools: ['phillips'],
    text: 'What to do.', tip: 'Common mistake to avoid.',
    focus: { at: [x, y, z], r: 30 }, view: { az, el, zoom },              // optional camera
  }],
};
```

Then add it to `products/index.js` and to the `SHELL` list in `sw.js`, and bump `VERSION`.

Next batches: MALM, HEMNES, PAX, BRIMNES, ALEX, MICKE, IVAR, POÄNG, TARVA, BESTÅ, KULLEN, RÅSKOG, VITTSJÖ, TROFAST, LINNMON/ADILS.
