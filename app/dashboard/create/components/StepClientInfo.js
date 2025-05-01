import React from 'react';

export default function StepClientInfo({ ticket, handleChange, handleNext, handlePrev }) {
  return (
    <div className="space-y-6 text-black">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Nom
          </label>
          <input
            type="text"
            name="clientLastName"
            value={ticket.clientLastName}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition shadow-sm"
            required
          />
        </div>
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Prénom
          </label>
          <input
            type="text"
            name="clientFirstName"
            value={ticket.clientFirstName}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition shadow-sm"
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10a9 9 0 0118 0c0 7-9 13-9 13S3 17 3 10z" /></svg>
            Téléphone
          </label>
          <input
            type="tel"
            name="clientPhone"
            value={ticket.clientPhone}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition shadow-sm"
            required
          />
        </div>
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 01-8 0 4 4 0 018 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 16v2m0 4h.01" /></svg>
            Email
          </label>
          <input
            type="email"
            name="clientEmail"
            value={ticket.clientEmail}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition shadow-sm"
            required
          />
        </div>
      </div>
      <div className="flex justify-between">
        <button type="button" onClick={handlePrev} className="bg-gray-200 text-gray-800 px-8 py-2 rounded-lg hover:bg-gray-300 transition cursor-pointer font-semibold shadow">Previous</button>
        <button type="button" onClick={handleNext} className="bg-blue-600 text-white px-8 py-2 rounded-lg hover:bg-blue-700 transition cursor-pointer font-semibold shadow">Next</button>
      </div>
    </div>
  );
} 