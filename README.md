# Nền Tảng Thương Mại Điện Tử

Đây là đồ án website thương mại điện tử được xây dựng theo kiến trúc tách riêng `frontend` và `backend`. Hệ thống hiện tại đã có các luồng chính của một sàn thương mại điện tử như xác thực người dùng, quản lý sản phẩm, giỏ hàng, đặt hàng, quản trị, đăng nhập Google, upload ảnh và thông báo thời gian thực cho đơn hàng.

README này mô tả trung thực trạng thái hiện tại của dự án: công nghệ đang sử dụng, các chức năng đã hoàn thành, các phần còn thiếu, cách chạy local, và các hướng mở rộng để đáp ứng tốt hơn yêu cầu đồ án/cuối kỳ.

## 1. Tổng quan dự án

Dự án gồm 2 ứng dụng chính:

- `frontend/`: giao diện web cho khách hàng, admin và shipper
- `backend/`: REST API + xác thực + kết nối MongoDB + Socket.IO

Phần mobile `ShipperMobileApp/` đã được xóa khỏi repo.

## 2. Mục tiêu hệ thống

Hệ thống hướng tới các nhóm chức năng chính của một website thương mại điện tử:

- khách hàng xem sản phẩm, tìm kiếm, lọc, thêm vào giỏ hàng, wishlist, đặt hàng
- người dùng đăng ký, đăng nhập, đăng nhập Google, cập nhật hồ sơ
- admin quản lý sản phẩm, danh mục, đơn hàng, người dùng, duyệt shipper
- shipper nhận và cập nhật trạng thái giao hàng
- thông báo thời gian thực khi đơn hàng thay đổi trạng thái qua Socket.IO

## 3. Kiến trúc tổng thể

### Frontend

- React 18
- React Router DOM
- Redux Toolkit + React Redux
- Axios
- Tailwind CSS
- Socket.IO Client
- React Hot Toast

### Backend

- Node.js + Express.js
- MongoDB + Mongoose
- JWT + refresh token
- Passport Google OAuth 2.0
- Multer + Cloudinary upload
- Socket.IO
- Helmet, CORS, cookie-parser, express-rate-limit

### CI

- GitHub Actions workflow tại `.github/workflows/ci.yml`
- Hiện tại workflow chỉ còn `workflow_dispatch` (chạy thủ công), không auto-run trên `push`/`pull_request`

## 4. Cấu trúc thư mục

