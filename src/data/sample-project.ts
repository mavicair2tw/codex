import type { EditorProject } from "@/types/editor";

export const sampleProject: EditorProject = {
  settings: {
    name: "Codex Editor V1",
    canvas: { width: 1920, height: 1080 },
    aspectRatio: "16:9",
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
  mediaAssets: [],
  clips: []
};
