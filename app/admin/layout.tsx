import { AdminSidebar } from "@/components/admin-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-950 text-white lg:flex">
      <AdminSidebar />
      <main className="flex-1 min-w-0 p-4 lg:p-6 overflow-y-auto w-full">
        <div className="w-full space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}
