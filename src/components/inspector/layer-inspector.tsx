"use client";

import type { EditorClip } from "@/types/editor";
import { useEditorStore } from "@/stores/editor-store";

const asNumber = (value: string) => Number.parseFloat(value) || 0;

export const LayerInspector = () => {
  const project = useEditorStore((state) => state.project);
  const selectedClipId = useEditorStore((state) => state.selectedClipId);
  const updateClip = useEditorStore((state) => state.updateClip);
  const selectedClip = project.clips.find((clip) => clip.id === selectedClipId);

  const updateSelected = (patch: Partial<EditorClip>) => {
    if (!selectedClip) return;
    updateClip(selectedClip.id, patch);
  };

  if (!selectedClip) {
    return (
      <aside className="inspector-column">
        <h2 className="section-title">Inspector</h2>
        <p style={{ color: "var(--muted)", margin: 0 }}>Select a clip to edit layer settings.</p>
      </aside>
    );
  }

  return (
    <aside className="inspector-column">
      <h2 className="section-title">Layer</h2>
      <div className="field-grid">
        <div className="field">
          <label htmlFor="clip-name">Name</label>
          <input id="clip-name" onChange={(event) => updateSelected({ name: event.target.value })} value={selectedClip.name} />
        </div>
        <div className="two-col">
          <div className="field">
            <label htmlFor="clip-start">Start</label>
            <input id="clip-start" min={0} onChange={(event) => updateSelected({ timing: { ...selectedClip.timing, start: asNumber(event.target.value) } })} step={0.01} type="number" value={selectedClip.timing.start} />
          </div>
          <div className="field">
            <label htmlFor="clip-duration">Duration</label>
            <input id="clip-duration" min={0.1} onChange={(event) => updateSelected({ timing: { ...selectedClip.timing, duration: asNumber(event.target.value) } })} step={0.01} type="number" value={selectedClip.timing.duration} />
          </div>
        </div>
        <div className="two-col">
          <div className="field">
            <label htmlFor="fade-in">Fade in</label>
            <input id="fade-in" min={0} onChange={(event) => updateSelected({ fades: { ...selectedClip.fades, fadeIn: asNumber(event.target.value) } })} step={0.05} type="number" value={selectedClip.fades.fadeIn} />
          </div>
          <div className="field">
            <label htmlFor="fade-out">Fade out</label>
            <input id="fade-out" min={0} onChange={(event) => updateSelected({ fades: { ...selectedClip.fades, fadeOut: asNumber(event.target.value) } })} step={0.05} type="number" value={selectedClip.fades.fadeOut} />
          </div>
        </div>
      </div>

      <div className="export-panel">
        <h2 className="section-title">Transform</h2>
        <div className="field-grid">
          <div className="two-col">
            <div className="field">
              <label htmlFor="pos-x">X</label>
              <input id="pos-x" onChange={(event) => updateSelected({ transform: { ...selectedClip.transform, position: { ...selectedClip.transform.position, x: asNumber(event.target.value) } } })} type="number" value={selectedClip.transform.position.x} />
            </div>
            <div className="field">
              <label htmlFor="pos-y">Y</label>
              <input id="pos-y" onChange={(event) => updateSelected({ transform: { ...selectedClip.transform, position: { ...selectedClip.transform.position, y: asNumber(event.target.value) } } })} type="number" value={selectedClip.transform.position.y} />
            </div>
          </div>
          <div className="two-col">
            <div className="field">
              <label htmlFor="width">Width</label>
              <input id="width" min={1} onChange={(event) => updateSelected({ transform: { ...selectedClip.transform, size: { ...selectedClip.transform.size, width: asNumber(event.target.value) } } })} type="number" value={selectedClip.transform.size.width} />
            </div>
            <div className="field">
              <label htmlFor="height">Height</label>
              <input id="height" min={1} onChange={(event) => updateSelected({ transform: { ...selectedClip.transform, size: { ...selectedClip.transform.size, height: asNumber(event.target.value) } } })} type="number" value={selectedClip.transform.size.height} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="opacity">Opacity</label>
            <input id="opacity" max={1} min={0} onChange={(event) => updateSelected({ transform: { ...selectedClip.transform, opacity: asNumber(event.target.value) } })} step={0.01} type="range" value={selectedClip.transform.opacity} />
          </div>
          <div className="two-col">
            <div className="field">
              <label htmlFor="scale">Scale</label>
              <input id="scale" min={0.05} onChange={(event) => updateSelected({ transform: { ...selectedClip.transform, scale: asNumber(event.target.value) } })} step={0.01} type="number" value={selectedClip.transform.scale} />
            </div>
            <div className="field">
              <label htmlFor="rotation">Rotation</label>
              <input id="rotation" onChange={(event) => updateSelected({ transform: { ...selectedClip.transform, rotation: asNumber(event.target.value) } })} step={1} type="number" value={selectedClip.transform.rotation} />
            </div>
          </div>
        </div>
      </div>

      {selectedClip.kind === "text" ? (
        <div className="export-panel">
          <h2 className="section-title">Text</h2>
          <div className="field-grid">
            <div className="field">
              <label htmlFor="text-value">Content</label>
              <textarea id="text-value" onChange={(event) => updateSelected({ text: event.target.value } as Partial<EditorClip>)} value={selectedClip.text} />
            </div>
            <div className="two-col">
              <div className="field">
                <label htmlFor="font-size">Font size</label>
                <input id="font-size" min={1} onChange={(event) => updateSelected({ fontSize: asNumber(event.target.value) } as Partial<EditorClip>)} type="number" value={selectedClip.fontSize} />
              </div>
              <div className="field">
                <label htmlFor="text-color">Color</label>
                <input id="text-color" onChange={(event) => updateSelected({ color: event.target.value } as Partial<EditorClip>)} type="color" value={selectedClip.color} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="font-family">Font family</label>
              <select id="font-family" onChange={(event) => updateSelected({ fontFamily: event.target.value } as Partial<EditorClip>)} value={selectedClip.fontFamily}>
                <option value="Inter">Inter</option>
                <option value="Arial">Arial</option>
                <option value="Georgia">Georgia</option>
                <option value="Helvetica">Helvetica</option>
              </select>
            </div>
          </div>
        </div>
      ) : null}

      {selectedClip.kind === "audio" ? (
        <div className="export-panel">
          <h2 className="section-title">Audio</h2>
          <div className="field-grid">
            <div className="field">
              <label htmlFor="volume">Volume</label>
              <input id="volume" max={2} min={0} onChange={(event) => updateSelected({ volume: asNumber(event.target.value) } as Partial<EditorClip>)} step={0.01} type="range" value={selectedClip.volume} />
            </div>
            <div className="two-col">
              <div className="field">
                <label htmlFor="volume-fade-in">Volume fade in</label>
                <input id="volume-fade-in" min={0} onChange={(event) => updateSelected({ volumeFadeIn: asNumber(event.target.value) } as Partial<EditorClip>)} step={0.05} type="number" value={selectedClip.volumeFadeIn} />
              </div>
              <div className="field">
                <label htmlFor="volume-fade-out">Volume fade out</label>
                <input id="volume-fade-out" min={0} onChange={(event) => updateSelected({ volumeFadeOut: asNumber(event.target.value) } as Partial<EditorClip>)} step={0.05} type="number" value={selectedClip.volumeFadeOut} />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
};
