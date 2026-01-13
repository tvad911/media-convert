# Changelog - Persistent State Management

## Version: 2025-01-01

### 🎯 Tính năng chính: Lưu trạng thái tự động

Ứng dụng giờ đây **tự động lưu và khôi phục** tất cả cài đặt của bạn khi đóng/mở lại app.

---

## ✨ Các thay đổi

### 1. **Backend (Rust)**

#### Thêm dependencies mới:
- `tauri-plugin-store = "2"` trong `Cargo.toml`

#### Cập nhật `lib.rs`:
- Đăng ký `tauri_plugin_store::Builder` vào Tauri builder
- Thêm quyền `store:default` vào `capabilities/default.json`

### 2. **Frontend (React/TypeScript)**

#### Thêm dependencies mới:
- `@tauri-apps/plugin-store` trong `package.json`

#### File mới:
- **`src/hooks/usePersistentState.ts`**: Custom React hook để quản lý persistent state
  - Tự động load giá trị từ store khi component mount
  - Tự động save giá trị vào store khi state thay đổi
  - Sử dụng file `settings.json` để lưu trữ

#### Cập nhật `App.tsx`:
Chuyển các state sau từ `useState` sang `usePersistentState`:
- ✅ `settings` (EncodingSettings) - key: "encodingSettings"
- ✅ `outputDir` (string) - key: "outputDir"
- ✅ `shouldShutdown` (boolean) - key: "shouldShutdown"
- ✅ `concurrentJobs` (number) - key: "concurrentJobs"
- ✅ `activeTab` ("queue" | "logs") - key: "activeTab"

### 3. **Documentation**

#### File mới:
- **`docs/PERSISTENT_STATE.md`**: Hướng dẫn chi tiết về tính năng persistent state
- **`docs/CHANGELOG_PERSISTENT_STATE.md`**: File này - tóm tắt các thay đổi

#### Cập nhật:
- **`README.md`**: Thêm tính năng persistent state vào danh sách features

---

## 📁 Cấu trúc file lưu trữ

### Linux/macOS:
```
~/.local/share/rust-video-converter/
├── sessions.db          # SQLite database cho sessions (đã có từ trước)
└── settings.json        # JSON file cho persistent settings (MỚI)
```

### Windows:
```
%APPDATA%\rust-video-converter\
├── sessions.db
└── settings.json
```

---

## 🔧 Cách sử dụng

### Cho người dùng:
1. **Không cần làm gì cả!** Mọi thứ tự động.
2. Thay đổi bất kỳ cài đặt nào → Tự động lưu
3. Đóng app → Mở lại → Cài đặt vẫn giữ nguyên

### Cho developer:
```typescript
// Sử dụng persistent state trong component
import { usePersistentState } from './hooks/usePersistentState';

function MyComponent() {
  // Giống như useState nhưng tự động persist
  const [value, setValue] = usePersistentState<string>('myKey', 'defaultValue');
  
  return (
    <input 
      value={value} 
      onChange={(e) => setValue(e.target.value)} 
    />
  );
}
```

---

## 🧪 Testing

### Test thủ công:
1. Mở app
2. Thay đổi các cài đặt:
   - Chọn output format khác
   - Thay đổi CRF value
   - Bật/tắt hardware acceleration
   - Chọn output directory
   - Thay đổi concurrent jobs
3. Đóng app hoàn toàn
4. Mở lại app
5. ✅ Kiểm tra: Tất cả cài đặt phải giống như lúc đóng

### Reset settings:
```bash
# Linux/macOS
rm ~/.local/share/rust-video-converter/settings.json

# Windows
del %APPDATA%\rust-video-converter\settings.json
```

---

## 🐛 Bug fixes

- ✅ Fixed: Duplicate `shouldShutdown` state declaration in `App.tsx`
- ✅ Fixed: Unused import `JobStatus` in `session.rs`
- ✅ Fixed: TypeScript errors với persistent state hook

---

## 📊 Impact

### Performance:
- **Minimal overhead**: Chỉ write vào disk khi state thay đổi
- **Lazy loading**: Store chỉ được khởi tạo khi cần
- **Async operations**: Không block UI thread

### User Experience:
- ⬆️ **Tăng**: Không mất cài đặt khi restart
- ⬆️ **Tăng**: Không cần cấu hình lại mỗi lần
- ⬆️ **Tăng**: Workflow mượt mà hơn

### Code Quality:
- ✅ Type-safe với TypeScript generics
- ✅ Reusable hook pattern
- ✅ Error handling đầy đủ
- ✅ Clean separation of concerns

---

## 🚀 Future Enhancements

Có thể mở rộng thêm:
1. **Sync settings** giữa nhiều thiết bị (cloud sync)
2. **Import/Export settings** dưới dạng file
3. **Multiple profiles** - Lưu nhiều bộ cài đặt khác nhau
4. **Settings history** - Undo/redo changes
5. **Encrypted storage** - Bảo mật sensitive data

---

## 📝 Notes

- Queue jobs (danh sách file đang xử lý) KHÔNG được persist tự động
- Nếu muốn lưu queue, dùng tính năng "Save Session" (đã có sẵn)
- Settings file là plain JSON, có thể edit thủ công nếu cần

---

**Completed**: 2025-01-01  
**Author**: Antigravity AI  
**Status**: ✅ Production Ready
