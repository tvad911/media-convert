# Testing Guide - Rust Video Converter

## Kiểm tra các chức năng

### 1. Kiểm tra System Info
Mở Developer Console (F12 hoặc Ctrl+Shift+I) và kiểm tra:
- FFmpeg có được phát hiện không
- Hardware encoders có được liệt kê không
- CPU cores được hiển thị đúng không

### 2. Kiểm tra nút "Add Files"
1. Click nút "Add Files"
2. Kiểm tra console log: "Opening file dialog..."
3. Chọn một file video
4. Kiểm tra console log: "Selected files:", "Adding files:", "New jobs created:"
5. File phải xuất hiện trong danh sách

**Nếu không hoạt động:**
- Kiểm tra console có lỗi gì không
- Kiểm tra xem dialog có mở không
- Thử chọn file khác định dạng (mp4, mkv, avi)

### 3. Kiểm tra nút "Add Folder"
1. Click nút "Add Folder"
2. Kiểm tra console log: "Opening directory dialog..."
3. Chọn một thư mục có video
4. Kiểm tra console log: "Selected directory:", "Adding directory:", "New jobs created:"
5. Tất cả video trong thư mục phải xuất hiện

**Nếu không hoạt động:**
- Kiểm tra thư mục có chứa video không
- Kiểm tra quyền đọc thư mục
- Xem console có lỗi gì

### 4. Kiểm tra Settings Panel
1. Thay đổi Output Format
2. Thay đổi Video Codec
3. Thay đổi Resolution
4. Thay đổi CRF value
5. Kiểm tra console log settings khi add file

**Các giá trị phải được cập nhật:**
- Output Format: mp4, mkv, avi, webm, mov
- Video Codec: libx264, libx265, vp9, av1
- Resolution: Original, 1080p, 720p, 480p
- CRF: 0-51 (mặc định 23)

### 5. Kiểm tra nút "Start"
1. Add ít nhất 1 file
2. Chọn output directory
3. Click "Start"
4. Kiểm tra:
   - Status chuyển sang "Processing"
   - Progress bar xuất hiện
   - Percentage tăng dần
   - File output được tạo

**Nếu không hoạt động:**
- Kiểm tra FFmpeg có được cài đặt: `ffmpeg -version`
- Kiểm tra output directory có quyền ghi
- Xem console có lỗi từ backend

### 6. Kiểm tra Queue Management
1. Add nhiều file
2. Click "Start"
3. Kiểm tra:
   - Nhiều file xử lý đồng thời (max = CPU cores / 4)
   - Stats panel cập nhật đúng
   - Status của từng file

### 7. Kiểm tra Remove/Cancel
1. Add file
2. Click nút Remove (X) - file phải biến mất
3. Start processing
4. Click Cancel trong khi đang xử lý
5. File phải dừng và status = Cancelled

## Debug Console Commands

Mở Developer Console và chạy các lệnh sau:

```javascript
// Kiểm tra system info
await window.__TAURI__.core.invoke('get_system_info')

// Kiểm tra jobs hiện tại
await window.__TAURI__.core.invoke('get_jobs')

// Kiểm tra queue stats
await window.__TAURI__.core.invoke('get_queue_stats')

// Test probe một file
await window.__TAURI__.core.invoke('probe_video_file', { 
  path: '/path/to/video.mp4' 
})
```

## Các vấn đề thường gặp

### Nút không phản hồi
**Nguyên nhân:**
- Dialog plugin chưa được khởi tạo đúng
- Tauri commands chưa được register
- Frontend chưa kết nối được với backend

**Giải pháp:**
1. Kiểm tra console có lỗi
2. Restart ứng dụng: `npm run tauri dev`
3. Kiểm tra src-tauri/src/lib.rs có register đầy đủ commands

### File không được add vào queue
**Nguyên nhân:**
- FFprobe không thể đọc file
- File không phải video hợp lệ
- Lỗi khi gọi backend

**Giải pháp:**
1. Test file bằng FFprobe: `ffprobe /path/to/video.mp4`
2. Kiểm tra console log
3. Thử file khác

### Processing không bắt đầu
**Nguyên nhân:**
- FFmpeg không được cài đặt
- Output directory không tồn tại hoặc không có quyền ghi
- Settings không hợp lệ

**Giải pháp:**
1. Kiểm tra FFmpeg: `which ffmpeg`
2. Kiểm tra output directory
3. Xem backend logs trong terminal

### Progress không cập nhật
**Nguyên nhân:**
- Event listener không hoạt động
- Backend không emit events
- FFmpeg không output progress

**Giải pháp:**
1. Kiểm tra console có nhận được events
2. Restart ứng dụng
3. Kiểm tra FFmpeg command trong backend

## Checklist hoàn chỉnh

- [ ] System info hiển thị đúng
- [ ] Add Files dialog mở được
- [ ] Add Folder dialog mở được
- [ ] Files xuất hiện trong queue
- [ ] Settings có thể thay đổi
- [ ] Output directory có thể chọn
- [ ] Start button hoạt động
- [ ] Progress bar cập nhật
- [ ] Stats panel cập nhật
- [ ] Remove job hoạt động
- [ ] Cancel job hoạt động
- [ ] Clear completed hoạt động
- [ ] File output được tạo thành công
- [ ] Hardware acceleration được phát hiện (nếu có)

## Logs quan trọng

Khi test, chú ý các log sau trong console:

```
Opening file dialog...
Selected files: [...]
Adding files: [...]
Output dir: /path/to/output
Settings: {...}
New jobs created: [...]
```

Nếu thiếu bất kỳ log nào, có nghĩa là bước đó bị lỗi.

## Performance Testing

### Test với 1 file nhỏ (< 100MB)
- Thời gian: < 1 phút
- CPU usage: Moderate
- Memory: < 500MB

### Test với nhiều file (5-10 files)
- Concurrent jobs: CPU cores / 4
- Tổng thời gian: Tùy thuộc vào kích thước
- Memory: < 1GB

### Test với hardware acceleration
- Encoding speed: 5-10x nhanh hơn
- CPU usage: Thấp hơn
- GPU usage: Cao

## Kết luận

Sau khi test tất cả các chức năng trên, ứng dụng phải:
1. ✅ Mở dialog được
2. ✅ Add files/folders được
3. ✅ Hiển thị danh sách jobs
4. ✅ Start encoding được
5. ✅ Hiển thị progress real-time
6. ✅ Tạo file output thành công
7. ✅ Quản lý queue được

Nếu có bất kỳ chức năng nào không hoạt động, xem lại phần Debug ở trên.
