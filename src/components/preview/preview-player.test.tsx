import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { PreviewPlayer } from "@/components/preview/preview-player";
import { resetEditorStore } from "@/test-utils/editor-store";
import { useEditorStore } from "@/stores/editor-store";

describe("PreviewPlayer", () => {
  beforeEach(() => {
    resetEditorStore();
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
});
