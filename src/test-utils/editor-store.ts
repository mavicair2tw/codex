import { sampleProject } from "@/data/sample-project";
import { useEditorStore } from "@/stores/editor-store";

export const resetEditorStore = () => {
  useEditorStore.setState({
    project: structuredClone(sampleProject),
    selectedClipId: sampleProject.clips[0]?.id ?? null,
    selectedAssetId: null,
    playhead: 0,
    playback: "stopped",
    exportJob: {
      id: "test-export",
      preset: "1080p",
      status: "idle",
      progress: 0,
      message: "Ready"
    }
  });
};
