import { useState } from "react";
import { Job, JobStatus } from "../App";

interface FileListProps {
    jobs: Job[];
    onRemoveJob: (id: string) => void;
    onCancelJob: (id: string) => void;
}

// ... formatting functions (unchanged)

type FilterStatus = "All" | "Pending" | "Processing" | "Completed" | "Failed";

export default function FileList({
    jobs,
    onRemoveJob,
    onCancelJob,
}: FileListProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [filter, setFilter] = useState<FilterStatus>("All");
    const itemsPerPage = 7;

    if (jobs.length === 0) {
        return (
            <div className="card flex-1 flex items-center justify-center">
                <div className="text-center text-gray-400">
                    <svg className="w-24 h-24 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <p className="text-lg font-medium mb-2">No files added yet</p>
                    <p className="text-sm">Click "Add Files" or "Add Folder" to get started</p>
                </div>
            </div>
        );
    }

    const filteredJobs = jobs.filter(job => {
        if (filter === "All") return true;
        if (typeof job.status === "string") return job.status === filter;
        return filter in job.status;
    });

    const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
    const paginatedJobs = filteredJobs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const getFilterCount = (status: FilterStatus) => {
        if (status === "All") return jobs.length;
        return jobs.filter(job => {
            if (typeof job.status === "string") return job.status === status;
            return status in job.status;
        }).length;
    };

    const filters: FilterStatus[] = ["All", "Pending", "Processing", "Completed", "Failed"];

    return (
        <div className="card flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    File Queue
                </h2>
                <div className="flex gap-1 p-1 bg-black/20 rounded-lg">
                    {filters.map(f => {
                        const count = getFilterCount(f);
                        if (count === 0 && f !== "All" && filter !== f) return null;
                        return (
                            <button
                                key={f}
                                onClick={() => { setFilter(f); setCurrentPage(1); }}
                                className={`flex items-center gap-2 py-1 px-2.5 rounded-md text-[10px] font-medium transition-all ${filter === f
                                        ? "bg-primary-500/20 text-primary-400 shadow-sm"
                                        : "text-gray-500 hover:text-gray-300 hover:bg-gray-700/30"
                                    }`}
                            >
                                {f}
                                <span className={`px-1 rounded-full ${filter === f ? "bg-primary-500/30" : "bg-gray-700"
                                    }`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex-1 overflow-auto pr-2">
                {filteredJobs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 italic">
                        No items found with "{filter}" status
                    </div>
                ) : (
                    <div className="space-y-2">
                        {paginatedJobs.map((job) => {
                            const statusInfo = getStatusInfo(job.status);
                            const fileName = getFileName(job.input_path);
                            return (
                                <div key={job.id} className="bg-gray-700/20 rounded-lg px-3 py-2 border border-gray-600/30 hover:border-gray-500/50 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 bg-gray-600/50 rounded flex items-center justify-center">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-sm font-medium text-white truncate">{fileName}</h3>
                                                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                                        <span>{job.video_info.width}x{job.video_info.height}</span>
                                                        <span>{formatDuration(job.video_info.duration)}</span>
                                                        <span>{formatFileSize(job.video_info.size)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`status-badge text-[10px] py-0.5 px-2 ${statusInfo.className}`}>
                                                        {statusInfo.label}
                                                    </span>
                                                    {typeof job.status !== "string" && "Processing" in job.status && (
                                                        <button onClick={() => onCancelJob(job.id)} className="p-1 hover:bg-gray-600 rounded transition-colors" title="Cancel">
                                                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                    {((typeof job.status !== "string" && ("Completed" in job.status || "Failed" in job.status)) || job.status === "Cancelled") && (
                                                        <button onClick={() => onRemoveJob(job.id)} className="p-1 hover:bg-gray-600 rounded transition-colors" title="Remove">
                                                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            {statusInfo.progress !== undefined && (
                                                <div className="mt-1">
                                                    <div className="progress-bar h-1">
                                                        <div className="progress-fill" style={{ width: `${statusInfo.progress}%` }} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between border-t border-gray-700 pt-3">
                    <span className="text-xs text-gray-500">
                        Page {currentPage} of {totalPages}
                    </span>
                    <div className="flex gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((p) => p - 1)}
                            className="p-1 btn btn-secondary !py-1 !px-2 text-xs"
                        >
                            Previous
                        </button>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((p) => p + 1)}
                            className="p-1 btn btn-secondary !py-1 !px-2 text-xs"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ... formatting helpers need code back
function formatFileSize(bytes: number): string {
    const units = ["B", "KB", "MB", "GB", "TB"];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
}

function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function getStatusInfo(status: JobStatus): {
    label: string;
    className: string;
    progress?: number;
} {
    if (typeof status === "string") {
        if (status === "Pending") return { label: "Pending", className: "status-pending" };
        if (status === "Paused") return { label: "Paused", className: "status-paused" };
        if (status === "Cancelled") return { label: "Cancelled", className: "status-badge bg-gray-600" };
        return { label: status, className: "status-badge" };
    }
    if ("Processing" in status) return { label: "Processing", className: "status-processing", progress: status.Processing.progress };
    if ("Completed" in status) return { label: "Completed", className: "status-completed" };
    if ("Failed" in status) return { label: "Failed", className: "status-failed" };
    return { label: "Unknown", className: "status-badge" };
}

function getFileName(path: string): string {
    return path.split("/").pop() || path.split("\\").pop() || path;
}
