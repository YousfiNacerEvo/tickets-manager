import { cookies } from 'next/headers';
import { getTicketById } from '@/services/ticketservice';
import TicketDetails from './TicketDetails';
import Link from 'next/link';

export default async function TicketPage({ params }) {
  const { id } = await params;
  // Récupérer le token dans les cookies côté serveur
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  console.log('TOKEN SERVEUR:', token); // <-- Ce log s'affichera dans le terminal

  if (!token) {
    const ticketUrl = `https://tickets-manager-kappa.vercel.app/dashboard/tickets/${id}`;
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
            <h1 className="text-2xl font-bold text-red-600">Authentication required</h1>
            <p className="mt-2 text-gray-600">You must be logged in to access this ticket.</p>
            <p className="mt-2 text-gray-600">After logging in, you will be automatically redirected to this ticket.</p>
            <Link href={`/Login?redirectTo=${encodeURIComponent(ticketUrl)}`} className="text-blue-600 hover:underline mt-4 inline-block">Log in</Link>
          </div>
        </div>
      </div>
    );
  }

  try {
    const ticket = await getTicketById(id, token);
    return <TicketDetails ticket={ticket} />;
  } catch (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
            <h1 className="text-2xl font-bold text-red-600">Error</h1>
            <p className="mt-2 text-gray-600">{error.message}</p>
            <Link href="/dashboard/tickets" className="text-blue-600 hover:underline mt-4 inline-block">Back to ticket list</Link>
          </div>
        </div>
      </div>
    );
  }
}