```text
.
|- backend/
|  |- config/
|  |- controllers/
|  |- middleware/
|  |- models/
|  |- routes/
|  |- scripts/
|  |- socket/
|  `- server.js
|- frontend/
|  |- src/
|  |  |- components/
|  |  |- hooks/
|  |  |- pages/
|  |  |- services/
|  |  `- store/
|- .github/workflows/
|- package.json
`- README.md
```

## 5. Công nghệ và thư viện đang sử dụng

### Frontend

- `react`, `react-dom`
- `react-router-dom`
- `@reduxjs/toolkit`, `react-redux`
- `axios`
- `socket.io-client`
- `react-hot-toast`
- `@headlessui/react`, `@heroicons/react`
- `tailwindcss`, `postcss`, `autoprefixer`

### Backend

- `express`
- `mongoose`, `mongodb`
- `jsonwebtoken`
- `passport`, `passport-google-oauth20`
- `multer`, `cloudinary`, `multer-storage-cloudinary`
- `socket.io`
- `bcryptjs`
- `cookie-parser`
- `cors`
- `helmet`
- `express-rate-limit`
- `express-validator`
- `dotenv`
- `express-async-handler`

### Công cụ ở thư mục gốc

- `concurrently`

## 6. Số model hiện tại trong dự án

Hiện tại backend có 6 model độc lập trong `backend/models`:

1. `User`
2. `Product`
3. `Category`
4. `Order`
5. `Cart`
6. `Wishlist`

Ngoài ra còn có các thực thể nhưng đang nằm dưới dạng subdocument/embedded data:

- review trong `Product`
- order item trong `Order`
- shipping address trong `Order`
- shipper info / shipper application trong `User`
- payment details trong `Order`

### Đánh giá theo yêu cầu cuối kỳ

Nếu giảng viên chỉ đếm model độc lập thì hiện tại dự án mới có **6/8 model**. Để đáp ứng chắc chắn yêu cầu, bạn nên bổ sung thêm **2 model độc lập** nữa.

Hai lựa chọn phù hợp nhất với dự án này:

- `Coupon` hoặc `Promotion`
- `Payment` hoặc `ShipperApplication`

## 7. Các chức năng đã hoàn thành

### 7.1 Authentication / Authorization

Đã có:

- đăng ký tài khoản bằng email/password
- đăng nhập bằng email/password
- đăng nhập bằng Google OAuth
- logout
- refresh token session
- cập nhật profile
- đổi mật khẩu
- role-based authorization cho `user`, `admin`, `shipper`
- route guard ở frontend cho từng vai trò

### 7.2 CRUD và nghiệp vụ khách hàng

Đã có:

- xem danh sách sản phẩm
- tìm kiếm, lọc, sắp xếp sản phẩm
- xem chi tiết sản phẩm
- xem danh mục và cây danh mục
- thêm/sửa/xóa giỏ hàng
- wishlist
- checkout
- tạo đơn hàng
- xem lịch sử đơn hàng
- xem chi tiết đơn hàng

### 7.3 Admin

Đã có:

- dashboard thống kê cơ bản
- quản lý sản phẩm
- tạo/sửa/xóa sản phẩm
- upload hình sản phẩm
- quản lý danh mục
- quản lý đơn hàng
- cập nhật trạng thái đơn hàng
- xem danh sách người dùng
- duyệt shipper application

### 7.4 Shipper

Đã có:

- dashboard shipper
- xem danh sách đơn được giao / đơn có liên quan
- nhận / cập nhật trạng thái giao hàng
- luồng nộp đơn xin làm shipper

### 7.5 Upload

Đã có:

- upload ảnh sản phẩm
- upload ảnh category
- upload avatar user
- endpoint upload/delete ảnh tổng quát cho admin

### 7.6 Real-time

Đã có:

- thông báo thời gian thực khi trạng thái đơn hàng thay đổi
- thông báo đơn mới
- thông báo gán shipper
- frontend socket session handling đã được triển khai và đã giảm được tình trạng duplicate connection

### 7.7 Seed data

Đã có:

- script seed catalog: `backend/scripts/seedCatalog.js`
- tạo 10 category và 10 product mẫu

## 8. Các chức năng đã có nhưng chưa hoàn thiện 100%

Đây là những phần đã có hướng đi, nhưng chưa được xem là hoàn chỉnh/đầy đủ:

### Payment

- checkout cho phép chọn phương thức thanh toán như `cod`, `bank_transfer`, `momo`, `zalopay`
- `Order` đã có `paymentMethod`, `paymentStatus`, `paymentDetails`
- nhưng **chưa có payment gateway tích hợp thực sự** (chưa có callback/webhook/transaction flow hoàn chỉnh)

### Reviews

- backend đã hỗ trợ reviews trong `Product`
- frontend đã hiển thị review
- nhưng cần kiểm tra/hoàn thiện UX gửi review để trình bày trọn vẹn hơn

### Shipper route / map

- đã có trang `frontend/src/pages/shipper/Route.js`
- nhưng hiện trạng vẫn nghiêng về placeholder / chưa đầy đủ tính năng điều hướng thực tế

### Admin user management

- đã có màn hình admin users
- nhưng vẫn còn một số thao tác frontend/backend chưa map khớp hoàn toàn

### CI

- đã có workflow GitHub Actions
- hiện tại chỉ chạy thủ công do billing issue
- backend mới ở mức install + syntax check, frontend ở mức build + test với `--passWithNoTests`

## 9. Các chức năng còn thiếu nếu muốn đầy đủ hơn cho một sàn TMDT

Nếu xét theo một website thương mại điện tử đầy đủ hơn, dự án hiện vẫn nên bổ sung thêm:

### 9.1 Mã giảm giá / khuyến mãi

Nên thêm:

- `Coupon` / `Promotion` model
- CRUD admin cho coupon
- áp mã giảm giá khi checkout
- lưu lịch sử áp dụng coupon trên order

### 9.2 Payment model / payment gateway

Nên thêm:

- `Payment` model độc lập
- lưu giao dịch thanh toán
- callback/webhook payment
- đối chiếu trạng thái thanh toán

### 9.3 Support / Contact backend

Hiện tại mới có `ContactPage`, nhưng chưa có:

- form liên hệ gửi về backend
- ticket/feedback model
- admin xử lý ticket

### 9.4 Notification center

Hiện có realtime socket, nhưng chưa có:

- model `Notification`
- lịch sử thông báo lưu DB
- đánh dấu đã đọc/chưa đọc
- thông báo hệ thống cho user/admin/shipper

### 9.5 Forgot password / reset password

Frontend có liên kết liên quan, nhưng luồng đầy đủ vẫn chưa xong:

- quên mật khẩu
- gửi email reset
- đặt lại mật khẩu bằng token

### 9.6 Returns / Refunds

Cho bài toán thương mại điện tử đầy đủ hơn, nên có thêm:

- model `ReturnRequest` hoặc `RefundRequest`
- trạng thái hoàn hàng/hoàn tiền
- admin xử lý yêu cầu

## 10. Đề xuất ưu tiên nếu cần đáp ứng cuối kỳ nhanh

Nếu mục tiêu là vừa đúng đề, vừa dễ demo, thứ tự ưu tiên mình khuyên như sau:

1. Thêm `Coupon` model + CRUD admin + áp coupon ở checkout
2. Thêm `Payment` hoặc `ShipperApplication` model độc lập
3. Hoàn thiện review submit UX ở frontend
4. Bổ sung `forgot password`
5. Nếu còn thời gian, thêm `Notification` hoặc `SupportTicket`

=> Như vậy bạn vừa đạt mốc **8 model**, vừa nâng tầm bài toán thương mại điện tử rõ ràng hơn.

## 11. Cách cài đặt và chạy dự án

### Yêu cầu

- Node.js >= 18
- npm
- MongoDB Atlas hoặc MongoDB local
- Tài khoản Cloudinary (nếu muốn upload ảnh thực tế)
- Google OAuth credentials (nếu muốn login Google)

### Cài đặt

Chạy tại thư mục gốc:

```bash
npm run install:all
```

Hoặc cài riêng:

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

### Biến môi trường backend

Cần có ít nhất file `backend/.env` với các biến cơ bản sau:

```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

