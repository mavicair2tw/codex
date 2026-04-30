import { exportPresetSizes } from "@/lib/ffmpeg/presets";
import type { EditorClip, EditorProject, ExportPreset } from "@/types/editor";

export interface FfmpegCommand {
  executable: "ffmpeg";
  args: string[];
  description: string;
}

const escapeDrawtext = (value: string) => value.replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\\'");

const clipEnable = (clip: EditorClip) => `between(t,${clip.timing.start.toFixed(3)},${(clip.timing.start + clip.timing.duration).toFixed(3)})`;

const opacityExpression = (clip: EditorClip) => {
  const start = clip.timing.start;
  const end = clip.timing.start + clip.timing.duration;
  const fadeInEnd = start + clip.fades.fadeIn;
  const fadeOutStart = end - clip.fades.fadeOut;

  if (clip.fades.fadeIn <= 0 && clip.fades.fadeOut <= 0) {
    return clip.transform.opacity.toFixed(3);
  }

  const baseOpacity = clip.transform.opacity.toFixed(3);
  const fadeIn = clip.fades.fadeIn > 0 ? `if(lt(t\\,${fadeInEnd.toFixed(3)})\\,((t-${start.toFixed(3)})/${clip.fades.fadeIn.toFixed(3)})*${baseOpacity}\\,${baseOpacity})` : baseOpacity;
  return clip.fades.fadeOut > 0 ? `if(gt(t\\,${fadeOutStart.toFixed(3)})\\,((${end.toFixed(3)}-t)/${clip.fades.fadeOut.toFixed(3)})*${baseOpacity}\\,${fadeIn})` : fadeIn;
};

const inputClips = (project: EditorProject) => project.clips.filter((clip) => clip.kind !== "text");

const buildVideoFilters = (project: EditorProject, preset: ExportPreset) => {
  const size = exportPresetSizes[preset];
  const visualClips = project.clips.filter((clip) => clip.kind === "video" || clip.kind === "image" || clip.kind === "text");
  const filters: string[] = [`color=c=${project.settings.backgroundColor}:s=${size.width}x${size.height}:r=${project.timeline.fps}:d=${project.timeline.duration}[base]`];
  let currentLabel = "base";
  let mediaInputIndex = 0;

  visualClips.forEach((clip, visualIndex) => {
    const nextLabel = `v${visualIndex}`;

    if (clip.kind === "text") {
      const text = escapeDrawtext(clip.text);
      const alpha = opacityExpression(clip);
      filters.push(
        `[${currentLabel}]drawtext=text='${text}':font='${escapeDrawtext(clip.fontFamily)}':fontsize=${clip.fontSize}:fontcolor=${clip.color}:x=${clip.transform.position.x}:y=${clip.transform.position.y}:alpha='${alpha}':enable='${clipEnable(clip)}'[${nextLabel}]`
      );
      currentLabel = nextLabel;
      return;
    }

    const inputLabel = `${mediaInputIndex}:v`;
    const layerLabel = `layer${visualIndex}`;
    const alpha = opacityExpression(clip);
    filters.push(
      `[${inputLabel}]trim=start=${clip.timing.sourceIn}:duration=${clip.timing.duration},setpts=PTS-STARTPTS+${clip.timing.start}/TB,scale=${clip.transform.size.width}:${clip.transform.size.height},format=rgba,colorchannelmixer=aa='${alpha}'[${layerLabel}]`
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
  const audioInputs = media
    .map((clip, index) => ({ clip, index }))
    .filter(({ clip }) => clip.kind === "audio" || clip.kind === "video");

  if (audioInputs.length === 0) {
    return "anullsrc=channel_layout=stereo:sample_rate=48000:d=" + project.timeline.duration + "[outa]";
  }

  const filters = audioInputs.map(({ clip, index }, audioIndex) => {
    const volume = clip.kind === "audio" ? clip.volume : 1;
    const fadeIn = clip.kind === "audio" ? clip.volumeFadeIn : 0;
    const fadeOut = clip.kind === "audio" ? clip.volumeFadeOut : 0;
    const end = clip.timing.start + clip.timing.duration;
    const fades = [
      fadeIn > 0 ? `afade=t=in:st=${clip.timing.start}:d=${fadeIn}` : "",
      fadeOut > 0 ? `afade=t=out:st=${Math.max(clip.timing.start, end - fadeOut)}:d=${fadeOut}` : ""
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
