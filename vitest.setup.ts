import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";

Object.defineProperty(HTMLMediaElement.prototype, "play", {
  configurable: true,
  value: vi.fn().mockResolvedValue(undefined)
});

Object.defineProperty(HTMLMediaElement.prototype, "pause", {
  configurable: true,
  value: vi.fn()
});

beforeEach(() => {
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback: FrameRequestCallback) =>
    window.setTimeout(() => callback(performance.now()), 16)
  );
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id: number) => window.clearTimeout(id));
});

afterEach(() => {
  vi.restoreAllMocks();
});
