import React from 'react';

export default function TicketSearchBar({ filters, setFilters }) {
  
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
        <label className="block text-xs font-medium text-gray-700 mb-1">User name</label>
        <input
          type="text"
          value={filters.user || ''}
          onChange={e => setFilters(f => ({ ...f, user: e.target.value }))}
          className="px-3 py-2 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="User name"
        />
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
          <option value="pending">Pending</option>
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
          <option value="request">Request</option>
          <option value="incident">Incident</option>
        </select>
      </div>
    </div>
  );
} 