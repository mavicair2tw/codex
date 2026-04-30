"use client";

import { Pause, Play, SkipBack, SkipForward, Square, StepBack, StepForward } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { shouldTogglePlaybackFromKeyboard } from "@/lib/keyboard/transport-shortcuts";
import { getRenderableLayers } from "@/lib/renderer/preview-engine";
import { getEditorFontCssFamily } from "@/lib/text/fonts";
import { formatTimecode, getFadeMultiplierAtLocalTime } from "@/lib/time";
import { getTimelineContentEnd } from "@/lib/timeline/content-end";
import { useEditorStore } from "@/stores/editor-store";
import type { EditorClip } from "@/types/editor";

type PreviewEditMode = "move" | "rotate" | "resize-n" | "resize-e" | "resize-s" | "resize-w" | "resize-nw" | "resize-ne" | "resize-sw" | "resize-se";

interface PreviewEditState {
  clip: EditorClip;
  mode: PreviewEditMode;
  originX: number;
  originY: number;
  originPosition: { x: number; y: number };
  originRotation: number;
  originScale: number;
  originSize: { width: number; height: number };
  originPointerAngle: number;
}

interface MediaPreviewProps {
  clip: EditorClip;
  localTime: number;
  playback: "playing" | "paused" | "stopped";
}

const SEEK_EPSILON_SECONDS = 0.035;
const PLAYING_DRIFT_TOLERANCE_SECONDS = 0.45;
const TIMELINE_JUMP_TOLERANCE_SECONDS = 0.25;
const MIN_LAYER_SCALE = 0.05;
const MAX_LAYER_SCALE = 10;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const normalizeRotation = (degrees: number) => {
  const normalized = ((degrees % 360) + 360) % 360;
  return normalized > 180 ? normalized - 360 : normalized;
};

const shouldSeekMedia = ({
  currentTime,
  targetTime,
  playback,
  previousPlayback,
  previousTargetTime
}: {
  currentTime: number;
  targetTime: number;
  playback: "playing" | "paused" | "stopped";
  previousPlayback: "playing" | "paused" | "stopped" | null;
  previousTargetTime: number | null;
}) => {
  const drift = Math.abs(currentTime - targetTime);
  const isStartingPlayback = playback === "playing" && previousPlayback !== "playing";
  const isScrubbingOrPaused = playback !== "playing";
  const didTimelineJump = previousTargetTime === null || Math.abs(targetTime - previousTargetTime) > TIMELINE_JUMP_TOLERANCE_SECONDS;

  if (isStartingPlayback || isScrubbingOrPaused || didTimelineJump) {
    return drift > SEEK_EPSILON_SECONDS;
  }

  return drift > PLAYING_DRIFT_TOLERANCE_SECONDS;
};

const MediaPreview = ({ clip, localTime, playback }: MediaPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previousPlaybackRef = useRef<MediaPreviewProps["playback"] | null>(null);
  const previousTargetRef = useRef<number | null>(null);

  useEffect(() => {
    if (clip.kind !== "video" || !videoRef.current) return;
    const video = videoRef.current;
    const target = Math.max(0, clip.timing.sourceIn + localTime);
    const previousPlayback = previousPlaybackRef.current;
    const previousTarget = previousTargetRef.current;

    if (
      shouldSeekMedia({
        currentTime: video.currentTime,
        targetTime: target,
        playback,
        previousPlayback,
        previousTargetTime: previousTarget
      })
    ) {
      video.currentTime = target;
    }

    if (playback === "playing" && previousPlayback !== "playing") {
      video.play().catch(() => undefined);
    } else if (playback !== "playing" && previousPlayback === "playing") {
      video.pause();
    }

    previousPlaybackRef.current = playback;
    previousTargetRef.current = target;
  }, [clip, localTime, playback]);

  if ((clip.kind === "image" || clip.kind === "video") && clip.previewUrl) {
    if (clip.kind === "image") {
      return <div aria-label={clip.name} className="preview-media" role="img" style={{ backgroundImage: `url("${clip.previewUrl}")` }} />;
    }

    return <video className="preview-media" muted playsInline preload="metadata" ref={videoRef} src={clip.previewUrl} />;
  }

  return <span>{clip.name}</span>;
};

