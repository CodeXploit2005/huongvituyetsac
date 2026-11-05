import React from "react";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { getCurrentUser } from "@/lib/authSession";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/tai-khoan");
  if (user.role !== "admin") redirect("/");

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 dark:bg-[#0a0d14] dark:text-stone-100 flex flex-col lg:flex-row transition-colors duration-300">
      <AdminSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-[1440px] w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
