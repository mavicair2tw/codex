import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { MediaGallery } from "@/components/media/media-gallery";
import { resetEditorStore } from "@/test-utils/editor-store";
import { useEditorStore } from "@/stores/editor-store";
import type { EditorClip, MediaAsset } from "@/types/editor";

const makeClip = (id: string, kind: "image" | "video" | "audio", start: number): EditorClip => {
  const base = {
    id,
    trackId: `track-${kind}-1`,
    name: `${kind} asset`,
    sourcePath: `${kind}.mock`,
    previewUrl: `blob:${kind}`,
    timing: { start, duration: 3, sourceIn: 0, sourceDuration: 3 },
    transform: {
      position: { x: 0, y: 0 },
      size: { width: 320, height: 180 },
      scale: 1,
      rotation: 0,
      opacity: 1
    },
    fades: { fadeIn: 0, fadeOut: 0 }
  };

  if (kind === "audio") {
    return { ...base, kind, volume: 1, volumeFadeIn: 0, volumeFadeOut: 0 };
  }

  return { ...base, kind };
};

const makeAsset = (clipId: string, kind: "image" | "video" | "audio"): MediaAsset => ({
  id: `asset-${clipId}`,
  clipId,
  kind,
  name: `${kind} upload`,
  sourcePath: `${kind}.mock`,
  previewUrl: kind === "audio" ? undefined : `blob:${kind}`,
  mimeType: `${kind}/mock`,
  duration: 3,
  importedAt: "2026-04-30T00:00:00.000Z"
});

describe("MediaGallery", () => {
  beforeEach(() => {
    resetEditorStore();
  });

  it("renders an empty imported-media state without crashing", () => {
    render(<MediaGallery />);

    expect(screen.getByText(/no imports yet/i)).toBeInTheDocument();
  });

  it("renders imported image, video, and audio assets", () => {
    const clips = [makeClip("clip-image", "image", 1), makeClip("clip-video", "video", 2), makeClip("clip-audio", "audio", 3)];
    const mediaAssets = [makeAsset("clip-image", "image"), makeAsset("clip-video", "video"), makeAsset("clip-audio", "audio")];

    useEditorStore.setState((state) => ({
      project: {
        ...state.project,
        clips: [...state.project.clips, ...clips],
        mediaAssets
      }
    }));

    render(<MediaGallery />);

    expect(screen.getByText("image upload")).toBeInTheDocument();
    expect(screen.getByText("video upload")).toBeInTheDocument();
    expect(screen.getByText("audio upload")).toBeInTheDocument();
  });

  it("selects the linked clip and seeks to its start when a gallery item is clicked", () => {
    const clip = makeClip("clip-video", "video", 4);
    const asset = makeAsset("clip-video", "video");

    useEditorStore.setState((state) => ({
      project: {
        ...state.project,
        clips: [...state.project.clips, clip],
        mediaAssets: [asset]
      }
    }));

    render(<MediaGallery />);
    fireEvent.click(screen.getByRole("button", { name: /video upload/i }));

    expect(useEditorStore.getState().selectedClipId).toBe("clip-video");
    expect(useEditorStore.getState().playhead).toBe(4);
  });
});
