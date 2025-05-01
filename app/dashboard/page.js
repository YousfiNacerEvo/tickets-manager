"use client"
import React from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  // Données fictives pour l'exemple
  const username = "username";
  const stats = {
    closed: 32,
    pending: 20,
    open: 10,
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-[#181C26]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="bg-white rounded px-4 py-1 font-bold text-sm">LOGO</div>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-gray-300 hover:text-white">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
            </button>
            <button className="text-gray-300 hover:text-white">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            </button>
            <div className="w-8 h-8 rounded-full bg-purple-400 flex items-center justify-center text-white font-bold">M</div>
          </div>
        </div>
        <div className="bg-blue-500 h-2"></div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center px-4 pb-8 text-black">
        <div className="w-full max-w-5xl mt-8">
         
          {/* Stats */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 border border-gray-300 rounded-lg bg-white p-6 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold">{stats.closed}</span>
              <span className="text-green-600 font-semibold ml-1">Closed</span> <span className="text-gray-700">tickets</span>
            </div>
            <div className="flex-1 border border-gray-300 rounded-lg bg-white p-6 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold">{stats.pending}</span>
              <span className="text-yellow-500 font-semibold ml-1">Pending</span> <span className="text-gray-700">tickets</span>
            </div>
            <div className="flex-1 border rounded-lg border-gray-300 bg-white p-6 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold">{stats.open}</span>
              <span className="text-red-500 font-semibold ml-1">Open</span> <span className="text-gray-700">tickets</span>
            </div>
          </div>

          

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            {/* Create ticket */}
            <div
              onClick={() => router.push('/dashboard/create')}
              className="border border-gray-300 rounded-xl bg-blue-50 hover:bg-blue-100 cursor-pointer p-8 flex flex-col items-center transition group"
            >
              <span className="text-xl font-semibold mb-4">Create ticket</span>
              <svg className="w-20 h-20 text-blue-400 group-hover:text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v8M8 12h8"/>
              </svg>
            </div>
            {/* Manage tickets */}
            <div
              onClick={() => router.push('/dashboard/tickets')}
              className="border border-gray-300 rounded-xl bg-green-50 hover:bg-green-100 cursor-pointer p-8 flex flex-col items-center transition group"
            >
              <span className="text-xl font-semibold mb-4">Manage tickets</span>
              <svg className="w-20 h-20 text-green-400 group-hover:text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="6" y="8" width="12" height="12" rx="2"/>
                <path d="M9 12h6M9 16h6"/>
              </svg>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-300 text-center py-4 text-gray-700 font-medium">Footer</footer>
    </div>
  );
}
