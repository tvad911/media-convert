use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::process::Stdio;
use anyhow::{Context, Result};
use regex::Regex;
use tokio::process::Command;
use tokio::io::{AsyncBufReadExt, BufReader};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncodingSettings {
    pub output_format: String,
    pub video_codec: String,
    pub audio_codec: String,
    pub resolution: Option<(u32, u32)>,
    pub bitrate: Option<u64>,
    pub crf: Option<u8>,
    pub preset: String,
    pub use_hardware: bool,
    pub remove_metadata: bool,
    pub custom_metadata: Option<Vec<(String, String)>>,
}

impl Default for EncodingSettings {
    fn default() -> Self {
        Self {
            output_format: "mp4".to_string(),
            video_codec: "libx264".to_string(),
            audio_codec: "aac".to_string(),
            resolution: None,
            bitrate: None,
            crf: Some(23),
            preset: "medium".to_string(),
            use_hardware: true,
            remove_metadata: false,
            custom_metadata: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncodingProgress {
    pub percentage: f32,
    pub current_time: f64,
    pub fps: f32,
    pub speed: String,
    pub bitrate: String,
}

/// Detect available hardware encoders
pub fn detect_hardware_encoders() -> Vec<String> {
    let output = std::process::Command::new("ffmpeg")
        .args(["-encoders", "-hide_banner"])
        .output();

    if let Ok(output) = output {
        let stdout = String::from_utf8_lossy(&output.stdout);
        let mut encoders = Vec::new();

        // Check for NVIDIA NVENC
        if stdout.contains("h264_nvenc") {
            encoders.push("h264_nvenc".to_string());
        }
        if stdout.contains("hevc_nvenc") {
            encoders.push("hevc_nvenc".to_string());
        }

        // Check for Intel QSV
        if stdout.contains("h264_qsv") {
            encoders.push("h264_qsv".to_string());
        }
        if stdout.contains("hevc_qsv") {
            encoders.push("hevc_qsv".to_string());
        }

        // Check for VAAPI
        if stdout.contains("h264_vaapi") {
            encoders.push("h264_vaapi".to_string());
        }
        if stdout.contains("hevc_vaapi") {
            encoders.push("hevc_vaapi".to_string());
        }

        encoders
    } else {
        Vec::new()
    }
}

/// Select best encoder based on settings and available hardware
pub fn select_encoder(settings: &EncodingSettings, hw_encoders: &[String]) -> String {
    if !settings.use_hardware || hw_encoders.is_empty() {
        return settings.video_codec.clone();
    }

    // Map software codec to hardware equivalent
    let hw_codec = match settings.video_codec.as_str() {
        "libx264" | "h264" => {
            // Prefer NVENC > QSV > VAAPI
            if hw_encoders.contains(&"h264_nvenc".to_string()) {
                "h264_nvenc"
            } else if hw_encoders.contains(&"h264_qsv".to_string()) {
                "h264_qsv"
            } else if hw_encoders.contains(&"h264_vaapi".to_string()) {
                "h264_vaapi"
            } else {
                &settings.video_codec
            }
        }
        "libx265" | "hevc" => {
            if hw_encoders.contains(&"hevc_nvenc".to_string()) {
                "hevc_nvenc"
            } else if hw_encoders.contains(&"hevc_qsv".to_string()) {
                "hevc_qsv"
            } else if hw_encoders.contains(&"hevc_vaapi".to_string()) {
                "hevc_vaapi"
            } else {
                &settings.video_codec
            }
        }
        _ => &settings.video_codec,
    };

    hw_codec.to_string()
}

/// Calculate safe bitrate (prevent unnecessary quality increase)
pub fn calculate_safe_bitrate(target: u64, original: u64) -> u64 {
    if target > original && original > 0 {
        original
    } else {
        target
    }
}

/// Validate resolution (prevent upscaling)
pub fn validate_resolution(
    target: (u32, u32),
    original: (u32, u32),
) -> Result<(u32, u32)> {
    if target.0 > original.0 || target.1 > original.1 {
        anyhow::bail!(
            "Cannot upscale video from {}x{} to {}x{}",
            original.0, original.1, target.0, target.1
        );
    }
    Ok(target)
}

/// Estimate output file size in bytes
pub fn estimate_output_size(bitrate: u64, duration: f64) -> u64 {
    ((bitrate as f64 * duration) / 8.0) as u64
}

/// Build FFmpeg command arguments
pub fn build_ffmpeg_command(
    input: &PathBuf,
    output: &PathBuf,
    settings: &EncodingSettings,
    hw_encoders: &[String],
) -> Vec<String> {
    let mut args = vec![
        "-i".to_string(),
        input.to_str().unwrap().to_string(),
        "-y".to_string(), // Overwrite output file
    ];

    // Video codec
    let encoder = select_encoder(settings, hw_encoders);
    args.push("-c:v".to_string());
    args.push(encoder.clone());

    // Ensure pixel format for compatibility
    args.push("-pix_fmt".to_string());
    args.push("yuv420p".to_string());

    // Resolution and scaling
    if let Some((width, height)) = settings.resolution {
        args.push("-vf".to_string());
        args.push(format!("scale={}:{}", width, height));
    } else {
        // Force even dimensions for compatibility (trunc(iw/2)*2) if keeping original
        args.push("-vf".to_string());
        args.push("scale=trunc(iw/2)*2:trunc(ih/2)*2".to_string());
    }

    // Bitrate or CRF
    if let Some(bitrate) = settings.bitrate {
        args.push("-b:v".to_string());
        args.push(format!("{}k", bitrate / 1000));
    } else if let Some(crf) = settings.crf {
        // CRF not supported by all hardware encoders
        if !encoder.contains("nvenc") && !encoder.contains("qsv") && !encoder.contains("vaapi") {
            args.push("-crf".to_string());
            args.push(crf.to_string());
        }
    }

    // Preset
    args.push("-preset".to_string());
    args.push(settings.preset.clone());

    // Audio codec
    args.push("-c:a".to_string());
    args.push(settings.audio_codec.clone());

    // Metadata handling
    if settings.remove_metadata {
        args.push("-map_metadata".to_string());
        args.push("-1".to_string());
    }

    // Custom metadata
    if let Some(metadata) = &settings.custom_metadata {
        for (key, value) in metadata {
            args.push("-metadata".to_string());
            args.push(format!("{}={}", key, value));
        }
    }

    // Progress reporting
    args.push("-progress".to_string());
    args.push("pipe:1".to_string());

    // Output file
    args.push(output.to_str().unwrap().to_string());

    args
}

/// Parse FFmpeg progress output
pub fn parse_progress(line: &str, total_duration: f64) -> Option<EncodingProgress> {
    lazy_static::lazy_static! {
        static ref TIME_RE: Regex = Regex::new(r"out_time_ms=(\d+)").unwrap();
        static ref FPS_RE: Regex = Regex::new(r"fps=([\d.]+)").unwrap();
        static ref SPEED_RE: Regex = Regex::new(r"speed=([\d.]+)x").unwrap();
        static ref BITRATE_RE: Regex = Regex::new(r"bitrate=([\d.]+)kbits/s").unwrap();
    }

    let time_ms = TIME_RE.captures(line)
        .and_then(|cap| cap.get(1))
        .and_then(|m| m.as_str().parse::<u64>().ok())?;

    let current_time = time_ms as f64 / 1_000_000.0; // Convert microseconds to seconds
    let percentage = if total_duration > 0.0 {
        ((current_time / total_duration) * 100.0).min(100.0)
    } else {
        0.0
    };

    let fps = FPS_RE.captures(line)
        .and_then(|cap| cap.get(1))
        .and_then(|m| m.as_str().parse::<f32>().ok())
        .unwrap_or(0.0);

    let speed = SPEED_RE.captures(line)
        .and_then(|cap| cap.get(1))
        .map(|m| format!("{}x", m.as_str()))
        .unwrap_or_else(|| "0x".to_string());

    let bitrate = BITRATE_RE.captures(line)
        .and_then(|cap| cap.get(1))
        .map(|m| format!("{}kbits/s", m.as_str()))
        .unwrap_or_else(|| "0kbits/s".to_string());

    Some(EncodingProgress {
        percentage: percentage as f32,
        current_time,
        fps,
        speed,
        bitrate,
    })
}



/// Encode video with progress callback
pub async fn encode_video<F>(
    app: tauri::AppHandle,
    input: PathBuf,
    output: PathBuf,
    settings: EncodingSettings,
    total_duration: f64,
    progress_callback: F,
) -> Result<()>
where
    F: Fn(EncodingProgress) + Send + 'static,
{
    let hw_encoders = detect_hardware_encoders();
    let args = build_ffmpeg_command(&input, &output, &settings, &hw_encoders);

    // Use tokio::process::Command for async execution
    let mut child = Command::new("ffmpeg")
        .args(&args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .context("Failed to spawn ffmpeg process")?;

    let stdout = child.stdout.take().context("Failed to capture stdout")?;
    let stderr = child.stderr.take().context("Failed to capture stderr")?;

    // Handle stdout for progress updates
    let mut stdout_reader = BufReader::new(stdout);
    
    // Spawn task for stdout processing
    let stdout_handle = tokio::spawn(async move {
        let mut line = String::new();
        while let Ok(n) = stdout_reader.read_line(&mut line).await {
            if n == 0 { break; }
            if let Some(progress) = parse_progress(&line, total_duration) {
                progress_callback(progress);
            }
            line.clear();
        }
    });

    // Handle stderr for error capturing AND real-time logging
    let mut stderr_reader = BufReader::new(stderr);
    let app_clone = app.clone();
    let stderr_handle = tokio::spawn(async move {
        use tauri::Emitter;
        let mut lines = Vec::new();
        let mut line = String::new();
        while let Ok(n) = stderr_reader.read_line(&mut line).await {
            if n == 0 { break; }
            let log_line = line.trim().to_string();
            
            // Emit log line to frontend
            let _ = app_clone.emit("ffmpeg-log", log_line.clone());

            // Keep for error reporting
            if lines.len() >= 20 {
                lines.remove(0);
            }
            lines.push(log_line);
            line.clear();
        }
        lines.join("\n")
    });

    // Wait for process to complete
    let status = child.wait().await.context("Failed to wait for ffmpeg process")?;
    
    // Wait for IO tasks to finish
    let _ = stdout_handle.await;
    let error_log = stderr_handle.await.unwrap_or_default();

    if !status.success() {
        anyhow::bail!("FFmpeg encoding failed with status: {}\nLast 20 lines of error log:\n{}", status, error_log);
    }

    Ok(())
}
