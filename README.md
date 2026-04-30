# Codex Video Editor

A production-oriented foundation for a desktop video editor built with Next.js, Tauri, Zustand, and FFmpeg.

## Current Capabilities

- Multi-track timeline for video, image, text, and audio layers
- Import video, image, and audio files through browser file inputs on the web build
- Import real local media paths through the Tauri desktop file dialog for FFmpeg export
- Left-side media gallery logs imported video, image, and audio assets with thumbnails
- Horizontal ruler, zoom controls, snap-to-grid, draggable playhead
- Drag/move clips and trim clip start/end
- Preview window synced to timeline position
- Play, pause, stop, and scrub controls
- Space toggles preview playback unless the user is typing in a form field
- Layer controls for timing, transform, opacity, fades, text styling, and audio volume fades
- FFmpeg command generation separated from UI
- Tauri backend command for H.264 MP4 export through local FFmpeg
- Export presets for 1080p, 2K, and 4K
- Static Next.js export for GitHub Pages deployment

## Architecture

```text
src/app                 Next.js app entry and global styles
src/components          React editor UI components
src/data                Sample project model
src/lib/ffmpeg          FFmpeg command generation and export presets
src/lib/export          Export service and Tauri bridge
src/lib/media           Media import metadata and preview URL helpers
src/lib/renderer        Preview renderer abstraction
src/lib/time.ts         Timeline math, snapping, frame rounding, timecode helpers
src/stores              Zustand editor state
src/types               Strong editor data model
src-tauri               Tauri desktop shell and FFmpeg command backend
```

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Desktop App

Install FFmpeg locally and ensure `ffmpeg` is available on `PATH`.

```bash
npm run tauri dev
```

In the desktop app, use the Video/Image/Audio toolbar buttons to select files through the native dialog. Those imports preserve the real local source path so the FFmpeg export pipeline can read the media.

## Production Site

The production URL is:

```text
https://i.openai-tw.com
```

GitHub Pages is configured to build the static Next.js export from `main`.

## Notes

This is a v1 foundation. It intentionally separates timeline state, preview rendering, and FFmpeg command generation so the editor can evolve toward real media import, asset management, waveform rendering, thumbnails, keyframes, background export jobs, and native file dialogs without rewriting the core model.
