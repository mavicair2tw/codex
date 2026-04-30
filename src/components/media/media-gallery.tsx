"use client";

import { FileAudio, Film, ImageIcon } from "lucide-react";
import { formatTimecode } from "@/lib/time";
import { useEditorStore } from "@/stores/editor-store";
import type { MediaAsset } from "@/types/editor";

const AssetIcon = ({ asset }: { asset: MediaAsset }) => {
  if (asset.kind === "image" && asset.previewUrl) {
    return <div aria-label={asset.name} className="media-thumb image-thumb" role="img" style={{ backgroundImage: `url("${asset.previewUrl}")` }} />;
  }

  if (asset.kind === "video" && asset.previewUrl) {
    return <video className="media-thumb" muted playsInline preload="metadata" src={asset.previewUrl} />;
  }

  return (
    <div className={`media-thumb empty-thumb ${asset.kind}`}>
      {asset.kind === "audio" ? <FileAudio size={22} /> : asset.kind === "video" ? <Film size={22} /> : <ImageIcon size={22} />}
    </div>
  );
};

export const MediaGallery = () => {
  const assets = useEditorStore((state) => state.project.mediaAssets);
  const clips = useEditorStore((state) => state.project.clips);
  const fps = useEditorStore((state) => state.project.timeline.fps);
  const selectedClipId = useEditorStore((state) => state.selectedClipId);
  const selectClip = useEditorStore((state) => state.selectClip);
  const setPlayhead = useEditorStore((state) => state.setPlayhead);

  const selectAsset = (asset: MediaAsset) => {
    const clip = clips.find((item) => item.id === asset.clipId);
    selectClip(asset.clipId);
    if (clip) {
      setPlayhead(clip.timing.start);
    }
  };

  return (
    <aside className="media-gallery" aria-label="Imported media gallery">
      <h2 className="section-title">Media</h2>
      {assets.length === 0 ? (
        <div className="media-empty">
          <Film size={22} />
          <span>No imports yet</span>
        </div>
      ) : (
        <div className="media-list">
          {assets.map((asset) => (
            <button className={`media-item ${selectedClipId === asset.clipId ? "selected" : ""}`} key={asset.id} onClick={() => selectAsset(asset)} type="button">
              <AssetIcon asset={asset} />
              <span className="media-meta">
                <span className="media-name">{asset.name}</span>
                <span className="media-detail">
                  {asset.kind} · {formatTimecode(asset.duration, fps)}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </aside>
  );
};
