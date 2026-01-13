use std::path::{Path, PathBuf};
use anyhow::Result;

/// Generate unique output filename if file already exists
pub fn generate_unique_filename(path: &Path) -> PathBuf {
    if !path.exists() {
        return path.to_path_buf();
    }

    let parent = path.parent().unwrap_or_else(|| Path::new("."));
    let stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or("output");
    let extension = path.extension().and_then(|s| s.to_str()).unwrap_or("");

    let mut counter = 1;
    loop {
        let new_name = if extension.is_empty() {
            format!("{}_{}", stem, counter)
        } else {
            format!("{}_{}.{}", stem, counter, extension)
        };

        let new_path = parent.join(new_name);
        if !new_path.exists() {
            return new_path;
        }

        counter += 1;
    }
}

/// Scan directory for video files
pub fn scan_directory(dir: &Path, recursive: bool) -> Result<Vec<PathBuf>> {
    let video_extensions = vec!["mp4", "mkv", "avi", "mov", "wmv", "flv", "webm", "m4v", "mpg", "mpeg"];
    let mut video_files = Vec::new();

    if !dir.is_dir() {
        anyhow::bail!("Path is not a directory: {:?}", dir);
    }

    scan_directory_recursive(dir, &video_extensions, recursive, &mut video_files)?;

    Ok(video_files)
}

fn scan_directory_recursive(
    dir: &Path,
    extensions: &[&str],
    recursive: bool,
    files: &mut Vec<PathBuf>,
) -> Result<()> {
    for entry in std::fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();

        if path.is_file() {
            if let Some(ext) = path.extension() {
                if let Some(ext_str) = ext.to_str() {
                    if extensions.contains(&ext_str.to_lowercase().as_str()) {
                        files.push(path);
                    }
                }
            }
        } else if path.is_dir() && recursive {
            scan_directory_recursive(&path, extensions, recursive, files)?;
        }
    }

    Ok(())
}

/// Format file size in human-readable format
pub fn format_file_size(bytes: u64) -> String {
    const UNITS: &[&str] = &["B", "KB", "MB", "GB", "TB"];
    
    if bytes == 0 {
        return "0 B".to_string();
    }

    let mut size = bytes as f64;
    let mut unit_index = 0;

    while size >= 1024.0 && unit_index < UNITS.len() - 1 {
        size /= 1024.0;
        unit_index += 1;
    }

    format!("{:.2} {}", size, UNITS[unit_index])
}

/// Format duration in human-readable format
pub fn format_duration(seconds: f64) -> String {
    let total_seconds = seconds as u64;
    let hours = total_seconds / 3600;
    let minutes = (total_seconds % 3600) / 60;
    let secs = total_seconds % 60;

    if hours > 0 {
        format!("{:02}:{:02}:{:02}", hours, minutes, secs)
    } else {
        format!("{:02}:{:02}", minutes, secs)
    }
}

/// Parse resolution string (e.g., "1920x1080") to tuple
pub fn parse_resolution(res_str: &str) -> Option<(u32, u32)> {
    let parts: Vec<&str> = res_str.split('x').collect();
    if parts.len() != 2 {
        return None;
    }

    let width = parts[0].parse::<u32>().ok()?;
    let height = parts[1].parse::<u32>().ok()?;

    Some((width, height))
}

/// Get common resolution presets
pub fn get_resolution_presets() -> Vec<(&'static str, (u32, u32))> {
    vec![
        ("4K (3840x2160)", (3840, 2160)),
        ("1080p (1920x1080)", (1920, 1080)),
        ("720p (1280x720)", (1280, 720)),
        ("480p (854x480)", (854, 480)),
        ("360p (640x360)", (640, 360)),
    ]
}

/// Calculate bitrate from file size and duration
pub fn calculate_bitrate(size_bytes: u64, duration_seconds: f64) -> u64 {
    if duration_seconds <= 0.0 {
        return 0;
    }
    ((size_bytes as f64 * 8.0) / duration_seconds) as u64
}

/// Sanitize filename (remove invalid characters)
pub fn sanitize_filename(filename: &str) -> String {
    filename
        .chars()
        .map(|c| match c {
            '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|' => '_',
            _ => c,
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_format_file_size() {
        assert_eq!(format_file_size(0), "0 B");
        assert_eq!(format_file_size(1024), "1.00 KB");
        assert_eq!(format_file_size(1048576), "1.00 MB");
        assert_eq!(format_file_size(1073741824), "1.00 GB");
    }

    #[test]
    fn test_format_duration() {
        assert_eq!(format_duration(0.0), "00:00");
        assert_eq!(format_duration(59.0), "00:59");
        assert_eq!(format_duration(60.0), "01:00");
        assert_eq!(format_duration(3661.0), "01:01:01");
    }

    #[test]
    fn test_parse_resolution() {
        assert_eq!(parse_resolution("1920x1080"), Some((1920, 1080)));
        assert_eq!(parse_resolution("1280x720"), Some((1280, 720)));
        assert_eq!(parse_resolution("invalid"), None);
    }

    #[test]
    fn test_sanitize_filename() {
        assert_eq!(sanitize_filename("test:file*.mp4"), "test_file_.mp4");
        assert_eq!(sanitize_filename("normal.mp4"), "normal.mp4");
    }
}
