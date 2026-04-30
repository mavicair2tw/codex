"use client";

import { Pause, Play, SkipBack, SkipForward, Square, StepBack, StepForward } from "lucide-react";
import { useEffect, useRef } from "react";
import { shouldTogglePlaybackFromKeyboard } from "@/lib/keyboard/transport-shortcuts";
import { getPreviewPlaybackBounds } from "@/lib/preview/playback-bounds";
import { getRenderableLayers } from "@/lib/renderer/preview-engine";
import { formatTimecode } from "@/lib/time";
import { useEditorStore } from "@/stores/editor-store";
import type { EditorClip } from "@/types/editor";

interface MediaPreviewProps {
  clip: EditorClip;
  localTime: number;
  playback: "playing" | "paused" | "stopped";
}

const MediaPreview = ({ clip, localTime, playback }: MediaPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (clip.kind !== "video" || !videoRef.current) return;
    const video = videoRef.current;
    const target = Math.max(0, clip.timing.sourceIn + localTime);
    if (Math.abs(video.currentTime - target) > 0.08) {
      video.currentTime = target;
    }

    if (playback === "playing") {
      video.play().catch(() => undefined);
    } else {
      video.pause();
    }
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

  useEffect(() => {
    if (clip.kind !== "audio" || !clip.previewUrl || !audioRef.current) return;
    const audio = audioRef.current;
    const target = Math.max(0, clip.timing.sourceIn + localTime);
    audio.volume = clip.muted ? 0 : clip.volume;
    if (Math.abs(audio.currentTime - target) > 0.08) {
      audio.currentTime = target;
    }

    if (playback === "playing") {
      audio.play().catch(() => undefined);
    } else {
      audio.pause();
    }
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
  const jumpToTimelineStart = useEditorStore((state) => state.jumpToTimelineStart);
  const jumpToTimelineEnd = useEditorStore((state) => state.jumpToTimelineEnd);
  const stepPlayheadBackward = useEditorStore((state) => state.stepPlayheadBackward);
  const stepPlayheadForward = useEditorStore((state) => state.stepPlayheadForward);
  const togglePlayback = useEditorStore((state) => state.togglePlayback);
  const stopPlayback = useEditorStore((state) => state.stopPlayback);
  const playheadRef = useRef(playhead);
  const durationRef = useRef(project.timeline.duration);
  const projectRef = useRef(project);
  const selectedClipIdRef = useRef(selectedClipId);
  const layers = getRenderableLayers(project, playhead);
  const activeAudioClips = project.clips.filter((clip) => clip.kind === "audio" && playhead >= clip.timing.start && playhead <= clip.timing.start + clip.timing.duration);

  useEffect(() => {
    playheadRef.current = playhead;
  }, [playhead]);

  useEffect(() => {
    durationRef.current = project.timeline.duration;
  }, [project.timeline.duration]);

  useEffect(() => {
    projectRef.current = project;
  }, [project]);

  useEffect(() => {
    selectedClipIdRef.current = selectedClipId;
  }, [selectedClipId]);

  useEffect(() => {
    if (playback !== "playing") {
      return;
    }

    let animationFrame = 0;
    let last = performance.now();
    const bounds = getPreviewPlaybackBounds(projectRef.current, selectedClipIdRef.current, playheadRef.current);
    if (bounds && (playheadRef.current < bounds.start || playheadRef.current >= bounds.end)) {
      playheadRef.current = bounds.start;
      setPlayhead(bounds.start);
    }

    const tick = (now: number) => {
      const delta = (now - last) / 1000;
      last = now;
      const next = playheadRef.current + delta;
      const currentBounds = getPreviewPlaybackBounds(projectRef.current, selectedClipIdRef.current, playheadRef.current);
      if (currentBounds && next >= currentBounds.end) {
        playheadRef.current = currentBounds.end;
        setPlayhead(currentBounds.end);
        setPlayback("stopped");
        return;
      }

      if (next >= durationRef.current) {
        setPlayhead(durationRef.current);
        setPlayback("stopped");
        return;
      }

      playheadRef.current = next;
      setPlayhead(next);
      animationFrame = requestAnimationFrame(tick);
    };

    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [playback, setPlayback, setPlayhead]);

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

  return (
    <section className="preview-column" aria-label="Preview player">
      <div className="preview-stage">
        <div className="canvas" style={{ aspectRatio: `${canvasWidth} / ${canvasHeight}`, background: project.settings.backgroundColor }}>
          <div className="canvas-grid" />
          {layers.map(({ clip, opacity, leftPercent, topPercent, widthPercent, heightPercent, transform }) => (
            <div
              className={`preview-layer ${clip.kind === "text" ? "text" : clip.kind === "image" ? "image" : "media"}`}
              key={clip.id}
              style={{
                left: `${leftPercent}%`,
                top: `${topPercent}%`,
                width: `${widthPercent}%`,
                height: `${heightPercent}%`,
                opacity,
                transform
              }}
            >
              {clip.kind === "text" ? (
                <span style={{ color: clip.color, fontFamily: clip.fontFamily, fontSize: `${Math.max(12, clip.fontSize / 3)}px` }}>{clip.text}</span>
              ) : (
                <MediaPreview clip={clip} localTime={playhead - clip.timing.start} playback={playback} />
              )}
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
