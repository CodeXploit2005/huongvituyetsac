# Quên mật khẩu qua EmailJS

## Đã tích hợp

- Link Quên mật khẩu trên trang tài khoản dẫn tới `/quen-mat-khau`.
- Email → OTP 6 số → `/dat-lai-mat-khau` → đăng nhập lại.
- Form, lỗi, hướng dẫn, nội dung email hỗ trợ tiếng Việt và tiếng Anh theo lựa chọn của khách.
- Máy chủ sinh mã ngẫu nhiên, chỉ lưu HMAC; mã không trả về trình duyệt hoặc ghi log.
- OTP hết hạn sau 10 phút, tối đa 5 lần thử. Mã mới hủy mã cũ.
- Quyền đặt mật khẩu sau xác thực chỉ có hiệu lực 5 phút, dùng một lần, nằm trong cookie HttpOnly.
- Giới hạn yêu cầu theo email và tổng hệ thống, lưu trong MongoDB. Các bản ghi bảo mật tự hết hạn bằng TTL.
- Đổi mật khẩu xong hủy phiên đăng nhập cũ bằng sessionVersion. Không tự đăng nhập sau khi đổi.
- Trả thông báo chung khi email không tồn tại hoặc gửi thư thất bại để không tiết lộ tài khoản. Lỗi gửi thư được ghi ở máy chủ bằng HTTP status, không kèm email/OTP.

## Cấu hình EmailJS cần thực hiện trong tài khoản của chủ website

Service: `service_24ag3sa`

Template: `template_3i3qzrx`

1. Mở EmailJS → Account → Security và bật API cho ứng dụng không phải trình duyệt (non-browser applications). Đây là yêu cầu gửi từ máy chủ của EmailJS.
2. Mở template trên và đặt **To Email** thành `{{email}}`, **Subject** thành `{{subject}}`. Không điền cứng địa chỉ nhận thư, không thêm CC/BCC cho OTP.
3. Trong nội dung template hiện có, dùng `{{to_name}}` cho tên người nhận và `{{passcode}}` cho mã OTP 6 số, rồi lưu. Các biến bổ sung `heading`, `greeting`, `message`, `expiry_text`, `security_note` được máy chủ gửi theo ngôn ngữ.
4. Nếu tài khoản bật yêu cầu Private Key, thêm `EMAILJS_PRIVATE_KEY` vào biến môi trường của máy chủ. Không dùng tiền tố `NEXT_PUBLIC_`, không đưa Private Key vào code hoặc trình duyệt.
5. Sau khi cấu hình, chủ tài khoản thử gửi mã tới email của chính mình, nhập OTP và đặt mật khẩu mới. Không dùng tài khoản khách hàng để kiểm thử.

Tài liệu chính thức: https://www.emailjs.com/docs/rest-api/send/ và https://github.com/emailjs-com/emailjs-nodejs#usage

## Biến môi trường

Các ID bạn cung cấp và một khóa bảo vệ OTP ngẫu nhiên đã được thêm vào `.env.local` (được Git bỏ qua).
Khi triển khai, cần cấu hình cùng các tên biến trên dịch vụ hosting rồi triển khai lại:

- `EMAILJS_SERVICE_ID`
- `EMAILJS_TEMPLATE_ID`
- `EMAILJS_PUBLIC_KEY`
- `PASSWORD_RESET_SECRET`: chuỗi ngẫu nhiên tối thiểu 32 byte; dùng cùng giá trị giữa các máy chủ và giữ ổn định. Không dùng Public Key của EmailJS làm khóa này.
- `EMAILJS_PRIVATE_KEY`: nếu tài khoản EmailJS yêu cầu.

Không sao chép `.env.local` vào kho mã nguồn. Khóa reset không được thay đổi trong thời gian OTP đang có hiệu lực.

## Kiểm thử

`node scripts/test-password-reset.cjs`

Bộ kiểm thử chạy bằng kho dữ liệu và dịch vụ email giả lập, không tạo tài khoản, không ghi vào database thật và không gửi thư. Kiểm tra mã sai/hết hạn/dùng lại, giới hạn 5 lần, hủy mã cũ khi gửi lại, yêu cầu phải xác thực trước khi đổi, băm mật khẩu và tăng phiên bản phiên đăng nhập.

Gửi email thực tế chưa được xác nhận nếu template/quyền gửi từ máy chủ chưa được chủ tài khoản cấu hình.
