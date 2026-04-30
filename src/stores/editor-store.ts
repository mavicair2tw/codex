"use client";

import { create } from "zustand";
import { sampleProject } from "@/data/sample-project";
import { clamp, snapTime } from "@/lib/time";
import type { EditorClip, EditorProject, ExportJob, ExportPreset, PlaybackState } from "@/types/editor";

interface EditorState {
  project: EditorProject;
  selectedClipId: string | null;
  playhead: number;
  playback: PlaybackState;
  exportJob: ExportJob;
  selectClip: (clipId: string | null) => void;
  setPlayhead: (seconds: number) => void;
  setPlayback: (playback: PlaybackState) => void;
  setZoom: (zoom: number) => void;
  toggleSnap: () => void;
  moveClip: (clipId: string, start: number, trackId?: string) => void;
  trimClip: (clipId: string, edge: "start" | "end", time: number) => void;
  updateClip: (clipId: string, patch: Partial<EditorClip>) => void;
  addTextClip: () => void;
  addImageClip: () => void;
  addVideoClip: () => void;
  addAudioClip: () => void;
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
  playhead: 0,
  playback: "stopped",
  exportJob: createExportJob(),

  selectClip: (clipId) => set({ selectedClipId: clipId }),

  setPlayhead: (seconds) =>
    set((state) => ({
      playhead: snapTime(seconds, state.project.timeline)
    })),

  setPlayback: (playback) => set({ playback }),

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

  updateClip: (clipId, patch) =>
    set((state) => ({
      project: {
        ...state.project,
        clips: state.project.clips.map((clip) => (clip.id === clipId ? patchClip(clip, patch) : clip))
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
