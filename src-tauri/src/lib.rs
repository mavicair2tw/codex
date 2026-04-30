use std::process::{Command, Stdio};
use tauri::Emitter;

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

impl serde::Serialize for ExportError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
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
        .invoke_handler(tauri::generate_handler![export_with_ffmpeg])
        .run(tauri::generate_context!())
        .expect("failed to run Codex Video Editor");
}