interface AudioPreviewProps {
  clip: EditorClip;
  localTime: number;
  playback: "playing" | "paused" | "stopped";
}

const AudioPreview = ({ clip, localTime, playback }: AudioPreviewProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousPlaybackRef = useRef<AudioPreviewProps["playback"] | null>(null);
  const previousTargetRef = useRef<number | null>(null);

  useEffect(() => {
    if (clip.kind !== "audio" || !clip.previewUrl || !audioRef.current) return;
    const audio = audioRef.current;
    const target = Math.max(0, clip.timing.sourceIn + localTime);
    const previousPlayback = previousPlaybackRef.current;
    const previousTarget = previousTargetRef.current;
    const fadeMultiplier = getFadeMultiplierAtLocalTime(
      localTime,
      clip.timing.duration,
      Math.max(clip.fades.fadeIn, clip.volumeFadeIn),
      Math.max(clip.fades.fadeOut, clip.volumeFadeOut)
    );
    audio.volume = clip.muted ? 0 : Math.min(1, clip.volume * fadeMultiplier);
    if (
      shouldSeekMedia({
        currentTime: audio.currentTime,
        targetTime: target,
        playback,
        previousPlayback,
        previousTargetTime: previousTarget
      })
    ) {
      audio.currentTime = target;
    }

    if (playback === "playing" && previousPlayback !== "playing") {
      audio.play().catch(() => undefined);
    } else if (playback !== "playing" && previousPlayback === "playing") {
      audio.pause();
    }

    previousPlaybackRef.current = playback;
    previousTargetRef.current = target;
  }, [clip, localTime, playback]);

  if (clip.kind !== "audio" || !clip.previewUrl || clip.muted) {
    return null;
  }

  return <audio preload="metadata" ref={audioRef} src={clip.previewUrl} />;
};

