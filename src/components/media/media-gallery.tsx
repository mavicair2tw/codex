"use client";

import { FileAudio, Film, ImageIcon, Plus, Trash2, Type } from "lucide-react";
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
      {asset.kind === "audio" ? <FileAudio size={22} /> : asset.kind === "video" ? <Film size={22} /> : asset.kind === "text" ? <Type size={22} /> : <ImageIcon size={22} />}
    </div>
  );
};

export const MediaGallery = () => {
  const assets = useEditorStore((state) => state.project.mediaAssets);
  const fps = useEditorStore((state) => state.project.timeline.fps);
  const selectedAssetId = useEditorStore((state) => state.selectedAssetId);
  const selectAsset = useEditorStore((state) => state.selectAsset);
  const addAssetToTimeline = useEditorStore((state) => state.addAssetToTimeline);
  const removeMediaAsset = useEditorStore((state) => state.removeMediaAsset);

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
            <div
              aria-label={`Select ${asset.name}`}
              className={`media-item ${selectedAssetId === asset.id ? "selected" : ""}`}
              key={asset.id}
              onClick={() => selectAsset(asset.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  selectAsset(asset.id);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <AssetIcon asset={asset} />
              <span className="media-meta">
                <span className="media-name">{asset.name}</span>
                <span className="media-detail">
                  {asset.kind} · {formatTimecode(asset.duration, fps)}
                </span>
              </span>
              <span className="media-actions">
                <button
                  aria-label={`Add ${asset.name} to timeline`}
                  className="media-action-button"
                  onClick={(event) => {
                    event.stopPropagation();
                    addAssetToTimeline(asset.id);
                  }}
                  title="Add to timeline"
                  type="button"
                >
                  <Plus size={16} />
                </button>
                <button
                  aria-label={`Remove ${asset.name} from gallery`}
                  className="media-action-button danger"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeMediaAsset(asset.id);
                  }}
                  title="Remove from gallery"
                  type="button"
                >
                  <Trash2 size={15} />
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
};
