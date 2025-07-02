"use client";
import { FaPlus, FaList, FaUserPlus, FaChartBar, FaHome, FaSignOutAlt, FaFileAlt } from "react-icons/fa";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logout } from "@/services/auth";
import Image from 'next/image';
import { useEffect, useState } from "react";

export default function Sidebar() {
  const [userEmail, setUserEmail] = useState(null);
  const [role, setRole] = useState(null);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const u = localStorage.getItem("user");
      let email = null;
      try {
        const parsed = JSON.parse(u);
        if (parsed && typeof parsed === "object" && parsed.email) {
          email = parsed.email;
        } else if (typeof parsed === "string") {
          email = parsed;
        }
      } catch {
        if (typeof u === "string") {
          email = u;
        }
      }
      setUserEmail(email);
      setRole(localStorage.getItem("role"));
    }
  }, []);
  const isAdmin = role === "admin";
  const menu = [
    { label: "Dashboard", icon: <FaChartBar />, href: "/dashboard" },
    { label: "Create Ticket", icon: <FaPlus />, href: "/dashboard/create" },
    { label: "Ticket Manager", icon: <FaList />, href: "/dashboard/tickets" },
    ...(isAdmin ? [
      { label: "Reporting", icon: <FaFileAlt />, href: "/dashboard/reporting" },
      { label: "Add Account", icon: <FaUserPlus />, href: "/dashboard/add-account" },
    ] : []),
  ];
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.clear();
    Logout();
    router.push('/Login');
  };

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col py-8 px-4 shadow-lg">
      <div className="mb-10 text-2xl font-bold text-blue-600 tracking-tight">
        <Image
          src="/logo.png"
          alt="Logo"
          width={200}
          height={200}
        >
        </Image>
      </div>
      {userEmail && (
        <div className="mb-6 flex items-center justify-center gap-2 text-sm text-blue-800 bg-blue-50 border border-blue-100 rounded p-2">
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 10a4 4 0 100-8 4 4 0 000 8zm0 2c-4 0-7 2-7 4v1a1 1 0 001 1h12a1 1 0 001-1v-1c0-2-3-4-7-4z"/>
          </svg>
          <span className="truncate">{userEmail}</span>
        </div>
      )}
      <nav className="flex-1 space-y-2">
        {menu.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${pathname === item.href
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
        onClick={() => router.push('/dashboard/help')}
        className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition mb-2"
      >
        <span className="text-lg"><FaHome /></span>
        <span>Help</span>
      </button>
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-gray-700 hover:bg-red-50 hover:text-red-700 transition mt-4"
      >
        <span className="text-lg"><FaSignOutAlt /></span>
        <span>Logout</span>
      </button>
      <div className="mt-auto text-xs text-gray-400 text-center pt-8">
        &copy; {new Date().getFullYear()} TicketApp
      </div>
    </aside>
  );
} 