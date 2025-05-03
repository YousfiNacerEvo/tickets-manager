"use client"
import React, { useEffect, useState } from "react";
import { getTicketStats } from "@/services/ticketservice";
import { getDashboardState } from "@/services/ticketservice";
import { FaTicketAlt, FaCheckCircle, FaHourglassHalf, FaChartBar, FaUserCircle, FaHome } from "react-icons/fa";
import Link from "next/link";

export default function DashboardHome() {
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    pending: 0,
    open: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        const data = await getDashboardState();
        console.log("sttaattteee",data);
        setStats(data);
        // Récupérer l'email de l'utilisateur depuis le localStorage
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
          setUserEmail(user.email);
        }
      } catch (err) {
        setError("Erreur lors du chargement des statistiques");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Modern Navbar */}
      <nav className="w-full bg-white/90 backdrop-blur border-b border-gray-200 shadow-sm flex items-center justify-between px-8 py-3 sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition">
            <FaHome className="text-xl" />
            <span className="font-medium">Dashboard</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <button className="text-gray-500 hover:text-blue-600 transition text-2xl">
              <FaUserCircle />
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 hidden group-hover:block">
              <div className="px-4 py-2 text-sm text-gray-700">
                {userEmail}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-10">
        {error && <div className="text-red-600 mb-4">{error}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8 mb-12">
          <StatCard title="Tickets" value={stats.total} icon={<FaTicketAlt />} color="blue" loading={loading} />
          <StatCard title="Résolus" value={stats.resolved} icon={<FaCheckCircle />} color="green" loading={loading} />
          <StatCard title="En attente" value={stats.pending} icon={<FaHourglassHalf />} color="yellow" loading={loading} />
          <StatCard title="Ouverts" value={stats.open} icon={<FaChartBar />} color="purple" loading={loading} />
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="w-full bg-white/80 border-t border-gray-100 py-4 text-center text-gray-500 text-sm font-medium">
        TicketApp &copy; {new Date().getFullYear()} &middot; <a href="#" className="text-blue-600 hover:underline ml-1">Support</a>
      </footer>
    </div>
  );
}

function StatCard({ title, value, icon, color = "blue", loading }) {
  const colorMap = {
    blue: "text-blue-600 border-blue-600 bg-blue-50 hover:bg-blue-100",
    green: "text-green-600 border-green-600 bg-green-50 hover:bg-green-100",
    yellow: "text-yellow-500 border-yellow-500 bg-yellow-50 hover:bg-yellow-100",
    purple: "text-purple-600 border-purple-600 bg-purple-50 hover:bg-purple-100",
  };
  return (
    <div className={`rounded-2xl shadow-md p-8 flex items-center gap-6 border-b-4 transition-all duration-200 group ${colorMap[color]}`}
      style={{ minHeight: 120 }}
    >
      <div className={`text-4xl ${colorMap[color]} group-hover:scale-110 transition-transform`}>{icon}</div>
      <div>
        <div className="text-gray-800 font-bold text-lg mb-1">{title}</div>
        <div className="text-3xl font-extrabold tracking-tight">
          {loading ? <span className="animate-pulse text-gray-300">...</span> : value}
        </div>
      </div>
    </div>
  );
}