JWT_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Chạy development

Chạy cả frontend và backend:

```bash
npm run dev
```

Chạy riêng từng phần:

```bash
npm run dev:backend
npm run dev:frontend
```

### Build

```bash
npm run build
```

### Seed dữ liệu mẫu

```bash
npm run seed --prefix backend
npm run seed:catalog --prefix backend
```

## 12. API domains hiện có

Backend hiện đang mount các nhóm route sau:

- `/api/auth`
- `/api/users`
- `/api/products`
- `/api/categories`
- `/api/cart`
- `/api/orders`
- `/api/upload`
- `/api/wishlist`
- `/api/shipper`

Ngoài ra có:

- `/health`
- `/api/health`

## 13. Tình trạng quality hiện tại

### Đã có

- frontend build thành công
- backend syntax check thành công
- workflow CI đã tồn tại
- auth flow, Google login, refresh token, socket session handling đã được triển khai và điều chỉnh để ổn định hơn

### Chưa có / chưa đầy đủ

- chưa có test suite đầy đủ cho backend
- frontend test hiện có thể không có test case thực tế
- chưa có PR auto CI do workflow đang tắt trigger tự động

## 14. Điểm mạnh của đồ án khi demo

Bạn nên nhấn mạnh các điểm sau khi thuyết trình:

- kiến trúc tách frontend/backend rõ ràng
- có auth, autho, Google login, role guard
- có CRUD nhiều nghiệp vụ thật: product, category, cart, order, wishlist, user admin
- có upload ảnh và real-time notification
- có dashboard admin và luồng shipper
- có model order/cart/wishlist riêng, không chỉ là demo CRUD đơn giản

## 15. Hạn chế hiện tại

- chưa đủ 8 standalone model nếu đếm nghiêm ngặt
- payment chưa tích hợp gateway thật
- promotions/coupon chưa có
- support/ticket chưa có
- một vài flow shipper/admin vẫn cần polish thêm
- CI hiện tại chỉ chạy thủ công

## 16. Hướng mở rộng tương lai

- thêm coupon/promotion engine
- thêm payment transaction model và payment gateway
- thêm notification model lưu DB
- thêm support ticket / contact backend
- thêm forgot/reset password
- thêm return/refund flow
- viết thêm tests cho backend và frontend
- bật lại auto CI khi billing GitHub Actions ổn định

## 17. Kết luận

Ở thời điểm hiện tại, dự án đã có các luồng chính của một đồ án website thương mại điện tử ở mức môn học: auth, autho, upload, catalog, cart, wishlist, checkout, order, admin, shipper và realtime. Tuy nhiên, để đáp ứng chắc chắn yêu cầu “8 model” và để bài nhìn trọn vẹn hơn như một sản phẩm e-commerce đầy đủ, bạn nên ưu tiên thêm **2 model độc lập** nữa (đề xuất: `Coupon` + `Payment` hoặc `ShipperApplication`) và hoàn thiện thêm một số flow còn thiếu như promotions, payment, support, notifications.
