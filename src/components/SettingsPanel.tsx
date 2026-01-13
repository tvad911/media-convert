import { useState, useEffect } from "react";
import { EncodingSettings, SystemInfo } from "../App";

interface SettingsPanelProps {
    settings: EncodingSettings;
    onSettingsChange: (settings: EncodingSettings) => void;
    outputDir: string;
    onOutputDirChange: () => void;
    systemInfo: SystemInfo | null;
    shouldShutdown: boolean;
    onShouldShutdownChange: (val: boolean) => void;
    concurrentJobs: number;
    onConcurrentJobsChange: (val: number) => void;
}

const OUTPUT_FORMATS = ["mp4", "mkv", "avi", "webm", "mov"];
const VIDEO_CODECS = ["libx264", "libx265", "vp9", "av1"];
const AUDIO_CODECS = ["aac", "mp3", "opus", "vorbis", "copy"];
const PRESETS = ["ultrafast", "superfast", "veryfast", "faster", "fast", "medium", "slow", "slower", "veryslow"];
const RESOLUTIONS = [
    { label: "Original", value: null },
    { label: "4K (3840x2160)", value: [3840, 2160] as [number, number] },
    { label: "1080p (1920x1080)", value: [1920, 1080] as [number, number] },
    { label: "720p (1280x720)", value: [1280, 720] as [number, number] },
    { label: "480p (854x480)", value: [854, 480] as [number, number] },
];

