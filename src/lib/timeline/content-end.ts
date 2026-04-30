import type { EditorProject } from "@/types/editor";

export const getTimelineContentEnd = (project: EditorProject) => {
  if (project.clips.length === 0) {
    return 0;
  }

  const contentEnd = Math.max(...project.clips.map((clip) => clip.timing.start + clip.timing.duration));
  return Math.min(contentEnd, project.timeline.duration);
};
