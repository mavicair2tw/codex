import type { EditorProject } from "@/types/editor";

export const sampleProject: EditorProject = {
  settings: {
    name: "Codex Editor V1",
    canvas: { width: 1920, height: 1080 },
    backgroundColor: "#050607"
  },
  timeline: {
    duration: 30,
    fps: 30,
    zoom: 64,
    snapEnabled: true,
    snapStep: 0.25
  },
  tracks: [
    { id: "track-video-1", name: "Video 1", kind: "video" },
    { id: "track-image-1", name: "Image 1", kind: "image" },
    { id: "track-text-1", name: "Text 1", kind: "text" },
    { id: "track-audio-1", name: "Audio 1", kind: "audio" }
  ],
  clips: [
    {
      id: "clip-video-1",
      trackId: "track-video-1",
      kind: "video",
      name: "Interview A",
      sourcePath: "/media/interview-a.mp4",
      timing: { start: 0, duration: 10, sourceIn: 0, sourceDuration: 10 },
      transform: {
        position: { x: 0, y: 0 },
        size: { width: 1920, height: 1080 },
        scale: 1,
        rotation: 0,
        opacity: 1
      },
      fades: { fadeIn: 0.35, fadeOut: 0.35 }
    },
    {
      id: "clip-image-1",
      trackId: "track-image-1",
      kind: "image",
      name: "Logo Overlay",
      sourcePath: "/media/logo.png",
      timing: { start: 1.5, duration: 8, sourceIn: 0, sourceDuration: 8 },
      transform: {
        position: { x: 1480, y: 72 },
        size: { width: 280, height: 120 },
        scale: 1,
        rotation: 0,
        opacity: 0.92
      },
      fades: { fadeIn: 0.4, fadeOut: 0.5 }
    },
    {
      id: "clip-text-1",
      trackId: "track-text-1",
      kind: "text",
      name: "Title",
      text: "Hello World!",
      fontSize: 72,
      fontFamily: "Inter",
      color: "#ffffff",
      timing: { start: 0.8, duration: 6.5, sourceIn: 0, sourceDuration: 6.5 },
      transform: {
        position: { x: 140, y: 780 },
        size: { width: 920, height: 140 },
        scale: 1,
        rotation: 0,
        opacity: 1
      },
      fades: { fadeIn: 0.45, fadeOut: 0.45 }
    },
    {
      id: "clip-audio-1",
      trackId: "track-audio-1",
      kind: "audio",
      name: "Music Bed",
      sourcePath: "/media/music.wav",
      volume: 0.68,
      volumeFadeIn: 1.2,
      volumeFadeOut: 1.8,
      timing: { start: 0, duration: 22, sourceIn: 0, sourceDuration: 22 },
      transform: {
        position: { x: 0, y: 0 },
        size: { width: 1920, height: 1080 },
        scale: 1,
        rotation: 0,
        opacity: 1
      },
      fades: { fadeIn: 0, fadeOut: 0 }
    }
  ]
};
