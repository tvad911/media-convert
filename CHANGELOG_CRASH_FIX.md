# Changelog

## Ngày 28/12/2025 - Fix lỗi Crash & UX

### 1. Fix lỗi "App đóng sau khi chọn Output Folder" ✅

**Nguyên nhân:**
- Code Rust sử dụng `.unwrap()` khi xử lý đường dẫn file (path conversions).
- Khi gặp file có tên chứa ký tự đặc biệt hoặc encode lạ (non-UTF8), Rust backend sẽ panic -> Crash App.
- Hàm `probe_video` và `add_files` thiếu cơ chế xử lý lỗi an toàn.

**Giải pháp đã thực hiện:**
- **`src-tauri/src/probe.rs`**: Thay `unwrap()` bằng `context()` để trả về lỗi thay vì crash.
- **`src-tauri/src/lib.rs` (add_files)**:
  - Thay đổi logic từ "Fail tất cả nếu 1 file lỗi" sang "Skip file lỗi và tiếp tục".
  - Sử dụng `match` để bắt lỗi probe từng file.
- **`src-tauri/src/lib.rs` (add_directory)**:
  - Sử dụng `to_string_lossy()` thay vì `unwrap()` khi quét thư mục, đảm bảo không crash với tên file lạ.

### 2. Cải thiện UX ✅
- Đã sửa màu dropdown (như log trước).
- Đã fix quyền dialog (như log trước).

## Trạng thái hiện tại

Ứng dụng đã ổn định hơn nhiều:
- Không còn crash khi gặp file "xấu".
- Dialog hoạt động trơn tru.
- Text hiển thị rõ ràng.

## Hướng dẫn Test lại lỗi Crash

1. Restart app: `npm run tauri dev`
2. Tạo thử một file có tên chứa ký tự lạ (ví dụ icon, hoặc tiếng Việt có dấu phức tạp).
3. Thử Add File đó -> App sẽ không còn đóng đột ngột, mà có thể chỉ log lỗi trong terminal (hoặc skip file đó).
4. Thử Add Folder chứa nhiều file -> App sẽ load các file hợp lệ và bỏ qua file lỗi.
