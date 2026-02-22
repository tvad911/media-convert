import { useState, useEffect } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { check } from "@tauri-apps/plugin-updater";
import { ask, message } from "@tauri-apps/plugin-dialog";
import { relaunch } from "@tauri-apps/plugin-process";

interface AboutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
    const [appVersion, setAppVersion] = useState<string>("");
    const [checking, setChecking] = useState(false);
    const [updateStatus, setUpdateStatus] = useState<string>("");

    useEffect(() => {
        getVersion().then(setAppVersion);
    }, []);

    const checkForUpdates = async () => {
        setChecking(true);
        setUpdateStatus("Checking for updates...");

        try {
            const update = await check();

            if (update === null) {
                setUpdateStatus("You are on the latest version.");
                setChecking(false);
                return;
            }

            if (update.available) {
                setUpdateStatus(`Update available: v${update.version}`);

                const shouldUpdate = await ask(
                    `Update to v${update.version}?\n\n${update.body}`,
                    { title: "Update Available", kind: "info" }
                );

                if (shouldUpdate) {
                    setUpdateStatus("Downloading & installing update...");
                    await update.downloadAndInstall();

                    setUpdateStatus("Update installed. Restarting...");
                    await relaunch();
                } else {
                    setUpdateStatus("Update cancelled.");
                }
            } else {
                setUpdateStatus("You are on the latest version.");
            }
        } catch (error) {
            console.error(error);
            setUpdateStatus("Error checking for updates.");
            await message(String(error), { title: "Update Error", kind: "error" });
        } finally {
            setChecking(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-96 rounded-xl border border-white/10 bg-gray-900 p-6 shadow-2xl">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">About</h2>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1 text-gray-400 hover:bg-white/10 hover:text-white"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="flex flex-col items-center justify-center p-4">
                        <img src="/icons/128x128.png" alt="Logo" className="mb-4 h-16 w-16" />
                        <h3 className="text-lg font-semibold text-white">Rust Video Converter</h3>
                        <p className="text-sm text-gray-400">Version: {appVersion}</p>
                    </div>

                    <div className="rounded-lg bg-gray-800 p-3 text-center text-sm">
                        {updateStatus || "Click check for updates to see if a new version is available."}
                    </div>

                    <button
                        onClick={checkForUpdates}
                        disabled={checking}
                        className="w-full rounded-lg bg-blue-600 py-2 font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                    >
                        {checking ? "Checking..." : "Check for Updates"}
                    </button>

                    <div className="mt-4 text-center text-xs text-gray-500">
                        © 2024 Anh Duong. All rights reserved.
                    </div>
                </div>
            </div>
        </div>
    );
}
