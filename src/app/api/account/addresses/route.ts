import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/authSession";
import { User } from "@/models";

const MAX_ADDRESSES = 10;

const cleanText = (value: unknown, maxLength: number) =>
  String(value ?? "").trim().slice(0, maxLength);

async function saveAddress(req: Request, editing: boolean) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Vui lòng đăng nhập để lưu địa chỉ." }, { status: 401 });
    }

    const body = await req.json();
    const addressId = cleanText(body.addressId, 100);
    if (editing && !addressId) return NextResponse.json({ error: "Địa chỉ không hợp lệ." }, { status: 400 });
    const address = {
      id: editing ? addressId : randomUUID(),
      label: cleanText(body.label, 50) || "Nhà riêng",
      receiverName: cleanText(body.receiverName, 100),
      phone: cleanText(body.phone, 20),
      address: cleanText(body.address, 300),
      province: cleanText(body.province, 100),
      isDefault: Boolean(body.isDefault),
    };

    if (!address.receiverName || !address.phone || !address.address || !address.province) {
      return NextResponse.json({ error: "Vui lòng nhập đầy đủ thông tin địa chỉ." }, { status: 400 });
    }
    if (!/^\d{10}$/.test(address.phone)) {
      return NextResponse.json({ error: "Số điện thoại phải gồm đúng 10 chữ số." }, { status: 400 });
    }

    const updatedUser = await User.findOneAndUpdate(
      editing ? { _id: currentUser._id, "addresses.id": addressId } : { _id: currentUser._id, [`addresses.${MAX_ADDRESSES - 1}`]: { $exists: false } },
      editing ? { $set: {
        "addresses.$.label": address.label,
        "addresses.$.receiverName": address.receiverName,
        "addresses.$.phone": address.phone,
        "addresses.$.address": address.address,
        "addresses.$.province": address.province,
      } } : { $push: { addresses: address } },
      { new: true, runValidators: true },
    ).select("addresses").lean();

    if (!updatedUser) {
      if (editing) return NextResponse.json({ error: "Không tìm thấy địa chỉ cần sửa." }, { status: 404 });
      return NextResponse.json({ error: `Mỗi tài khoản chỉ được lưu tối đa ${MAX_ADDRESSES} địa chỉ.` }, { status: 409 });
    }

    return NextResponse.json({ success: true, addresses: updatedUser.addresses }, { status: editing ? 200 : 201 });
  } catch (error: unknown) {
    console.error("POST /api/account/addresses error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không thể lưu địa chỉ." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) { return saveAddress(req, false); }
export async function PUT(req: Request) { return saveAddress(req, true); }

export async function DELETE(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Vui lòng đăng nhập để xóa địa chỉ." }, { status: 401 });
    }

    const { addressId } = await req.json();
    const id = cleanText(addressId, 100);
    if (!id) {
      return NextResponse.json({ error: "Địa chỉ không hợp lệ." }, { status: 400 });
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: currentUser._id, "addresses.id": id },
      { $pull: { addresses: { id } } },
      { new: true },
    ).select("addresses").lean();

    if (!updatedUser) {
      return NextResponse.json({ error: "Không tìm thấy địa chỉ cần xóa." }, { status: 404 });
    }

    return NextResponse.json({ success: true, addresses: updatedUser.addresses });
  } catch (error: unknown) {
    console.error("DELETE /api/account/addresses error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không thể xóa địa chỉ." },
      { status: 500 },
    );
  }
}
