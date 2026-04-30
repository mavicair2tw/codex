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
    useEditorStore.setState((state) => ({
      project: {
        ...state.project,
        clips: [
          {
            id: "video-for-playback",
            trackId: "track-video-1",
            kind: "video",
            name: "Video for playback",
            sourcePath: "video.mp4",
            timing: { start: 0, duration: 5, sourceIn: 0, sourceDuration: 5 },
            transform: {
              position: { x: 0, y: 0 },
              size: { width: 1920, height: 1080 },
              scale: 1,
              rotation: 0,
              opacity: 1
            },
            fades: { fadeIn: 0, fadeOut: 0 }
          }
        ]
      }
    }));
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

  it("continues timeline playback past the first selected visual clip", () => {
    vi.useFakeTimers();
    const firstClip: EditorClip = {
      id: "first-video",
      trackId: "track-video-1",
      kind: "video",
      name: "First video",
      sourcePath: "first.mp4",
      timing: { start: 0, duration: 2, sourceIn: 0, sourceDuration: 2 },
      transform: {
        position: { x: 0, y: 0 },
        size: { width: 1920, height: 1080 },
        scale: 1,
        rotation: 0,
        opacity: 1
      },
      fades: { fadeIn: 0, fadeOut: 0 }
    };
    const secondClip: EditorClip = {
      ...firstClip,
      id: "second-video",
      name: "Second video",
      sourcePath: "second.mp4",
      timing: { start: 2, duration: 2, sourceIn: 0, sourceDuration: 2 }
    };
    useEditorStore.setState((state) => ({
      project: { ...state.project, clips: [firstClip, secondClip] },
      selectedClipId: firstClip.id,
      playhead: 1.8
    }));

    render(<PreviewPlayer />);
    fireEvent.click(screen.getByRole("button", { name: /play preview/i }));
    act(() => {
      vi.advanceTimersByTime(700);
    });

    expect(useEditorStore.getState().playback).toBe("playing");
    expect(useEditorStore.getState().playhead).toBeGreaterThan(2);
  });

  it("advances preview playback without snapping to the edit grid", () => {
    vi.useFakeTimers();
    const clip: EditorClip = {
      id: "audio-clock",
      trackId: "track-audio-1",
      kind: "audio",
      name: "Audio clock",
      sourcePath: "clock.mp3",
      previewUrl: "blob:audio-clock",
      volume: 1,
      volumeFadeIn: 0,
      volumeFadeOut: 0,
      timing: { start: 0, duration: 5, sourceIn: 0, sourceDuration: 5 },
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
      project: { ...state.project, clips: [clip] }
    }));

    render(<PreviewPlayer />);
    fireEvent.click(screen.getByRole("button", { name: /play preview/i }));
    act(() => {
      vi.advanceTimersByTime(80);
    });

    const playhead = useEditorStore.getState().playhead;
    expect(playhead).toBeGreaterThan(0);
    expect(playhead).toBeLessThan(0.25);
  });

  it("does not restart or seek video on every playhead tick during normal playback", () => {
    const clip: EditorClip = {
      id: "stable-video",
      trackId: "track-video-1",
      kind: "video",
      name: "Stable video",
      sourcePath: "stable.mp4",
      previewUrl: "blob:stable-video",
      timing: { start: 0, duration: 5, sourceIn: 0, sourceDuration: 5 },
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
      project: { ...state.project, clips: [clip] }
    }));
    const play = vi.mocked(HTMLMediaElement.prototype.play);
    play.mockClear();

    const { container } = render(<PreviewPlayer />);
    const video = container.querySelector("video");
    expect(video).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /play preview/i }));
    expect(play).toHaveBeenCalledTimes(1);

    if (video) {
      video.currentTime = 0.1;
    }
    act(() => useEditorStore.setState({ playhead: 0.1 }));
    expect(play).toHaveBeenCalledTimes(1);
    expect(video?.currentTime).toBeCloseTo(0.1);

    if (video) {
      video.currentTime = 0.2;
    }
    act(() => useEditorStore.setState({ playhead: 0.2 }));
    expect(play).toHaveBeenCalledTimes(1);
    expect(video?.currentTime).toBeCloseTo(0.2);
  });

  it("seeks video when the timeline position jumps during playback", () => {
    const clip: EditorClip = {
      id: "jump-video",
      trackId: "track-video-1",
      kind: "video",
      name: "Jump video",
      sourcePath: "jump.mp4",
      previewUrl: "blob:jump-video",
      timing: { start: 0, duration: 5, sourceIn: 0, sourceDuration: 5 },
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
      project: { ...state.project, clips: [clip] }
    }));

    const { container } = render(<PreviewPlayer />);
    const video = container.querySelector("video");
    expect(video).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /play preview/i }));
    if (video) {
      video.currentTime = 0.2;
    }

    act(() => useEditorStore.getState().setPlayhead(2));

    expect(video?.currentTime).toBeCloseTo(2);
  });

  it("does not restart or seek audio on every playhead tick during normal playback", () => {
    const clip: EditorClip = {
      id: "stable-audio",
      trackId: "track-audio-1",
      kind: "audio",
      name: "Stable audio",
      sourcePath: "stable.mp3",
      previewUrl: "blob:stable-audio",
      volume: 1,
      volumeFadeIn: 0,
      volumeFadeOut: 0,
      timing: { start: 0, duration: 5, sourceIn: 0, sourceDuration: 5 },
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
      project: { ...state.project, clips: [clip] }
    }));
    const play = vi.mocked(HTMLMediaElement.prototype.play);
    play.mockClear();

    const { container } = render(<PreviewPlayer />);
    const audio = container.querySelector("audio");
    expect(audio).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /play preview/i }));
    expect(play).toHaveBeenCalledTimes(1);

    if (audio) {
      audio.currentTime = 0.1;
    }
    act(() => useEditorStore.setState({ playhead: 0.1 }));
    expect(play).toHaveBeenCalledTimes(1);
    expect(audio?.currentTime).toBeCloseTo(0.1);
  });

  it("stops preview playback at the end of actual timeline content", () => {
    vi.useFakeTimers();
    const clip: EditorClip = {
      id: "short-video",
      trackId: "track-video-1",
      kind: "video",
      name: "Short video",
      sourcePath: "short.mp4",
      timing: { start: 0, duration: 4, sourceIn: 0, sourceDuration: 4 },
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
      playhead: 3.8
    }));

    render(<PreviewPlayer />);
    fireEvent.click(screen.getByRole("button", { name: /play preview/i }));
    act(() => {
      vi.advanceTimersByTime(700);
    });

    expect(useEditorStore.getState().playback).toBe("stopped");
    expect(useEditorStore.getState().playhead).toBeCloseTo(4);
  });

  it("does not play an empty timeline", () => {
    vi.useFakeTimers();
    render(<PreviewPlayer />);

    fireEvent.click(screen.getByRole("button", { name: /play preview/i }));
    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(useEditorStore.getState().playback).toBe("stopped");
    expect(useEditorStore.getState().playhead).toBe(0);
  });
});
