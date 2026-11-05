# Upload ảnh từ Admin và đánh giá khách hàng

## Bổ sung video và avatar

- Nút đính kèm dùng kiểu gọn ban đầu: icon kẹp giấy nhỏ, viền nét đứt và tông vàng cho cả ảnh và video.
- Đánh giá hỗ trợ tối đa 4 ảnh và 1 video. Video có preview, có thể thay/bỏ trước khi gửi và phát trực tiếp tại phần bình luận cũng như Admin đánh giá.
- Admin sản phẩm có nút chọn video, tiếp tục lưu vào trường video sản phẩm hiện có.
- Video đầu vào MP4, WebM, MOV tối đa 50 MB; Cloudinary chuyển thành MP4 H.264/AAC để phát trên trình duyệt. Video upload trực tiếp có chữ ký từ server theo [tài liệu Cloudinary](https://cloudinary.com/documentation/client_side_uploading); API secret không gửi ra trình duyệt. Server xác nhận metadata video và quyền sở hữu trước khi trả URL. Giới hạn 50 MB được kiểm tra ở trình duyệt trước khi gửi, tại bước cấp chữ ký với thông tin khai báo và trên dung lượng video đầu ra khi xác nhận với Cloudinary.
- Trang tài khoản bỏ Hạng thành viên trong Thông Tin Cá Nhân, thay bằng chọn ảnh đại diện, Lưu ảnh đại diện và Dùng ảnh mặc định. Dùng chính hình người dùng cung cấp tại `public/default-avatar.png` khi chưa có avatar; áp dụng khi đăng nhập, đăng ký, khôi phục phiên và ở menu tài khoản.
- Avatar lưu vào trường `User.avatar` hiện có. Chỉ tài khoản đang đăng nhập được thay avatar của chính mình. Schema Review bổ sung `videos` mặc định `[]` để lưu video; không cần di chuyển dữ liệu cũ.

File mới: `src/lib/mediaUpload.ts`, `src/app/api/upload/video/route.ts`, `src/app/api/account/avatar/route.ts`, `src/components/common/AvatarEditor.tsx`, `public/default-avatar.png`, `scripts/test-media-profile.cjs`.

File cập nhật: component ImageUploader, ProductReviews, MobileDrawer; trang tài khoản, Admin sản phẩm/đánh giá; AuthContext, DataContext; helper Cloudinary và upload ảnh; API reviews/upload; Review schema và types.

Kiểm tra thêm: `node scripts/test-media-profile.cjs`. Script giả lập database/Cloudinary, kiểm tra cấp chữ ký, không lộ secret, giới hạn video, quyền sở hữu, xác nhận video, lưu/xóa tham chiếu avatar và lưu video cùng đánh giá. Để test thực tế, đăng nhập → Thông tin cá nhân → chọn avatar → Lưu → tải lại; thử Dùng ảnh mặc định rồi lưu. Với đánh giá, chọn ảnh và video → đợi tải xong → gửi → tải lại và phát video. Thử tương tự video trong form Admin sản phẩm. Không cần biến môi trường hay package mới.

## Tình trạng tích hợp

Project đã có package Cloudinary, cấu hình server, API upload và component dùng chung trước lần kiểm tra này. Đã tiếp tục hoàn thiện component thay vì tạo lại hoặc thay database.

- Admin sản phẩm: chọn/thay ảnh chính và ảnh phụ từ thiết bị.
- Admin banner và danh mục: nút kẹp giấy để chọn/thay ảnh.
- Khách đã đăng nhập: đính kèm tối đa 4 ảnh trong form đánh giá, bỏ ảnh trước khi gửi; ảnh lưu cùng đánh giá và bấm để xem lớn.
- Preview xuất hiện ngay khi chọn. URL HTTPS từ Cloudinary được đưa vào form và chỉ lưu database khi bấm lưu/gửi.
- JPG, PNG, WebP, GIF; tối đa 4 MB mỗi ảnh. API kiểm tra đăng nhập, vai trò, dung lượng thực tế, MIME và chữ ký tệp; Cloudinary kiểm tra ảnh khi upload.
- Ảnh sản phẩm lưu ở `huongvituyetsac/products`; các mục khác lần lượt ở `huongvituyetsac/banners`, `huongvituyetsac/categories`, `huongvituyetsac/reviews`.
- Giữ nguyên MongoDB/Mongoose và các trường URL hiện tại. API trả `publicId`, nhưng không bổ sung trường database vì schema hiện tại chưa cần lưu nó.

## File đã tạo trong lần hoàn thiện này

- `scripts/test-image-upload.cjs`: kiểm tra handler upload với giả lập đăng nhập và Cloudinary, không ghi database hay upload thật.
- `CLOUDINARY.md`: hướng dẫn này.

## File đã sửa trong lần hoàn thiện này

- `src/components/common/ImageUploader.tsx`: tránh preview trùng khi tải nhiều ảnh, thời gian chờ 75 giây mỗi request, dọn URL preview khi đóng form, thông báo lỗi và giữ ảnh đã tải thành công.
- `src/components/product/ProductReviews.tsx`: khóa nút gửi trong khi upload, bỏ lớp đếm ảnh thừa che ảnh thứ ba.

Các file tích hợp có sẵn được kiểm tra: `src/lib/cloudinary.ts`, `src/lib/imageUpload.ts`, `src/app/api/upload/route.ts`, các trang Admin `san-pham`, `banners`, `danh-muc`, `src/app/api/reviews/route.ts`, `src/context/DataContext.tsx` và schema đánh giá.

## Package

`cloudinary@2.11.0` đã được cài và khai báo trong package.json/package-lock.json. Lần này không cần cài thêm package.

## Biến môi trường cần có

Trong `.env.local` (đã có đủ):

```ini
CLOUDINARY_CLOUD_NAME=<cloud name>
CLOUDINARY_API_KEY=<api key>
CLOUDINARY_API_SECRET=<api secret>
```

Không dùng `NEXT_PUBLIC_` cho các biến này. Module Cloudinary có `server-only`; `.env.local` được Git bỏ qua. Khi triển khai, đặt cả ba biến trong cấu hình môi trường của hosting rồi triển khai lại. Không chép secret vào source hoặc tài liệu.

## Cách test

1. Khởi động app, đăng nhập Admin, mở `/admin/san-pham`, thêm hoặc sửa sản phẩm. Bấm nút kẹp giấy chọn ảnh chính/phụ; kiểm tra preview, đợi báo thành công, lưu. Tải lại trang và mở trang sản phẩm để kiểm tra ảnh vẫn còn.
2. Sửa sản phẩm đó, chọn ảnh mới, lưu và tải lại để kiểm tra URL mới. Thực hiện tương tự ở `/admin/banners` và `/admin/danh-muc`.
3. Đăng nhập khách hàng, mở sản phẩm → viết đánh giá → chọn 1–4 ảnh. Thử bỏ một ảnh, thêm lại, gửi và tải lại trang. Kiểm tra ảnh hiện cùng nhận xét và có thể mở lớn.
4. Thử ảnh trên 4 MB, tệp không phải ảnh và chọn quá 4 ảnh. Phải có thông báo lỗi. Khi đang upload, nút lưu/gửi phải bị khóa. Nếu mạng lỗi giữa nhiều ảnh, ảnh đã tải xong phải được giữ lại.
5. Kiểm tra tự động: `node scripts/test-image-upload.cjs`. Kiểm tra bản production: `node node_modules/next/dist/bin/next build`.

## Kết quả xác minh

- TypeScript và production build: đạt.
- ESLint cho component upload, helper và API upload: đạt.
- Kiểm tra API: đạt các trường hợp đăng nhập, phân quyền, kết quả thành công, sai MIME/chữ ký, tệp trống/quá lớn/trùng, multipart lỗi và không lộ lỗi nội bộ nhà cung cấp.
- Cloudinary authenticated ping: `ok`, cấu hình kết nối hợp lệ.
- Chưa kiểm thử thao tác trình duyệt và lưu ảnh thật xuyên suốt vào database trong lần này; làm theo các bước trên để xác nhận với tài khoản và dữ liệu thực tế.

Ảnh đã upload nhưng chưa lưu form vẫn có thể còn trên Cloudinary. Việc bỏ/thay ảnh trong form chỉ thay URL tham chiếu, không tự xóa tài nguyên đang có trên Cloudinary.
