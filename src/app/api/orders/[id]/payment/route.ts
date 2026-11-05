import { NextResponse } from "next/server";

// Khách hàng không được tự đánh dấu đã thanh toán. Admin phải đối soát tiền
// thực nhận rồi xác nhận trong phần quản lý đơn hàng.
export async function POST() {
  return NextResponse.json(
    { error: "Thanh toán đang chờ Admin kiểm tra và xác nhận." },
    { status: 403 },
  );
}
