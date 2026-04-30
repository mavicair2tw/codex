import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { MediaGallery } from "@/components/media/media-gallery";
import { resetEditorStore } from "@/test-utils/editor-store";
import { useEditorStore } from "@/stores/editor-store";
import type { LayerKind, MediaAsset } from "@/types/editor";

const makeAsset = (id: string, kind: LayerKind): MediaAsset => ({
  id: `asset-${id}`,
  kind,
  name: `${kind} upload`,
  sourcePath: kind === "text" ? undefined : `${kind}.mock`,
  previewUrl: kind === "audio" ? undefined : `blob:${kind}`,
  mimeType: `${kind}/mock`,
  duration: kind === "text" ? 5 : 3,
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

  it("renders imported image, video, audio, and text assets", () => {
    const mediaAssets = [makeAsset("image", "image"), makeAsset("video", "video"), makeAsset("audio", "audio"), makeAsset("text", "text")];

    useEditorStore.setState((state) => ({
      project: {
        ...state.project,
        mediaAssets
      }
    }));

    render(<MediaGallery />);

    expect(screen.getByText("image upload")).toBeInTheDocument();
    expect(screen.getByText("video upload")).toBeInTheDocument();
    expect(screen.getByText("audio upload")).toBeInTheDocument();
    expect(screen.getByText("text upload")).toBeInTheDocument();
  });

  it("selects gallery assets without adding timeline clips", () => {
    const asset = makeAsset("video", "video");

    useEditorStore.setState((state) => ({
      project: {
        ...state.project,
        mediaAssets: [asset]
      }
    }));

    render(<MediaGallery />);
    fireEvent.click(screen.getByRole("button", { name: /select video upload/i }));

    expect(useEditorStore.getState().selectedAssetId).toBe(asset.id);
    expect(useEditorStore.getState().selectedClipId).toBeNull();
    expect(useEditorStore.getState().project.clips).toHaveLength(0);
  });

  it("adds a selected gallery asset to the timeline only when requested", () => {
    const asset = makeAsset("image", "image");
    useEditorStore.setState((state) => ({
      project: {
        ...state.project,
        mediaAssets: [asset]
      }
    }));

    render(<MediaGallery />);
    fireEvent.click(screen.getByRole("button", { name: /add image upload to timeline/i }));

    expect(useEditorStore.getState().project.clips).toHaveLength(1);
    expect(useEditorStore.getState().project.clips[0].kind).toBe("image");
    expect(useEditorStore.getState().selectedClipId).toBe(useEditorStore.getState().project.clips[0].id);
    expect(useEditorStore.getState().selectedAssetId).toBeNull();
  });
});
