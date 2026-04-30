"use client";

import { Pause, Play, Square } from "lucide-react";
import { useEffect } from "react";
import { getRenderableLayers } from "@/lib/renderer/preview-engine";
import { formatTimecode } from "@/lib/time";
import { useEditorStore } from "@/stores/editor-store";

export const PreviewPlayer = () => {
  const project = useEditorStore((state) => state.project);
  const playhead = useEditorStore((state) => state.playhead);
  const playback = useEditorStore((state) => state.playback);
  const setPlayback = useEditorStore((state) => state.setPlayback);
  const setPlayhead = useEditorStore((state) => state.setPlayhead);
  const layers = getRenderableLayers(project, playhead);

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
                <span>{clip.name}</span>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="transport">
        <div className="toolbar">
          <button className="icon-button" onClick={() => setPlayback(playback === "playing" ? "paused" : "playing")} title={playback === "playing" ? "Pause" : "Play"} type="button">
            {playback === "playing" ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button
            className="icon-button"
            onClick={() => {
              setPlayback("stopped");
              setPlayhead(0);
            }}
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
