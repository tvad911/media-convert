use crate::queue::Job;
use anyhow::{Context, Result};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub id: i64,
    pub name: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

pub struct SessionManager {
    db_path: PathBuf,
}

impl SessionManager {
    pub fn new(db_path: PathBuf) -> Result<Self> {
        let manager = Self { db_path };
        manager.init_database()?;
        Ok(manager)
    }

    fn get_connection(&self) -> Result<Connection> {
        Connection::open(&self.db_path).context("Failed to open database connection")
    }

    fn init_database(&self) -> Result<()> {
        let conn = self.get_connection()?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS jobs (
                id TEXT PRIMARY KEY,
                session_id INTEGER NOT NULL,
                input_path TEXT NOT NULL,
                output_path TEXT NOT NULL,
                video_info TEXT NOT NULL,
                settings TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL,
                started_at TEXT,
                completed_at TEXT,
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
            )",
            [],
        )?;

        Ok(())
    }

    /// Create a new session
    pub fn create_session(&self, name: String) -> Result<Session> {
        let conn = self.get_connection()?;
        let now = chrono::Utc::now();
        let now_str = now.to_rfc3339();

        conn.execute(
            "INSERT INTO sessions (name, created_at, updated_at) VALUES (?1, ?2, ?3)",
            params![name, now_str, now_str],
        )?;

        let id = conn.last_insert_rowid();

        Ok(Session {
            id,
            name,
            created_at: now,
            updated_at: now,
        })
    }

    /// Get all sessions
    pub fn get_sessions(&self) -> Result<Vec<Session>> {
        let conn = self.get_connection()?;
        let mut stmt = conn.prepare(
            "SELECT id, name, created_at, updated_at FROM sessions ORDER BY updated_at DESC",
        )?;

        let sessions = stmt
            .query_map([], |row| {
                Ok(Session {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    created_at: row
                        .get::<_, String>(2)?
                        .parse::<chrono::DateTime<chrono::Utc>>()
                        .unwrap(),
                    updated_at: row
                        .get::<_, String>(3)?
                        .parse::<chrono::DateTime<chrono::Utc>>()
                        .unwrap(),
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(sessions)
    }

    /// Get a session by ID
    pub fn get_session(&self, id: i64) -> Result<Option<Session>> {
        let conn = self.get_connection()?;
        let mut stmt =
            conn.prepare("SELECT id, name, created_at, updated_at FROM sessions WHERE id = ?1")?;

        let mut rows = stmt.query(params![id])?;

        if let Some(row) = rows.next()? {
            Ok(Some(Session {
                id: row.get(0)?,
                name: row.get(1)?,
                created_at: row
                    .get::<_, String>(2)?
                    .parse::<chrono::DateTime<chrono::Utc>>()
                    .unwrap(),
                updated_at: row
                    .get::<_, String>(3)?
                    .parse::<chrono::DateTime<chrono::Utc>>()
                    .unwrap(),
            }))
        } else {
            Ok(None)
        }
    }

    /// Update session
    pub fn update_session(&self, id: i64, name: String) -> Result<()> {
        let conn = self.get_connection()?;
        let now = chrono::Utc::now().to_rfc3339();

        conn.execute(
            "UPDATE sessions SET name = ?1, updated_at = ?2 WHERE id = ?3",
            params![name, now, id],
        )?;

        Ok(())
    }

    /// Delete session
    pub fn delete_session(&self, id: i64) -> Result<()> {
        let conn = self.get_connection()?;
        conn.execute("DELETE FROM sessions WHERE id = ?1", params![id])?;
        Ok(())
    }

    /// Save jobs to session
    pub fn save_jobs(&self, session_id: i64, jobs: &[Job]) -> Result<()> {
        let conn = self.get_connection()?;

        // Delete existing jobs for this session
        conn.execute(
            "DELETE FROM jobs WHERE session_id = ?1",
            params![session_id],
        )?;

        // Insert new jobs
        for job in jobs {
            let video_info_json = serde_json::to_string(&job.video_info)?;
            let settings_json = serde_json::to_string(&job.settings)?;
            let status_json = serde_json::to_string(&job.status)?;

            conn.execute(
                "INSERT INTO jobs (id, session_id, input_path, output_path, video_info, settings, status, created_at, started_at, completed_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
                params![
                    job.id,
                    session_id,
                    job.input_path.to_str().unwrap(),
                    job.output_path.to_str().unwrap(),
                    video_info_json,
                    settings_json,
                    status_json,
                    job.created_at.to_rfc3339(),
                    job.started_at.map(|dt| dt.to_rfc3339()),
                    job.completed_at.map(|dt| dt.to_rfc3339()),
                ],
            )?;
        }

        // Update session timestamp
        let now = chrono::Utc::now().to_rfc3339();
        conn.execute(
            "UPDATE sessions SET updated_at = ?1 WHERE id = ?2",
            params![now, session_id],
        )?;

        Ok(())
    }

    /// Load jobs from session
    pub fn load_jobs(&self, session_id: i64) -> Result<Vec<Job>> {
        let conn = self.get_connection()?;
        let mut stmt = conn.prepare(
            "SELECT id, input_path, output_path, video_info, settings, status, created_at, started_at, completed_at
             FROM jobs WHERE session_id = ?1"
        )?;

        let jobs = stmt
            .query_map(params![session_id], |row| {
                let video_info_json: String = row.get(3)?;
                let settings_json: String = row.get(4)?;
                let status_json: String = row.get(5)?;

                Ok(Job {
                    id: row.get(0)?,
                    input_path: PathBuf::from(row.get::<_, String>(1)?),
                    output_path: PathBuf::from(row.get::<_, String>(2)?),
                    video_info: serde_json::from_str(&video_info_json).unwrap(),
                    settings: serde_json::from_str(&settings_json).unwrap(),
                    status: serde_json::from_str(&status_json).unwrap(),
                    created_at: row
                        .get::<_, String>(6)?
                        .parse::<chrono::DateTime<chrono::Utc>>()
                        .unwrap(),
                    started_at: row
                        .get::<_, Option<String>>(7)?
                        .and_then(|s| s.parse::<chrono::DateTime<chrono::Utc>>().ok()),
                    completed_at: row
                        .get::<_, Option<String>>(8)?
                        .and_then(|s| s.parse::<chrono::DateTime<chrono::Utc>>().ok()),
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(jobs)
    }

    /// Get the most recent session
    pub fn get_latest_session(&self) -> Result<Option<Session>> {
        let conn = self.get_connection()?;
        let mut stmt = conn.prepare(
            "SELECT id, name, created_at, updated_at FROM sessions ORDER BY updated_at DESC LIMIT 1"
        )?;

        let mut rows = stmt.query([])?;

        if let Some(row) = rows.next()? {
            Ok(Some(Session {
                id: row.get(0)?,
                name: row.get(1)?,
                created_at: row
                    .get::<_, String>(2)?
                    .parse::<chrono::DateTime<chrono::Utc>>()
                    .unwrap(),
                updated_at: row
                    .get::<_, String>(3)?
                    .parse::<chrono::DateTime<chrono::Utc>>()
                    .unwrap(),
            }))
        } else {
            Ok(None)
        }
    }
}
