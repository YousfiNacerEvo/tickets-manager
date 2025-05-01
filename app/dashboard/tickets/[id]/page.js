import { cookies } from 'next/headers';
import { getTicketById } from '@/services/ticketservice';
import TicketDetails from './TicketDetails';
import Link from 'next/link';

export default async function TicketPage({ params }) {
  // 1. Récupérer le token dans les cookies côté serveur
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  // 2. Vérifier la présence de l'id
  const { id } = params;
  if (!id) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
            <h1 className="text-2xl font-bold text-red-600">Erreur</h1>
            <p className="mt-2 text-gray-600">Aucun identifiant de ticket fourni.</p>
          </div>
        </div>
      </div>
    );
  }

  // 3. Appeler le service avec le token
  try {
    const ticket = await getTicketById(id, token);
    console.log('Tokenkqdjfqmsd:', ticket); // Debug: Afficher le token

    if (!ticket) {
      return (
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
              <h1 className="text-2xl font-bold text-red-600">Ticket non trouvé</h1>
              <p className="mt-2 text-gray-600">Le ticket que vous recherchez n'existe pas ou a été supprimé.</p>
            </div>
          </div>
        </div>
      );
    }

    return <TicketDetails ticket={ticket} />;
  } catch (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-xl shadow p-6 border border-gray-200">
            <h1 className="text-2xl font-bold text-red-600">Erreur</h1>
            <p className="mt-2 text-gray-600">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }
}