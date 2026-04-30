import { getClipOpacityAtTime } from "@/lib/time";
import type { EditorClip, EditorProject } from "@/types/editor";

export interface RenderableLayer {
  clip: EditorClip;
  opacity: number;
  leftPercent: number;
  topPercent: number;
  widthPercent: number;
  heightPercent: number;
  transform: string;
}

export const getActiveClips = (project: EditorProject, time: number) =>
  project.clips.filter((clip) => time >= clip.timing.start && time <= clip.timing.start + clip.timing.duration);

export const getRenderableLayers = (project: EditorProject, time: number): RenderableLayer[] => {
  const { width, height } = project.settings.canvas;

  return getActiveClips(project, time)
    .filter((clip) => clip.kind !== "audio")
    .map((clip) => ({
      clip,
      opacity: getClipOpacityAtTime(clip.timing.start, clip.timing.duration, clip.fades.fadeIn, clip.fades.fadeOut, clip.transform.opacity, time),
      leftPercent: (clip.transform.position.x / width) * 100,
      topPercent: (clip.transform.position.y / height) * 100,
      widthPercent: (clip.transform.size.width / width) * 100,
      heightPercent: (clip.transform.size.height / height) * 100,
      transform: `scale(${clip.transform.scale}) rotate(${clip.transform.rotation}deg)`
    }));
};
