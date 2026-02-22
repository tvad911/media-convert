import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import { downloadDir } from "@tauri-apps/api/path";
import Header from "./components/Header";
import FileList from "./components/FileList";
import SettingsPanel from "./components/SettingsPanel";
import StatsPanel from "./components/StatsPanel";
import { AboutModal } from "./components/AboutModal";
import { usePersistentState } from "./hooks/usePersistentState";
import "./index.css";

export interface VideoInfo {
  path: string;
  duration: number;
  width: number;
  height: number;
  bitrate: number;
  codec: string;
  fps: number;
  size: number;
  audio_codec?: string;
  audio_bitrate?: number;
}

export interface EncodingSettings {
  output_format: string;
  video_codec: string;
  audio_codec: string;
  resolution?: [number, number];
  bitrate?: number;
  crf?: number;
  preset: string;
  use_hardware: boolean;
  remove_metadata: boolean;
  custom_metadata?: [string, string][];
}

export interface Job {
  id: string;
  input_path: string;
  output_path: string;
  video_info: VideoInfo;
  settings: EncodingSettings;
  status: JobStatus;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export type JobStatus =
  | "Pending"
  | { Processing: { progress: number } }
  | { Completed: { output_path: string } }
  | { Failed: { error: string } }
  | "Paused"
  | "Cancelled";

export interface SystemInfo {
  ffmpeg_available: boolean;
  ffprobe_available: boolean;
  hardware_encoders: string[];
  max_concurrent_jobs: number;
  cpu_cores: number;
}

export interface QueueStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled: number;
}

