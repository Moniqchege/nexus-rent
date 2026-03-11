import Sidebar from "@/app/components/layout/Sidebar";
import type { ReactNode } from "react";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 ml-[220px] p-6">
        {children}
      </main>
    </div>
  );
}