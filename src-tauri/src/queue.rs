use crate::encoder::{encode_video, EncodingProgress, EncodingSettings};
use crate::probe::VideoInfo;
use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::{Mutex, Semaphore};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum JobStatus {
    Pending,
    Processing { progress: f32 },
    Completed { output_path: PathBuf },
    Failed { error: String },
    Paused,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Job {
    pub id: String,
    pub input_path: PathBuf,
    pub output_path: PathBuf,
    pub video_info: VideoInfo,
    pub settings: EncodingSettings,
    pub status: JobStatus,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub started_at: Option<chrono::DateTime<chrono::Utc>>,
    pub completed_at: Option<chrono::DateTime<chrono::Utc>>,
}

impl Job {
    pub fn new(
        input_path: PathBuf,
        output_path: PathBuf,
        video_info: VideoInfo,
        settings: EncodingSettings,
    ) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            input_path,
            output_path,
            video_info,
            settings,
            status: JobStatus::Pending,
            created_at: chrono::Utc::now(),
            started_at: None,
            completed_at: None,
        }
    }
}

pub struct JobQueue {
    jobs: Arc<Mutex<Vec<Job>>>,
    semaphore: Arc<Mutex<Arc<Semaphore>>>,
    paused: Arc<Mutex<bool>>,
}

impl JobQueue {
    pub fn new(max_concurrent: usize) -> Self {
        Self {
            jobs: Arc::new(Mutex::new(Vec::new())),
            semaphore: Arc::new(Mutex::new(Arc::new(Semaphore::new(max_concurrent)))),
            paused: Arc::new(Mutex::new(false)),
        }
    }

    /// Set maximum concurrent jobs
    pub async fn set_max_concurrent(&self, max_concurrent: usize) {
        let mut semaphore = self.semaphore.lock().await;
        *semaphore = Arc::new(Semaphore::new(max_concurrent));
    }

    /// Add a job to the queue
    pub async fn add_job(&self, job: Job) {
        let mut jobs = self.jobs.lock().await;
        jobs.push(job);
    }

    /// Get all jobs
    pub async fn get_jobs(&self) -> Vec<Job> {
        let jobs = self.jobs.lock().await;
        jobs.clone()
    }

    /// Get a specific job by ID
    pub async fn get_job(&self, id: &str) -> Option<Job> {
        let jobs = self.jobs.lock().await;
        jobs.iter().find(|j| j.id == id).cloned()
    }

    /// Update job status
    pub async fn update_job_status(&self, id: &str, status: JobStatus) {
        let mut jobs = self.jobs.lock().await;
        if let Some(job) = jobs.iter_mut().find(|j| j.id == id) {
            job.status = status.clone();

            match status {
                JobStatus::Processing { .. } => {
                    if job.started_at.is_none() {
                        job.started_at = Some(chrono::Utc::now());
                    }
                }
                JobStatus::Completed { .. } | JobStatus::Failed { .. } => {
                    job.completed_at = Some(chrono::Utc::now());
                }
                _ => {}
            }
        }
    }

    /// Remove a job from the queue
    pub async fn remove_job(&self, id: &str) {
        let mut jobs = self.jobs.lock().await;
        jobs.retain(|j| j.id != id);
    }

    /// Clear all jobs
    pub async fn clear_jobs(&self) {
        let mut jobs = self.jobs.lock().await;
        jobs.clear();
    }

    /// Pause the queue
    pub async fn pause(&self) {
        let mut paused = self.paused.lock().await;
        *paused = true;
    }

    /// Resume the queue
    pub async fn resume(&self) {
        let mut paused = self.paused.lock().await;
        *paused = false;
    }

    /// Check if queue is paused
    pub async fn is_paused(&self) -> bool {
        let paused = self.paused.lock().await;
        *paused
    }

