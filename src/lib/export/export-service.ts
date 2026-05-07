import { buildFfmpegCommand } from "@/lib/ffmpeg/build-command";
import type { EditorProject, ExportPreset } from "@/types/editor";

interface TauriExportResult {
  outputPath: string;
}

const desktopRuntimeMessage = "MP4 export requires the desktop app with FFmpeg installed. The browser preview cannot create the exported video file.";

const isDesktopRuntimeError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return /__TAURI_INTERNALS__|not.*tauri|tauri.*not.*available|ipc|asset protocol/i.test(message);
};

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
  let outputPath: string | null;

  try {
    outputPath = await chooseExportPath(defaultOutputPath);
  } catch (error) {
    if (isDesktopRuntimeError(error)) {
      throw new Error(desktopRuntimeMessage);
    }
    throw error;
  }

  if (!outputPath) {
    throw new Error("Export cancelled.");
  }

  const command = buildFfmpegCommand(project, preset, outputPath);

  try {
    return await invokeTauri<TauriExportResult>("export_with_ffmpeg", {
      args: command.args,
      outputPath
    });
  } catch (error) {
    if (isDesktopRuntimeError(error)) {
      throw new Error(desktopRuntimeMessage);
    }
    throw error;
  }
};
