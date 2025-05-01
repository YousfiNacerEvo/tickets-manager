"use client"
import React, { useEffect, useState } from 'react';
import { getAllTickets } from '@/services/ticketservice';
import TicketCard from './TicketCard';
import TicketSearchBar from './TicketSearchBar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TicketsListPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ id: '', user: '', status: '', priority: '', type: '' });
  const router = useRouter();

  useEffect(() => {
    async function fetchTickets() {
      setLoading(true);
      setError(null);
      try {
        const data = await getAllTickets();
        setTickets(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchTickets();
  }, []);

  // Filtrage côté frontend
  const filteredTickets = tickets.filter(ticket => {
    const matchId = filters.id ? String(ticket.id).includes(filters.id) : true;
    const fullName = `${ticket.client_first_name || ''} ${ticket.client_last_name || ''}`.trim().toLowerCase();
    const matchUser = filters.user
      ? fullName.includes(filters.user.toLowerCase())
      : true;
    const matchStatus = filters.status ? ticket.status === filters.status : true;
    const matchPriority = filters.priority ? ticket.priority === filters.priority : true;
    const matchType = filters.type ? ticket.type === filters.type : true;
    return matchId && matchUser && matchStatus && matchPriority && matchType;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors duration-200"
          >
            ← Back to dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Ticket list</h1>
        </div>
        <div className="flex flex-wrap gap-4 mb-4">
          <TicketSearchBar filters={filters} setFilters={setFilters} />
        </div>
        {loading && <div className="text-center text-gray-500">Loading...</div>}
        {error && <div className="text-center text-red-500">{error}</div>}
        {!loading && !error && filteredTickets.length === 0 && (
          <div className="text-center text-gray-400">No tickets found.</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {filteredTickets.map(ticket => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      </div>
    </div>
  );
} 