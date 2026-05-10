import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token || !(await verifyToken(token))) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-neutral-400 mt-2">Willkommen.</p>
    </div>
  );
}