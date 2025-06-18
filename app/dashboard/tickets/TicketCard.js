import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TicketCard({ ticket }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    setIsLoading(true);
    router.push(`/dashboard/tickets/${ticket.id}`);
  };

  return (
    <div 
      onClick={handleClick}
      className="bg-white rounded-xl shadow p-6 flex flex-col gap-2 border border-gray-200 hover:shadow-lg hover:border-blue-500 cursor-pointer transition-all duration-200 relative"
    >
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
      <div className="flex flex-wrap justify-between items-center mb-2">
        <div className="font-bold text-lg text-blue-700">#{ticket.id}</div>
        <div className="text-xs text-gray-500">Créé le {ticket.updated_at ? (() => {
          const date = new Date(ticket.updated_at);
          date.setHours(date.getHours() ); // Soustraire une heure pour corriger le décalage UTC+1
          return date.toLocaleString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        })() : '-'}</div>
      </div>
      <div className="font-semibold text-2xl mb-1 text-black">{ticket.title}</div>
      <div className="flex flex-wrap gap-2 mb-2">
        <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-semibold">Priority: {ticket.priority}</span>
        <span className="px-2 py-1 rounded bg-green-50 text-green-700 text-xs font-semibold">Status: {ticket.status}</span>
        <span className="px-2 py-1 rounded bg-yellow-50 text-yellow-700 text-xs font-semibold">Type: {ticket.type}</span>
        {ticket.waitingClient && <span className="px-2 py-1 rounded bg-pink-100 text-pink-700 text-xs font-semibold">Waiting client</span>}
      </div>
      <div className="text-sm text-gray-600 mb-1">
        <span className="font-medium">Client :</span> {ticket.client_first_name} {ticket.client_last_name} | {ticket.client_email} | {ticket.client_phone}
      </div>
      {ticket.image && (
        <div className="mt-2">
          <img src={ticket.image} alt="Ticket" className="max-h-40 rounded shadow border" />
        </div>
      )}
      {ticket.user_id && (
        <div className="text-xs text-gray-500 mt-2">Créé par : {ticket.user_email}</div>
      )}
    </div>
  );
} 