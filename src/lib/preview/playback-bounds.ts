import type { EditorProject } from "@/types/editor";

export interface PlaybackBounds {
  start: number;
  end: number;
}

const isVisualMediaClip = (kind: string) => kind === "image" || kind === "video";

export const getPreviewPlaybackBounds = (project: EditorProject, selectedClipId: string | null, playhead: number): PlaybackBounds | null => {
  const selectedClip = selectedClipId ? project.clips.find((clip) => clip.id === selectedClipId) : undefined;
  const boundedClip =
    selectedClip && isVisualMediaClip(selectedClip.kind)
      ? selectedClip
      : project.clips
          .filter((clip) => isVisualMediaClip(clip.kind))
          .sort((left, right) => left.timing.start - right.timing.start)
          .find((clip) => playhead >= clip.timing.start && playhead <= clip.timing.start + clip.timing.duration);

  if (!boundedClip) {
    return null;
  }

  return {
    start: boundedClip.timing.start,
    end: boundedClip.timing.start + boundedClip.timing.duration
  };
};
