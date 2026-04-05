# Postman Guide - Ecommerce Platform

Bo file Postman nay da duoc tao lai tu backend hien tai trong `backend/server.js` va `backend/routes/*.js`.
Muc tieu la giong form demo/smoke-test gon gang cua GV: chia theo module, request dat ten ro, bien moi truong dung chung, va thu tu test de theo doi.

## 1. File trong `postman/`

- `Ecommerce-Platform.postman_collection.json`
- `Ecommerce-Platform.local.postman_environment.json`
- `POSTMAN_GUIDE.md`

## 2. Nguyen tac cua ban rebuild nay

- Chi giu cac module dang duoc mount trong `backend/server.js`
- Bo hoan toan nhom `Shipper` vi backend hien tai khong mount `/api/shipper`
- Bo sung cac nhom/route con thieu truoc day: `Notifications`, admin support day du, upload multiple/delete, admin product/category/order/user/coupon CRUD chinh
- Tach token theo vai tro de test de hon:
  - `customerAccessToken`
  - `adminAccessToken`
  - `activeAccessToken`

`activeAccessToken` la bien bearer mac dinh cua collection. Sau khi login bang customer hoac admin, request test script se tu dong cap nhat bien nay.

## 3. Cau truc collection

Collection duoc chia theo cac module dang mount that:

1. `Health`
2. `Auth`
3. `Categories`
4. `Products`
5. `Cart`
6. `Wishlist`
7. `Coupons`
8. `Orders`
9. `Payment`
10. `Support`
11. `Notifications`
12. `Users Admin`
13. `Upload Admin`

## 4. Bien moi truong

Environment local gom:

- `baseUrl`
- `activeAccessToken`
- `customerAccessToken`
- `adminAccessToken`
- `userId`
- `adminId`
- `productId`
- `categoryId`
- `orderId`
- `couponId`
- `conversationId`
- `notificationId`
- `imageId`
- `imagePublicId`
- `paymentOrderId`
- `resetToken`
- `customerEmail`
- `customerPassword`
- `adminEmail`
- `adminPassword`

## 5. Script tu dong luu bien

Mot so request co Postman test script de luu bien phuc vu request sau:

- `Register Customer`
- `Login Customer`
- `Login Admin`
- `Admin Create Category`
- `Admin Create Product`
- `Create COD Order`
- `Admin Create Coupon`
- `Get My Support Conversation`
- `Get Notifications`
- `Upload Single Image`

## 6. Cach import

1. Import `Ecommerce-Platform.postman_collection.json`
2. Import `Ecommerce-Platform.local.postman_environment.json`
3. Chon environment `Ecommerce Platform Local`

## 7. Thu tu test khuyen nghi

### Smoke test co ban

1. `Health -> API Health Check`
2. `Auth -> Login Admin` hoac `Auth -> Login Customer`
3. Chay nhom theo role phu hop

### Luong customer

1. `Auth -> Login Customer`
2. `Categories -> Get Categories`
3. `Products -> Get Products`
4. `Cart`
5. `Wishlist`
6. `Coupons -> Apply Coupon`
7. `Orders -> Create COD Order`
8. `Payment -> Create MoMo Payment`
9. `Support` phan user
10. `Notifications`

Luu y: backend hien tai dung `customerOnly` cho `Cart`, `Wishlist`, `Orders`, `Payment`. Admin se bi chan 403 o cac nhom nay.

### Luong admin

1. `Auth -> Login Admin`
2. `Users Admin`
3. `Categories` phan admin
4. `Products` phan admin
5. `Coupons` phan admin
6. `Orders` phan admin
7. `Support` phan admin
8. `Upload Admin`
9. `Notifications`

## 8. Diem can tu dien tay hoac cap nhat sau khi test

Van co mot so bien can ban tu cap nhat tuy theo du lieu thuc te:

- `resetToken`
- `paymentOrderId`
- `notificationId`
- `imageId`
- `imagePublicId`

Ngoai ra, cac request slug mau nhu `sample-product` hoac `sample-slug` can doi theo du lieu that cua DB.

## 9. Nhung thay doi quan trong so voi bo cu

- Da bo nhom `Shipper` vi route khong con mount
- Da them nhom `Notifications`
- Da them admin support day du: read, send, status, delete
- Da them admin product image management
- Da them admin category image upload
- Da them coupon list/update/delete
- Da them order stats/revenue/payment update
- Da them upload multiple/delete
- Da doi strategy token tu 1 bien thanh token theo role

## 10. Ket luan

Bo Postman nay khong con la ban smoke-test cu nua, ma la ban rebuilt theo backend hien tai.
No phu hop hon de:

- demo do an
- doi chieu route backend hien tai
- test theo role customer/admin ro rang
- giai thich he thong theo form module de doc nhu mau GV
