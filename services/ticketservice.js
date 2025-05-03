const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Récupère toutes les informations d'un ticket par son ID
 * @param {string|number} ticketId
 * @param {string} token
 * @returns {Promise<Object>} Les informations du ticket
 */
export async function getTicketById(ticketId, token) {
  if (!token) throw new Error("Aucun token d'authentification trouvé. Veuillez vous reconnecter.");

  try {
    const response = await fetch(`${API_URL}/tickets/${ticketId}`, {
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
    const response = await fetch(`${API_URL}/tickets`, {
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
  const token = getToken();
  if (!token) throw new Error("Aucun token d'authentification trouvé. Veuillez vous reconnecter.");

  try {
    const response = await fetch(`${API_URL}/tickets/${ticketId}`, {
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

/**
 * Upload une image pour un ticket
 * @param {File} imageFile - Le fichier image à uploader
 * @returns {Promise<string>} L'URL de l'image uploadée
 */
export async function uploadTicketImage(imageFile) {
  const token = getToken();
  if (!token) throw new Error("Aucun token d'authentification trouvé. Veuillez vous reconnecter.");

  const formData = new FormData();
  formData.append('image', imageFile);

  try {
    const response = await fetch(`${API_URL}/tickets/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) throw new Error('Erreur lors de l\'upload de l\'image.');

    const data = await response.json();
    return `http://localhost:5000${data.imageUrl}`;
  } catch (error) {
    console.error('Erreur backend:', error);
    throw error;
  }
}

// Fonction pour envoyer le ticket au backend
export async function sendTicketToBackend(ticketData) {
  const token = getToken();
  if (!token) throw new Error("Aucun token d'authentification trouvé. Veuillez vous reconnecter.");

  try {
    // Si une image est présente, on l'upload d'abord
    let imageUrl = null;
    if (ticketData.image instanceof File) {
      imageUrl = await uploadTicketImage(ticketData.image);
    }

    // On crée une copie des données du ticket sans l'image
    const { image, ...ticketDataWithoutImage } = ticketData;
    
    // On ajoute l'URL de l'image si elle existe
    const finalTicketData = {
      ...ticketDataWithoutImage,
      ...(imageUrl && { image: imageUrl }),
    };

    const response = await fetch(`${API_URL}/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(finalTicketData),
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

export async function getTicketStats() {
  const token = getToken();
  if (!token) throw new Error("Aucun token d'authentification trouvé. Veuillez vous reconnecter.");

  try {
    const response = await fetch(`${API_URL}/tickets`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    
    if (!response.ok) throw new Error('Erreur lors de la récupération des statistiques.');
    
    const tickets = await response.json();
    
    // Calculer les statistiques quotidiennes (tickets résolus)
    const dailyStats = tickets
      .filter(ticket => ticket.status === 'closed')
      .reduce((acc, ticket) => {
        const date = new Date(ticket.updated_at).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

    const daily = Object.entries(dailyStats)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculer les statistiques mensuelles
    const monthlyStats = tickets.reduce((acc, ticket) => {
      const month = new Date(ticket.created_at).toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    const monthly = Object.entries(monthlyStats)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => {
        const [monthA, yearA] = a.month.split(' ');
        const [monthB, yearB] = b.month.split(' ');
        return new Date(`${yearA}-${monthA}`) - new Date(`${yearB}-${monthB}`);
      });

    // Calculer les statistiques par type
    const byType = tickets.reduce((acc, ticket) => {
      acc[ticket.type] = (acc[ticket.type] || 0) + 1;
      return acc;
    }, {});

    // Calculer les statistiques par priorité
    const byPriority = tickets.reduce((acc, ticket) => {
      acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
      return acc;
    }, {});

    return {
      daily,
      monthly,
      byType,
      byPriority,
    };
  } catch (error) {
    console.error('Erreur backend:', error);
    throw error;
  }
} 

export async function getDashboardState() {
  const token = getToken();
  if (!token) throw new Error("Aucun token d'authentification trouvé. Veuillez vous reconnecter.");
  console.log("request envoyeeeeeeeeeeee")
  try {
    const response = await fetch(`${API_URL}/states`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      console.error('Erreur de réponse:', response.status, response.statusText);
      throw new Error('Erreur lors de la récupération des états des tickets.');
    }
    
    const states = await response.json();
    console.log('Réponse de l\'API:', states);

    // Si la réponse est null ou undefined, retourner des valeurs par défaut
    if (!states) {
      console.warn('La réponse de l\'API est null ou undefined');
      return {
        total: 0,
        resolved: 0,
        pending: 0,
        open: 0
      };
    }

    // Formatage des statistiques pour le dashboard
    return states

  } catch (error) {
    console.error('Erreur détaillée:', error);
    // En cas d'erreur, retourner des valeurs par défaut
    return {
      total: 0,
      resolved: 0,
      pending: 0,
      open: 0
    };
  }
}