"use client"
import React, { useEffect, useState } from 'react';
import { getAllTickets, getClientToken } from '@/services/ticketservice';
import TicketSearchBar from './TicketSearchBar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TicketsListPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ 
    id: '', 
    client: '', 
    station: '', 
    status: '', 
    priority: '', 
    type: '',
    user_email: '',
    clientCustom: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingTicketId, setLoadingTicketId] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');
  const ticketsPerPage = 10;
  const router = useRouter();

  useEffect(() => {
    async function fetchTickets() {
      setLoading(true);
      setError(null);
      try {
        const token = getClientToken();
        console.log('TOKEN CLIENT TicketsListPage:', token);
        const data = await getAllTickets(token);
        console.log('Tickets data:', data);
        const sortedTickets = data.sort((a, b) => {
          const dateA = new Date(a.created_at);
          const dateB = new Date(b.created_at);
          return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });
        setTickets(sortedTickets);
      } catch (err) {
        console.error('Error TicketsListPage:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchTickets();

    // Ajouter un écouteur pour le focus de la fenêtre
    const handleFocus = () => {
      fetchTickets();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [sortOrder]);

  const filteredTickets = tickets.filter(ticket => {
    const matchId = filters.id ? String(ticket.id).includes(filters.id) : true;
    const matchClient = filters.client ? ticket.client === filters.client : true;
    const matchClientCustom = filters.clientCustom ? (ticket.client || '').toLowerCase().includes(filters.clientCustom.toLowerCase()) : true;
    const matchStation = filters.station ? ticket.station === filters.station : true;
    const matchStatus = filters.status ? ticket.status === filters.status : true;
    const matchPriority = filters.priority ? ticket.priority === filters.priority : true;
    const matchType = filters.type ? ticket.type === filters.type : true;
    const matchUserEmail = filters.user_email ? (ticket.user_email || '').toLowerCase().includes(filters.user_email.toLowerCase()) : true;
    return matchId && matchClient && matchClientCustom && matchStation && matchStatus && matchPriority && matchType && matchUserEmail;
  });

  const indexOfLastTicket = currentPage * ticketsPerPage;
  const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage;
  const currentTickets = filteredTickets.slice(indexOfFirstTicket, indexOfLastTicket);
  const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '--';
    try {
      // Convert UTC date to Date object
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '--';
      // No UTC+1 correction
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return '--';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleTicketClick = (ticketId) => {
    setLoadingTicketId(ticketId);
    router.push(`/dashboard/tickets/${ticketId}`);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTM2IDM0YzAtMS4xLS45LTItMi0ycy0yIC45LTIgMiAuOSAyIDIgMiAyLS45IDItMnptMi0xMmMwLTEuMS0uOS0yLTItMnMtMiAuOS0yIDIgLjkgMiAyIDIgMi0uOSAyLTJ6bTAgMTJjMC0xLjEtLjktMi0yLTJzLTIgLjktMiAyIC45IDIgMiAyIDItLjkgMi0yem0tMi0xMmMwLTEuMS0uOS0yLTItMnMtMiAuOS0yIDIgLjkgMiAyIDIgMi0uOSAyLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
      </div>

      {/* Content */}
      <div className="relative p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-800 rounded-lg hover:bg-white transition-colors duration-200 shadow-sm"
            >
              ← Back to dashboard
            </Link>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-800 rounded-lg hover:bg-white transition-colors duration-200 shadow-sm flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                {sortOrder === 'desc' ? 'Newest first' : 'oldest first'}
              </button>
              <h1 className="text-2xl font-bold text-gray-800">Ticket list</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mb-4">
            <TicketSearchBar filters={filters} setFilters={setFilters} />
          </div>
          {loading && <div className="text-center text-gray-500">Loading...</div>}
          {!loading && !error && currentTickets.length === 0 && (
            <div className="text-center text-gray-400">No tickets found.</div>
          )}
          
          {!loading && !error && currentTickets.length > 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden border border-gray-100">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50/80">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Station</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waiting Client</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date of creation</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date of closure</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created by</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentTickets.map((ticket) => (
                      <tr 
                        key={ticket.id}
                        className="hover:bg-gray-50/80 cursor-pointer transition-colors duration-150 relative"
                        onClick={() => handleTicketClick(ticket.id)}
                      >
                        {loadingTicketId === ticket.id && (
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                              <span className="text-sm text-gray-600">Loading...</span>
                            </div>
                          </div>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{ticket.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {ticket.title}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {ticket.client}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {ticket.station}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                            {ticket.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.waiting_client ? 'Yes' : 'No'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(ticket.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {ticket.status === 'closed' ? formatDate(ticket.closed_at) : '--'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.user_email || '--'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination controls */}
          {!loading && !error && filteredTickets.length > 0 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg ${
                  currentPage === 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white/80 backdrop-blur-sm text-gray-800 hover:bg-white transition-colors duration-200 shadow-sm'
                }`}
              >
                Previous
              </button>
              <span className="text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg ${
                  currentPage === totalPages
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white/80 backdrop-blur-sm text-gray-800 hover:bg-white transition-colors duration-200 shadow-sm'
                }`}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}