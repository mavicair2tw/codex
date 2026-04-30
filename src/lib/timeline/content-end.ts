import type { EditorProject } from "@/types/editor";

const clipEnd = (clip: EditorProject["clips"][number]) => clip.timing.start + clip.timing.duration;

const hasVisibleTimelineOutput = (kind: string) => kind === "video" || kind === "image" || kind === "text";

export const getTimelineContentEnd = (project: EditorProject) => {
  if (project.clips.length === 0) {
    return 0;
  }

  const visibleClips = project.clips.filter((clip) => hasVisibleTimelineOutput(clip.kind));
  const clipsForPreviewEnd = visibleClips.length > 0 ? visibleClips : project.clips;
  const contentEnd = Math.max(...clipsForPreviewEnd.map(clipEnd));
  return Math.min(contentEnd, project.timeline.duration);
};
