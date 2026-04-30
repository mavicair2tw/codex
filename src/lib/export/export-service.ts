import { buildFfmpegCommand } from "@/lib/ffmpeg/build-command";
import type { EditorProject, ExportPreset } from "@/types/editor";

interface TauriExportResult {
  outputPath: string;
}

const hasTauriRuntime = () => typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

const invokeTauri = async <T>(command: string, payload: Record<string, unknown>): Promise<T> => {
  const tauri = await import("@tauri-apps/api/core");
  return tauri.invoke<T>(command, payload);
};

const chooseExportPath = async (defaultPath: string) => {
  const { save } = await import("@tauri-apps/plugin-dialog");
  return save({
    defaultPath,
    filters: [
      {
        name: "MP4 video",
        extensions: ["mp4"]
      }
    ]
  });
};

export const exportProject = async (project: EditorProject, preset: ExportPreset, defaultOutputPath: string): Promise<TauriExportResult> => {
  if (!hasTauriRuntime()) {
    throw new Error("MP4 export requires the desktop app with FFmpeg installed. The browser preview cannot create the exported video file.");
  }

  const outputPath = await chooseExportPath(defaultOutputPath);
  if (!outputPath) {
    throw new Error("Export cancelled.");
  }

  const command = buildFfmpegCommand(project, preset, outputPath);

  return invokeTauri<TauriExportResult>("export_with_ffmpeg", {
    args: command.args,
    outputPath
  });
};
