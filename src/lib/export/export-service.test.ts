import { beforeEach, describe, expect, it, vi } from "vitest";
import { sampleProject } from "@/data/sample-project";
import { exportProject, isDesktopExportAvailable } from "@/lib/export/export-service";

const tauriCore = vi.hoisted(() => ({
  invoke: vi.fn()
}));

const tauriDialog = vi.hoisted(() => ({
  save: vi.fn()
}));

vi.mock("@tauri-apps/api/core", () => tauriCore);
vi.mock("@tauri-apps/plugin-dialog", () => tauriDialog);

describe("exportProject", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
  });

  it("reports when MP4 export is unavailable in the browser", () => {
    expect(isDesktopExportAvailable()).toBe(false);
  });

  it("exports through Tauri APIs when the desktop invoke bridge is available", async () => {
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      configurable: true,
      value: { invoke: vi.fn() }
    });
    tauriDialog.save.mockResolvedValue("/Users/example/render.mp4");
    tauriCore.invoke.mockResolvedValue({ outputPath: "/Users/example/render.mp4" });

    await expect(exportProject(sampleProject, "1080p", "render.mp4")).resolves.toEqual({ outputPath: "/Users/example/render.mp4" });

    expect(tauriDialog.save).toHaveBeenCalledWith({
      defaultPath: "render.mp4",
      filters: [{ extensions: ["mp4"], name: "MP4 video" }]
    });
    expect(tauriCore.invoke).toHaveBeenCalledWith(
      "export_with_ffmpeg",
      expect.objectContaining({
        outputPath: "/Users/example/render.mp4"
      })
    );
  });

  it("keeps the browser-specific export message when Tauri APIs are unavailable", async () => {
    await expect(exportProject(sampleProject, "1080p", "render.mp4")).rejects.toThrow(
      "MP4 export requires the desktop app with FFmpeg installed. The browser preview cannot create the exported video file."
    );
    expect(tauriDialog.save).not.toHaveBeenCalled();
  });

  it("keeps the browser-specific export message when the Tauri invoke bridge is unavailable", async () => {
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      configurable: true,
      value: { invoke: vi.fn() }
    });
    tauriDialog.save.mockResolvedValue("/Users/example/render.mp4");
    tauriCore.invoke.mockRejectedValue(new TypeError("Cannot read properties of undefined (reading 'invoke')"));

    await expect(exportProject(sampleProject, "1080p", "render.mp4")).rejects.toThrow(
      "MP4 export requires the desktop app with FFmpeg installed. The browser preview cannot create the exported video file."
    );
  });

  it("does not start FFmpeg when the save dialog is cancelled", async () => {
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      configurable: true,
      value: { invoke: vi.fn() }
    });
    tauriDialog.save.mockResolvedValue(null);

    await expect(exportProject(sampleProject, "1080p", "render.mp4")).rejects.toThrow("Export cancelled.");

    expect(tauriCore.invoke).not.toHaveBeenCalled();
  });
});
