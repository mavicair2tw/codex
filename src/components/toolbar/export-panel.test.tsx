import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExportPanel } from "@/components/toolbar/export-panel";
import { resetEditorStore } from "@/test-utils/editor-store";

describe("ExportPanel", () => {
  beforeEach(() => {
    resetEditorStore();
    delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
  });

  it("disables MP4 export in the browser preview", async () => {
    render(<ExportPanel />);

    fireEvent.click(screen.getByRole("button", { name: /export/i }));

    await waitFor(() => expect(screen.getByRole("button", { name: /start export/i })).toBeDisabled());
    expect(screen.getByText(/mp4 export is available in the desktop app/i)).toBeInTheDocument();
  });

  it("enables MP4 export in the desktop app when the Tauri invoke bridge exists", async () => {
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      configurable: true,
      value: { invoke: vi.fn() }
    });

    render(<ExportPanel />);

    fireEvent.click(screen.getByRole("button", { name: /export/i }));

    await waitFor(() => expect(screen.getByRole("button", { name: /start export/i })).toBeEnabled());
    expect(screen.queryByText(/mp4 export is available in the desktop app/i)).not.toBeInTheDocument();
  });
});
