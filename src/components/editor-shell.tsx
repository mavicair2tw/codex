"use client";

import { ImageIcon, Music, Type, Video } from "lucide-react";
import { LayerInspector } from "@/components/inspector/layer-inspector";
import { PreviewPlayer } from "@/components/preview/preview-player";
import { TimelineEditor } from "@/components/timeline/timeline-editor";
import { ExportPanel } from "@/components/toolbar/export-panel";
import { useEditorStore } from "@/stores/editor-store";

export const EditorShell = () => {
  const addVideoClip = useEditorStore((state) => state.addVideoClip);
  const addImageClip = useEditorStore((state) => state.addImageClip);
  const addTextClip = useEditorStore((state) => state.addTextClip);
  const addAudioClip = useEditorStore((state) => state.addAudioClip);

  return (
    <main className="editor">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" />
          <span>Codex Video Editor</span>
        </div>
        <div className="toolbar" aria-label="Layer tools">
          <button className="text-button" onClick={addVideoClip} type="button">
            <Video size={16} /> Video
          </button>
          <button className="text-button" onClick={addImageClip} type="button">
            <ImageIcon size={16} /> Image
          </button>
          <button className="text-button" onClick={addTextClip} type="button">
            <Type size={16} /> Text
          </button>
          <button className="text-button" onClick={addAudioClip} type="button">
            <Music size={16} /> Audio
          </button>
        </div>
        <div style={{ flex: 1 }} />
        <ExportPanel />
      </header>
      <section className="main">
        <PreviewPlayer />
        <LayerInspector />
      </section>
      <TimelineEditor />
    </main>
  );
};