export const PreviewPlayer = () => {
  const project = useEditorStore((state) => state.project);
  const { width: canvasWidth, height: canvasHeight } = project.settings.canvas;
  const selectedClipId = useEditorStore((state) => state.selectedClipId);
  const playhead = useEditorStore((state) => state.playhead);
  const playback = useEditorStore((state) => state.playback);
  const setPlayback = useEditorStore((state) => state.setPlayback);
  const setPlayhead = useEditorStore((state) => state.setPlayhead);
  const setPreviewPlayhead = useEditorStore((state) => state.setPreviewPlayhead);
  const selectClip = useEditorStore((state) => state.selectClip);
  const updateClip = useEditorStore((state) => state.updateClip);
  const jumpToTimelineStart = useEditorStore((state) => state.jumpToTimelineStart);
  const jumpToTimelineEnd = useEditorStore((state) => state.jumpToTimelineEnd);
  const stepPlayheadBackward = useEditorStore((state) => state.stepPlayheadBackward);
  const stepPlayheadForward = useEditorStore((state) => state.stepPlayheadForward);
  const togglePlayback = useEditorStore((state) => state.togglePlayback);
  const stopPlayback = useEditorStore((state) => state.stopPlayback);
  const playheadRef = useRef(playhead);
  const previewEndRef = useRef(getTimelineContentEnd(project));
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const editRef = useRef<PreviewEditState | null>(null);
  const [previewSize, setPreviewSize] = useState({ width: canvasWidth, height: canvasHeight });
  const layers = getRenderableLayers(project, playhead);
  const activeAudioClips = project.clips.filter((clip) => clip.kind === "audio" && playhead >= clip.timing.start && playhead <= clip.timing.start + clip.timing.duration);

  useEffect(() => {
    playheadRef.current = playhead;
  }, [playhead]);

  useEffect(() => {
    previewEndRef.current = getTimelineContentEnd(project);
  }, [project]);

  useEffect(() => {
    const fitCanvasToStage = () => {
      const stage = stageRef.current;
      if (!stage) return;

      const styles = window.getComputedStyle(stage);
      const horizontalPadding = Number.parseFloat(styles.paddingLeft) + Number.parseFloat(styles.paddingRight);
      const verticalPadding = Number.parseFloat(styles.paddingTop) + Number.parseFloat(styles.paddingBottom);
      const availableWidth = Math.max(1, stage.clientWidth - horizontalPadding);
      const availableHeight = Math.max(1, stage.clientHeight - verticalPadding);
      const canvasAspect = canvasWidth / canvasHeight;
      const stageAspect = availableWidth / availableHeight;

      const nextSize =
        stageAspect > canvasAspect
          ? { width: availableHeight * canvasAspect, height: availableHeight }
          : { width: availableWidth, height: availableWidth / canvasAspect };

      setPreviewSize({
        width: Math.round(nextSize.width),
        height: Math.round(nextSize.height)
      });
    };

    fitCanvasToStage();

    if (typeof ResizeObserver !== "undefined" && stageRef.current) {
      const observer = new ResizeObserver(fitCanvasToStage);
      observer.observe(stageRef.current);
      return () => observer.disconnect();
    }

    window.addEventListener("resize", fitCanvasToStage);
    return () => window.removeEventListener("resize", fitCanvasToStage);
  }, [canvasHeight, canvasWidth]);

  useEffect(() => {
    if (playback !== "playing") {
      return;
    }

    let animationFrame = 0;
    let last = performance.now();
    const previewEnd = previewEndRef.current;

    if (previewEnd <= 0 || playheadRef.current >= previewEnd) {
      setPreviewPlayhead(previewEnd);
      setPlayback("stopped");
      return;
    }

    const tick = (now: number) => {
      const delta = (now - last) / 1000;
      last = now;
      const next = playheadRef.current + delta;
      const currentPreviewEnd = previewEndRef.current;

      if (next >= currentPreviewEnd) {
        playheadRef.current = currentPreviewEnd;
        setPreviewPlayhead(currentPreviewEnd);
        setPlayback("stopped");
        return;
      }

      playheadRef.current = next;
      setPreviewPlayhead(next);
      animationFrame = requestAnimationFrame(tick);
    };

    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [playback, setPlayback, setPreviewPlayhead]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!shouldTogglePlaybackFromKeyboard(event)) {
        return;
      }

      event.preventDefault();
      togglePlayback();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlayback]);

  const pointerDeltaToCanvas = (event: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) {
      return { x: 0, y: 0 };
    }

    const edit = editRef.current;
    if (!edit) {
      return { x: 0, y: 0 };
    }

    return {
      x: ((event.clientX - edit.originX) / rect.width) * canvasWidth,
      y: ((event.clientY - edit.originY) / rect.height) * canvasHeight
    };
  };

  const getPointerAngleFromClipCenter = (event: React.PointerEvent, clip: EditorClip) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) {
      return 0;
    }

    const centerX = rect.left + ((clip.transform.position.x + clip.transform.size.width / 2) / canvasWidth) * rect.width;
    const centerY = rect.top + ((clip.transform.position.y + clip.transform.size.height / 2) / canvasHeight) * rect.height;
    return (Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180) / Math.PI;
  };

  const beginPreviewEdit = (event: React.PointerEvent, clip: EditorClip, mode: PreviewEditMode) => {
    if (clip.kind === "audio") return;
    event.stopPropagation();
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    selectClip(clip.id);
    editRef.current = {
      clip,
      mode,
      originX: event.clientX,
      originY: event.clientY,
      originPosition: clip.transform.position,
      originRotation: clip.transform.rotation,
      originScale: clip.transform.scale,
      originSize: clip.transform.size,
      originPointerAngle: getPointerAngleFromClipCenter(event, clip)
    };
  };

  const handlePreviewPointerMove = (event: React.PointerEvent) => {
    const edit = editRef.current;
    if (!edit) return;

    const delta = pointerDeltaToCanvas(event);
    const minSize = 24;
    let position = edit.originPosition;
    let size = edit.originSize;
    let scale = edit.originScale;
    let rotation = edit.originRotation;

    if (edit.mode === "move") {
      position = {
        x: edit.originPosition.x + delta.x,
        y: edit.originPosition.y + delta.y
      };
    } else if (edit.mode === "rotate") {
      const nextAngle = getPointerAngleFromClipCenter(event, edit.clip);
      rotation = normalizeRotation(edit.originRotation + nextAngle - edit.originPointerAngle);
    } else {
      const resizeFromLeft = edit.mode === "resize-w" || edit.mode === "resize-nw" || edit.mode === "resize-sw";
      const resizeFromRight = edit.mode === "resize-e" || edit.mode === "resize-ne" || edit.mode === "resize-se";
      const resizeFromTop = edit.mode === "resize-n" || edit.mode === "resize-nw" || edit.mode === "resize-ne";
      const resizeFromBottom = edit.mode === "resize-s" || edit.mode === "resize-sw" || edit.mode === "resize-se";
      const nextLeft = resizeFromLeft ? edit.originPosition.x + delta.x : edit.originPosition.x;
      const nextTop = resizeFromTop ? edit.originPosition.y + delta.y : edit.originPosition.y;
      const nextRight = resizeFromRight ? edit.originPosition.x + edit.originSize.width + delta.x : edit.originPosition.x + edit.originSize.width;
      const nextBottom = resizeFromBottom ? edit.originPosition.y + edit.originSize.height + delta.y : edit.originPosition.y + edit.originSize.height;

      const width = Math.max(minSize, nextRight - nextLeft);
      const height = Math.max(minSize, nextBottom - nextTop);
      position = {
        x: width === minSize && resizeFromLeft ? edit.originPosition.x + edit.originSize.width - minSize : nextLeft,
        y: height === minSize && resizeFromTop ? edit.originPosition.y + edit.originSize.height - minSize : nextTop
      };
      size = { width, height };

      if (edit.clip.kind === "text") {
        const widthRatio = width / edit.originSize.width;
        const heightRatio = height / edit.originSize.height;
        const nextScale = edit.originScale * Math.max(widthRatio, heightRatio);
        scale = clamp(nextScale, MIN_LAYER_SCALE, MAX_LAYER_SCALE);
      }
    }

    updateClip(edit.clip.id, {
      transform: {
        ...edit.clip.transform,
        position,
        rotation,
        scale,
        size
      }
    });
  };

  const endPreviewEdit = () => {
    editRef.current = null;
  };

  return (
    <section className="preview-column" aria-label="Preview player">
      <div className="preview-stage" ref={stageRef}>
        <div
          aria-label={`Preview canvas ${canvasWidth} by ${canvasHeight}`}
          className="canvas"
          onPointerMove={handlePreviewPointerMove}
          onPointerUp={endPreviewEdit}
          ref={canvasRef}
          onPointerCancel={endPreviewEdit}
          style={{
            aspectRatio: `${canvasWidth} / ${canvasHeight}`,
            background: project.settings.backgroundColor,
            height: `${previewSize.height}px`,
            width: `${previewSize.width}px`
          }}
        >
          <div className="canvas-grid" />
          {layers.map(({ clip, opacity, leftPercent, topPercent, widthPercent, heightPercent, transform }) => (
            <div
              className={`preview-layer ${clip.kind === "text" ? "text" : clip.kind === "image" ? "image" : "media"} ${selectedClipId === clip.id ? "selected" : ""}`}
              key={clip.id}
              onPointerDown={(event) => beginPreviewEdit(event, clip, "move")}
              style={{
                left: `${leftPercent}%`,
                top: `${topPercent}%`,
                width: `${widthPercent}%`,
                height: `${heightPercent}%`,
                opacity,
                transform
              }}
            >
              <div className="preview-layer-inner">
                {clip.kind === "text" ? (
                  <span style={{ color: clip.color, fontFamily: getEditorFontCssFamily(clip.fontFamily), fontSize: `${Math.max(12, clip.fontSize / 3)}px` }}>{clip.text}</span>
                ) : (
                  <MediaPreview clip={clip} localTime={playhead - clip.timing.start} playback={playback} />
                )}
              </div>
              {selectedClipId === clip.id ? (
                <>
                  <span aria-label={`Resize ${clip.name} from top`} className="preview-resize-handle n" onPointerDown={(event) => beginPreviewEdit(event, clip, "resize-n")} role="button" />
                  <span aria-label={`Resize ${clip.name} from right`} className="preview-resize-handle e" onPointerDown={(event) => beginPreviewEdit(event, clip, "resize-e")} role="button" />
                  <span aria-label={`Resize ${clip.name} from bottom`} className="preview-resize-handle s" onPointerDown={(event) => beginPreviewEdit(event, clip, "resize-s")} role="button" />
                  <span aria-label={`Resize ${clip.name} from left`} className="preview-resize-handle w" onPointerDown={(event) => beginPreviewEdit(event, clip, "resize-w")} role="button" />
                  <span aria-label={`Resize ${clip.name} from top left`} className="preview-resize-handle nw" onPointerDown={(event) => beginPreviewEdit(event, clip, "resize-nw")} role="button" />
                  <span aria-label={`Resize ${clip.name} from top right`} className="preview-resize-handle ne" onPointerDown={(event) => beginPreviewEdit(event, clip, "resize-ne")} role="button" />
                  <span aria-label={`Resize ${clip.name} from bottom left`} className="preview-resize-handle sw" onPointerDown={(event) => beginPreviewEdit(event, clip, "resize-sw")} role="button" />
                  <span aria-label={`Resize ${clip.name} from bottom right`} className="preview-resize-handle se" onPointerDown={(event) => beginPreviewEdit(event, clip, "resize-se")} role="button" />
                  <span aria-label={`Rotate ${clip.name}`} className="preview-rotate-handle" onPointerDown={(event) => beginPreviewEdit(event, clip, "rotate")} role="button" />
                </>
              ) : null}
            </div>
          ))}
          {activeAudioClips.map((clip) => (
            <AudioPreview clip={clip} key={clip.id} localTime={playhead - clip.timing.start} playback={playback} />
          ))}
        </div>
      </div>
      <div className="transport">
        <div className="toolbar">
          <button aria-label="Jump to beginning" className="icon-button" onClick={jumpToTimelineStart} title="Jump to beginning" type="button">
            <SkipBack size={16} />
          </button>
          <button aria-label="Step backward one frame" className="icon-button" onClick={stepPlayheadBackward} title="Step backward" type="button">
            <StepBack size={16} />
          </button>
          <button aria-label={playback === "playing" ? "Pause preview" : "Play preview"} className="icon-button" onClick={togglePlayback} title={playback === "playing" ? "Pause" : "Play"} type="button">
            {playback === "playing" ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button
            aria-label="Stop preview"
            className="icon-button"
            onClick={stopPlayback}
            title="Stop"
            type="button"
          >
            <Square size={16} />
          </button>
          <button aria-label="Step forward one frame" className="icon-button" onClick={stepPlayheadForward} title="Step forward" type="button">
            <StepForward size={16} />
          </button>
          <button aria-label="Jump to end" className="icon-button" onClick={jumpToTimelineEnd} title="Jump to end" type="button">
            <SkipForward size={16} />
          </button>
        </div>
        <input className="scrub" max={project.timeline.duration} min={0} onChange={(event) => setPlayhead(Number(event.target.value))} step={1 / project.timeline.fps} type="range" value={playhead} />
        <div className="timecode">{formatTimecode(playhead, project.timeline.fps)}</div>
      </div>
    </section>
  );
};
