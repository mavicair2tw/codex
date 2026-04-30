"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { exportProject } from "@/lib/export/export-service";
import { exportPresetLabels } from "@/lib/ffmpeg/presets";
import { useEditorStore } from "@/stores/editor-store";
import type { ExportPreset } from "@/types/editor";

const presets: ExportPreset[] = ["1080p", "2k", "4k"];

export const ExportPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const project = useEditorStore((state) => state.project);
  const exportJob = useEditorStore((state) => state.exportJob);
  const setExportPreset = useEditorStore((state) => state.setExportPreset);
  const setExportProgress = useEditorStore((state) => state.setExportProgress);
  const setExportStatus = useEditorStore((state) => state.setExportStatus);

  const runExport = async () => {
    try {
      setExportStatus("preparing", "Preparing FFmpeg graph");
      setExportProgress(0.12, "Validating timeline");
      setExportStatus("running", "Encoding MP4");
      setExportProgress(0.45, "Rendering frames");
      const result = await exportProject(project, exportJob.preset, `${project.settings.name}-${exportJob.preset}.mp4`);
      setExportProgress(1, `Exported ${result.outputPath}`);
      setExportStatus("complete", "Export complete");
    } catch (error) {
      setExportStatus("failed", error instanceof Error ? error.message : "Export failed");
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <button className="text-button" onClick={() => setIsOpen((value) => !value)} type="button">
        <Download size={16} /> Export
      </button>
      {isOpen ? (
        <div
          style={{
            background: "var(--panel)",
            border: "1px solid var(--line)",
            borderRadius: 8,
            boxShadow: "0 16px 50px rgba(0,0,0,0.38)",
            padding: 12,
            position: "absolute",
            right: 0,
            top: 40,
            width: 260,
            zIndex: 20
          }}
        >
          <h2 className="section-title">Export MP4</h2>
          <div className="field-grid">
            <div className="field">
              <label htmlFor="preset">Preset</label>
              <select id="preset" onChange={(event) => setExportPreset(event.target.value as ExportPreset)} value={exportJob.preset}>
                {presets.map((preset) => (
                  <option key={preset} value={preset}>
                    {exportPresetLabels[preset]}
                  </option>
                ))}
              </select>
            </div>
            <button className="text-button" disabled={exportJob.status === "running"} onClick={runExport} type="button">
              Start Export
            </button>
            <div className="progress" aria-label="Export progress">
              <span style={{ width: `${Math.round(exportJob.progress * 100)}%` }} />
            </div>
            <p style={{ color: "var(--muted)", fontSize: 12, margin: 0 }}>{exportJob.message}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
};
