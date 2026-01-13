// Debug Helper - Paste this into Browser Console

console.log("=== Rust Video Converter Debug Helper ===");

// Test if Tauri is available
if (window.__TAURI__) {
  console.log("✅ Tauri API is available");
} else {
  console.error("❌ Tauri API is NOT available");
}

// Test system info
async function testSystemInfo() {
  try {
    const info = await window.__TAURI__.core.invoke('get_system_info');
    console.log("✅ System Info:", info);
    return info;
  } catch (error) {
    console.error("❌ Failed to get system info:", error);
  }
}

// Test file dialog
async function testFileDialog() {
  try {
    console.log("Opening file dialog...");
    const selected = await window.__TAURI__.dialog.open({
      multiple: true,
      filters: [{
        name: "Video Files",
        extensions: ["mp4", "mkv", "avi", "mov"]
      }]
    });
    console.log("✅ Selected files:", selected);
    console.log("Type:", typeof selected);
    console.log("Is Array:", Array.isArray(selected));
    return selected;
  } catch (error) {
    console.error("❌ Failed to open dialog:", error);
  }
}

// Test directory dialog
async function testDirectoryDialog() {
  try {
    console.log("Opening directory dialog...");
    const selected = await window.__TAURI__.dialog.open({
      directory: true
    });
    console.log("✅ Selected directory:", selected);
    console.log("Type:", typeof selected);
    return selected;
  } catch (error) {
    console.error("❌ Failed to open directory dialog:", error);
  }
}

// Test probe video
async function testProbeVideo(path) {
  try {
    console.log("Probing video:", path);
    const info = await window.__TAURI__.core.invoke('probe_video_file', { path });
    console.log("✅ Video info:", info);
    return info;
  } catch (error) {
    console.error("❌ Failed to probe video:", error);
  }
}

// Test add files
async function testAddFiles(paths, outputDir) {
  try {
    console.log("Adding files:", paths);
    console.log("Output dir:", outputDir);
    const settings = {
      output_format: "mp4",
      video_codec: "libx264",
      audio_codec: "aac",
      crf: 23,
      preset: "medium",
      use_hardware: true,
      remove_metadata: false
    };
    console.log("Settings:", settings);
    
    const jobs = await window.__TAURI__.core.invoke('add_files', {
      paths,
      outputDir,
      settings
    });
    console.log("✅ Jobs created:", jobs);
    return jobs;
  } catch (error) {
    console.error("❌ Failed to add files:", error);
  }
}

// Run all tests
async function runAllTests() {
  console.log("\n=== Running All Tests ===\n");
  
  console.log("1. Testing System Info...");
  await testSystemInfo();
  
  console.log("\n2. Testing File Dialog...");
  console.log("Click OK to open file dialog");
  // await testFileDialog();
  
  console.log("\n3. Testing Directory Dialog...");
  console.log("Click OK to open directory dialog");
  // await testDirectoryDialog();
  
  console.log("\nTests complete! Check results above.");
  console.log("\nTo test dialogs manually:");
  console.log("  testFileDialog()");
  console.log("  testDirectoryDialog()");
  console.log("\nTo test adding files:");
  console.log("  testAddFiles(['/path/to/video.mp4'], '/path/to/output')");
}

// Export functions to window
window.debugHelper = {
  testSystemInfo,
  testFileDialog,
  testDirectoryDialog,
  testProbeVideo,
  testAddFiles,
  runAllTests
};

console.log("\n=== Available Commands ===");
console.log("debugHelper.testSystemInfo()");
console.log("debugHelper.testFileDialog()");
console.log("debugHelper.testDirectoryDialog()");
console.log("debugHelper.testProbeVideo('/path/to/video.mp4')");
console.log("debugHelper.testAddFiles(['/path/to/video.mp4'], '/output/dir')");
console.log("debugHelper.runAllTests()");
console.log("\n=== Starting Auto Tests ===\n");

// Auto run system info test
testSystemInfo();
