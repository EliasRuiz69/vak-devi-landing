import { redirect } from "next/navigation";
import { createAuthClient } from "@/lib/supabase-server";
import Sidebar from "@/components/admin/Sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex h-screen bg-lavender overflow-hidden">
      <Sidebar userEmail={user.email ?? ""} />
      <main className="flex-1 overflow-y-auto pt-12 lg:pt-0">{children}</main>
    </div>
  );
}
