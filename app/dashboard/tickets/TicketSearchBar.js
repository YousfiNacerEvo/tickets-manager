import React from 'react';

export default function TicketSearchBar({ filters, setFilters }) {
  const clients = [
    "TDA Algerian VN", "AbuDhabi", "Sharjah", "NOC", "KSA", "Palastine", 
    "Egypt", "Dubai", "Oman", "Moroco", "Algeria", "Qatar", "Kuwait", 
    "Libya", "Mauritania", "HQ ASBU", "HUB", "Tunisia", "Iraq", 
    "Bahrain", "Sudan", "Jordan", "Teleliban"
  ];

  const stations = ["Radio", "TV", "HUB"];
  
  // Fonction pour reset tous les filtres
  const handleReset = () => {
    setFilters({
      id: '',
      client: '',
      clientCustom: '',
      station: '',
      status: '',
      priority: '',
      type: '',
      user_email: ''
    });
  };

  // Affichage conditionnel du champ client
  const showCustomClient = filters.client === 'other';

  return (
    <div className="bg-white/90 border border-gray-200 rounded-xl shadow-sm p-3 mb-4 w-full max-w-2xl mx-auto text-black">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-bold text-blue-900 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          Ticket Filters
        </h2>
        <button
          onClick={handleReset}
          className="px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 border border-gray-300 text-xs"
        >
          Reset
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Ticket ID</label>
          <input
            type="text"
            value={filters.id || ''}
            onChange={e => setFilters(f => ({ ...f, id: e.target.value }))}
            className="px-2 py-1 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-400 w-full text-sm"
            placeholder="ID"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Client</label>
          {!showCustomClient ? (
            <select
              value={filters.client || ''}
              onChange={e => setFilters(f => ({ ...f, client: e.target.value, clientCustom: '' }))}
              className="px-2 py-1 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-400 w-full text-sm"
            >
              <option value="">All clients</option>
              {clients.map((client) => (
                <option key={client} value={client}>
                  {client}
                </option>
              ))}
              <option value="other">Other</option>
            </select>
          ) : (
            <>
              <input
                type="text"
                value={filters.clientCustom || ''}
                onChange={e => setFilters(f => ({ ...f, clientCustom: e.target.value }))}
                className="px-2 py-1 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-400 w-full text-sm"
                placeholder="Search any client"
                autoFocus
              />
              <div className="text-xs text-blue-600 mt-1 cursor-pointer underline" onClick={() => setFilters(f => ({ ...f, client: '', clientCustom: '' }))}>
                Back to list
              </div>
            </>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Station</label>
          <select
            value={filters.station || ''}
            onChange={e => setFilters(f => ({ ...f, station: e.target.value }))}
            className="px-2 py-1 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-400 w-full text-sm"
          >
            <option value="">All stations</option>
            {stations.map((station) => (
              <option key={station} value={station}>
                {station}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
          <select
            value={filters.status || ''}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            className="px-2 py-1 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-400 w-full text-sm"
          >
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Priority</label>
          <select
            value={filters.priority || ''}
            onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}
            className="px-2 py-1 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-400 w-full text-sm"
          >
            <option value="">All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Type</label>
          <select
            value={filters.type || ''}
            onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
            className="px-2 py-1 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-400 w-full text-sm"
          >
            <option value="">All</option>
            <option value="request">Request</option>
            <option value="incident">Incident</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Created by (email)</label>
          <input
            type="text"
            value={filters.user_email || ''}
            onChange={e => setFilters(f => ({ ...f, user_email: e.target.value }))}
            className="px-2 py-1 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-400 w-full text-sm"
            placeholder="Email of the creator"
          />
        </div>
      </div>
    </div>
  );
} 