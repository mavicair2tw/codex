import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PreviewPlayer } from "@/components/preview/preview-player";
import { resetEditorStore } from "@/test-utils/editor-store";
import { useEditorStore } from "@/stores/editor-store";
import type { EditorClip } from "@/types/editor";

describe("PreviewPlayer", () => {
  beforeEach(() => {
    resetEditorStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("toggles preview playback from the play button", () => {
    render(<PreviewPlayer />);

    fireEvent.click(screen.getByRole("button", { name: /play preview/i }));
    expect(useEditorStore.getState().playback).toBe("playing");
    expect(screen.getByRole("button", { name: /pause preview/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /pause preview/i }));
    expect(useEditorStore.getState().playback).toBe("paused");
  });

  it("toggles preview playback with Space and prevents page scroll", () => {
    render(<PreviewPlayer />);

    const event = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      code: "Space"
    });

    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(useEditorStore.getState().playback).toBe("playing");
  });

  it("does not toggle playback with Space while typing in an input", () => {
    render(
      <>
        <input aria-label="Clip name" />
        <PreviewPlayer />
      </>
    );

    const input = screen.getByRole("textbox", { name: /clip name/i });
    input.focus();
    fireEvent.keyDown(input, { code: "Space" });

    expect(useEditorStore.getState().playback).toBe("stopped");
  });

  it("supports precise playhead navigation controls", () => {
    render(<PreviewPlayer />);

    act(() => useEditorStore.getState().setPlayhead(1));
    fireEvent.click(screen.getByRole("button", { name: /step forward one frame/i }));
    expect(useEditorStore.getState().playhead).toBeCloseTo(1 + 1 / 30);

    fireEvent.click(screen.getByRole("button", { name: /step backward one frame/i }));
    expect(useEditorStore.getState().playhead).toBeCloseTo(1);

    fireEvent.click(screen.getByRole("button", { name: /jump to end/i }));
    expect(useEditorStore.getState().playhead).toBe(30);

    fireEvent.click(screen.getByRole("button", { name: /jump to beginning/i }));
    expect(useEditorStore.getState().playhead).toBe(0);
  });

  it("labels the preview canvas with the selected aspect-ratio dimensions", () => {
    useEditorStore.getState().setCanvasAspectRatio("9:16");

    render(<PreviewPlayer />);

    expect(screen.getByLabelText(/preview canvas 1080 by 1920/i)).toBeInTheDocument();
  });

  it("stops playback at the end of the selected image or video clip", () => {
    vi.useFakeTimers();
    const clip: EditorClip = {
      id: "video-clip",
      trackId: "track-video-1",
      kind: "video",
      name: "Selected video",
      sourcePath: "video.mp4",
      timing: { start: 5, duration: 2, sourceIn: 0, sourceDuration: 2 },
      transform: {
        position: { x: 0, y: 0 },
        size: { width: 1920, height: 1080 },
        scale: 1,
        rotation: 0,
        opacity: 1
      },
      fades: { fadeIn: 0, fadeOut: 0 }
    };
    useEditorStore.setState((state) => ({
      project: { ...state.project, clips: [clip] },
      selectedClipId: clip.id,
      playhead: 6.8
    }));

    render(<PreviewPlayer />);
    fireEvent.click(screen.getByRole("button", { name: /play preview/i }));
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(useEditorStore.getState().playback).toBe("stopped");
    expect(useEditorStore.getState().playhead).toBeCloseTo(7);
  });
});
