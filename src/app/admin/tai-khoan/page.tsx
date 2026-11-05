"use client";

import { useEffect, useState } from "react";
import { Search, ShieldCheck, Trash2, UserCog, Users } from "lucide-react";

type ManagedUser = {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  createdAt: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const filteredUsers = users.filter((user) => [user.name, user.email, user.role].join(" ").toLocaleLowerCase("vi").includes(searchQuery.trim().toLocaleLowerCase("vi")));

  useEffect(() => {
    fetch("/api/admin/users", { cache: "no-store" })
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => {
        if (ok) {
          setUsers(data.users);
          setCurrentUserId(data.currentUserId);
        } else {
          setMessage(data.error || "Không thể tải danh sách tài khoản.");
        }
      })
      .catch(() => setMessage("Không thể tải danh sách tài khoản."))
      .finally(() => setLoading(false));
  }, []);

  const changeRole = async (userId: string, role: "admin" | "user") => {
    setMessage("");
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    const data = await res.json();
    if (!res.ok) return setMessage(data.error || "Không thể cập nhật quyền.");
    setUsers((items) => items.map((item) => (item._id === userId ? data.user : item)));
    setMessage("Đã cập nhật quyền tài khoản.");
  };

  const removeUser = async (user: ManagedUser) => {
    if (!confirm(`Xóa vĩnh viễn tài khoản ${user.email}?`)) return;
    setMessage("");
    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user._id }),
    });
    const data = await res.json();
    if (!res.ok) return setMessage(data.error || "Không thể xóa tài khoản.");
    setUsers((items) => items.filter((item) => item._id !== user._id));
    setMessage("Đã xóa tài khoản.");
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-wider">
          <UserCog size={16} /> Phân quyền hệ thống
        </div>
        <h1 className="mt-2 text-3xl sm:text-4xl font-black text-stone-950 dark:text-white">Quản Lý Tài Khoản</h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">Chỉ tài khoản Admin mới có thể truy cập khu vực quản trị.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-lg">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 text-stone-950 shadow-sm dark:border-[#273044] dark:bg-[#111722] dark:text-white">
          <Users className="text-blue-600 dark:text-blue-400" size={20} />
          <div className="mt-2 text-2xl font-black text-stone-950 dark:text-white">{users.length}</div>
          <div className="text-xs text-stone-600 dark:text-stone-400">Tổng tài khoản</div>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4 text-stone-950 shadow-sm dark:border-[#273044] dark:bg-[#111722] dark:text-white">
          <ShieldCheck className="text-amber-600 dark:text-amber-400" size={20} />
          <div className="mt-2 text-2xl font-black text-stone-950 dark:text-white">{users.filter((u) => u.role === "admin").length}</div>
          <div className="text-xs text-stone-600 dark:text-stone-400">Quản trị viên</div>
        </div>
      </div>

      {message && <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">{message}</div>}

      <label className="relative block max-w-xl">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
        <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Tìm theo tên, email hoặc quyền tài khoản..." className="w-full rounded-2xl border border-stone-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 dark:border-[#273044] dark:bg-[#111722] dark:text-white" />
      </label>

      <div className="overflow-x-auto rounded-3xl border border-stone-200 bg-white shadow-sm dark:border-[#273044] dark:bg-[#111722] dark:shadow-none">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="select-none border-b border-stone-200 bg-stone-50/80 text-xs uppercase text-stone-600 dark:border-[#273044] dark:bg-transparent dark:text-stone-400">
            <tr><th className="p-4">Tài khoản</th><th className="p-4">Ngày tạo</th><th className="p-4">Quyền</th><th className="p-4 text-right">Thao tác</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="p-10 text-center text-stone-500 dark:text-stone-400">Đang tải tài khoản...</td></tr>
            ) : filteredUsers.length ? filteredUsers.map((user) => {
              const isCurrent = user._id === currentUserId;
              return (
                <tr key={user._id} className="border-b border-stone-200 transition-colors last:border-0 hover:bg-stone-50 dark:border-[#20283a] dark:hover:bg-[#151b2a]">
                  <td className="p-4"><div className="font-bold text-stone-950 dark:text-white">{user.name}</div><div className="text-xs text-stone-600 dark:text-stone-400">{user.email}</div>{isCurrent && <span className="mt-1 inline-block text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Đang đăng nhập</span>}</td>
                  <td className="p-4 text-stone-700 dark:text-stone-300">{new Date(user.createdAt).toLocaleDateString("vi-VN")}</td>
                  <td className="p-4">
                    <select value={user.role} disabled={isCurrent} onChange={(e) => void changeRole(user._id, e.target.value as "admin" | "user")} className="rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 font-bold text-stone-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#33405a] dark:bg-[#0a0d14] dark:text-white">
                      <option value="user">User</option><option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="p-4 text-right"><button disabled={isCurrent} onClick={() => void removeUser(user)} className="rounded-xl p-2 text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-30" title="Xóa tài khoản"><Trash2 size={17} /></button></td>
                </tr>
              );
            }) : <tr><td colSpan={4} className="p-10 text-center text-stone-500">Không tìm thấy tài khoản phù hợp.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
