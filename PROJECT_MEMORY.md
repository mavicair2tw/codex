# Project Memory

## Project

This repository is the foundation for our first project with Codex.

- Repository: https://github.com/mavicair2tw/codex
- Production site: https://i.openai-tw.com
- GitHub Pages fallback URL: https://mavicair2tw.github.io/codex/
- Current app: Codex Video Editor, a Next.js + Tauri + FFmpeg desktop editor foundation.

## What We Have Done

1. Created an initial static `Hello World!` web page.
2. Deployed it to `mavicair2tw/codex`.
3. Enabled GitHub Pages and configured `i.openai-tw.com`.
4. Confirmed Cloudflare DNS points `i.openai-tw.com` to `mavicair2tw.github.io`.
5. Replaced the simple page with a production-oriented video editor foundation.

## Current Architecture

- Next.js App Router frontend with static export support.
- Zustand editor store for project, timeline, selection, playback, and export state.
- Typed data model for video, audio, image, and text clips.
- Timeline components for ruler, zoom, snapping, draggable clips, trimming, and playhead control.
- Browser import flow for video, image, and audio via file inputs and object URLs.
- Desktop import flow via Tauri native dialogs, preserving real filesystem paths for FFmpeg.
- Left-side media gallery stores imported assets and selects their timeline clip.
- Shared transport actions power both the Play button and Space key playback shortcut.
- Preview renderer abstraction for active layers, transforms, opacity, and fades.
- FFmpeg command generation separated from UI.
- Tauri command backend for local FFmpeg export.
- GitHub Pages static build deployed at the repository root for `i.openai-tw.com`.

## DNS Configuration

The domain `openai-tw.com` is managed by Cloudflare.

Required DNS record:

```text
Type: CNAME
Name: i
Target: mavicair2tw.github.io
Proxy status: DNS only / grey cloud
TTL: Auto
```

## Useful Verification Commands

```bash
npm run typecheck
npm run build
dig i.openai-tw.com CNAME +short
curl -I https://i.openai-tw.com
curl -L https://i.openai-tw.com
```

Expected DNS result:

```text
mavicair2tw.github.io.
```

## Related Skills And Tools

- GitHub plugin: repository writes and deployment updates.
- Web GUI development: browser-facing UI implementation and validation.
- Optimized Next.js TypeScript: project structure, typing, and build practices.
- GitHub Pages: static production hosting.
- Cloudflare DNS: custom subdomain routing.
- Tauri: desktop shell and native FFmpeg bridge.
- FFmpeg: H.264 MP4 export engine.
- `dig` and `curl`: DNS and deployment verification.

## Operating Notes

- Keep secrets out of this public repo.
- Prefer static export compatibility while the site is hosted on GitHub Pages.
- Keep FFmpeg command generation independent from React UI.
- Update this memory when deployment, DNS, architecture, or workflow changes.
