import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token || !(await verifyToken(token))) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-neutral-950">
      {/* Sidebar */}
      <aside className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-neutral-800">
          <h1 className="text-xl font-bold text-white">CarMatcher</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavLink href="/dashboard" label="Dashboard" />
          <NavLink href="/dashboard/fahrzeuge" label="Fahrzeuge" />
          <NavLink href="/dashboard/broker" label="Broker" />
          <NavLink href="/dashboard/matches" label="Matches" />
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-neutral-800">
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full bg-neutral-800 hover:bg-neutral-700 text-white py-2 rounded-lg transition"
            >
              Abmelden
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-neutral-950">
        {children}
      </main>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block px-4 py-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
    >
      {label}
    </Link>
  );
}
