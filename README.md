# Rust Video Converter & Compressor (RVC)

Một ứng dụng máy tính mạnh mẽ để chuyển đổi và nén video hàng loạt, được xây dựng bằng Rust và Tauri.

![Rust Video Converter](https://img.shields.io/badge/Rust-Video_Converter-orange?style=for-the-badge&logo=rust)
![Tauri](https://img.shields.io/badge/Tauri-2.0-blue?style=for-the-badge&logo=tauri)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)

## ✨ Tính năng nổi bật

- 🎬 **Xử lý hàng loạt**: Chuyển đổi và nén nhiều video cùng lúc.
- 🚀 **Tăng tốc phần cứng**: Hỗ trợ NVENC (NVIDIA), QSV (Intel), và VAAPI.
- 📊 **Theo dõi thời gian thực**: Hiển thị tiến độ và thời gian dự kiến hoàn thành (ETA).
- 🎯 **Tối ưu hóa thông minh**: Tự động điều chỉnh bitrate và độ phân giải.
- 💾 **Quản lý phiên làm việc**: Lưu và khôi phục trạng thái làm việc tự động.
- 🎨 **Giao diện hiện đại**: Thiết kế sang trọng với chế độ tối (Dark Mode).

## 🛠️ Tính năng nâng cao

- Hỗ trợ nhiều định dạng: MP4, MKV, AVI, WebM, MOV.
- Đa dạng codec video: H.264 (AVC), H.265 (HEVC), VP9, AV1.
- Kiểm soát chất lượng: Sử dụng CRF hoặc tùy chỉnh bitrate.
- Cài đặt độ phân giải: 4K, 1080p, 720p, 480p.
- Thiết lập mã hóa: Từ "ultrafast" (siêu nhanh) đến "veryslow" (tối ưu nhất).

## 📋 Yêu cầu hệ thống

### Phần mềm bắt buộc

1. **FFmpeg & FFprobe**: Ứng dụng yêu cầu FFmpeg để xử lý video.
   ```bash
   sudo apt-get update
   sudo apt-get install ffmpeg
   ```

2. **Rust**: (Nếu bạn muốn xây dựng từ mã nguồn)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

3. **Node.js**: Phiên bản v20 trở lên.

## 🚀 Hướng dẫn cài đặt

### Chạy từ mã nguồn

1. **Clone repository**
   ```bash
   git clone git@github.com:tvad911/media-convert.git
   cd media-convert
   ```

2. **Cài đặt các gói phụ thuộc**
   ```bash
   npm install
   ```

3. **Chạy ở chế độ phát triển**
   ```bash
   npm run tauri dev
   ```

### Xây dựng ứng dụng (Build)

1. **Lệnh build**
   ```bash
   npm run tauri build
   ```

2. **Cài đặt gói đã build**
   - File cài đặt sẽ nằm trong thư mục `src-tauri/target/release/bundle/`.
   - Hỗ trợ `.deb`, `AppImage` trên Linux, `.msi` trên Windows, và `.dmg` trên macOS.

## 📖 Hướng dẫn sử dụng

1. **Thêm Video**: Nhấn "Add Files" để chọn file lẻ hoặc "Add Folder" để thêm cả thư mục.
2. **Cấu hình cài đặt**:
   - Chọn định dạng đầu ra (MP4 là khuyên dùng).
   - Chọn Codec (H.264 để tương thích tốt nhất, H.265 để nén tốt nhất).
   - Thiết lập chất lượng (CRF 23 là mức cân bằng).
   - Bật "Hardware Acceleration" nếu máy bạn có GPU hỗ trợ.
3. **Bắt đầu**: Nhấn nút "Start" để tiến hành chuyển đổi.
4. **Theo dõi**: Xem tiến độ trực tiếp trên danh sách file. Files sau khi hoàn thành sẽ nằm trong thư mục đầu ra đã chọn.

## 🛡️ Giấy phép

Dự án này được phát hành dưới giấy phép MIT.

---

**Được phát triển với ❤️ bởi Anh Dương**