function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [stats, setStats] = useState<QueueStats | null>(null);

  // Persistent states - saved across app restarts
  const [settings, setSettings] = usePersistentState<EncodingSettings>("encodingSettings", {
    output_format: "mp4",
    video_codec: "libx264",
    audio_codec: "aac",
    crf: 23,
    preset: "medium",
    use_hardware: true,
    remove_metadata: false,
  });
  const [outputDir, setOutputDir] = usePersistentState<string>("outputDir", "");
  const [shouldShutdown, setShouldShutdown] = usePersistentState<boolean>("shouldShutdown", false);
  const [concurrentJobs, setConcurrentJobs] = usePersistentState<number>("concurrentJobs", 1);
  const [activeTab, setActiveTab] = usePersistentState<"queue" | "logs">("activeTab", "queue");

  // Non-persistent states
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Load system info
    invoke<SystemInfo>("get_system_info").then((info) => {
      setSystemInfo(info);
      setConcurrentJobs(info.max_concurrent_jobs);
    });

    // Load jobs
    loadJobs();

    // Listen for progress updates
    const unlistenProgress = listen<[string, any]>("encoding-progress", (event) => {
      const [jobId, progress] = event.payload;
      updateJobProgress(jobId, progress.percentage);
    });

    // Listen for status changes
    const unlistenStatus = listen<[string, any]>("job-status-change", (event) => {
      const [jobId, status] = event.payload;
      updateJobStatus(jobId, status);
    });

    // Listen for real-time logs
    const unlistenLogs = listen<string>("ffmpeg-log", (event) => {
      setLogs((prev) => [...prev.slice(-499), event.payload]); // Keep last 500 lines
    });

    // Listen for queue completion
    const unlistenFinished = listen("queue-finished", () => {
      setIsProcessing(false);
    });

    return () => {
      unlistenProgress.then((fn) => fn());
      unlistenStatus.then((fn) => fn());
      unlistenLogs.then((fn) => fn());
      unlistenFinished.then((fn) => fn());
    };
  }, []);

  const handleStop = async () => {
    try {
      await invoke("pause_queue");
      setIsProcessing(false);
    } catch (error) {
      console.error("Failed to stop queue:", error);
    }
  };

  useEffect(() => {
    // Update stats whenever jobs change
    updateStats();
  }, [jobs]);

  const handleConcurrentJobsChange = async (count: number) => {
    setConcurrentJobs(count);
    try {
      await invoke("set_max_concurrent_jobs", { count });
    } catch (error) {
      console.error("Failed to set concurrent jobs:", error);
    }
  };

  const loadJobs = async () => {
    try {
      const loadedJobs = await invoke<Job[]>("get_jobs");
      setJobs(loadedJobs);
    } catch (error) {
      console.error("Failed to load jobs:", error);
    }
  };

  const updateStats = async () => {
    try {
      const queueStats = await invoke<QueueStats>("get_queue_stats");
      setStats(queueStats);
    } catch (error) {
      console.error("Failed to update stats:", error);
    }
  };

  const updateJobProgress = (jobId: string, progress: number) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId
          ? { ...job, status: { Processing: { progress } } }
          : job
      )
    );
  };

  const updateJobStatus = (jobId: string, status: any) => {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId
          ? { ...job, status: status }
          : job
      )
    );
    // Also update stats when status changes
    updateStats();
  };

  const handleAddFiles = async () => {
    try {
      console.log("Opening file dialog...");
      const selected = await open({
        multiple: true,
        filters: [
          {
            name: "Video Files",
            extensions: ["mp4", "mkv", "avi", "mov", "wmv", "flv", "webm", "m4v"],
          },
        ],
      });

      console.log("Selected files:", selected);

      if (selected && Array.isArray(selected)) {
        // Handle both string[] (Tauri v2) and object[] (Tauri v1/Backwards compat)
        const paths = selected.map((file: any) => {
          if (typeof file === "string") return file;
          return file.path;
        });

        let output = outputDir;
        if (!output) {
          try {
            output = await downloadDir();
            setOutputDir(output);
          } catch (e) {
            console.error("Failed to get default content dir", e);
            // If fallback fails, then we might need to ask, but usually this works.
            output = (await selectOutputDir()) || "";
          }
        }

        if (output) {
          console.log("Adding files:", paths);
          console.log("Output dir:", output);
          console.log("Settings:", settings);

          const newJobs = await invoke<Job[]>("add_files", {
            paths,
            outputDir: output,
            settings,
          });

          console.log("New jobs created:", newJobs);
          setJobs((prev) => [...prev, ...newJobs]);
        }
      } else if (selected && typeof selected === "string") {
        // Single file selected
        const paths = [selected];

        let output = outputDir;
        if (!output) {
          try {
            output = await downloadDir();
            setOutputDir(output);
          } catch (e) {
            console.error("Failed to get default content dir", e);
            output = (await selectOutputDir()) || "";
          }
        }

        if (output) {
          console.log("Adding file:", paths);
          const newJobs = await invoke<Job[]>("add_files", {
            paths,
            outputDir: output,
            settings,
          });
          setJobs((prev) => [...prev, ...newJobs]);
        }
      }
    } catch (error) {
      console.error("Failed to add files:", error);
      alert(`Error adding files: ${error}`);
    }
  };

  const handleAddDirectory = async () => {
    try {
      console.log("Opening directory dialog...");
      const selected = await open({
        directory: true,
      });

      console.log("Selected directory:", selected);

      if (selected) {
        const dirPath = selected;
        const output = outputDir || (await selectOutputDir());

        if (output) {
          console.log("Adding directory:", dirPath);
          console.log("Output dir:", output);

          const newJobs = await invoke<Job[]>("add_directory", {
            dirPath,
            outputDir: output,
            settings,
            recursive: true,
          });

          console.log("New jobs created:", newJobs);
          setJobs((prev) => [...prev, ...newJobs]);
        }
      }
    } catch (error) {
      console.error("Failed to add directory:", error);
      alert(`Error adding directory: ${error}`);
    }
  };

  const selectOutputDir = async (): Promise<string | null> => {
    try {
      console.log("Opening output directory dialog...");
      const selected = await open({
        directory: true,
        title: "Select Output Directory",
      });

      console.log("Selected output directory:", selected);

      if (selected) {
        const path = selected;
        setOutputDir(path);
        return path;
      }
      return null;
    } catch (error) {
      console.error("Failed to select output directory:", error);
      return null;
    }
  };



  const handleStartProcessing = async () => {
    try {
      setIsProcessing(true);
      await invoke("start_processing", { shouldShutdown });
    } catch (error) {
      console.error("Failed to start processing:", error);
      setIsProcessing(false);
    }
  };


  const handleClearCompleted = async () => {
    const completedIds = jobs
      .filter((job) => typeof job.status !== "string" && "Completed" in job.status)
      .map((job) => job.id);

    for (const id of completedIds) {
      try {
        await invoke("remove_job", { id });
      } catch (error) {
        console.error("Failed to remove job:", error);
      }
    }

    await loadJobs();
  };

  const handleRemoveJob = async (id: string) => {
    try {
      await invoke("remove_job", { id });
      await loadJobs();
    } catch (error) {
      console.error("Failed to remove job:", error);
    }
  };

  const handleCancelJob = async (id: string) => {
    try {
      await invoke("cancel_job", { id });
      await loadJobs();
    } catch (error) {
      console.error("Failed to cancel job:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        onAddFiles={handleAddFiles}
        onAddDirectory={handleAddDirectory}
        onStartProcessing={handleStartProcessing}
        onPause={handleStop}
        onOpenAbout={() => setIsAboutOpen(true)}

        onClearCompleted={handleClearCompleted}
        isProcessing={isProcessing}
        systemInfo={systemInfo}
      />

      <div className="flex-1 container mx-auto px-4 py-6 flex gap-6 overflow-hidden">
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          <StatsPanel stats={stats} />

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab("queue")}
              className={`px-6 py-2 font-medium transition-colors ${activeTab === "queue"
                ? "text-primary-400 border-b-2 border-primary-400"
                : "text-gray-400 hover:text-gray-200"
                }`}
            >
              File Queue
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`px-6 py-2 font-medium transition-colors ${activeTab === "logs"
                ? "text-primary-400 border-b-2 border-primary-400"
                : "text-gray-400 hover:text-gray-200"
                }`}
            >
              FFmpeg Logs
            </button>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            {activeTab === "queue" ? (
              <FileList
                jobs={jobs}
                onRemoveJob={handleRemoveJob}
                onCancelJob={handleCancelJob}
              />
            ) : (
              <div className="card flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    FFmpeg Output
                  </h2>
                  <button
                    onClick={() => setLogs([])}
                    className="text-xs btn btn-secondary !py-1"
                  >
                    Clear Logs
                  </button>
                </div>
                <div className="flex-1 bg-black/50 rounded-lg p-4 font-mono text-xs overflow-auto text-gray-300">
                  {logs.length === 0 ? (
                    <div className="text-gray-600 italic">No logs generated yet. Start processing to see output.</div>
                  ) : (
                    logs.map((log, i) => <div key={i} className="whitespace-pre-wrap mb-1">{log}</div>)
                  )}
                  <div id="logs-end"></div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="w-96 flex flex-col gap-6">
          <SettingsPanel
            settings={settings}
            onSettingsChange={setSettings}
            outputDir={outputDir}
            onOutputDirChange={selectOutputDir}
            systemInfo={systemInfo}
            shouldShutdown={shouldShutdown}
            onShouldShutdownChange={setShouldShutdown}
            concurrentJobs={concurrentJobs}
            onConcurrentJobsChange={handleConcurrentJobsChange}
          />
        </div>
      </div>
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}

export default App;
