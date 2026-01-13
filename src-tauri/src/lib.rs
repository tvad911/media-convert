// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

mod encoder;
mod probe;
mod queue;
mod session;
mod utils;

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{Emitter, State};
use tokio::sync::Mutex;

use encoder::{detect_hardware_encoders, EncodingSettings};
use probe::{check_ffmpeg, check_ffprobe, probe_video, VideoInfo};
use queue::{calculate_max_concurrent, Job, JobQueue, QueueStats};
use session::SessionManager;
use utils::{generate_unique_filename, get_resolution_presets, scan_directory};

// Application state
pub struct AppState {
    queue: Arc<Mutex<JobQueue>>,
    session_manager: Arc<Mutex<SessionManager>>,
    current_session_id: Arc<Mutex<Option<i64>>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfo {
    pub ffmpeg_available: bool,
    pub ffprobe_available: bool,
    pub hardware_encoders: Vec<String>,
    pub max_concurrent_jobs: usize,
    pub cpu_cores: usize,
}

// Tauri Commands

#[tauri::command]
async fn get_system_info() -> Result<SystemInfo, String> {
    Ok(SystemInfo {
        ffmpeg_available: check_ffmpeg(),
        ffprobe_available: check_ffprobe(),
        hardware_encoders: detect_hardware_encoders(),
        max_concurrent_jobs: calculate_max_concurrent(),
        cpu_cores: num_cpus::get(),
    })
}

#[tauri::command]
async fn probe_video_file(path: String) -> Result<VideoInfo, String> {
    let path_buf = PathBuf::from(path);
    probe_video(path_buf).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn add_files(
    paths: Vec<String>,
    output_dir: String,
    settings: EncodingSettings,
    state: State<'_, AppState>,
) -> Result<Vec<Job>, String> {
    let mut jobs = Vec::new();
    let queue = state.queue.lock().await;

    for path_str in paths {
        let input_path = PathBuf::from(&path_str);

        // Probe video
        let video_info = match probe_video(input_path.clone()).await {
            Ok(info) => info,
            Err(e) => {
                eprintln!("Failed to probe {}: {}", path_str, e);
                continue;
            }
        };

        // Generate output path
        let filename = input_path
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("output");
        let output_filename = format!("{}.{}", filename, settings.output_format);
        let output_path = PathBuf::from(&output_dir).join(output_filename);
        let output_path = generate_unique_filename(&output_path);

        // Create job
        let job = Job::new(input_path, output_path, video_info, settings.clone());
        queue.add_job(job.clone()).await;
        jobs.push(job);
    }

    Ok(jobs)
}

#[tauri::command]
async fn add_directory(
    dir_path: String,
    output_dir: String,
    settings: EncodingSettings,
    recursive: bool,
    state: State<'_, AppState>,
) -> Result<Vec<Job>, String> {
    let dir = PathBuf::from(&dir_path);

    // Scan directory for video files
    let video_files = scan_directory(&dir, recursive).map_err(|e| e.to_string())?;

    let paths: Vec<String> = video_files
        .iter()
        .map(|p| p.to_string_lossy().to_string())
        .collect();

    add_files(paths, output_dir, settings, state).await
}

#[tauri::command]
async fn get_jobs(state: State<'_, AppState>) -> Result<Vec<Job>, String> {
    let queue = state.queue.lock().await;
    Ok(queue.get_jobs().await)
}

#[tauri::command]
async fn get_job(id: String, state: State<'_, AppState>) -> Result<Option<Job>, String> {
    let queue = state.queue.lock().await;
    Ok(queue.get_job(&id).await)
}

#[tauri::command]
async fn remove_job(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let queue = state.queue.lock().await;
    queue.remove_job(&id).await;
    Ok(())
}

#[tauri::command]
async fn clear_jobs(state: State<'_, AppState>) -> Result<(), String> {
    let queue = state.queue.lock().await;
    queue.clear_jobs().await;
    Ok(())
}

#[tauri::command]
async fn set_max_concurrent_jobs(state: State<'_, AppState>, count: usize) -> Result<(), String> {
    let queue = state.queue.lock().await;
    queue.set_max_concurrent(count).await;
    Ok(())
}

#[tauri::command]
async fn start_processing(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    should_shutdown: bool,
) -> Result<(), String> {
    let queue = state.queue.lock().await;
    let queue_clone = queue.clone();
    drop(queue);

    tokio::spawn(async move {
        use tauri_plugin_notification::NotificationExt;

        let app_progress = app.clone();
        let app_status = app.clone();
        let app_finished = app.clone();
        let app_notify = app.clone();

        queue_clone
            .process_all(
                app.clone(),
                move |job_id, progress| {
                    let _ = app_progress.emit("encoding-progress", (job_id, progress));
                },
                move |job_id, status| {
                    let _ = app_status.emit("job-status-change", (job_id, status));
                },
            )
            .await;

        // Notify user
        let _ = app_notify
            .notification()
            .builder()
            .title("Processing Complete")
            .body("All videos in the queue have been converted.")
            .show();

        let _ = app_finished.emit("queue-finished", ());

        if should_shutdown {
            println!("Shutdown requested. Executing shutdown command...");
            let _ = std::process::Command::new("shutdown")
                .args(["-h", "now"])
                .spawn();
        }
    });

    Ok(())
}

#[tauri::command]
async fn pause_queue(state: State<'_, AppState>) -> Result<(), String> {
    let queue = state.queue.lock().await;
    queue.pause().await;
    Ok(())
}

#[tauri::command]
async fn resume_queue(state: State<'_, AppState>) -> Result<(), String> {
    let queue = state.queue.lock().await;
    queue.resume().await;
    Ok(())
}

#[tauri::command]
async fn cancel_job(id: String, state: State<'_, AppState>) -> Result<(), String> {
    let queue = state.queue.lock().await;
    queue.cancel_job(&id).await;
    Ok(())
}

#[tauri::command]
async fn get_queue_stats(state: State<'_, AppState>) -> Result<QueueStats, String> {
    let queue = state.queue.lock().await;
    Ok(queue.get_stats().await)
}

#[tauri::command]
async fn create_session(name: String, state: State<'_, AppState>) -> Result<i64, String> {
    let session_manager = state.session_manager.lock().await;
    let session = session_manager
        .create_session(name)
        .map_err(|e| e.to_string())?;

    let mut current_session = state.current_session_id.lock().await;
    *current_session = Some(session.id);

    Ok(session.id)
}

#[tauri::command]
async fn save_session(state: State<'_, AppState>) -> Result<(), String> {
    let current_session_id = {
        let session_id = state.current_session_id.lock().await;
        *session_id
    };

    if let Some(session_id) = current_session_id {
        let queue = state.queue.lock().await;
        let jobs = queue.get_jobs().await;

        let session_manager = state.session_manager.lock().await;
        session_manager
            .save_jobs(session_id, &jobs)
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
async fn load_session(session_id: i64, state: State<'_, AppState>) -> Result<Vec<Job>, String> {
    let session_manager = state.session_manager.lock().await;
    let jobs = session_manager
        .load_jobs(session_id)
        .map_err(|e| e.to_string())?;

    let queue = state.queue.lock().await;
    queue.clear_jobs().await;

    for job in &jobs {
        queue.add_job(job.clone()).await;
    }

    let mut current_session = state.current_session_id.lock().await;
    *current_session = Some(session_id);

    Ok(jobs)
}

#[tauri::command]
async fn get_sessions(state: State<'_, AppState>) -> Result<Vec<session::Session>, String> {
    let session_manager = state.session_manager.lock().await;
    session_manager.get_sessions().map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_session(session_id: i64, state: State<'_, AppState>) -> Result<(), String> {
    let session_manager = state.session_manager.lock().await;
    session_manager
        .delete_session(session_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn get_resolution_presets_cmd() -> Vec<(String, (u32, u32))> {
    get_resolution_presets()
        .into_iter()
        .map(|(name, res)| (name.to_string(), res))
        .collect()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize application state
    let max_concurrent = calculate_max_concurrent();
    let queue = Arc::new(Mutex::new(JobQueue::new(max_concurrent)));

    // Get app data directory for database
    let app_data_dir = std::env::var("HOME")
        .map(|home| PathBuf::from(home).join(".local/share/rust-video-converter"))
        .unwrap_or_else(|_| PathBuf::from("."));
    std::fs::create_dir_all(&app_data_dir).ok();

    let db_path = app_data_dir.join("sessions.db");
    let session_manager = Arc::new(Mutex::new(
        SessionManager::new(db_path).expect("Failed to initialize session manager"),
    ));

    let app_state = AppState {
        queue,
        session_manager,
        current_session_id: Arc::new(Mutex::new(None)),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            get_system_info,
            probe_video_file,
            add_files,
            add_directory,
            get_jobs,
            get_job,
            remove_job,
            clear_jobs,
            start_processing,
            set_max_concurrent_jobs,
            pause_queue,
            resume_queue,
            cancel_job,
            get_queue_stats,
            create_session,
            save_session,
            load_session,
            get_sessions,
            delete_session,
            get_resolution_presets_cmd,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
