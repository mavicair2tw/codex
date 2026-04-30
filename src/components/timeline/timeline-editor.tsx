"use client";

import { Magnet, ZoomIn, ZoomOut } from "lucide-react";
import { useRef } from "react";
import { formatTimecode, pixelsToSeconds, secondsToPixels } from "@/lib/time";
import { useEditorStore } from "@/stores/editor-store";
import type { EditorClip, Track } from "@/types/editor";

const TRACK_LABEL_WIDTH = 128;

interface DragState {
  clipId: string;
  mode: "move" | "trim-start" | "trim-end";
  originX: number;
  originStart: number;
  originDuration: number;
}

const getTrackColor = (kind: Track["kind"]) => `var(--track-${kind})`;

export const TimelineEditor = () => {
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const project = useEditorStore((state) => state.project);
  const playhead = useEditorStore((state) => state.playhead);
  const selectedClipId = useEditorStore((state) => state.selectedClipId);
  const setPlayhead = useEditorStore((state) => state.setPlayhead);
  const selectClip = useEditorStore((state) => state.selectClip);
  const setZoom = useEditorStore((state) => state.setZoom);
  const toggleSnap = useEditorStore((state) => state.toggleSnap);
  const moveClip = useEditorStore((state) => state.moveClip);
  const trimClip = useEditorStore((state) => state.trimClip);
  const width = secondsToPixels(project.timeline.duration, project.timeline.zoom);

  const pointerToTime = (clientX: number) => {
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect || !timelineRef.current) return 0;
    return pixelsToSeconds(clientX - rect.left + timelineRef.current.scrollLeft - TRACK_LABEL_WIDTH, project.timeline.zoom);
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;

    const delta = pixelsToSeconds(event.clientX - drag.originX, project.timeline.zoom);
    if (drag.mode === "move") {
      moveClip(drag.clipId, drag.originStart + delta);
      return;
    }

    if (drag.mode === "trim-start") {
      trimClip(drag.clipId, "start", drag.originStart + delta);
      return;
    }

    trimClip(drag.clipId, "end", drag.originStart + drag.originDuration + delta);
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  const beginDrag = (event: React.PointerEvent, clip: EditorClip, mode: DragState["mode"]) => {
    event.stopPropagation();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    selectClip(clip.id);
    dragRef.current = {
      clipId: clip.id,
      mode,
      originX: event.clientX,
      originStart: clip.timing.start,
      originDuration: clip.timing.duration
    };
  };

  const rulerMarks = Array.from({ length: Math.floor(project.timeline.duration) + 1 }, (_, second) => second);

  return (
    <section className="timeline-panel" aria-label="Timeline editor">
      <div className="timeline-controls">
        <button className="icon-button" onClick={() => setZoom(project.timeline.zoom - 12)} title="Zoom out" type="button">
          <ZoomOut size={16} />
        </button>
        <button className="icon-button" onClick={() => setZoom(project.timeline.zoom + 12)} title="Zoom in" type="button">
          <ZoomIn size={16} />
        </button>
        <button className="text-button" onClick={toggleSnap} type="button">
          <Magnet size={16} /> Snap {project.timeline.snapEnabled ? "On" : "Off"}
        </button>
        <span className="timecode">{formatTimecode(playhead, project.timeline.fps)}</span>
      </div>
      <div
        className="timeline"
        onPointerDown={(event) => setPlayhead(pointerToTime(event.clientX))}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        ref={timelineRef}
      >
        <div style={{ minWidth: width + TRACK_LABEL_WIDTH }}>
          <div className="ruler" style={{ marginLeft: TRACK_LABEL_WIDTH, width }}>
            {rulerMarks.map((second) => (
              <div className="ruler-mark" key={second} style={{ left: secondsToPixels(second, project.timeline.zoom) }}>
                {second}s
              </div>
            ))}
          </div>
          <div className="tracks">
            <div className="playhead" style={{ left: TRACK_LABEL_WIDTH + secondsToPixels(playhead, project.timeline.zoom) }} />
            {project.tracks.map((track) => (
              <div className="track" key={track.id}>
                <div className="track-label">
                  <span style={{ background: getTrackColor(track.kind), borderRadius: 3, height: 10, width: 10 }} />
                  {track.name}
                </div>
                <div className="track-lane" style={{ width }}>
                  {project.clips
                    .filter((clip) => clip.trackId === track.id)
                    .map((clip) => (
                      <div
                        className={`clip ${clip.kind} ${selectedClipId === clip.id ? "selected" : ""}`}
                        key={clip.id}
                        onPointerDown={(event) => beginDrag(event, clip, "move")}
                        style={{
                          left: secondsToPixels(clip.timing.start, project.timeline.zoom),
                          width: secondsToPixels(clip.timing.duration, project.timeline.zoom)
                        }}
                        title={`${clip.name} ${clip.timing.start.toFixed(2)}s`}
                      >
                        <span className="trim-handle left" onPointerDown={(event) => beginDrag(event, clip, "trim-start")} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{clip.name}</span>
                        <span className="trim-handle right" onPointerDown={(event) => beginDrag(event, clip, "trim-end")} />
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
