# Tổng hợp hệ thống User và Support

Tài liệu này được viết dựa trên code hiện tại của dự án, tập trung vào:

- schema `User`
- 2 schema support: `SupportConversation`, `SupportMessage`
- lý do vì sao support bị chậm / lỗi hiển thị
- từng hàm xử lý chính trong luồng support và auth
- thứ tự request đi qua hệ thống
- server hiểu dữ liệu client gửi lên như thế nào

Mục tiêu là mô tả theo đúng code hiện tại, không viết lý thuyết chung chung.

---

## 1. Tổng quan nhanh

Hệ thống support hiện tại được chia thành 3 lớp rõ ràng:

1. `routes`: nhận URL và middleware
2. `controllers`: nhận `req`, `res`, gọi service
3. `services`: xử lý nghiệp vụ, đọc/ghi DB, tạo thông báo

Dữ liệu user và support được lưu trong 3 schema chính:

- `backend/schemas/User.js`
- `backend/schemas/SupportConversation.js`
- `backend/schemas/SupportMessage.js`

---

## 2. Schema User

File: `backend/schemas/User.js`

### 2.1 Các trường chính

- `name`: tên người dùng
- `email`: email duy nhất
- `password`: mật khẩu đã hash, `select: false`
- `role`: vai trò, hiện tại chủ yếu là `user` và `admin`
- `avatar`: URL ảnh đại diện
- `phone`: số điện thoại
- `address`: object địa chỉ
  - `street`
  - `city`
  - `state`
  - `zipCode`
  - `country`
- `googleId`: dành cho đăng nhập Google
- `isEmailVerified`: đã xác minh email hay chưa
- `refreshToken`: token refresh đang lưu trên DB
- `passwordResetToken`, `passwordResetExpires`: reset password
- `isActive`: tài khoản có hoạt động hay không
- `createdAt`, `updatedAt`: từ `timestamps: true`

### 2.2 Middleware và method quan trọng

#### a. `pre('save')`

Nếu `password` thay đổi thì hệ thống sẽ:

1. tạo `salt`
2. hash password bằng `bcrypt`
3. lưu password đã hash vào DB

=> nghĩa là client gửi password thô, nhưng DB không lưu password thô.

#### b. `comparePassword(enteredPassword)`

Dùng để so sánh password login với password đã hash trong DB.

#### c. `getFullAddress()`

Nối `street`, `city`, `country` thành chuỗi địa chỉ đầy đủ.

#### d. `toJSON()`

Khi convert ra JSON, hệ thống tự xóa:

- `password`
- `refreshToken`
- `passwordResetToken`
- `passwordResetExpires`

=> giúp API không lộ dữ liệu nhạy cảm.

---

## 3. Schema SupportConversation

File: `backend/schemas/SupportConversation.js`

Schema này đại diện cho **một cuộc hội thoại support** giữa một user và admin.

### 3.1 Các trường chính

- `user`: user sở hữu cuộc trò chuyện
- `assignedAdmin`: admin đang phụ trách
- `status`: `open` hoặc `closed`
- `lastMessageAt`: thời điểm tin nhắn cuối
- `lastMessagePreview`: preview ngắn của tin nhắn cuối
- `lastSender`: `user` hoặc `admin`
- `adminUnreadCount`: số tin nhắn admin chưa đọc
- `userUnreadCount`: số tin nhắn user chưa đọc
- `createdAt`, `updatedAt`

### 3.2 Ý nghĩa nghiệp vụ

Schema này không lưu toàn bộ nội dung tin nhắn. Nó chỉ lưu:

- ai đang nói chuyện
- trạng thái cuộc trò chuyện
- thông tin tổng hợp để render list nhanh

Nội dung chi tiết của từng tin nhắn nằm ở `SupportMessage`.

### 3.3 Index

`supportConversationSchema.index({ lastMessageAt: -1 })`

=> giúp sắp xếp nhanh cuộc trò chuyện mới nhất lên trên.

---

## 4. Schema SupportMessage

File: `backend/schemas/SupportMessage.js`

Schema này đại diện cho **một dòng tin nhắn cụ thể** trong conversation.

### 4.1 Các trường chính

- `conversation`: conversation mà tin nhắn thuộc về
- `sender`: người gửi
- `senderRole`: `user` hoặc `admin`
- `text`: nội dung text
- `attachments`: danh sách tệp đính kèm
- `readByAdminAt`: admin đã đọc lúc nào
- `readByUserAt`: user đã đọc lúc nào
- `createdAt`, `updatedAt`

