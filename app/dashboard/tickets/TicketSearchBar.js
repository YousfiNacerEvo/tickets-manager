import React from 'react';

export default function TicketSearchBar({ filters, setFilters }) {
  const clients = [
    "TDA Algerian VN", "AbuDhabi", "Sharjah", "NOC", "KSA", "Palastine", 
    "Egypt", "Dubai", "Oman", "Moroco", "Algeria", "Qatar", "Kuwait", 
    "Libya", "Mauritania", "HQ ASBU", "HUB", "Tunisia", "Iraq", 
    "Bahrain", "Sudan", "Jordan", "Teleliban"
  ];

  const stations = ["Radio", "TV", "HUB"];
  
  return (
    <div className="flex flex-wrap gap-4 mb-6 items-end text-black">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Ticket ID</label>
        <input
          type="text"
          value={filters.id || ''}
          onChange={e => setFilters(f => ({ ...f, id: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="ID"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Client</label>
        <select
          value={filters.client || ''}
          onChange={e => setFilters(f => ({ ...f, client: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Tous les clients</option>
          {clients.map((client) => (
            <option key={client} value={client}>
              {client}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Station</label>
        <select
          value={filters.station || ''}
          onChange={e => setFilters(f => ({ ...f, station: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">Toutes les stations</option>
          {stations.map((station) => (
            <option key={station} value={station}>
              {station}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
        <select
          value={filters.status || ''}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">All</option>
          <option value="open">Open</option>
          <option value="in_progress">in_progress</option>
          <option value="closed">Closed</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
        <select
          value={filters.priority || ''}
          onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">All</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
        <select
          value={filters.type || ''}
          onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">All</option>
          <option value="requeste">Requeste</option>
          <option value="incident">Incident</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Créé par (email)</label>
        <input
          type="text"
          value={filters.user_email || ''}
          onChange={e => setFilters(f => ({ ...f, user_email: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Email du créateur"
        />
      </div>
    </div>
  );
} 