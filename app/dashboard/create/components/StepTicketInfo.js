import React from 'react';

export default function StepTicketInfo({ ticket, handleChange, handleNext }) {
  return (
    <div className="space-y-6 text-black">
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 01-8 0" /></svg>
          Titre
        </label>
        <input
          type="text"
          name="title"
          value={ticket.title}
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
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm"
          rows="3"
          required
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
          <select
            name="priority"
            value={ticket.priority}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm"
          >
            <option value="low">Basse</option>
            <option value="medium">Moyenne</option>
            <option value="high">Haute</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type de ticket</label>
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
          <select
            name="status"
            value={ticket.status}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition shadow-sm"
          >
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="close">Close</option>
          </select>
        </div>
      </div>
      <div className="flex items-center mt-2">
        <button
          type="button"
          onClick={() => handleChange({ target: { name: 'waitingClient', checked: !ticket.waitingClient, type: 'checkbox' } })}
          className={`h-6 w-6 flex items-center justify-center rounded border-2 mr-2 transition-colors duration-150 cursor-pointer ${ticket.waitingClient ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}
          aria-pressed={ticket.waitingClient}
        >
          {ticket.waitingClient && (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          )}
        </button>
        <label
          htmlFor="waitingClient"
          className="text-sm text-gray-700 select-none cursor-pointer"
          onClick={() => handleChange({ target: { name: 'waitingClient', checked: !ticket.waitingClient, type: 'checkbox' } })}
        >
          Waiting client
        </label>
      </div>
      <div className="flex justify-end">
        <button type="button" onClick={handleNext} className="bg-blue-600 text-white px-8 py-2 rounded-lg hover:bg-blue-700 transition cursor-pointer font-semibold shadow">Next</button>
      </div>
    </div>
  );
} 