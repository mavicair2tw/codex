import { buildFfmpegCommand } from "@/lib/ffmpeg/build-command";
import type { EditorProject, ExportPreset } from "@/types/editor";

interface TauriExportResult {
  outputPath: string;
}

const invokeTauri = async <T>(command: string, payload: Record<string, unknown>): Promise<T> => {
  const tauri = await import("@tauri-apps/api/core");
  return tauri.invoke<T>(command, payload);
};

export const exportProject = async (project: EditorProject, preset: ExportPreset, outputPath: string): Promise<TauriExportResult> => {
  const command = buildFfmpegCommand(project, preset, outputPath);

  if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) {
    await new Promise((resolve) => setTimeout(resolve, 900));
    return { outputPath };
  }

  return invokeTauri<TauriExportResult>("export_with_ffmpeg", {
    args: command.args,
    outputPath
  });
};
