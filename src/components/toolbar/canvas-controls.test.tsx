import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { CanvasControls } from "@/components/toolbar/canvas-controls";
import { useEditorStore } from "@/stores/editor-store";
import { resetEditorStore } from "@/test-utils/editor-store";

describe("CanvasControls", () => {
  beforeEach(() => {
    resetEditorStore();
  });

  it("selects square, vertical, and horizontal canvas aspect ratios", () => {
    render(<CanvasControls />);

    const select = screen.getByLabelText(/canvas aspect ratio/i);

    fireEvent.change(select, { target: { value: "1:1" } });
    expect(useEditorStore.getState().project.settings.canvas).toEqual({ width: 1080, height: 1080 });
    expect(screen.getByText("1080 x 1080")).toBeInTheDocument();

    fireEvent.change(select, { target: { value: "9:16" } });
    expect(useEditorStore.getState().project.settings.canvas).toEqual({ width: 1080, height: 1920 });
    expect(screen.getByText("1080 x 1920")).toBeInTheDocument();

    fireEvent.change(select, { target: { value: "16:9" } });
    expect(useEditorStore.getState().project.settings.canvas).toEqual({ width: 1920, height: 1080 });
    expect(screen.getByText("1920 x 1080")).toBeInTheDocument();
  });
});