### 4.2 Cấu trúc attachment

Mỗi attachment có:

- `url`: đường dẫn tới file/ảnh
- `publicId`: id để xóa file nếu dùng Cloudinary
- `mimeType`: kiểu file
- `originalName`: tên file gốc
- `size`: kích thước file

### 4.3 Index

`supportMessageSchema.index({ conversation: 1, createdAt: 1 })`

=> giúp query tin nhắn theo conversation và theo thứ tự thời gian nhanh hơn.

---

## 5. Request support đi qua hệ thống như thế nào

Phần này trả lời câu hỏi: **server hiểu dữ liệu client gửi lên như thế nào?**

### 5.1 Ví dụ: user gửi tin nhắn support có kèm ảnh

Client tạo request tới:

- `POST /api/support/conversations/:id/messages`

File route: `backend/routes/support.js`

Route được định nghĩa như sau:

1. `protect`
2. `customerOnly`
3. `mongoIdValidation('id')`
4. `upload.array('attachments', 3)`
5. `supportMessageValidation`
6. `sendUserMessage`

### 5.2 Thứ tự lệnh được thực thi

#### Bước 1: `protect`

File: `backend/middleware/auth.js`

Server đọc token từ:

- `Authorization: Bearer ...`
- hoặc cookie `accessToken`

Sau đó:

1. `jwt.verify(...)`
2. tìm `User` trong DB
3. gán vào `req.user`

Nếu không hợp lệ -> trả 401.

#### Bước 2: `customerOnly` hoặc `admin`

File: `backend/routes/support.js`

- user thường mới được vào route customer
- admin mới được vào route admin

=> đây là authorization (phân quyền).

#### Bước 3: `mongoIdValidation('id')`

Kiểm tra `:id` có phải ObjectId hợp lệ hay không.

#### Bước 4: `upload.array('attachments', 3)`

File: `backend/config/cloudinary.js`

Client gửi `multipart/form-data`.

Middleware `multer` đọc từng file trong field `attachments`.

Khi đó:

- nếu có Cloudinary => file được đẩy lên Cloudinary
- nếu không có Cloudinary => file nằm trong memory buffer

Kết quả sẽ đưa vào:

- `req.files`

#### Bước 5: `supportMessageValidation`

Kiểm tra text/file có hợp lệ theo rule validation.

#### Bước 6: controller `sendUserMessage`

File: `backend/controllers/support.js`

Controller **không làm nghiệp vụ phức tạp**. Nó chỉ lấy:

- `conversationId` từ `req.params.id`
- `user` từ `req.user`
- `text` từ `req.body.text`
- `files` từ `req.files`

rồi gọi:

- `supportService.sendUserMessage(...)`

#### Bước 7: service `sendUserMessage`

File: `backend/services/supportService.js`

Service sẽ:

1. tìm conversation
2. check quyền truy cập bằng `ensureConversationAccess`
3. gọi `createSupportMessage(...)`
4. tạo notification cho admin bằng `sendNotification(...)`

#### Bước 8: helper `createSupportMessage`

File: `backend/services/supportHelpers.js`

Đây là nơi nghiệp vụ chính xảy ra:

1. chuẩn hóa text
2. gọi `normalizeAttachments(files)`
3. tạo document `SupportMessage`
4. update lại `SupportConversation`
   - `lastMessageAt`
   - `lastMessagePreview`
   - `lastSender`
   - `adminUnreadCount` / `userUnreadCount`
5. populate sender và conversation để trả về cho frontend

#### Bước 9: response trả về frontend

Controller trả:

```json
{
  "success": true,
  "data": {
    "message": {...},
    "conversation": {...}
  }
}
```

Frontend nhận response, normalize lại, rồi render ra khung chat.

---

## 6. Server hiểu client gửi gì bằng cách nào

Đây là cách server “hiểu” request của client:

### 6.1 Query string

Ví dụ:

- `/support/admin/conversations?status=open`

Server đọc ở `req.query.status`

### 6.2 Route params

Ví dụ:

- `/support/admin/conversations/:id/messages`

Server đọc ở `req.params.id`

### 6.3 JSON body

Ví dụ:

- `{ "status": "closed" }`

Server đọc ở `req.body.status`

### 6.4 FormData + file

Nếu client gửi `multipart/form-data`:

- text vào `req.body`
- file vào `req.file` hoặc `req.files`

Ví dụ support:

