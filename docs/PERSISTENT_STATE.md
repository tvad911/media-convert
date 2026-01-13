# Persistent State Management

## Tính năng mới: Lưu trạng thái tự động

Ứng dụng giờ đây **tự động lưu** các cài đặt và trạng thái giao diện của bạn. Khi bạn đóng và mở lại ứng dụng, mọi thứ sẽ được khôi phục như cũ.

### Các trạng thái được lưu tự động:

#### 1. **Encoding Settings (Cài đặt mã hóa)**
- Output Format (mp4, mkv, webm, v.v.)
- Video Codec (libx264, libx265, v.v.)
- Audio Codec (aac, mp3, opus, v.v.)
- Resolution (1080p, 720p, v.v.)
- Quality (CRF hoặc Bitrate)
- Preset (ultrafast, medium, slow, v.v.)
- Hardware Acceleration (bật/tắt)
- Remove Metadata (bật/tắt)

#### 2. **Output Directory (Thư mục đầu ra)**
- Thư mục bạn đã chọn để lưu file sau khi convert

#### 3. **Performance Settings (Cài đặt hiệu suất)**
- Max Concurrent Jobs (số video xử lý cùng lúc)

#### 4. **System Automation (Tự động hóa hệ thống)**
- Shutdown when finished (tắt máy khi hoàn thành)

#### 5. **UI State (Trạng thái giao diện)**
- Active Tab (Queue hoặc Logs)

### Cách hoạt động:

- **Tự động**: Không cần nhấn nút "Save" hay "Apply". Mọi thay đổi được lưu ngay lập tức.
- **Persistent**: Dữ liệu được lưu vào file `settings.json` trong thư mục cấu hình của ứng dụng.
- **Cross-session**: Cài đặt được giữ nguyên qua các lần khởi động lại ứng dụng.

### Vị trí file lưu trữ:

**Linux/macOS:**
```
~/.local/share/rust-video-converter/settings.json
```

**Windows:**
```
%APPDATA%\rust-video-converter\settings.json
```

### Reset về mặc định:

Nếu bạn muốn reset tất cả cài đặt về mặc định, chỉ cần xóa file `settings.json` và khởi động lại ứng dụng.

### Technical Details:

Tính năng này sử dụng:
- **Frontend**: Custom React hook `usePersistentState`
- **Backend**: Tauri Store Plugin
- **Storage**: JSON file với key-value pairs
- **Auto-save**: Mỗi khi state thay đổi, tự động ghi vào disk

### Lợi ích:

✅ Không mất cài đặt khi đóng ứng dụng  
✅ Không cần cấu hình lại mỗi lần mở app  
✅ Tiết kiệm thời gian cho người dùng thường xuyên  
✅ Trải nghiệm người dùng mượt mà hơn  

---

**Lưu ý**: Queue jobs (danh sách file đang xử lý) KHÔNG được lưu tự động vì chúng là dữ liệu tạm thời. Nếu bạn muốn lưu queue, hãy sử dụng tính năng "Save Session" trong menu.
