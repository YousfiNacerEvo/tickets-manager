/**
 * Récupère toutes les informations d'un ticket par son ID
 * @param {string|number} ticketId
 * @param {string} token
 * @returns {Promise<Object>} Les informations du ticket
 */
export async function getTicketById(ticketId, token) {
  if (!token) throw new Error("Aucun token d'authentification trouvé. Veuillez vous reconnecter.");

  try {
    const response = await fetch(`http://localhost:5000/tickets/${ticketId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) throw new Error('Erreur lors de la récupération du ticket.');

    return await response.json();
  } catch (error) {
    console.error('Erreur backend:', error);
    throw error;
  }
}

// Utilitaire pour récupérer le token côté serveur ou client
function getToken() {
  if (typeof window !== 'undefined') {
    // Côté client
    return localStorage.getItem('token');
  } else {
    // Côté serveur (Next.js 13+)
    const { cookies } = require('next/headers');
    const cookieStore = cookies();
    return cookieStore.get('token')?.value;
  }
}

/**
 * Récupère tous les tickets depuis le backend
 * @returns {Promise<Array>} Liste des tickets
 */
export async function getAllTickets() {
  const token = getToken();
  if (!token) throw new Error("Aucun token d'authentification trouvé. Veuillez vous reconnecter.");

  try {
    const response = await fetch('http://localhost:5000/tickets', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    if (!response.ok) throw new Error('Erreur lors de la récupération des tickets.');
    return await response.json();
  } catch (error) {
    console.error('Erreur backend:', error);
    throw error;
  }
}

/**
 * Met à jour un ticket existant
 * @param {string|number} ticketId - ID du ticket à mettre à jour
 * @param {Object} ticketData - Nouvelles données du ticket
 * @returns {Promise<Object>} Le ticket mis à jour
 */
export async function updateTicket(ticketId, ticketData) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token) throw new Error("Aucun token d'authentification trouvé. Veuillez vous reconnecter.");

  try {
    const response = await fetch(`http://localhost:5000/tickets/${ticketId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(ticketData),
      cache: 'no-store',
    });

    if (!response.ok) throw new Error('Erreur lors de la mise à jour du ticket.');

    return await response.json();
  } catch (error) {
    console.error('Erreur backend:', error);
    throw error;
  }
}

// Fonction pour envoyer le ticket au backend
export async function sendTicketToBackend(ticketData) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token) throw new Error("Aucun token d'authentification trouvé. Veuillez vous reconnecter.");

  try {
    const response = await fetch('http://localhost:5000/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(ticketData),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error("Erreur lors de l'envoi du ticket.");
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur backend:', error);
    throw error;
  }
}