- `text` -> `req.body.text`
- `attachments[]` -> `req.files`

### 6.5 Access token

Server đọc token từ:

- `req.headers.authorization`
- hoặc `req.cookies.accessToken`

Nếu token đúng -> server biết request này là của user nào.

---

## 7. Các hàm support quan trọng và chức năng của từng hàm

### 7.1 Trong `backend/controllers/support.js`

- `getMyConversation`
  - lấy conversation hiện tại của user
- `getConversationMessages`
  - lấy danh sách tin nhắn theo conversation của user
- `sendUserMessage`
  - user gửi tin nhắn mới
- `markUserConversationRead`
  - user đánh dấu đã đọc
- `getAdminConversations`
  - admin lấy list toàn bộ hội thoại
- `getAdminConversationMessages`
  - admin lấy messages của 1 hội thoại
- `sendAdminMessage`
  - admin phản hồi user
- `markAdminConversationRead`
  - admin đánh dấu đã đọc
- `updateConversationStatus`
  - đổi `open` / `closed`
- `deleteAdminConversation`
  - xóa hội thoại và attachment liên quan

### 7.2 Trong `backend/services/supportService.js`

- `getConversationOrThrow`
  - tìm conversation, không có thì throw 404
- `getMyConversation`
  - nếu user chưa có conversation thì tạo mới
- `getConversationMessages`
  - check quyền và trả messages cho user
- `sendUserMessage`
  - gửi tin + thông báo admin
- `markUserConversationRead`
  - xóa unread count phía user
- `getAdminConversations`
  - lấy full list support cho admin
- `getAdminConversationMessages`
  - lấy full list message cho admin
- `sendAdminMessage`
  - admin gửi trả lời, thông báo user
- `markAdminConversationRead`
  - xóa unread count phía admin
- `updateConversationStatus`
  - đổi trạng thái conversation
- `deleteAdminConversation`
  - xóa DB và xóa ảnh nếu cần

### 7.3 Trong `backend/services/supportHelpers.js`

- `ensureConversationAccess`
  - chặn user truy cập conversation không phải của mình
- `populateConversation`
  - populate `user`, `assignedAdmin`
- `populateMessage`
  - populate `sender`
- `normalizeAttachments`
  - biến file upload thành object `{ url, publicId, mimeType, originalName, size }`
- `markConversationRead`
  - update read timestamp + unread count
- `createSupportMessage`
  - hàm trung tâm để tạo message mới và cập nhật conversation

---

## 8. Vì sao support đã từng bị chậm

Phần support admin đã từng bị chậm và gây log lặp ở backend. Nguyên nhân chính:

### 8.1 Polling lặp lại liên tục

Trước đó trang admin support poll liên tục mỗi 5 giây:

- lấy danh sách conversation
- lấy messages của conversation đang mở
- đánh dấu read lại

Điều này gây:

- nhiều request lặp lại
- backend auth middleware verify token liên tục
- request mới và cũ dễ bị race nhau

### 8.2 Request cũ ghi đè request mới

Khi admin chuyển nhanh giữa các conversation:

- request A của chat cũ chưa xong
- admin đã chọn chat B
- request A xong trễ hơn và set state đè lên chat B

=> UI có thể bị sai messages, sai pane, hoặc mất composer.

### 8.3 Message có ảnh làm vỡ layout

Khi attachment là ảnh lớn:

- bubble chat có thể tăng chiều cao lớn
- message list nếu không bị giới hạn `min-h-0`, `overflow`, `shrink-0`
- composer bị đẩy ra khỏi khung nhìn

### 8.4 Ảnh local support cũ không hiện đúng

Một số ảnh support local được lưu dạng:

- `/uploads/support/...`
- hoặc path local/Windows
- hoặc tên file `.jfif`

Nếu frontend normalize URL chưa đủ tốt thì ảnh sẽ vỡ, render lỗi, hoặc khung chat hiển thị bất thường.

---

## 9. Các cách đã sửa support

### 9.1 Giảm request lặp

Đã đổi logic support admin theo hướng:

- không poll messages liên tục
- không `mark read` trong mọi silent refresh
- ưu tiên refresh khi có sự kiện liên quan

### 9.2 Thêm stale-request protection

Đã thêm cơ chế request id / stale-request guard để:

- request cũ không được phép overwrite state của conversation mới

### 9.3 Sửa layout khung chat

Đã sửa các container theo hướng:

