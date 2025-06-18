import React from 'react';

export default function StepTicketInfo({ ticket, handleChange, handleNext }) {
  return (
    <div className="space-y-6 text-black">
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 01-8 0" /></svg>
          Title
        </label>
        <input
          type="text"
          name="title"
          value={ticket.title}
          maxLength={50}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm"
          required
        />
      </div>
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8" /></svg>
          Description
        </label>
        <textarea
          name="description"
          value={ticket.description}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm resize-none"
          rows="3"
          required
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <select
            name="priority"
            value={ticket.priority}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm"
          >
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type of the ticket</label>
          <select
            name="type"
            value={ticket.type}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm"
          >
            <option value="request">Request</option>
            <option value="incident">Incident</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
          <input
            type="text"
            value="open"
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <button type="button" onClick={handleNext} className="bg-blue-600 text-white px-8 py-2 rounded-lg hover:bg-blue-700 transition cursor-pointer font-semibold shadow">Next</button>
      </div>
    </div>
  );
} 