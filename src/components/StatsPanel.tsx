import { QueueStats } from "../App";

interface StatsPanelProps {
    stats: QueueStats | null;
}

export default function StatsPanel({ stats }: StatsPanelProps) {
    if (!stats) return null;

    const statItems = [
        { label: "Total", value: stats.total, color: "text-gray-300" },
        { label: "Pending", value: stats.pending, color: "text-gray-400" },
        {
            label: "Processing",
            value: stats.processing,
            color: "text-blue-400",
            pulse: true,
        },
        { label: "Completed", value: stats.completed, color: "text-green-400" },
        { label: "Failed", value: stats.failed, color: "text-red-400" },
    ];

    return (
        <div className="card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg
                    className="w-5 h-5 text-primary-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                </svg>
                Queue Statistics
            </h2>

            <div className="grid grid-cols-5 gap-4">
                {statItems.map((item) => (
                    <div
                        key={item.label}
                        className="bg-gray-700/30 rounded-lg p-4 text-center border border-gray-600/30 hover:border-gray-500/50 transition-colors"
                    >
                        <div
                            className={`text-3xl font-bold ${item.color} ${item.pulse ? "animate-pulse" : ""
                                }`}
                        >
                            {item.value}
                        </div>
                        <div className="text-sm text-gray-400 mt-1">{item.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
