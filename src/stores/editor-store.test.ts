import { beforeEach, describe, expect, it } from "vitest";
import { resetEditorStore } from "@/test-utils/editor-store";
import { useEditorStore } from "@/stores/editor-store";
import type { EditorClip } from "@/types/editor";

const makeClip = (id: string, kind: "video" | "audio" | "image" | "text"): EditorClip => {
  const base = {
    id,
    trackId: `track-${kind}-1`,
    name: `${kind} clip`,
    timing: { start: 0, duration: 3, sourceIn: 0, sourceDuration: 3 },
    transform: {
      position: { x: 0, y: 0 },
      size: { width: 320, height: 180 },
      scale: 1,
      rotation: 0,
      opacity: 1
    },
    fades: { fadeIn: 0, fadeOut: 0 }
  };

  if (kind === "text") {
    return { ...base, kind, text: "Title", fontSize: 32, fontFamily: "Inter", color: "#ffffff" };
  }

  if (kind === "audio") {
    return { ...base, kind, sourcePath: "audio.wav", volume: 1, volumeFadeIn: 0, volumeFadeOut: 0 };
  }

  return { ...base, kind, sourcePath: `${kind}.mock` };
};

describe("editor store timeline clip controls", () => {
  beforeEach(() => {
    resetEditorStore();
  });

  it("deletes video, image, text, and audio clips from the timeline", () => {
    const clips = [makeClip("video", "video"), makeClip("image", "image"), makeClip("text", "text"), makeClip("audio", "audio")];
    useEditorStore.setState((state) => ({
      project: { ...state.project, clips },
      selectedClipId: "text"
    }));

    clips.forEach((clip) => useEditorStore.getState().deleteClip(clip.id));

    expect(useEditorStore.getState().project.clips).toHaveLength(0);
    expect(useEditorStore.getState().selectedClipId).toBeNull();
  });

  it("trims the start and end of video, image, text, and audio clips", () => {
    const clips = [makeClip("video", "video"), makeClip("image", "image"), makeClip("text", "text"), makeClip("audio", "audio")];
    useEditorStore.setState((state) => ({
      project: { ...state.project, clips }
    }));

    clips.forEach((clip) => {
      useEditorStore.getState().trimClip(clip.id, "start", 1);
      useEditorStore.getState().trimClip(clip.id, "end", 2);
    });

    const nextClips = useEditorStore.getState().project.clips;
    nextClips.forEach((clip) => {
      expect(clip.timing.start).toBe(1);
      expect(clip.timing.duration).toBe(1);
      expect(clip.timing.sourceIn).toBe(1);
    });
  });

  it("splits video, image, text, and audio clips at the playhead", () => {
    const kinds = ["video", "image", "text", "audio"] as const;

    kinds.forEach((kind) => {
      resetEditorStore();
      const clip = makeClip(`${kind}-split`, kind);
      useEditorStore.setState((state) => ({
        project: { ...state.project, clips: [clip] }
      }));
      useEditorStore.getState().setPreviewPlayhead(1.2);

      useEditorStore.getState().splitClipAtPlayhead(clip.id);

      const nextClips = useEditorStore.getState().project.clips;
      expect(nextClips).toHaveLength(2);
      const [leftClip, rightClip] = nextClips;
      expect(leftClip.kind).toBe(kind);
      expect(rightClip.kind).toBe(kind);
      expect(leftClip.timing.start).toBe(0);
      expect(leftClip.timing.duration).toBe(1.2);
      expect(rightClip.timing.start).toBe(1.2);
      expect(rightClip.timing.duration).toBe(1.8);
      expect(rightClip.timing.sourceIn).toBe(1.2);
      expect(useEditorStore.getState().selectedClipId).toBe(rightClip.id);
    });
  });

  it("does not split clips when the playhead is outside the clip body", () => {
    const clip = makeClip("video", "video");
    useEditorStore.setState((state) => ({
      project: { ...state.project, clips: [clip] }
    }));

    useEditorStore.getState().setPreviewPlayhead(3);
    useEditorStore.getState().splitClipAtPlayhead(clip.id);

    expect(useEditorStore.getState().project.clips).toHaveLength(1);
  });

  it("toggles mute only for video and audio clips", () => {
    const clips = [makeClip("video", "video"), makeClip("audio", "audio"), makeClip("image", "image")];
    useEditorStore.setState((state) => ({
      project: { ...state.project, clips }
    }));

    useEditorStore.getState().toggleClipMute("video");
    useEditorStore.getState().toggleClipMute("audio");
    useEditorStore.getState().toggleClipMute("image");

    const nextClips = useEditorStore.getState().project.clips;
    expect(nextClips.find((clip) => clip.id === "video")?.muted).toBe(true);
    expect(nextClips.find((clip) => clip.id === "audio")?.muted).toBe(true);
    expect(nextClips.find((clip) => clip.id === "image")?.muted).toBeUndefined();
  });

  it("updates the canvas size when the aspect ratio changes", () => {
    useEditorStore.getState().setCanvasAspectRatio("9:16");

    expect(useEditorStore.getState().project.settings.aspectRatio).toBe("9:16");
    expect(useEditorStore.getState().project.settings.canvas).toEqual({ width: 1080, height: 1920 });

    useEditorStore.getState().setCanvasAspectRatio("1:1");

    expect(useEditorStore.getState().project.settings.aspectRatio).toBe("1:1");
    expect(useEditorStore.getState().project.settings.canvas).toEqual({ width: 1080, height: 1080 });
  });

  it("keeps preview playhead movement unsnapped for stable playback timing", () => {
    useEditorStore.getState().setPlayhead(0.12);
    expect(useEditorStore.getState().playhead).not.toBe(0.12);

    useEditorStore.getState().setPreviewPlayhead(0.12);
    expect(useEditorStore.getState().playhead).toBe(0.12);
  });

  it("imports media assets into the gallery without creating timeline clips", () => {
    useEditorStore.getState().importMediaAsset({
      kind: "video",
      name: "Opening shot",
      sourcePath: "opening.mp4",
      previewUrl: "blob:opening",
      mimeType: "video/mp4",
      duration: 4
    });

    expect(useEditorStore.getState().project.mediaAssets).toHaveLength(1);
    expect(useEditorStore.getState().project.clips).toHaveLength(0);
    expect(useEditorStore.getState().selectedAssetId).toBe(useEditorStore.getState().project.mediaAssets[0].id);
    expect(useEditorStore.getState().selectedClipId).toBeNull();
  });

  it("adds gallery assets to the timeline on explicit request", () => {
    useEditorStore.getState().importMediaAsset({
      kind: "audio",
      name: "Music bed",
      sourcePath: "music.mp3",
      previewUrl: "blob:music",
      mimeType: "audio/mpeg",
      duration: 6
    });
    const assetId = useEditorStore.getState().project.mediaAssets[0].id;

    useEditorStore.getState().addAssetToTimeline(assetId);

    expect(useEditorStore.getState().project.clips).toHaveLength(1);
    expect(useEditorStore.getState().project.clips[0].kind).toBe("audio");
    expect(useEditorStore.getState().selectedClipId).toBe(useEditorStore.getState().project.clips[0].id);
    expect(useEditorStore.getState().selectedAssetId).toBeNull();
  });

  it("creates text assets in the gallery before timeline insertion", () => {
    useEditorStore.getState().addTextAsset();

    expect(useEditorStore.getState().project.mediaAssets).toHaveLength(1);
    expect(useEditorStore.getState().project.mediaAssets[0].kind).toBe("text");
    expect(useEditorStore.getState().project.clips).toHaveLength(0);

    useEditorStore.getState().addAssetToTimeline(useEditorStore.getState().project.mediaAssets[0].id);

    expect(useEditorStore.getState().project.clips).toHaveLength(1);
    expect(useEditorStore.getState().project.clips[0].kind).toBe("text");
  });

  it("removes selected gallery assets without deleting existing timeline clips", () => {
    useEditorStore.getState().importMediaAsset({
      kind: "image",
      name: "Logo",
      sourcePath: "logo.png",
      previewUrl: "blob:logo",
      mimeType: "image/png",
      duration: 5
    });
    const assetId = useEditorStore.getState().project.mediaAssets[0].id;
    useEditorStore.getState().addAssetToTimeline(assetId);

    useEditorStore.getState().selectAsset(assetId);
    useEditorStore.getState().removeMediaAsset(assetId);

    expect(useEditorStore.getState().project.mediaAssets).toHaveLength(0);
    expect(useEditorStore.getState().project.clips).toHaveLength(1);
    expect(useEditorStore.getState().selectedAssetId).toBeNull();
  });
});