export default function SettingsPanel({
    settings,
    onSettingsChange,
    outputDir,
    onOutputDirChange,
    systemInfo,
    shouldShutdown,
    onShouldShutdownChange,
    concurrentJobs,
    onConcurrentJobsChange,
}: SettingsPanelProps) {
    const [useCRF, setUseCRF] = useState(settings.crf !== undefined);

    useEffect(() => {
        if (useCRF && settings.bitrate) {
            onSettingsChange({ ...settings, bitrate: undefined });
        } else if (!useCRF && !settings.crf) {
            onSettingsChange({ ...settings, crf: 23 });
        }
    }, [useCRF]);

    const handleChange = (key: keyof EncodingSettings, value: any) => {
        onSettingsChange({ ...settings, [key]: value });
    };

    return (
        <div className="card sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
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
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                </svg>
                Encoding Settings
            </h2>

            <div className="space-y-4">
                {/* Output Directory */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Output Directory
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={outputDir || "Not selected"}
                            readOnly
                            className="input flex-1 cursor-not-allowed"
                        />
                        <button onClick={onOutputDirChange} className="btn btn-secondary">
                            Browse
                        </button>
                    </div>
                </div>

                {/* Output Format */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Output Format
                    </label>
                    <select
                        value={settings.output_format}
                        onChange={(e) => handleChange("output_format", e.target.value)}
                        className="select"
                    >
                        {OUTPUT_FORMATS.map((format) => (
                            <option key={format} value={format}>
                                {format.toUpperCase()}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Video Codec */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Video Codec
                    </label>
                    <select
                        value={settings.video_codec}
                        onChange={(e) => handleChange("video_codec", e.target.value)}
                        className="select"
                    >
                        {VIDEO_CODECS.map((codec) => (
                            <option key={codec} value={codec}>
                                {codec.toUpperCase()}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Audio Codec */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Audio Codec
                    </label>
                    <select
                        value={settings.audio_codec}
                        onChange={(e) => handleChange("audio_codec", e.target.value)}
                        className="select"
                    >
                        {AUDIO_CODECS.map((codec) => (
                            <option key={codec} value={codec}>
                                {codec.toUpperCase()}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Resolution */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Resolution
                    </label>
                    <select
                        value={
                            settings.resolution
                                ? `${settings.resolution[0]}x${settings.resolution[1]}`
                                : "original"
                        }
                        onChange={(e) => {
                            const value = e.target.value;
                            if (value === "original") {
                                handleChange("resolution", undefined);
                            } else {
                                const res = RESOLUTIONS.find(
                                    (r) => r.value && `${r.value[0]}x${r.value[1]}` === value
                                );
                                if (res && res.value) {
                                    handleChange("resolution", res.value);
                                }
                            }
                        }}
                        className="select"
                    >
                        {RESOLUTIONS.map((res) => (
                            <option
                                key={res.label}
                                value={
                                    res.value ? `${res.value[0]}x${res.value[1]}` : "original"
                                }
                            >
                                {res.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Quality Control */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Quality Control
                    </label>
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                checked={useCRF}
                                onChange={() => setUseCRF(true)}
                                className="w-4 h-4 text-primary-500"
                            />
                            <span className="text-sm text-gray-300">Use CRF (Constant Rate Factor)</span>
                        </label>

                        {useCRF && (
                            <div className="ml-6">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm text-gray-400">CRF Value:</span>
                                    <span className="text-sm font-medium text-primary-400">
                                        {settings.crf || 23}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="51"
                                    value={settings.crf || 23}
                                    onChange={(e) =>
                                        handleChange("crf", parseInt(e.target.value))
                                    }
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>Best Quality (0)</span>
                                    <span>Worst Quality (51)</span>
                                </div>
                            </div>
                        )}

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                checked={!useCRF}
                                onChange={() => setUseCRF(false)}
                                className="w-4 h-4 text-primary-500"
                            />
                            <span className="text-sm text-gray-300">Use Custom Bitrate</span>
                        </label>

                        {!useCRF && (
                            <div className="ml-6">
                                <input
                                    type="number"
                                    value={settings.bitrate ? settings.bitrate / 1000 : ""}
                                    onChange={(e) =>
                                        handleChange("bitrate", parseInt(e.target.value) * 1000)
                                    }
                                    placeholder="e.g., 5000"
                                    className="input"
                                />
                                <p className="text-xs text-gray-500 mt-1">Bitrate in kbps</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Preset */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Encoding Preset
                    </label>
                    <select
                        value={settings.preset}
                        onChange={(e) => handleChange("preset", e.target.value)}
                        className="select"
                    >
                        {PRESETS.map((preset) => (
                            <option key={preset} value={preset}>
                                {preset.charAt(0).toUpperCase() + preset.slice(1)}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                        Faster presets = quicker encoding, larger files
                    </p>
                </div>

                {/* Hardware & Performance */}
                <div className="border-t border-gray-700 pt-4 mt-4">
                    <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Performance & Hardware
                    </h3>

                    <div className="space-y-4">
                        {/* Hardware Accel Toggle */}
                        <div>
                            <label className="flex items-center justify-between cursor-pointer group">
                                <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                                    Hardware Acceleration
                                </span>
                                <input
                                    type="checkbox"
                                    checked={settings.use_hardware}
                                    onChange={(e) => handleChange("use_hardware", e.target.checked)}
                                    className="w-4 h-4 text-primary-500 rounded"
                                />
                            </label>
                            {systemInfo && systemInfo.hardware_encoders.length > 0 && (
                                <div className="mt-2 p-2 bg-primary-500/5 border border-primary-500/20 rounded text-[10px] text-primary-400/80 italic">
                                    Detected: {systemInfo.hardware_encoders.join(", ")}
                                </div>
                            )}
                        </div>

                        {/* Concurrent Jobs */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-gray-300">
                                    Max Concurrent Jobs
                                </label>
                                <span className="text-xs font-bold text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded">
                                    {concurrentJobs}
                                </span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max={systemInfo?.cpu_cores || 8}
                                value={concurrentJobs}
                                onChange={(e) => onConcurrentJobsChange(parseInt(e.target.value))}
                                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                            />
                            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                                <span>1 Job</span>
                                <span>{systemInfo?.cpu_cores || 8} Cores</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Metadata */}
                <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.remove_metadata}
                            onChange={(e) =>
                                handleChange("remove_metadata", e.target.checked)
                            }
                            className="w-4 h-4 text-primary-500 rounded"
                        />
                        <span className="text-sm font-medium text-gray-300">
                            Remove Metadata
                        </span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                        Strip all metadata from output files
                    </p>
                </div>

                <div className="border-t border-gray-700 pt-4 mt-4">
                    <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">System Automation</h3>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={shouldShutdown}
                            onChange={(e) => onShouldShutdownChange(e.target.checked)}
                            className="w-4 h-4 text-red-500 rounded"
                        />
                        <span className="text-sm font-medium text-gray-300">
                            Shutdown when finished
                        </span>
                    </label>
                    <p className="text-[10px] text-red-500/70 mt-1">
                        Warning: This will execute 'shutdown -h now' after all jobs complete.
                    </p>
                </div>
            </div>
        </div>
    );
}
