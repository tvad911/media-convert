# Rust Video Converter & Compressor (RVC)

A powerful desktop application for batch video conversion and compression built with Rust and Tauri.

![Rust Video Converter](https://img.shields.io/badge/Rust-Video_Converter-orange?style=for-the-badge&logo=rust)
![Tauri](https://img.shields.io/badge/Tauri-2.0-blue?style=for-the-badge&logo=tauri)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)

## Features

✨ **Core Features**
- 🎬 Batch video conversion and compression
- 🚀 Hardware acceleration support (NVENC, VAAPI, QSV)
- 📊 Real-time progress tracking with ETA
- 🎯 Smart bitrate and resolution optimization
- 💾 Session management (save and restore work)
- 🎨 Modern, beautiful UI with dark mode

🛠️ **Advanced Features**
- Multiple output formats (MP4, MKV, AVI, WebM, MOV)
- Various video codecs (H.264, H.265, VP9, AV1)
- Quality control (CRF or custom bitrate)
- Resolution presets (4K, 1080p, 720p, 480p)
- Encoding presets (ultrafast to veryslow)
- Metadata handling (preserve or remove)
- Concurrent job processing
- Queue management (pause, resume, cancel)
- **🔄 Persistent state** - Settings automatically saved across sessions

📖 **Documentation**
- See [Persistent State Guide](docs/PERSISTENT_STATE.md) for details on auto-save features


## Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04+ (Windows support coming soon)
- **RAM**: 4GB minimum, 8GB recommended
- **Disk**: Sufficient space for input and output videos

### Required Software

1. **FFmpeg and FFprobe**
   ```bash
   sudo apt-get update
   sudo apt-get install ffmpeg
   ```

2. **Rust** (if building from source)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

3. **Node.js** (v20+)
   ```bash
   # Using nvm
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 20
   ```

4. **Tauri Dependencies** (Ubuntu/Debian)
   ```bash
   sudo apt-get install libwebkit2gtk-4.1-dev \
     build-essential \
     curl \
     wget \
     file \
     libssl-dev \
     libayatana-appindicator3-dev \
     librsvg2-dev
   ```

## Installation

### Option 1: Run from Source

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd media-convert
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm run tauri dev
   ```

### Option 2: Build and Install

1. **Build the application**
   ```bash
   npm run tauri build
   ```

2. **Install the generated package**
   ```bash
   # For Debian/Ubuntu (.deb)
   sudo dpkg -i src-tauri/target/release/bundle/deb/*.deb

   # Or use the AppImage
   chmod +x src-tauri/target/release/bundle/appimage/*.AppImage
   ./src-tauri/target/release/bundle/appimage/*.AppImage
   ```

## Usage

### Quick Start

1. **Launch the application**
   - Run from terminal: `npm run tauri dev`
   - Or launch the installed app from your applications menu

2. **Add videos**
   - Click "Add Files" to select individual video files
   - Click "Add Folder" to add all videos from a directory

3. **Configure settings**
   - Choose output format and codecs
   - Select resolution and quality settings
   - Enable hardware acceleration if available
   - Set output directory

4. **Start processing**
   - Click "Start" to begin batch conversion
   - Monitor progress in real-time
   - Completed files will be saved to the output directory

### Settings Guide

#### Output Format
- **MP4**: Most compatible, good for web and devices
- **MKV**: Supports more features, larger file sizes
- **WebM**: Optimized for web streaming
- **AVI**: Legacy format, widely supported
- **MOV**: Apple's format, good for editing

#### Video Codecs
- **H.264 (libx264)**: Best compatibility, good quality
- **H.265 (libx265)**: Better compression, newer devices
- **VP9**: Open-source, good for web
- **AV1**: Next-gen codec, best compression (slow)

#### Quality Control
- **CRF (Constant Rate Factor)**: 
  - 0-17: Visually lossless
  - 18-23: High quality (recommended)
  - 24-28: Medium quality
  - 29+: Low quality
  
- **Custom Bitrate**: 
  - 1080p: 5000-8000 kbps
  - 720p: 2500-5000 kbps
  - 480p: 1000-2500 kbps

#### Encoding Presets
- **Ultrafast**: Fastest encoding, largest files
- **Fast/Medium**: Balanced speed and size
- **Slow/Slower**: Better compression, slower encoding
- **Veryslow**: Best compression, very slow

### Hardware Acceleration

The app automatically detects available hardware encoders:

- **NVIDIA (NVENC)**: Requires NVIDIA GPU with NVENC support
- **Intel (QSV)**: Requires Intel CPU with Quick Sync Video
- **AMD/Intel (VAAPI)**: Linux-specific hardware acceleration

Enable "Use Hardware Acceleration" in settings to use GPU encoding (much faster).

## Architecture

### Backend (Rust)
```
src-tauri/src/
├── main.rs          # Entry point
├── lib.rs           # Tauri commands and state
├── probe.rs         # Video metadata extraction
├── encoder.rs       # FFmpeg encoding logic
├── queue.rs         # Job queue management
├── session.rs       # SQLite session storage
└── utils.rs         # Helper functions
```

### Frontend (React + TypeScript)
```
src/
├── App.tsx                    # Main application
├── components/
│   ├── Header.tsx            # App header with actions
│   ├── FileList.tsx          # Job queue display
│   ├── SettingsPanel.tsx     # Encoding settings
│   └── StatsPanel.tsx        # Queue statistics
└── index.css                 # Tailwind CSS styles
```

## Performance Tips

1. **Hardware Acceleration**: Always enable if available (5-10x faster)
2. **Concurrent Jobs**: Automatically set to CPU cores / 4
3. **Preset Selection**: Use "fast" or "medium" for most cases
4. **Resolution**: Don't upscale videos (app prevents this)
5. **Bitrate**: Let the app use CRF for optimal quality/size ratio

## Troubleshooting

### FFmpeg not found
```bash
# Verify installation
ffmpeg -version
ffprobe -version

# Add to PATH if needed
export PATH=$PATH:/usr/bin
```

### Hardware acceleration not working
```bash
# Check NVIDIA
nvidia-smi

# Check VAAPI
vainfo

# Verify FFmpeg support
ffmpeg -encoders | grep nvenc
ffmpeg -encoders | grep vaapi
```

### Build errors
```bash
# Clean and rebuild
rm -rf node_modules dist src-tauri/target
npm install
npm run tauri build
```

## Development

### Project Structure
- `src/`: React frontend source
- `src-tauri/`: Rust backend source
- `public/`: Static assets
- `dist/`: Built frontend (generated)
- `src-tauri/target/`: Rust build output (generated)

### Available Scripts
```bash
npm run dev          # Run Vite dev server
npm run build        # Build frontend
npm run tauri dev    # Run Tauri in development
npm run tauri build  # Build production app
```

### Adding Features
1. Backend: Add Tauri commands in `src-tauri/src/lib.rs`
2. Frontend: Create React components in `src/components/`
3. State: Update types in `src/App.tsx`

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Credits

- Built with [Tauri](https://tauri.app/)
- Powered by [FFmpeg](https://ffmpeg.org/)
- UI with [React](https://react.dev/) and [Tailwind CSS](https://tailwindcss.com/)

## Support

For issues and questions:
- Create an issue on GitHub
- Check existing documentation
- Review FFmpeg documentation for encoding questions

---

**Made with ❤️ using Rust and Tauri**