- pane phải có `min-h-0`
- message list có `overflow-y-auto`
- composer có `shrink-0`
- image bubble bị giới hạn `max-h`, `max-w`

=> khi gửi ảnh, ô nhập tin vẫn nằm dưới khung chat.

### 9.4 Chuẩn hóa attachment URL

Đã sửa utility normalize để hỗ trợ:

- `.jfif`
- path local Windows
- `/uploads/support/...`
- record cũ chỉ có `publicId`

### 9.5 Serve file local support

Đã mở static path:

- `app.use('/uploads', express.static(...))`

=> frontend có thể truy cập file support local đã lưu.

---

## 10. Luồng upload support và user avatar

### 10.1 User avatar

Route:

- `PUT /api/auth/profile`

Nếu có `req.file`:

- nếu `req.file.path` tồn tại => lưu thẳng `user.avatar = req.file.path`
- nếu chỉ có `buffer` => gọi `uploadBuffer(...)`

### 10.2 Support attachment

Route:

- `POST /api/support/conversations/:id/messages`
- `POST /api/support/admin/conversations/:id/messages`

File được đưa vào `req.files`.

Helper `normalizeAttachments(files)` sẽ xử lý:

- Nếu có `file.path` => sử dụng ngay
- Nếu có `file.buffer` và không có Cloudinary => ghi file local vào `backend/uploads/support`
- Nếu có `file.buffer` và có Cloudinary => upload lên Cloudinary

Sau đó lưu metadata vào `SupportMessage.attachments[]`.

---

## 11. Phần auth liên quan đến user và support

### 11.1 Đăng nhập

File: `backend/controllers/auth.js`

Luồng đăng nhập:

1. tìm user theo email
2. check password bằng `comparePassword`
3. check `isActive`
4. gọi `issueAuthSession(...)`
5. trả về `accessToken` + user safe

### 11.2 Refresh token

File: `backend/controllers/auth.js`

Luồng refresh:

1. đọc refresh token từ cookie hoặc body
2. verify refresh token
3. kiểm tra token hash trong DB
4. issue lại access token mới

### 11.3 Middleware `protect`

File: `backend/middleware/auth.js`

Mọi route support đều chạy qua middleware này.

Nó giúp server biết:

- request đó của user nào
- user có tồn tại không
- user có bị khóa không

---

## 12. Ví dụ đầy đủ một request admin support có ảnh

### Bước A - client gửi request

Admin ở frontend:

1. chọn file
2. file được đưa vào `FormData`
3. gửi `POST /api/support/admin/conversations/:id/messages`

### Bước B - route nhận request

`backend/routes/support.js`

Route chạy qua:

1. `protect`
2. `admin`
3. `mongoIdValidation('id')`
4. `upload.array('attachments', 3)`
5. `supportMessageValidation`
6. `sendAdminMessage`

### Bước C - controller gọi service

Controller `sendAdminMessage` gọi:

- `supportService.sendAdminMessage(...)`

### Bước D - service xử lý

Service:

1. tìm conversation
2. gọi `createSupportMessage(...)`
3. tạo notification cho user

### Bước E - helper tạo message

Helper:

1. normalize attachment
2. tạo `SupportMessage`
3. update `SupportConversation`
4. trả về `message` + `conversation`

### Bước F - frontend render

Frontend nhận response:

1. normalize message
2. đưa message vào state
3. render bubble text/ảnh/file

---

## 13. Kết luận ngắn gọn

Hệ thống User + Support hiện tại hoạt động theo đúng mô hình:

- client gửi request
- middleware xác thực và parse file
- controller chỉ điều hướng
- service xử lý nghiệp vụ
- schema lưu dữ liệu chính xác trong MongoDB

3 điểm quan trọng nhất để hiểu hệ thống này:

1. `User` giữ auth/profile/account state
2. `SupportConversation` giữ thông tin tổng hợp của hội thoại
3. `SupportMessage` giữ từng message và attachment chi tiết

Nếu muốn debug một lỗi support, thứ tự nên đọc là:

1. `backend/routes/support.js`
2. `backend/controllers/support.js`
3. `backend/services/supportService.js`
4. `backend/services/supportHelpers.js`
5. `backend/schemas/SupportConversation.js`
6. `backend/schemas/SupportMessage.js`

Nếu muốn debug auth/profile, thứ tự nên đọc là:

1. `backend/middleware/auth.js`
2. `backend/controllers/auth.js`
3. `backend/services/authHelpers.js`
4. `backend/schemas/User.js`
