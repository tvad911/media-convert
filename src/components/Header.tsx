import { SystemInfo } from "../App";

interface HeaderProps {
    onAddFiles: () => void;
    onAddDirectory: () => void;
    onStartProcessing: () => void;
    onPause: () => void;

    onClearCompleted: () => void;
    isProcessing: boolean;
    systemInfo: SystemInfo | null;
}

export default function Header({
    onAddFiles,
    onAddDirectory,
    onStartProcessing,
    onPause,

    onClearCompleted,
    isProcessing,
    systemInfo,
}: HeaderProps) {
    return (
        <header className="bg-gray-800/80 backdrop-blur-md border-b border-gray-700/50 sticky top-0 z-50 shadow-xl">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                                <svg
                                    className="w-7 h-7 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
                                    Rust Video Converter
                                </h1>
                                <p className="text-sm text-gray-400">
                                    Batch video conversion & compression
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {systemInfo && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 rounded-lg text-sm">
                                <div className="flex items-center gap-1.5">
                                    <div
                                        className={`w-2 h-2 rounded-full ${systemInfo.ffmpeg_available
                                            ? "bg-green-500 animate-pulse"
                                            : "bg-red-500"
                                            }`}
                                    />
                                    <span className="text-gray-300">FFmpeg</span>
                                </div>
                                {systemInfo.hardware_encoders.length > 0 && (
                                    <div className="flex items-center gap-1.5 ml-3">
                                        <svg
                                            className="w-4 h-4 text-primary-400"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M13 7H7v6h6V7z" />
                                            <path
                                                fillRule="evenodd"
                                                d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        <span className="text-gray-300">GPU</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <button onClick={onAddFiles} className="btn btn-secondary">
                            <svg
                                className="w-5 h-5 inline mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                />
                            </svg>
                            Add Files
                        </button>

                        <button onClick={onAddDirectory} className="btn btn-secondary">
                            <svg
                                className="w-5 h-5 inline mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                                />
                            </svg>
                            Add Folder
                        </button>

                        {isProcessing ? (
                            <button
                                onClick={onPause}
                                className="btn btn-danger"
                            >
                                <svg
                                    className="w-5 h-5 inline mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                Stop
                            </button>
                        ) : (
                            <button
                                onClick={onStartProcessing}
                                className="btn btn-primary"
                            >
                                <svg
                                    className="w-5 h-5 inline mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                Start
                            </button>
                        )}

                        <button onClick={onClearCompleted} className="btn btn-secondary">
                            <svg
                                className="w-5 h-5 inline mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                            </svg>
                            Clear Completed
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
