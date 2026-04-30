"use client";

import { create } from "zustand";
import { sampleProject } from "@/data/sample-project";
import { getCanvasSize } from "@/lib/canvas/aspect-ratio";
import { clamp, roundToFrame, snapTime } from "@/lib/time";
import type { ImportedMediaFile } from "@/lib/media/read-media-file";
import type { CanvasAspectRatio, EditorClip, EditorProject, ExportJob, ExportPreset, PlaybackState } from "@/types/editor";

interface EditorState {
  project: EditorProject;
  selectedClipId: string | null;
  selectedAssetId: string | null;
  playhead: number;
  playback: PlaybackState;
  exportJob: ExportJob;
  selectClip: (clipId: string | null) => void;
  selectAsset: (assetId: string | null) => void;
  setPlayhead: (seconds: number) => void;
  jumpToTimelineStart: () => void;
  jumpToTimelineEnd: () => void;
  stepPlayheadBackward: () => void;
  stepPlayheadForward: () => void;
  setPlayback: (playback: PlaybackState) => void;
  togglePlayback: () => void;
  playPreview: () => void;
  pausePreview: () => void;
  stopPlayback: () => void;
  setZoom: (zoom: number) => void;
  toggleSnap: () => void;
  moveClip: (clipId: string, start: number, trackId?: string) => void;
  trimClip: (clipId: string, edge: "start" | "end", time: number) => void;
  deleteClip: (clipId: string) => void;
  toggleClipMute: (clipId: string) => void;
  updateClip: (clipId: string, patch: Partial<EditorClip>) => void;
  setCanvasAspectRatio: (aspectRatio: CanvasAspectRatio) => void;
  addTextClip: () => void;
  addImageClip: () => void;
  addVideoClip: () => void;
  addAudioClip: () => void;
  addTextAsset: () => void;
  importMediaAsset: (file: ImportedMediaFile) => void;
  addAssetToTimeline: (assetId: string) => void;
  removeMediaAsset: (assetId: string) => void;
  setExportPreset: (preset: ExportPreset) => void;
  setExportProgress: (progress: number, message: string) => void;
  setExportStatus: (status: ExportJob["status"], message?: string) => void;
}

const makeId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const createExportJob = (): ExportJob => ({
  id: makeId("export"),
  preset: "1080p",
  status: "idle",
  progress: 0,
  message: "Ready"
});

const patchClip = (clip: EditorClip, patch: Partial<EditorClip>): EditorClip => ({ ...clip, ...patch } as EditorClip);

