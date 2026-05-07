import { beforeEach, describe, expect, it, vi } from "vitest";
import { readMediaFile, readMediaPath } from "@/lib/media/read-media-file";

const tauriCore = vi.hoisted(() => ({
  convertFileSrc: vi.fn((sourcePath: string) => `asset://localhost/${sourcePath}`),
  invoke: vi.fn()
}));

vi.mock("@tauri-apps/api/core", () => tauriCore);

const installTauriRuntime = () => {
  Object.defineProperty(window, "__TAURI_INTERNALS__", {
    configurable: true,
    value: {}
  });
};

const mockVideoMetadataFailure = () => {
  const createElement = document.createElement.bind(document);
  vi.spyOn(document, "createElement").mockImplementation((tagName: string) => {
    if (tagName !== "video") {
      return createElement(tagName);
    }

    const video = {
      duration: Number.NaN,
      muted: false,
      onerror: null as null | ((event: Event) => void),
      onloadedmetadata: null as null | (() => void),
      playsInline: false,
      preload: "",
      videoHeight: 0,
      videoWidth: 0,
      set src(_value: string) {
        this.onerror?.(new Event("error"));
      }
    };

    return video as unknown as HTMLVideoElement;
  });
};

describe("read-media-file", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
  });

  it("reads desktop video metadata through the native Tauri command", async () => {
    installTauriRuntime();
    tauriCore.invoke.mockResolvedValue({
      duration: 12.5,
      mimeType: "video/mp4",
      naturalSize: { width: 3840, height: 2160 }
    });

    const media = await readMediaPath("/Users/example/o.mp4", "video");

    expect(media).toMatchObject({
      duration: 12.5,
      mimeType: "video/mp4",
      name: "o",
      naturalSize: { width: 3840, height: 2160 },
      previewUrl: "asset://localhost//Users/example/o.mp4",
      sourcePath: "/Users/example/o.mp4"
    });
    expect(tauriCore.invoke).toHaveBeenCalledWith("read_media_metadata", { kind: "video", sourcePath: "/Users/example/o.mp4" });
  });

  it("keeps desktop video imports when native and browser metadata probing fail", async () => {
    installTauriRuntime();
    mockVideoMetadataFailure();
    tauriCore.invoke.mockRejectedValue(new Error("ffprobe unavailable"));

    const media = await readMediaPath("/Users/example/o.mov", "video");

    expect(media.duration).toBe(10);
    expect(media.naturalSize).toEqual({ width: 1920, height: 1080 });
    expect(media.name).toBe("o");
    expect(media.previewUrl).toBe("asset://localhost//Users/example/o.mov");
  });

  it("keeps browser video imports when metadata probing fails", async () => {
    mockVideoMetadataFailure();
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:video");

    const media = await readMediaFile(new File(["video"], "o.mp4", { type: "video/mp4" }), "video");

    expect(media.duration).toBe(10);
    expect(media.naturalSize).toEqual({ width: 1920, height: 1080 });
    expect(media.previewUrl).toBe("blob:video");
    expect(media.sourcePath).toBe("o.mp4");
  });
});
