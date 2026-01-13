use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::process::Command;
use anyhow::{Context, Result};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoInfo {
    pub path: PathBuf,
    pub duration: f64,
    pub width: u32,
    pub height: u32,
    pub bitrate: u64,
    pub codec: String,
    pub fps: f32,
    pub size: u64,
    pub audio_codec: Option<String>,
    pub audio_bitrate: Option<u64>,
}

#[derive(Debug, Deserialize)]
struct FFProbeOutput {
    format: Format,
    streams: Vec<Stream>,
}

#[derive(Debug, Deserialize)]
struct Format {
    duration: Option<String>,
    size: Option<String>,
    bit_rate: Option<String>,
}

#[derive(Debug, Deserialize)]
struct Stream {
    codec_type: String,
    codec_name: String,
    width: Option<u32>,
    height: Option<u32>,
    r_frame_rate: Option<String>,
    bit_rate: Option<String>,
}

/// Probe video file using ffprobe and extract metadata
pub async fn probe_video(path: PathBuf) -> Result<VideoInfo> {
    // Check if file exists
    if !path.exists() {
        anyhow::bail!("File does not exist: {:?}", path);
    }

    // Get file size
    let metadata = std::fs::metadata(&path)
        .context("Failed to read file metadata")?;
    let size = metadata.len();

    // Execute ffprobe command
    let output = Command::new("ffprobe")
        .args([
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            path.to_str().context("Failed to convert path to string")?,
        ])
        .output()
        .context("Failed to execute ffprobe. Make sure ffprobe is installed and in PATH")?;

    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        anyhow::bail!("ffprobe failed: {}", error);
    }

    // Parse JSON output
    let probe_data: FFProbeOutput = serde_json::from_slice(&output.stdout)
        .context("Failed to parse ffprobe output")?;

    // Extract video stream info
    let video_stream = probe_data.streams.iter()
        .find(|s| s.codec_type == "video")
        .context("No video stream found")?;

    // Extract audio stream info
    let audio_stream = probe_data.streams.iter()
        .find(|s| s.codec_type == "audio");

    // Parse duration
    let duration = probe_data.format.duration
        .and_then(|d| d.parse::<f64>().ok())
        .unwrap_or(0.0);

    // Parse bitrate
    let bitrate = probe_data.format.bit_rate
        .and_then(|b| b.parse::<u64>().ok())
        .or_else(|| video_stream.bit_rate.as_ref().and_then(|b| b.parse::<u64>().ok()))
        .unwrap_or(0);

    // Parse frame rate
    let fps = video_stream.r_frame_rate
        .as_ref()
        .and_then(|fps_str| {
            let parts: Vec<&str> = fps_str.split('/').collect();
            if parts.len() == 2 {
                let num = parts[0].parse::<f32>().ok()?;
                let den = parts[1].parse::<f32>().ok()?;
                Some(num / den)
            } else {
                None
            }
        })
        .unwrap_or(0.0);

    // Extract audio info
    let audio_codec = audio_stream.map(|s| s.codec_name.clone());
    let audio_bitrate = audio_stream
        .and_then(|s| s.bit_rate.as_ref())
        .and_then(|b| b.parse::<u64>().ok());

    Ok(VideoInfo {
        path,
        duration,
        width: video_stream.width.unwrap_or(0),
        height: video_stream.height.unwrap_or(0),
        bitrate,
        codec: video_stream.codec_name.clone(),
        fps,
        size,
        audio_codec,
        audio_bitrate,
    })
}

/// Check if ffprobe is available
pub fn check_ffprobe() -> bool {
    Command::new("ffprobe")
        .arg("-version")
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false)
}

/// Check if ffmpeg is available
pub fn check_ffmpeg() -> bool {
    Command::new("ffmpeg")
        .arg("-version")
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ffprobe_available() {
        assert!(check_ffprobe(), "ffprobe is not available");
    }

    #[test]
    fn test_ffmpeg_available() {
        assert!(check_ffmpeg(), "ffmpeg is not available");
    }
}