export const useEditorStore = create<EditorState>((set, get) => ({
  project: sampleProject,
  selectedClipId: sampleProject.clips[0]?.id ?? null,
  selectedAssetId: null,
  playhead: 0,
  playback: "stopped",
  exportJob: createExportJob(),

  selectClip: (clipId) => set({ selectedClipId: clipId, selectedAssetId: null }),

  selectAsset: (assetId) => set({ selectedAssetId: assetId, selectedClipId: null }),

  setPlayhead: (seconds) =>
    set((state) => ({
      playhead: snapTime(seconds, state.project.timeline)
    })),

  jumpToTimelineStart: () => set({ playhead: 0 }),

  jumpToTimelineEnd: () =>
    set((state) => ({
      playhead: state.project.timeline.duration
    })),

  stepPlayheadBackward: () =>
    set((state) => ({
      playhead: clamp(roundToFrame(state.playhead - 1 / state.project.timeline.fps, state.project.timeline.fps), 0, state.project.timeline.duration)
    })),

  stepPlayheadForward: () =>
    set((state) => ({
      playhead: clamp(roundToFrame(state.playhead + 1 / state.project.timeline.fps, state.project.timeline.fps), 0, state.project.timeline.duration)
    })),

  setPlayback: (playback) => set({ playback }),

  togglePlayback: () =>
    set((state) => ({
      playback: state.playback === "playing" ? "paused" : "playing"
    })),

  playPreview: () => set({ playback: "playing" }),

  pausePreview: () => set({ playback: "paused" }),

  stopPlayback: () => set({ playback: "stopped", playhead: 0 }),

  setZoom: (zoom) =>
    set((state) => ({
      project: {
        ...state.project,
        timeline: {
          ...state.project.timeline,
          zoom: clamp(zoom, 28, 220)
        }
      }
    })),

  toggleSnap: () =>
    set((state) => ({
      project: {
        ...state.project,
        timeline: {
          ...state.project.timeline,
          snapEnabled: !state.project.timeline.snapEnabled
        }
      }
    })),

  moveClip: (clipId, start, trackId) =>
    set((state) => ({
      project: {
        ...state.project,
        clips: state.project.clips.map((clip) =>
          clip.id === clipId
            ? {
                ...clip,
                trackId: trackId ?? clip.trackId,
                timing: {
                  ...clip.timing,
                  start: snapTime(start, state.project.timeline)
                }
              }
            : clip
        )
      }
    })),

  trimClip: (clipId, edge, time) =>
    set((state) => ({
      project: {
        ...state.project,
        clips: state.project.clips.map((clip) => {
          if (clip.id !== clipId) {
            return clip;
          }

          const snappedTime = snapTime(time, state.project.timeline);
          if (edge === "start") {
            const end = clip.timing.start + clip.timing.duration;
            const nextStart = clamp(snappedTime, 0, end - 0.1);
            const delta = nextStart - clip.timing.start;

            return {
              ...clip,
              timing: {
                ...clip.timing,
                start: nextStart,
                sourceIn: clamp(clip.timing.sourceIn + delta, 0, clip.timing.sourceDuration),
                duration: clamp(end - nextStart, 0.1, clip.timing.sourceDuration)
              }
            };
          }

          const nextEnd = clamp(snappedTime, clip.timing.start + 0.1, state.project.timeline.duration);
          return {
            ...clip,
            timing: {
              ...clip.timing,
              duration: clamp(nextEnd - clip.timing.start, 0.1, clip.timing.sourceDuration)
            }
          };
        })
      }
    })),

  deleteClip: (clipId) =>
    set((state) => ({
      project: {
        ...state.project,
        clips: state.project.clips.filter((clip) => clip.id !== clipId)
      },
      selectedClipId: state.selectedClipId === clipId ? null : state.selectedClipId
    })),

  toggleClipMute: (clipId) =>
    set((state) => ({
      project: {
        ...state.project,
        clips: state.project.clips.map((clip) => {
          if (clip.id !== clipId || (clip.kind !== "video" && clip.kind !== "audio")) {
            return clip;
          }

          return {
            ...clip,
            muted: !clip.muted
          };
        })
      }
    })),

  updateClip: (clipId, patch) =>
    set((state) => ({
      project: {
        ...state.project,
        clips: state.project.clips.map((clip) => (clip.id === clipId ? patchClip(clip, patch) : clip))
      }
    })),

  setCanvasAspectRatio: (aspectRatio) =>
    set((state) => ({
      project: {
        ...state.project,
        settings: {
          ...state.project.settings,
          aspectRatio,
          canvas: getCanvasSize(aspectRatio)
        }
      }
    })),

  addTextClip: () => {
    const track = get().project.tracks.find((item) => item.kind === "text");
    if (!track) return;
    const clip: EditorClip = {
      id: makeId("text"),
      trackId: track.id,
      kind: "text",
      name: "Text Overlay",
      text: "New title",
      fontSize: 56,
      fontFamily: "Inter",
      color: "#ffffff",
      timing: { start: get().playhead, duration: 5, sourceIn: 0, sourceDuration: 5 },
      transform: { position: { x: 160, y: 760 }, size: { width: 720, height: 120 }, scale: 1, rotation: 0, opacity: 1 },
      fades: { fadeIn: 0.3, fadeOut: 0.3 }
    };
    set((state) => ({ project: { ...state.project, clips: [...state.project.clips, clip] }, selectedClipId: clip.id }));
  },

  addImageClip: () => {
    const track = get().project.tracks.find((item) => item.kind === "image");
    if (!track) return;
    const clip: EditorClip = {
      id: makeId("image"),
      trackId: track.id,
      kind: "image",
      name: "Image Layer",
      sourcePath: "/media/image.png",
      timing: { start: get().playhead, duration: 6, sourceIn: 0, sourceDuration: 6 },
      transform: { position: { x: 1280, y: 96 }, size: { width: 360, height: 240 }, scale: 1, rotation: 0, opacity: 1 },
      fades: { fadeIn: 0.25, fadeOut: 0.25 }
    };
    set((state) => ({ project: { ...state.project, clips: [...state.project.clips, clip] }, selectedClipId: clip.id }));
  },

  addVideoClip: () => {
    const track = get().project.tracks.find((item) => item.kind === "video");
    if (!track) return;
    const clip: EditorClip = {
      id: makeId("video"),
      trackId: track.id,
      kind: "video",
      name: "Video Layer",
      sourcePath: "/media/video.mp4",
      timing: { start: get().playhead, duration: 8, sourceIn: 0, sourceDuration: 8 },
      transform: { position: { x: 0, y: 0 }, size: { width: 1920, height: 1080 }, scale: 1, rotation: 0, opacity: 1 },
      fades: { fadeIn: 0.25, fadeOut: 0.25 }
    };
    set((state) => ({ project: { ...state.project, clips: [...state.project.clips, clip] }, selectedClipId: clip.id }));
  },

  addAudioClip: () => {
    const track = get().project.tracks.find((item) => item.kind === "audio");
    if (!track) return;
    const clip: EditorClip = {
      id: makeId("audio"),
      trackId: track.id,
      kind: "audio",
      name: "Audio Layer",
      sourcePath: "/media/audio.wav",
      volume: 0.8,
      volumeFadeIn: 0.8,
      volumeFadeOut: 0.8,
      timing: { start: get().playhead, duration: 10, sourceIn: 0, sourceDuration: 10 },
      transform: { position: { x: 0, y: 0 }, size: { width: 1920, height: 1080 }, scale: 1, rotation: 0, opacity: 1 },
      fades: { fadeIn: 0, fadeOut: 0 }
    };
    set((state) => ({ project: { ...state.project, clips: [...state.project.clips, clip] }, selectedClipId: clip.id }));
  },

  addTextAsset: () => {
    const asset = {
      id: makeId("asset"),
      kind: "text" as const,
      name: "Text Overlay",
      duration: 5,
      importedAt: new Date().toISOString()
    };

    set((state) => ({
      project: {
        ...state.project,
        mediaAssets: [...state.project.mediaAssets, asset]
      },
      selectedAssetId: asset.id,
      selectedClipId: null
    }));
  },

  importMediaAsset: (file) => {
    const asset = {
      id: makeId("asset"),
      kind: file.kind,
      name: file.name,
      sourcePath: file.sourcePath,
      previewUrl: file.previewUrl,
      mimeType: file.mimeType,
      duration: file.duration,
      naturalSize: file.naturalSize,
      importedAt: new Date().toISOString()
    };

    set((state) => ({
      project: {
        ...state.project,
        mediaAssets: [...state.project.mediaAssets, asset]
      },
      selectedAssetId: asset.id,
      selectedClipId: null
    }));
  },

  addAssetToTimeline: (assetId) => {
    const state = get();
    const asset = state.project.mediaAssets.find((item) => item.id === assetId);
    if (!asset) return;

    const track = state.project.tracks.find((item) => item.kind === asset.kind);
    if (!track) return;

    const start = state.playhead;
    const remainingDuration = Math.max(0.1, state.project.timeline.duration - start);
    const duration = clamp(asset.duration, 0.1, remainingDuration);
    const sourceDuration = Math.max(0.1, asset.duration);
    const naturalSize = asset.naturalSize ?? state.project.settings.canvas;

    if (asset.kind === "text") {
      const clip: EditorClip = {
        id: makeId("text"),
        trackId: track.id,
        kind: "text",
        name: asset.name,
        text: "New title",
        fontSize: 56,
        fontFamily: "Inter",
        color: "#ffffff",
        timing: { start, duration, sourceIn: 0, sourceDuration },
        transform: { position: { x: 160, y: 760 }, size: { width: 720, height: 120 }, scale: 1, rotation: 0, opacity: 1 },
        fades: { fadeIn: 0.3, fadeOut: 0.3 }
      };

      set((current) => ({
        project: { ...current.project, clips: [...current.project.clips, clip] },
        selectedClipId: clip.id,
        selectedAssetId: null
      }));
      return;
    }

    if (!asset.sourcePath) return;

    const common = {
      id: makeId(asset.kind),
      trackId: track.id,
      name: asset.name,
      sourcePath: asset.sourcePath,
      previewUrl: asset.previewUrl,
      fileName: asset.sourcePath,
      mimeType: asset.mimeType,
      timing: { start, duration, sourceIn: 0, sourceDuration },
      transform: {
        position: { x: asset.kind === "image" ? 160 : 0, y: asset.kind === "image" ? 120 : 0 },
        size:
          asset.kind === "image"
            ? { width: Math.min(naturalSize.width, 720), height: Math.min(naturalSize.height, 480) }
            : state.project.settings.canvas,
        scale: 1,
        rotation: 0,
        opacity: 1
      },
      fades: { fadeIn: 0.25, fadeOut: 0.25 }
    };

    const clip: EditorClip =
      asset.kind === "audio"
        ? {
            ...common,
            kind: "audio",
            volume: 0.85,
            volumeFadeIn: 0.4,
            volumeFadeOut: 0.4
          }
        : {
            ...common,
            kind: asset.kind
          };

    set((current) => ({
      project: {
        ...current.project,
        clips: [...current.project.clips, clip]
      },
      selectedClipId: clip.id,
      selectedAssetId: null
    }));
  },

  removeMediaAsset: (assetId) =>
    set((state) => ({
      project: {
        ...state.project,
        mediaAssets: state.project.mediaAssets.filter((asset) => asset.id !== assetId)
      },
      selectedAssetId: state.selectedAssetId === assetId ? null : state.selectedAssetId
    })),

  setExportPreset: (preset) => set((state) => ({ exportJob: { ...state.exportJob, preset } })),
  setExportProgress: (progress, message) => set((state) => ({ exportJob: { ...state.exportJob, progress, message } })),
  setExportStatus: (status, message) =>
    set((state) => ({
      exportJob: {
        ...state.exportJob,
        status,
        message: message ?? state.exportJob.message,
        progress: status === "complete" ? 1 : state.exportJob.progress
      }
    }))
}));
