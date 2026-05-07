use std::process::{Command, Stdio};
use tauri::Emitter;

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct Size {
    width: u32,
    height: u32,
}

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct MediaMetadata {
    duration: Option<f64>,
    natural_size: Option<Size>,
    mime_type: Option<String>,
}

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct ExportResult {
    output_path: String,
}

#[derive(Clone, Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct ExportProgress {
    message: String,
}

#[derive(Debug, thiserror::Error)]
enum ExportError {
    #[error("ffmpeg executable was not found. Install FFmpeg and ensure it is available on PATH.")]
    MissingFfmpeg,
    #[error("ffmpeg failed with status {status}: {stderr}")]
    FfmpegFailed { status: String, stderr: String },
    #[error("failed to start ffmpeg: {0}")]
    Spawn(String),
}

#[derive(Debug, thiserror::Error)]
enum MetadataError {
    #[error("ffprobe executable was not found. Metadata will use a safe fallback.")]
    MissingFfprobe,
    #[error("ffprobe failed with status {status}: {stderr}")]
    FfprobeFailed { status: String, stderr: String },
    #[error("failed to start ffprobe: {0}")]
    Spawn(String),
    #[error("failed to parse ffprobe output: {0}")]
    Parse(String),
}

impl serde::Serialize for ExportError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

impl serde::Serialize for MetadataError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

#[derive(Debug, serde::Deserialize)]
struct FfprobeOutput {
    streams: Option<Vec<FfprobeStream>>,
    format: Option<FfprobeFormat>,
}

#[derive(Debug, serde::Deserialize)]
struct FfprobeStream {
    codec_type: Option<String>,
    width: Option<u32>,
    height: Option<u32>,
    duration: Option<String>,
}

#[derive(Debug, serde::Deserialize)]
struct FfprobeFormat {
    duration: Option<String>,
    format_name: Option<String>,
}

fn parse_duration(value: Option<&String>) -> Option<f64> {
    value.and_then(|item| item.parse::<f64>().ok())
        .filter(|item| item.is_finite() && *item > 0.0)
}

fn mime_type_from_format(format_name: Option<&String>, kind: &str) -> Option<String> {
    let format_name = format_name?.to_lowercase();
    if kind == "video" {
        if format_name.contains("mp4") || format_name.contains("mov") || format_name.contains("m4v") {
            return Some("video/mp4".to_string());
        }
        if format_name.contains("matroska") || format_name.contains("webm") {
            return Some("video/webm".to_string());
        }
    }

    if kind == "audio" {
        if format_name.contains("mp3") {
            return Some("audio/mpeg".to_string());
        }
        if format_name.contains("wav") {
            return Some("audio/wav".to_string());
        }
        if format_name.contains("aac") || format_name.contains("m4a") {
            return Some("audio/aac".to_string());
        }
        if format_name.contains("ogg") {
            return Some("audio/ogg".to_string());
        }
    }

    None
}

#[tauri::command]
fn read_media_metadata(source_path: String, kind: String) -> Result<MediaMetadata, MetadataError> {
    let output = Command::new("ffprobe")
        .args([
            "-v",
            "error",
            "-show_entries",
            "format=duration,format_name:stream=codec_type,width,height,duration",
            "-of",
            "json",
            &source_path,
        ])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .map_err(|error| {
            if error.kind() == std::io::ErrorKind::NotFound {
                MetadataError::MissingFfprobe
            } else {
                MetadataError::Spawn(error.to_string())
            }
        })?;

    if !output.status.success() {
        return Err(MetadataError::FfprobeFailed {
            status: output.status.to_string(),
            stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        });
    }

    let parsed: FfprobeOutput = serde_json::from_slice(&output.stdout).map_err(|error| MetadataError::Parse(error.to_string()))?;
    let video_stream = parsed
        .streams
        .as_ref()
        .and_then(|streams| streams.iter().find(|stream| stream.codec_type.as_deref() == Some("video")));
    let first_stream_duration = parsed
        .streams
        .as_ref()
        .and_then(|streams| streams.iter().find_map(|stream| parse_duration(stream.duration.as_ref())));
    let format_duration = parsed.format.as_ref().and_then(|format| parse_duration(format.duration.as_ref()));

    Ok(MediaMetadata {
        duration: format_duration.or(first_stream_duration),
        natural_size: video_stream.and_then(|stream| match (stream.width, stream.height) {
            (Some(width), Some(height)) if width > 0 && height > 0 => Some(Size { width, height }),
            _ => None,
        }),
        mime_type: parsed
            .format
            .as_ref()
            .and_then(|format| mime_type_from_format(format.format_name.as_ref(), &kind)),
    })
}

#[tauri::command]
fn export_with_ffmpeg(
    app: tauri::AppHandle,
    args: Vec<String>,
    output_path: String,
) -> Result<ExportResult, ExportError> {
    app.emit(
        "export-progress",
        ExportProgress {
            message: "Starting FFmpeg".to_string(),
        },
    )
    .ok();

    let mut command = Command::new("ffmpeg");
    command.args(args).stdout(Stdio::null()).stderr(Stdio::piped());

    let output = command.output().map_err(|error| {
        if error.kind() == std::io::ErrorKind::NotFound {
            ExportError::MissingFfmpeg
        } else {
            ExportError::Spawn(error.to_string())
        }
    })?;

    if !output.status.success() {
        return Err(ExportError::FfmpegFailed {
            status: output.status.to_string(),
            stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        });
    }

    app.emit(
        "export-progress",
        ExportProgress {
            message: "Export complete".to_string(),
        },
    )
    .ok();

    Ok(ExportResult { output_path })
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![export_with_ffmpeg, read_media_metadata])
        .run(tauri::generate_context!())
        .expect("failed to run Codex Video Editor");
}
