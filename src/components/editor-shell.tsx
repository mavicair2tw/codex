"use client";

import { ImageIcon, Music, Type, Video } from "lucide-react";
import { useRef, useState } from "react";
import { LayerInspector } from "@/components/inspector/layer-inspector";
import { MediaGallery } from "@/components/media/media-gallery";
import { PreviewPlayer } from "@/components/preview/preview-player";
import { TimelineEditor } from "@/components/timeline/timeline-editor";
import { CanvasControls } from "@/components/toolbar/canvas-controls";
import { ExportPanel } from "@/components/toolbar/export-panel";
import { readMediaFile, readMediaPath, type ImportedMediaFile } from "@/lib/media/read-media-file";
import { useEditorStore } from "@/stores/editor-store";

export const EditorShell = () => {
  const addTextClip = useEditorStore((state) => state.addTextClip);
  const importMediaClip = useEditorStore((state) => state.importMediaClip);
  const [importError, setImportError] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  const importFile = async (event: React.ChangeEvent<HTMLInputElement>, kind: ImportedMediaFile["kind"]) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      setImportError(null);
      importMediaClip(await readMediaFile(file, kind));
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Import failed.");
    }
  };

  const openImport = async (kind: ImportedMediaFile["kind"], fallbackInput: HTMLInputElement | null) => {
    if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) {
      fallbackInput?.click();
      return;
    }

    try {
      setImportError(null);
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: kind,
            extensions:
              kind === "video"
                ? ["mp4", "mov", "m4v", "webm", "mkv"]
                : kind === "image"
                  ? ["png", "jpg", "jpeg", "webp", "gif"]
                  : ["wav", "mp3", "m4a", "aac", "flac", "ogg"]
          }
        ]
      });
      if (typeof selected !== "string") return;
      importMediaClip(await readMediaPath(selected, kind));
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Import failed.");
    }
  };

  return (
    <main className="editor">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" />
          <span>Codex Video Editor</span>
        </div>
        <div className="toolbar" aria-label="Layer tools">
          <button className="text-button" onClick={() => openImport("video", videoInputRef.current)} type="button">
            <Video size={16} /> Video
          </button>
          <button className="text-button" onClick={() => openImport("image", imageInputRef.current)} type="button">
            <ImageIcon size={16} /> Image
          </button>
          <button className="text-button" onClick={addTextClip} type="button">
            <Type size={16} /> Text
          </button>
          <button className="text-button" onClick={() => openImport("audio", audioInputRef.current)} type="button">
            <Music size={16} /> Audio
          </button>
          <input accept="video/*" className="file-input" onChange={(event) => importFile(event, "video")} ref={videoInputRef} type="file" />
          <input accept="image/*" className="file-input" onChange={(event) => importFile(event, "image")} ref={imageInputRef} type="file" />
          <input accept="audio/*" className="file-input" onChange={(event) => importFile(event, "audio")} ref={audioInputRef} type="file" />
        </div>
        {importError ? <div className="import-error">{importError}</div> : null}
        <div style={{ flex: 1 }} />
        <CanvasControls />
        <ExportPanel />
      </header>
      <section className="main">
        <MediaGallery />
        <PreviewPlayer />
        <LayerInspector />
      </section>
      <TimelineEditor />
    </main>
  );
};
