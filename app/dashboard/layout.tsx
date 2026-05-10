import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";

const CarIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-3m2 3l2-3m2 3l2-3m2 3l2-3m2 3l2-3M3 20l2-3m2 3l2-3m2 3l2-3m2 3l2-3m2 3l2-3" />
  </svg>
);

const VehiclesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const BrokerIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM4 20h16a1 1 0 001-1v-2a3 3 0 00-3-3H7a3 3 0 00-3 3v2a1 1 0 001 1z" />
  </svg>
);

const MatchesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4.243 4.243a4 4 0 105.656 5.656l4.243-4.243" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

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
    <div className="flex h-screen bg-[#09090b]">
      {/* Sidebar */}
      <aside className="w-60 bg-[#18181b] border-r border-[#27272a] flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-[#27272a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#8b5cf6] rounded-lg flex items-center justify-center">
              <CarIcon />
            </div>
            <h1 className="text-lg font-bold text-[#fafafa]">CarMatcher</h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavLink href="/dashboard" icon={<DashboardIcon />} label="Dashboard" />
          <NavLink href="/dashboard/fahrzeuge" icon={<VehiclesIcon />} label="Fahrzeuge" />
          <NavLink href="/dashboard/broker" icon={<BrokerIcon />} label="Broker" />
          <NavLink href="/dashboard/matches" icon={<MatchesIcon />} label="Matches" />
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-[#27272a]">
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full bg-[#27272a] hover:bg-[#3f3f46] text-[#fafafa] py-2.5 rounded-lg transition flex items-center justify-center gap-2"
            >
              <LogoutIcon />
              <span>Abmelden</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-[#09090b]">
        {children}
      </main>
    </div>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#8b5cf6]/10 transition border-l-2 border-transparent hover:border-[#8b5cf6]"
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </a>
  );
}
