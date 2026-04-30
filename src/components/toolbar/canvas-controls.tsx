"use client";

import { Maximize2 } from "lucide-react";
import { canvasAspectRatioLabels, canvasAspectRatios } from "@/lib/canvas/aspect-ratio";
import { useEditorStore } from "@/stores/editor-store";
import type { CanvasAspectRatio } from "@/types/editor";

export const CanvasControls = () => {
  const aspectRatio = useEditorStore((state) => state.project.settings.aspectRatio);
  const canvas = useEditorStore((state) => state.project.settings.canvas);
  const setCanvasAspectRatio = useEditorStore((state) => state.setCanvasAspectRatio);

  return (
    <div className="canvas-controls" aria-label="Canvas settings">
      <Maximize2 size={16} />
      <label className="sr-only" htmlFor="canvas-aspect-ratio">
        Canvas aspect ratio
      </label>
      <select
        aria-label="Canvas aspect ratio"
        id="canvas-aspect-ratio"
        onChange={(event) => setCanvasAspectRatio(event.target.value as CanvasAspectRatio)}
        value={aspectRatio}
      >
        {canvasAspectRatios.map((value) => (
          <option key={value} value={value}>
            {canvasAspectRatioLabels[value]}
          </option>
        ))}
      </select>
      <span>{`${canvas.width} x ${canvas.height}`}</span>
    </div>
  );
};