    /// Process a single job
    pub async fn process_job<F, S>(
        &self,
        app: tauri::AppHandle,
        job_id: String,
        progress_callback: F,
        status_callback: S,
    ) -> Result<()>
    where
        F: Fn(String, EncodingProgress) + Send + Clone + 'static,
        S: Fn(String, JobStatus) + Send + Clone + 'static,
    {
        // Acquire semaphore permit
        let _permit = {
            let semaphore = self.semaphore.lock().await.clone();
            semaphore.acquire_owned().await?
        };

        // Check if paused
        while self.is_paused().await {
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        }

        // Get job details
        let job = {
            let jobs = self.jobs.lock().await;
            jobs.iter().find(|j| j.id == job_id).cloned()
        };

        let job = match job {
            Some(j) => j,
            None => return Ok(()),
        };

        // Check if job is cancelled
        if matches!(job.status, JobStatus::Cancelled) {
            return Ok(());
        }

        // Update status to processing
        let processing_status = JobStatus::Processing { progress: 0.0 };
        self.update_job_status(&job_id, processing_status.clone())
            .await;
        status_callback(job_id.clone(), processing_status);

        // Create progress callback
        let job_id_clone = job_id.clone();
        let queue = self.clone();
        let callback = move |progress: EncodingProgress| {
            let job_id = job_id_clone.clone();
            let queue = queue.clone();
            let progress_cb = progress_callback.clone();

            tokio::spawn(async move {
                queue
                    .update_job_status(
                        &job_id,
                        JobStatus::Processing {
                            progress: progress.percentage,
                        },
                    )
                    .await;
                progress_cb(job_id, progress);
            });
        };

        // Encode video
        let mut result = encode_video(
            app.clone(),
            job.input_path.clone(),
            job.output_path.clone(),
            job.settings.clone(),
            job.video_info.duration,
            callback.clone(),
        )
        .await;

        // Fallback to software encoding if hardware encoding fails
        if result.is_err() && job.settings.use_hardware {
            let err = result.as_ref().unwrap_err();
            eprintln!(
                "Hardware encoding failed ({}). Retrying with software encoder...",
                err
            );

            let mut software_settings = job.settings.clone();
            software_settings.use_hardware = false;

            result = encode_video(
                app,
                job.input_path.clone(),
                job.output_path.clone(),
                software_settings,
                job.video_info.duration,
                callback,
            )
            .await;
        }

        // Update final status
        match result {
            Ok(_) => {
                let status = JobStatus::Completed {
                    output_path: job.output_path,
                };
                self.update_job_status(&job_id, status.clone()).await;
                status_callback(job_id, status);
            }
            Err(e) => {
                let status = JobStatus::Failed {
                    error: e.to_string(),
                };
                self.update_job_status(&job_id, status.clone()).await;
                status_callback(job_id, status);
            }
        }

        Ok(())
    }

    /// Process all pending jobs
    pub async fn process_all<F, S>(
        &self,
        app: tauri::AppHandle,
        progress_callback: F,
        status_callback: S,
    ) where
        F: Fn(String, EncodingProgress) + Send + Clone + 'static,
        S: Fn(String, JobStatus) + Send + Clone + 'static,
    {
        let job_ids: Vec<String> = {
            let jobs = self.jobs.lock().await;
            jobs.iter()
                .filter(|j| matches!(j.status, JobStatus::Pending))
                .map(|j| j.id.clone())
                .collect()
        };

        let mut handles = Vec::new();

        for job_id in job_ids {
            let queue = self.clone();
            let callback = progress_callback.clone();
            let status_cb = status_callback.clone();
            let app_handle = app.clone();

            let handle = tokio::spawn(async move {
                let _ = queue
                    .process_job(app_handle, job_id, callback, status_cb)
                    .await;
            });

            handles.push(handle);
        }

        // Wait for all jobs to complete
        for handle in handles {
            let _ = handle.await;
        }
    }

    /// Cancel a job
    pub async fn cancel_job(&self, id: &str) {
        self.update_job_status(id, JobStatus::Cancelled).await;
    }

    /// Get queue statistics
    pub async fn get_stats(&self) -> QueueStats {
        let jobs = self.jobs.lock().await;

        let total = jobs.len();
        let pending = jobs
            .iter()
            .filter(|j| matches!(j.status, JobStatus::Pending))
            .count();
        let processing = jobs
            .iter()
            .filter(|j| matches!(j.status, JobStatus::Processing { .. }))
            .count();
        let completed = jobs
            .iter()
            .filter(|j| matches!(j.status, JobStatus::Completed { .. }))
            .count();
        let failed = jobs
            .iter()
            .filter(|j| matches!(j.status, JobStatus::Failed { .. }))
            .count();
        let cancelled = jobs
            .iter()
            .filter(|j| matches!(j.status, JobStatus::Cancelled))
            .count();

        QueueStats {
            total,
            pending,
            processing,
            completed,
            failed,
            cancelled,
        }
    }
}

impl Clone for JobQueue {
    fn clone(&self) -> Self {
        Self {
            jobs: Arc::clone(&self.jobs),
            semaphore: Arc::clone(&self.semaphore),
            paused: Arc::clone(&self.paused),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueueStats {
    pub total: usize,
    pub pending: usize,
    pub processing: usize,
    pub completed: usize,
    pub failed: usize,
    pub cancelled: usize,
}

/// Calculate optimal concurrent jobs based on CPU cores
pub fn calculate_max_concurrent() -> usize {
    let cores = num_cpus::get();
    std::cmp::max(1, cores / 4)
}
