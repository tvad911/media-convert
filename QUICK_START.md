# Quick Start Guide - Rust Video Converter

## 🚀 Getting Started

### Prerequisites Check
```bash
# Check if FFmpeg is installed
ffmpeg -version
ffprobe -version

# If not installed:
sudo apt-get update
sudo apt-get install ffmpeg
```

### Running the Application

#### Development Mode (Recommended for first run)
```bash
# Navigate to project directory
cd /home/anhduong/docker/rust/media-convert

# Run the application
npm run tauri dev
```

The application will:
1. Start the Vite development server (React frontend)
2. Compile the Rust backend
3. Launch the application window

**First launch may take 2-5 minutes** as Rust compiles all dependencies.

### Using the Application

#### Step 1: Add Videos
1. Click **"Add Files"** to select individual video files
2. Or click **"Add Folder"** to add all videos from a directory

#### Step 2: Configure Settings (Right Panel)
- **Output Directory**: Where converted files will be saved
- **Output Format**: MP4 (recommended), MKV, AVI, WebM, or MOV
- **Video Codec**: H.264 (best compatibility) or H.265 (better compression)
- **Resolution**: Keep original or downscale to 1080p, 720p, etc.
- **Quality**: Use CRF 23 for balanced quality (lower = better quality)
- **Hardware Acceleration**: Enable if you have NVIDIA/Intel/AMD GPU

#### Step 3: Start Processing
1. Click **"Start"** button in the header
2. Watch real-time progress for each file
3. Completed files will show green status

#### Step 4: Manage Queue
- **Pause**: Temporarily stop processing
- **Resume**: Continue processing
- **Cancel**: Stop a specific job
- **Clear Completed**: Remove finished jobs from list

## 📊 Understanding the Interface

### Header Bar
- **Add Files**: Select individual video files
- **Add Folder**: Add all videos from a directory
- **Start**: Begin batch conversion
- **Clear Completed**: Remove finished jobs

### Statistics Panel (Top)
Shows queue status:
- **Total**: All jobs in queue
- **Pending**: Waiting to process
- **Processing**: Currently encoding (animated)
- **Completed**: Successfully finished
- **Failed**: Errors occurred

### File List (Center)
Each file shows:
- Video thumbnail icon
- Filename
- Resolution (e.g., 1920x1080)
- Duration (e.g., 02:35)
- File size (e.g., 150.5 MB)
- Codec (e.g., H264)
- Status badge
- Progress bar (when processing)

### Settings Panel (Right)
Configure encoding options:
- Output location
- Format and codecs
- Resolution and quality
- Advanced options

## 🎯 Common Use Cases

### 1. Compress Large Videos
**Goal**: Reduce file size while maintaining quality

**Settings**:
- Output Format: MP4
- Video Codec: H.265 (HEVC)
- Resolution: Original
- Quality: CRF 23-28
- Hardware Acceleration: ON

**Result**: 30-50% smaller files

### 2. Convert for Web
**Goal**: Create web-optimized videos

**Settings**:
- Output Format: WebM or MP4
- Video Codec: VP9 or H.264
- Resolution: 1080p or 720p
- Quality: CRF 23
- Preset: Fast

**Result**: Fast loading, compatible videos

### 3. Downscale 4K to 1080p
**Goal**: Make 4K videos compatible with more devices

**Settings**:
- Output Format: MP4
- Video Codec: H.264
- Resolution: 1080p (1920x1080)
- Quality: CRF 20-23
- Hardware Acceleration: ON

**Result**: Smaller, more compatible files

### 4. Extract Audio Only
**Goal**: Get audio from video files

**Settings**:
- Output Format: MP4
- Video Codec: Copy
- Audio Codec: AAC or MP3
- (Note: Full audio extraction coming in future update)

## ⚡ Performance Tips

### 1. Hardware Acceleration
- **NVIDIA GPU**: Automatically uses NVENC (5-10x faster)
- **Intel CPU**: Uses Quick Sync Video (3-5x faster)
- **AMD GPU**: Uses VAAPI on Linux (2-4x faster)

Check if detected: Look for GPU indicator in header

### 2. Optimal Settings
- **Fast Encoding**: Use "fast" or "veryfast" preset
- **Best Quality**: Use CRF 18-20, "slow" preset
- **Balanced**: Use CRF 23, "medium" preset (default)

### 3. Batch Processing
- The app automatically processes multiple files
- Concurrent jobs = CPU cores / 4
- Example: 8-core CPU = 2 files at once

## 🐛 Troubleshooting

### Application Won't Start
```bash
# Check if all dependencies are installed
npm install

# Reinstall if needed
rm -rf node_modules
npm install
```

### FFmpeg Not Found
```bash
# Install FFmpeg
sudo apt-get install ffmpeg

# Verify installation
which ffmpeg
ffmpeg -version
```

### Compilation Errors
```bash
# Update Rust
rustup update

# Clean and rebuild
cd src-tauri
cargo clean
cargo build
```

### Video Won't Convert
**Check**:
1. Is the input file a valid video?
2. Do you have write permissions to output directory?
3. Is there enough disk space?
4. Check the error message in the file list

### Hardware Acceleration Not Working
```bash
# Check NVIDIA
nvidia-smi

# Check FFmpeg encoders
ffmpeg -encoders | grep nvenc
ffmpeg -encoders | grep vaapi
```

## 📝 Keyboard Shortcuts (Future Feature)
- `Ctrl+O`: Add files
- `Ctrl+Shift+O`: Add folder
- `Ctrl+S`: Save session
- `Space`: Start/Pause
- `Delete`: Remove selected job

## 💾 Session Management

### Auto-Save
- Sessions are automatically saved every 30 seconds
- Database location: `~/.local/share/rust-video-converter/sessions.db`

### Manual Save
- Click "Save Session" (future feature)
- Sessions persist between app restarts

### Load Previous Session
- On startup, the app can restore your last session
- All pending jobs will be loaded

## 🎨 UI Features

### Dark Mode
- Beautiful dark gradient background
- Easy on the eyes for long sessions
- Modern glassmorphism design

### Real-time Updates
- Progress bars update every second
- Status changes are instant
- No page refresh needed

### Responsive Layout
- Adapts to window size
- Minimum window: 1200x700
- Recommended: 1400x900 or larger

## 🔄 Workflow Example

**Scenario**: Convert 10 vacation videos for sharing

1. **Add Files**: Click "Add Folder", select vacation folder
2. **Set Output**: Click "Browse", choose destination folder
3. **Configure**:
   - Format: MP4
   - Codec: H.264
   - Resolution: 1080p
   - CRF: 23
   - Hardware: ON
4. **Start**: Click "Start" button
5. **Monitor**: Watch progress in real-time
6. **Complete**: Files saved to output folder

**Time**: ~5 minutes for 10 videos (with hardware acceleration)

## 📚 Next Steps

- Explore different encoding presets
- Try hardware acceleration
- Experiment with quality settings
- Save your favorite configurations (future feature)

## 🆘 Getting Help

If you encounter issues:
1. Check the error message in the app
2. Review this guide
3. Check FFmpeg documentation
4. Create an issue on GitHub

---

**Enjoy converting your videos! 🎬**
