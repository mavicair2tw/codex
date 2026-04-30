import { getExportPresetSize } from "@/lib/ffmpeg/presets";
import type { EditorClip, EditorProject, ExportPreset } from "@/types/editor";

export interface FfmpegCommand {
  executable: "ffmpeg";
  args: string[];
  description: string;
}

const escapeDrawtext = (value: string) => value.replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\\'");

const clipEnable = (clip: EditorClip) => `between(t,${clip.timing.start.toFixed(3)},${(clip.timing.start + clip.timing.duration).toFixed(3)})`;

const clampFadeDuration = (fade: number, duration: number) => Math.max(0, Math.min(fade, duration));

const visualFadeFilters = (clip: EditorClip) => {
  const filters: string[] = [];
  const fadeIn = clampFadeDuration(clip.fades.fadeIn, clip.timing.duration);
  const fadeOut = clampFadeDuration(clip.fades.fadeOut, clip.timing.duration);

  if (fadeIn > 0) {
    filters.push(`fade=t=in:st=0:d=${fadeIn.toFixed(3)}:alpha=1`);
  }

  if (fadeOut > 0) {
    filters.push(`fade=t=out:st=${Math.max(0, clip.timing.duration - fadeOut).toFixed(3)}:d=${fadeOut.toFixed(3)}:alpha=1`);
  }

  if (clip.transform.opacity < 1) {
    filters.push(`colorchannelmixer=aa=${clip.transform.opacity.toFixed(3)}`);
  }

  return filters;
};

const textOpacityExpression = (clip: EditorClip) => {
  const start = clip.timing.start;
  const end = clip.timing.start + clip.timing.duration;
  const fadeIn = clampFadeDuration(clip.fades.fadeIn, clip.timing.duration);
  const fadeOut = clampFadeDuration(clip.fades.fadeOut, clip.timing.duration);
  const fadeInEnd = start + fadeIn;
  const fadeOutStart = end - fadeOut;

  if (fadeIn <= 0 && fadeOut <= 0) {
    return clip.transform.opacity.toFixed(3);
  }

  const baseOpacity = clip.transform.opacity.toFixed(3);
  const fadeInExpression = fadeIn > 0 ? `if(lt(t\\,${fadeInEnd.toFixed(3)})\\,((t-${start.toFixed(3)})/${fadeIn.toFixed(3)})*${baseOpacity}\\,${baseOpacity})` : baseOpacity;
  return fadeOut > 0 ? `if(gt(t\\,${fadeOutStart.toFixed(3)})\\,((${end.toFixed(3)}-t)/${fadeOut.toFixed(3)})*${baseOpacity}\\,${fadeInExpression})` : fadeInExpression;
};

const inputClips = (project: EditorProject) => project.clips.filter((clip) => clip.kind !== "text");

const buildVideoFilters = (project: EditorProject, preset: ExportPreset) => {
  const size = getExportPresetSize(preset, project.settings.aspectRatio);
  const visualClips = project.clips.filter((clip) => clip.kind === "video" || clip.kind === "image" || clip.kind === "text");
  const filters: string[] = [`color=c=${project.settings.backgroundColor}:s=${size.width}x${size.height}:r=${project.timeline.fps}:d=${project.timeline.duration}[base]`];
  let currentLabel = "base";
  let mediaInputIndex = 0;

  visualClips.forEach((clip, visualIndex) => {
    const nextLabel = `v${visualIndex}`;

    if (clip.kind === "text") {
      const text = escapeDrawtext(clip.text);
      const alpha = textOpacityExpression(clip);
      filters.push(
        `[${currentLabel}]drawtext=text='${text}':font='${escapeDrawtext(clip.fontFamily)}':fontsize=${clip.fontSize}:fontcolor=${clip.color}:x=${clip.transform.position.x}:y=${clip.transform.position.y}:alpha='${alpha}':enable='${clipEnable(clip)}'[${nextLabel}]`
      );
      currentLabel = nextLabel;
      return;
    }

    const inputLabel = `${mediaInputIndex}:v`;
    const layerLabel = `layer${visualIndex}`;
    const fadeFilters = visualFadeFilters(clip);
    filters.push(
      `[${inputLabel}]trim=start=${clip.timing.sourceIn}:duration=${clip.timing.duration},setpts=PTS-STARTPTS,scale=${clip.transform.size.width}:${clip.transform.size.height},format=rgba${fadeFilters.length ? "," + fadeFilters.join(",") : ""},setpts=PTS+${clip.timing.start}/TB[${layerLabel}]`
    );
    filters.push(
      `[${currentLabel}][${layerLabel}]overlay=x=${clip.transform.position.x}:y=${clip.transform.position.y}:enable='${clipEnable(clip)}'[${nextLabel}]`
    );
    currentLabel = nextLabel;
    mediaInputIndex += 1;
  });

  filters.push(`[${currentLabel}]format=yuv420p[outv]`);
  return filters.join(";");
};

const buildAudioFilters = (project: EditorProject) => {
  const media = inputClips(project);
  const audioInputs = media.map((clip, index) => ({ clip, index })).filter(({ clip }) => clip.kind === "audio" && !clip.muted);

  if (audioInputs.length === 0) {
    return "anullsrc=channel_layout=stereo:sample_rate=48000:d=" + project.timeline.duration + "[outa]";
  }

  const filters = audioInputs.map(({ clip, index }, audioIndex) => {
    const volume = clip.kind === "audio" ? clip.volume : 1;
    const fadeIn = clampFadeDuration(clip.kind === "audio" ? Math.max(clip.volumeFadeIn, clip.fades.fadeIn) : clip.fades.fadeIn, clip.timing.duration);
    const fadeOut = clampFadeDuration(clip.kind === "audio" ? Math.max(clip.volumeFadeOut, clip.fades.fadeOut) : clip.fades.fadeOut, clip.timing.duration);
    const fades = [
      fadeIn > 0 ? `afade=t=in:st=0:d=${fadeIn.toFixed(3)}` : "",
      fadeOut > 0 ? `afade=t=out:st=${Math.max(0, clip.timing.duration - fadeOut).toFixed(3)}:d=${fadeOut.toFixed(3)}` : ""
    ].filter(Boolean);

    return `[${index}:a]atrim=start=${clip.timing.sourceIn}:duration=${clip.timing.duration},asetpts=PTS-STARTPTS,adelay=${Math.round(clip.timing.start * 1000)}|${Math.round(clip.timing.start * 1000)},volume=${volume}${fades.length ? "," + fades.join(",") : ""}[a${audioIndex}]`;
  });

  filters.push(`${audioInputs.map((_, index) => `[a${index}]`).join("")}amix=inputs=${audioInputs.length}:duration=longest:normalize=0[outa]`);
  return filters.join(";");
};

export const buildFfmpegCommand = (project: EditorProject, preset: ExportPreset, outputPath: string): FfmpegCommand => {
  const media = inputClips(project);
  const args = ["-y"];

  media.forEach((clip) => {
    if (clip.kind === "image") {
      args.push("-loop", "1", "-t", clip.timing.duration.toString(), "-i", clip.sourcePath);
      return;
    }
    args.push("-i", clip.sourcePath);
  });

  args.push("-filter_complex", `${buildVideoFilters(project, preset)};${buildAudioFilters(project)}`);
  args.push("-map", "[outv]", "-map", "[outa]", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-t", project.timeline.duration.toString(), outputPath);

  return {
    executable: "ffmpeg",
    args,
    description: `Export ${project.settings.name} as ${preset.toUpperCase()} H.264 MP4`
  };
};
