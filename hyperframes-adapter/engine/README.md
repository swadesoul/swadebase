# Hyperframes Kit

A self-contained drop-in kit for [HyperFrames](https://github.com/heygen-com/hyperframes) (HeyGen's open-source HTML → video framework). Write a composition in HTML/CSS/GSAP, preview it in the browser, render it to MP4.

- Package: `hyperframes` (CLI), pinned to **0.8.156** in `package.json`
- Starter: `index.html` – 5 s, 1920×1080, "SSS Brain" gold-on-black fade/slide title card
- Requirements: **Node.js ≥ 22**, **ffmpeg/ffprobe**, **Chrome** (system Chrome, or auto-downloaded by `hyperframes browser ensure`)

## Quick start (inside this folder)

```bash
npm run setup     # checks Node>=22, installs ffmpeg if missing, npm install, ensures headless Chrome
npm run preview   # live-reload preview in the browser (Hyperframes Studio)
npm run render    # renders index.html -> renders/example.mp4
```

Other scripts: `npm run lint`, `npm run check`, `npm run doctor`.
Render a different composition or file: `npx hyperframes render -c compositions/intro.html -o renders/intro.mp4`.

Verify a render:

```bash
ffprobe -v error -show_entries format=duration:stream=width,height -of default=nw=1 renders/example.mp4
```

## Drop it into any project

Works the same for SWADEBASE, SSS Brain, Oathloom, swideo, or any Vite / React / Next.js site. The kit is its **own npm package in its own folder**, so it never touches the host app's dependencies, bundler, or existing video tooling (e.g. Remotion).

1. Copy the kit into the project (pick any folder name; `video/` or `ops/hyperframes/` are typical):
   ```bash
   git clone https://github.com/swadesoul/hyperframes-kit.git /tmp/hyperframes-kit
   mkdir -p video && git -C /tmp/hyperframes-kit archive HEAD | tar -x -C video
   ```
2. Install and render:
   ```bash
   cd video
   npm run setup
   npm run render
   ```
3. Edit `index.html` (or add files under `compositions/`) and re-render.
4. Optional – call it from the host project's root `package.json`:
   ```json
   "scripts": { "video:render": "npm --prefix video run render", "video:preview": "npm --prefix video run preview" }
   ```

**Monorepo / workspaces note:** if the host root `package.json` uses npm/pnpm/yarn `workspaces` with a glob that would match this folder, either exclude it or accept it as a workspace — it has no shared deps either way.
**Next.js / Vite note:** keep the kit outside `src/`, `app/`, `pages/` and `public/` so the site build never picks up `index.html`.

## Composition basics

- Root element carries `data-composition-id`, `data-duration` (seconds), `data-width`, `data-height`.
- Timed elements get `class="clip"` plus `data-start`, `data-duration`, `data-track-index`.
- Animations are a paused GSAP timeline registered on `window.__timelines["<composition-id>"]`; Hyperframes seeks it frame-by-frame, so output is deterministic.

Docs: https://hyperframes.heygen.com · CLI reference: https://hyperframes.heygen.com/packages/cli

## Git

`.gitignore` excludes `node_modules/`, `renders/`, video files and `.hyperframes/` artifacts. Commit `package-lock.json` for reproducible installs.

## In SSS Brain

This copy lives at `ops/hyperframes/` and is fully independent of the Remotion render worker in `ops/render-worker/` (separate package.json, separate node_modules, no shared deps). Run everything from `ops/hyperframes/`: `npm run setup && npm run render`.
