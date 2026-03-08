# Hướng Dẫn Cập Nhật Phiên Bản (Auto-Update) qua GitHub Releases

Tài liệu này mô tả cách hoạt động của cơ chế tự động cập nhật trong ứng dụng Tauri và các bước người phát triển cần thực hiện để phát hành một phiên bản mới.

## 1. Cách Hoạt Động (Flow Cập Nhật)

Hệ thống cập nhật (Tauri Updater) kết hợp với GitHub Releases hoạt động qua 4 bước chính:

1.  **Đánh dấu phiên bản (Versioning) & Ghi chú (Changelog):**
    *   Phiên bản ứng dụng được quản lý qua `tauri.conf.json` và `package.json`.
    *   Sử dụng Git tag (VD: `v0.2.1`) để chốt phiên bản mã nguồn cần phát hành.
    *   Nội dung Changelog hiển thị cho người dùng chính là mô tả (Release body) bạn viết khi tạo Release trên GitHub.

2.  **Cơ chế Thông Báo (Notification Mechanism):**
    *   Frontend gọi API `check()` từ `@tauri-apps/plugin-updater`.
    *   Lệnh này tải file `latest.json` từ đường dẫn đã cấu hình: `https://github.com/tvad911/media-convert/releases/latest/download/latest.json`.
    *   Trình Updater so sánh phiên bản hiện hành với phiên bản trong `latest.json`. Nếu có bản mới, frontend sẽ bắt sự kiện và hiển thị thông báo.

3.  **Tải Xuống & Cài Đặt (Download & Install):**
    *   Khi người dùng xác nhận "Cập nhật", hàm `.downloadAndInstall()` được gọi.
    *   File cài đặt (Ví dụ `.msi.zip` hoặc `.AppImage.tar.gz`) được tải về.
    *   **Bảo mật:** Quá trình giải nén yêu cầu chữ ký số. Hệ thống dùng `pubkey` cấu hình ở `tauri.conf.json` để xác minh độ xác thực tệp thiết lập mới. Nếu hợp lệ, tệp cài đặt mới được đè lên tệp hiện tại.
    *   Hàm `relaunch()` được gọi để khởi động lại ứng dụng với phiên bản mới.

4.  **Tích hợp CI/CD (GitHub Actions):**
    *   Toàn bộ quy trình Build, Sign (ký số điện tử), và Upload file cài đặt, cũng như tệp `latest.json` được tự động hóa hoàn toàn bằng GitHub Actions khi bạn đẩy mã nhánh Tag mới lên repo.

---

## 2. Quy Trình Phát Hành Bản Cập Nhật Mới (Manual Steps)

Khi có bản vá lỗi hay cập nhật tính năng, hãy thực hiện lần lượt các bước sau:

### Bước 1: Khai báo phiên bản
Chỉnh sửa tham số Version ở 2 file thành một số nhận diện đồng bộ (ví dụ: `v0.2.1`):
- `package.json`
- `src-tauri/tauri.conf.json`

### Bước 2: Lưu và tải thay đổi mã nguồn
Cập nhật mã nguồn hoàn chỉnh lên kho chứa.
```bash
git add .
git commit -m "feat: release version 0.2.1 - cap nhat tinh nang..."
git push origin main
```

### Bước 3: Tạo điểm rẽ nhánh mốc thời gian (Tag)
Đánh dấu phiên bản v0.2.1 và đẩy tag lên GitHub. Thao tác này kích hoạt CI/CD Github Actions chạy rập khuông ngầm định ở dưới:
```bash
git tag v0.2.1
git push origin v0.2.1
```

### Bước 4: Viết Release Note (Changelog) trên kho lưu trữ
1. Vào tab **Releases** trên repo GitHub của dự án (`https://github.com/tvad911/media-convert/releases`).
2. Sửa thông tin Draft Release gắn với Tag `v0.2.1` vừa tạo. (Nếu Github Action chưa chạy xong có thể chưa thấy, hãy đổi lại sau).
3. Đặt **Release Title** và mô tả chi tiết vào hộp nội dung **Release Description**. Đoạn văn bạn soạn thảo chính là phần văn bản giải thích tính năng tới cho người dùng cập nhật!

### Bước 5: Hoàn tất phát hành
- Sau khi Action chạy xong không gặp lỗi, file cấu hình hạt nhân `latest.json` sẽ tự động sinh và ném vào mục Latest Assets trên trang Github.
- Khách hàng đã có thể nhận thông báo qua phần mềm khi khởi động ứng dụng!
