"use client";
import { FaPlus, FaList, FaUserPlus, FaChartBar, FaHome, FaSignOutAlt } from "react-icons/fa";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logout } from "@/services/auth";

const menu = [
  { label: "Dashboard", icon: <FaChartBar />, href: "/dashboard" },
  { label: "Create Ticket", icon: <FaPlus />, href: "/dashboard/create" },
  { label: "Ticket Manager", icon: <FaList />, href: "/dashboard/tickets" },
  { label: "Add Account", icon: <FaUserPlus />, href: "/dashboard/add-account" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    Logout();
    router.push('/Login');
  };

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col py-8 px-4 shadow-lg">
      <div className="mb-10 text-2xl font-bold text-blue-600 tracking-tight">TicketApp</div>
      <nav className="flex-1 space-y-2">
        {menu.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
              pathname === item.href
                ? "bg-blue-600 text-white shadow"
                : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 transition mt-4"
      >
        <span className="text-lg"><FaSignOutAlt /></span>
        <span>Déconnexion</span>
      </button>
      <div className="mt-auto text-xs text-gray-400 text-center pt-8">
        &copy; {new Date().getFullYear()} TicketApp
      </div>
    </aside>
  );
} 