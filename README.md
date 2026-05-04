# Distraction-Free Browser

A Chrome and Firefox extension that hides distracting content on YouTube,
Facebook, and TikTok, plus a local-only rich-text scratchpad for quick notes.

## Features

- **YouTube** — only the search results page (`/results`) and the watch page
  (`/watch`) are usable. The home feed, Shorts, recommendations, comments, and
  end-screen cards are hidden everywhere.
- **Facebook** — all posts, Stories, and Reels are hidden across home, profile,
  group, and page timelines. Top bar, navigation, Messenger, and settings stay
  intact.
- **TikTok** — all video posts are hidden across the For You feed, Following,
  Explore, profile grids, and search results.
- **Per-site toggles** — turn blocking on or off independently from the toolbar
  popup or the options page. Changes apply instantly to every open tab; no
  reload needed.
- **Notes** — a single rich-text scratchpad with bold, italic, underline,
  strikethrough, lists, image paste/drag, and a clock button that inserts a
  timestamp. Auto-saved locally. `Cmd`/`Ctrl`+`S` triggers an immediate save and
  suppresses the browser's "Save Page" dialog.

## Privacy

Everything is stored locally in `chrome.storage.local`. No telemetry, no remote
calls, no accounts. The Firefox manifest declares
`data_collection_permissions: ["none"]`.

## Install (load unpacked)

### Chrome / Edge / Brave

1. `bun install`
2. `bun run build`
3. Open `chrome://extensions`, enable **Developer mode**, click **Load
   unpacked**, and select the project root.

### Firefox

1. `bun install`
2. `bun run build`
3. Open `about:debugging` → **This Firefox** → **Load Temporary Add-on…** and
   select `manifest.json`. (Permanent install requires a signed XPI from
   addons.mozilla.org.)

## Build & package

```bash
bun install                # install dependencies
bun run typecheck          # tsc --noEmit
bun run build              # bundle TS to dist/ via bun build
bun run package            # build + zip to releases/distraction-free-browser-<timestamp>.zip
```

Bundled output lives in `dist/`. Source-only files (`manifest.json`, `popup/`,
`options/`, `notes/`, `styles/`, `icons/`) are referenced directly by the
manifest. The `package` script produces a single zip that works as a sideload
package for both Chrome and Firefox.

## Project layout

```
manifest.json          MV3 manifest (Chrome + Firefox)
icons/                 source SVG + generated PNGs (16, 32, 48, 128)
styles/                always-loaded CSS injected by content scripts
  youtube.css
  facebook.css
  tiktok.css
popup/                 toolbar popup HTML/CSS
options/               options/welcome page HTML/CSS
notes/                 notes page HTML/CSS
src/                   TypeScript source
  background.ts        service worker / event page (onInstalled hook)
  content/             per-site content scripts
  popup/               toolbar popup logic (Alpine CSP build)
  options/             options page logic
  notes/               notes editor logic (vanilla JS)
  shared/              storage helpers, types, Alpine component
  types/               module shims
scripts/
  package.sh           build + zip
dist/                  bundler output (gitignored)
releases/              packaged zips (gitignored)
```

## How blocking works

Content scripts run at `document_start` and add `html.dfb-disabled` only when
the user has toggled blocking off. Every CSS rule in `styles/<site>.css` is
scoped under `html:not(.dfb-disabled)`, so the default state is "blocking on,
no JS work needed". Toggling fires `chrome.storage.onChanged`, which every open
tab listens for and applies live.

YouTube also keeps a `dfb-route-blocked` class that flips on `yt-navigate-finish`
events — anything other than `/results` or `/watch` hides the entire page body
while leaving the search bar in the masthead usable.

## Tech notes

- **TypeScript** — type-checked with `tsc --noEmit`. Bundled with `bun build`
  in IIFE format. Content scripts cannot use runtime ES module imports in the
  manifest, so `bun build` produces self-contained bundles per entry point.
- **Alpine.js** — popup and options use `@alpinejs/csp` (the CSP-friendly
  build) because MV3 extension pages disallow `eval`/`new Function()`. Only
  property-path expressions are allowed in directives.
- **Notes editor** — vanilla DOM with `contenteditable`. Initial HTML is parsed
  through `DOMParser` and sanitized (scripts/iframes/event-handler attrs/
  `javascript:` URLs stripped) before being mounted into the editor. Image
  insertion uses the Range API so we never touch `innerHTML` directly.

## Tweaking selectors

The blocking CSS lives in `styles/{youtube,facebook,tiktok}.css`. Each rule is
gated by `html:not(.dfb-disabled)` so toggles keep working. If a site renames
its DOM and content leaks through, find a stable anchor in the page (prefer
`role`, `aria-*`, `data-pagelet`, or `data-e2e` attributes over class hashes)
and add it to the matching CSS file.

## License

MIT.
