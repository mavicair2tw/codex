"use client";

import { Pause, Play, Square } from "lucide-react";
import { useEffect, useRef } from "react";
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
    audio.volume = clip.volume;
    if (Math.abs(audio.currentTime - target) > 0.08) {
      audio.currentTime = target;
    }

    if (playback === "playing") {
      audio.play().catch(() => undefined);
    } else {
      audio.pause();
    }
  }, [clip, localTime, playback]);

  if (clip.kind !== "audio" || !clip.previewUrl) {
    return null;
  }

  return <audio preload="metadata" ref={audioRef} src={clip.previewUrl} />;
};

export const PreviewPlayer = () => {
  const project = useEditorStore((state) => state.project);
  const playhead = useEditorStore((state) => state.playhead);
  const playback = useEditorStore((state) => state.playback);
  const setPlayback = useEditorStore((state) => state.setPlayback);
  const setPlayhead = useEditorStore((state) => state.setPlayhead);
  const togglePlayback = useEditorStore((state) => state.togglePlayback);
  const stopPlayback = useEditorStore((state) => state.stopPlayback);
  const layers = getRenderableLayers(project, playhead);
  const activeAudioClips = project.clips.filter((clip) => clip.kind === "audio" && playhead >= clip.timing.start && playhead <= clip.timing.start + clip.timing.duration);

  useEffect(() => {
    if (playback !== "playing") {
      return;
    }

    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const delta = (now - last) / 1000;
      last = now;
      const next = playhead + delta;
      if (next >= project.timeline.duration) {
        setPlayhead(project.timeline.duration);
        setPlayback("stopped");
        return;
      }
      setPlayhead(next);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playback, playhead, project.timeline.duration, setPlayback, setPlayhead]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable);

      if (isTyping || event.code !== "Space" || event.repeat) {
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
        <div className="canvas" style={{ background: project.settings.backgroundColor }}>
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
          <button className="icon-button" onClick={togglePlayback} title={playback === "playing" ? "Pause" : "Play"} type="button">
            {playback === "playing" ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button
            className="icon-button"
            onClick={stopPlayback}
            title="Stop"
            type="button"
          >
            <Square size={16} />
          </button>
        </div>
        <input className="scrub" max={project.timeline.duration} min={0} onChange={(event) => setPlayhead(Number(event.target.value))} step={1 / project.timeline.fps} type="range" value={playhead} />
        <div className="timecode">{formatTimecode(playhead, project.timeline.fps)}</div>
      </div>
    </section>
  );
};
