# Status Update - 28/12/2025

## ✅ Các vấn đề đã xử lý

### 1. Fix màu sắc Dropdown
- Đã cập nhật `src/index.css` để dùng màu nền `#1f2937` (gray-800) và chữ `#f3f4f6` (gray-100) cho dropdown và options.
- Đã thêm custom arrow SVG để đảm bảo hiển thị đẹp trên mọi trình duyệt.
- Đã xử lý trạng thái disabled.

### 2. Fix nút "Add Files" và "Add Folder"
- **Nguyên nhân chính:** Thiếu quyền `dialog:default` và `fs:default` trong cấu hình Tauri v2 (`src-tauri/capabilities/default.json`).
- **Đã khắc phục:**
  1. Thêm các quyền cần thiết vào `src-tauri/capabilities/default.json`.
  2. Cập nhật `src/App.tsx` để xử lý linh hoạt cả 2 trường hợp trả về của dialog (string hoặc object), đảm bảo tương thích đa nền tảng.
  3. Thêm logging chi tiết để dễ dàng debug nếu có lỗi phát sinh.

## 🚀 Hướng dẫn kiểm tra lại

1. **Khởi động lại ứng dụng:**
   Do đã thay đổi cấu hình capabilities, bạn nên restart server dev:
   ```bash
   Ctrl+C (để tắt server hiện tại)
   npm run tauri dev
   ```

2. **Kiểm tra Dropdown:**
   - Click vào dropdown Format hoặc Codec.
   - Màu nền phải là màu tối, chữ màu sáng, dễ đọc.
   - Khi hover vào options, màu phải thay đổi hợp lý.

3. **Kiểm tra nút Add Files:**
   - Click nút "Add Files".
   - Dialog chọn file phải hiện ra.
   - Chọn 1 hoặc nhiều file -> Files phải hiện trong danh sách.
   - Kiểm tra console (F12) để xem logs.

Nếu vẫn gặp lỗi, vui lòng copy logs từ Console (F12) gửi lại để mình kiểm tra thêm.
