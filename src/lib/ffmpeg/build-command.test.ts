import { describe, expect, it } from "vitest";
import { sampleProject } from "@/data/sample-project";
import { buildFfmpegCommand } from "@/lib/ffmpeg/build-command";
import type { EditorClip } from "@/types/editor";

const baseTransform = {
  position: { x: 0, y: 0 },
  size: { width: 640, height: 360 },
  scale: 1,
  rotation: 0,
  opacity: 1
};

describe("buildFfmpegCommand", () => {
  it("uses local timeline fade filters for image and video opacity", () => {
    const imageClip: EditorClip = {
      id: "image",
      trackId: "track-image-1",
      kind: "image",
      name: "Image",
      sourcePath: "image.png",
      timing: { start: 4, duration: 6, sourceIn: 0, sourceDuration: 6 },
      transform: baseTransform,
      fades: { fadeIn: 1, fadeOut: 2 }
    };
    const command = buildFfmpegCommand({ ...sampleProject, clips: [imageClip] }, "1080p", "out.mp4");
    const filter = command.args[command.args.indexOf("-filter_complex") + 1];

    expect(filter).toContain("fade=t=in:st=0:d=1.000:alpha=1");
    expect(filter).toContain("fade=t=out:st=4.000:d=2.000:alpha=1");
    expect(filter).toContain("setpts=PTS+4/TB");
  });

  it("uses local audio fade timing for audio clips", () => {
    const audioClip: EditorClip = {
      id: "audio",
      trackId: "track-audio-1",
      kind: "audio",
      name: "Audio",
      sourcePath: "audio.mp3",
      volume: 1,
      volumeFadeIn: 0,
      volumeFadeOut: 0,
      timing: { start: 8, duration: 5, sourceIn: 0, sourceDuration: 5 },
      transform: baseTransform,
      fades: { fadeIn: 1.5, fadeOut: 2 }
    };
    const command = buildFfmpegCommand({ ...sampleProject, clips: [audioClip] }, "1080p", "out.mp4");
    const filter = command.args[command.args.indexOf("-filter_complex") + 1];

    expect(filter).toContain("afade=t=in:st=0:d=1.500");
    expect(filter).toContain("afade=t=out:st=3.000:d=2.000");
    expect(filter).toContain("adelay=8000|8000");
  });

  it("does not assume video inputs have audio streams", () => {
    const videoClip: EditorClip = {
      id: "video",
      trackId: "track-video-1",
      kind: "video",
      name: "Silent video",
      sourcePath: "silent.mp4",
      timing: { start: 0, duration: 5, sourceIn: 0, sourceDuration: 5 },
      transform: baseTransform,
      fades: { fadeIn: 0, fadeOut: 0 }
    };
    const command = buildFfmpegCommand({ ...sampleProject, clips: [videoClip] }, "1080p", "out.mp4");
    const filter = command.args[command.args.indexOf("-filter_complex") + 1];

    expect(filter).not.toContain("[0:a]");
    expect(filter).toContain("anullsrc=channel_layout=stereo:sample_rate=48000");
  });
});
