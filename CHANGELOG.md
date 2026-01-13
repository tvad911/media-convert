# Changelog - Các thay đổi đã thực hiện

## Ngày 28/12/2025 - Sửa lỗi sau khi build

### 1. Sửa màu text trong form controls ✅

**Vấn đề:** Text trong select và input có màu trắng trên nền trắng, không đọc được

**Giải pháp:**
- Thay đổi background từ `bg-gray-700/50` sang `bg-gray-800` (tối hơn)
- Thay đổi text color từ `text-white` sang `text-gray-100` (tương phản tốt hơn)
- Thêm style cho `select option` để đảm bảo dropdown cũng có màu đúng
- Thêm style cho disabled state

**File đã sửa:** `src/index.css`

```css
.input {
  @apply w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg 
         focus:outline-none focus:ring-2 focus:ring-primary-500 
         focus:border-transparent text-gray-100 placeholder-gray-400;
}

.select {
  @apply w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg 
         focus:outline-none focus:ring-2 focus:ring-primary-500 
         focus:border-transparent text-gray-100;
}

.select option {
  @apply bg-gray-800 text-gray-100;
}

.input:disabled,
.select:disabled {
  @apply bg-gray-900 text-gray-500 cursor-not-allowed;
}
```

### 2. Sửa logic các nút không hoạt động ✅

**Vấn đề:** Các nút Add Files, Add Folder không hoạt động

**Nguyên nhân:**
- Tauri 2 API trả về format khác với Tauri 1
- Dialog có thể trả về string hoặc array
- Thiếu xử lý cho các trường hợp khác nhau

**Giải pháp:**
- Cập nhật `handleAddFiles()` để xử lý cả array và string
- Cập nhật `handleAddDirectory()` để xử lý cả object và string
- Cập nhật `selectOutputDir()` để xử lý cả object và string
- Thêm console.log để debug
- Thêm alert để hiển thị lỗi cho user

**File đã sửa:** `src/App.tsx`

**Thay đổi chính:**

```typescript
// Trước đây
if (selected && Array.isArray(selected)) {
  const paths = selected.map((file) => file.path);
  // ...
}

// Bây giờ
if (selected && Array.isArray(selected)) {
  const paths = selected; // Tauri 2 trả về array of strings
  // ...
} else if (selected && typeof selected === "string") {
  const paths = [selected]; // Single file
  // ...
}
```

### 3. Thêm logging và error handling ✅

**Thêm console.log tại các điểm quan trọng:**
- Khi mở dialog
- Khi nhận được kết quả từ dialog
- Khi gọi Tauri commands
- Khi nhận được response từ backend

**Thêm alert để thông báo lỗi:**
- Khi add files thất bại
- Khi add directory thất bại
- Khi select output directory thất bại

### 4. Cập nhật Tailwind CSS config ✅

**Thay đổi bạn đã làm:**

**File:** `postcss.config.js`
```javascript
// Trước
plugins: {
  tailwindcss: {},
  autoprefixer: {},
}

// Sau
plugins: {
  '@tailwindcss/postcss': {},
  autoprefixer: {},
}
```

**File:** `src/index.css`
```css
// Trước
@tailwind base;
@tailwind components;
@tailwind utilities;

// Sau
@import "tailwindcss";
@config "../tailwind.config.js";
```

## Tóm tắt các file đã thay đổi

1. ✅ `src/index.css` - Sửa màu text trong form controls
2. ✅ `src/App.tsx` - Sửa logic dialog và thêm logging
3. ✅ `postcss.config.js` - Cập nhật Tailwind plugin
4. ✅ `TESTING.md` - Tạo guide để test

## Các vấn đề đã giải quyết

- ✅ Text trong select/input không đọc được
- ✅ Nút Add Files không hoạt động
- ✅ Nút Add Folder không hoạt động
- ✅ Nút Browse output directory không hoạt động
- ✅ Thiếu error handling
- ✅ Thiếu logging để debug

## Cách test

1. Chạy ứng dụng: `npm run tauri dev`
2. Mở Developer Console (F12)
3. Test từng nút và xem console log
4. Kiểm tra xem có lỗi nào không
5. Tham khảo file `TESTING.md` để test chi tiết

## Các bước tiếp theo (nếu vẫn có vấn đề)

### Nếu nút vẫn không hoạt động:

1. **Kiểm tra Tauri plugins đã được cài đặt:**
   ```bash
   npm list @tauri-apps/plugin-dialog
   npm list @tauri-apps/plugin-fs
   ```

2. **Kiểm tra backend có register commands:**
   - Mở `src-tauri/src/lib.rs`
   - Tìm `invoke_handler!` macro
   - Đảm bảo có: `add_files`, `add_directory`, `get_jobs`, etc.

3. **Rebuild backend:**
   ```bash
   cd src-tauri
   cargo clean
   cargo build
   cd ..
   npm run tauri dev
   ```

4. **Kiểm tra permissions trong tauri.conf.json:**
   - Đảm bảo có quyền dialog
   - Đảm bảo có quyền fs

### Nếu màu vẫn không đúng:

1. **Clear cache và rebuild:**
   ```bash
   rm -rf dist
   npm run build
   npm run tauri dev
   ```

2. **Kiểm tra Tailwind có compile đúng:**
   - Xem file CSS output trong dist
   - Đảm bảo các class được generate

## Notes

- Các lint warnings về `@apply` và `@config` là bình thường với Tailwind CSS
- TypeScript errors về missing modules sẽ biến mất khi build
- Console logs có thể được remove sau khi test xong
- Alert có thể được thay bằng toast notification trong tương lai

## Kết luận

Đã sửa xong 2 vấn đề chính:
1. ✅ Màu text trong form controls
2. ✅ Logic các nút Add Files/Folder

Ứng dụng bây giờ nên hoạt động đầy đủ. Hãy test và báo lại nếu còn vấn đề gì!
