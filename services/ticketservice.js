const API_URL = "https://gestion-ticket-back-3.onrender.com"

/**
 * Récupère toutes les informations d'un ticket par son ID
 * @param {string|number} ticketId
 * @param {string} token
 * @returns {Promise<Object>} Les informations du ticket
 */
export async function getTicketById(ticketId, token) {
  if (!token) throw new Error("Aucun token d'authentification trouvé. Veuillez vous reconnecter.");

  try {
    const response = await fetch(`https://gestion-ticket-back-78nj.onrender.com/tickets/${ticketId}`, {
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

  try {//https://gestion-ticket-back-3.onrender.com/tickets
    const response = await fetch(`https://gestion-ticket-back-78nj.onrender.com/tickets`, {
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
    const response = await fetch(`https://gestion-ticket-back-78nj.onrender.com/tickets/${ticketId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(ticketData),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de la mise à jour du ticket.');
    }

    const data = await response.json();
    if (!data || data.length === 0) {
      throw new Error('Aucune donnée reçue après la mise à jour.');
    }

    return data;
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
    const response = await fetch(`https://gestion-ticket-back-3.onrender.com/tickets/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) throw new Error('Erreur lors de l\'upload de l\'image.');

    const data = await response.json();
    return `https://gestion-ticket-back-3.onrender.com${data.imageUrl}`;
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
      client: ticketData.client || '',
      station: ticketData.station || '',
      client_phone: ticketData.clientPhone || '',
      client_email: ticketData.clientEmail || '',
    };

    console.log('Données envoyées au backend:', finalTicketData);

    const response = await fetch(`https://gestion-ticket-back-78nj.onrender.com/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(finalTicketData),
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erreur lors de l'envoi du ticket.");
    }
    return await response.json();
  } catch (error) {
    console.error('Erreur backend:', error);
    throw error;
  }
}



export async function getTicketsByStation() {
  const token = getToken();
  if (!token) throw new Error("Aucun token d'authentification trouvé. Veuillez vous reconnecter.");

  try {
    const response = await fetch(`https://gestion-ticket-back-78nj.onrender.com/stats/tickets-by-station`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    
    if (!response.ok) throw new Error('Erreur lors de la récupération des statistiques par station.');
    return await response.json();
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
}

export async function getIncidentsByPriority() {
  const token = getToken();
  if (!token) throw new Error("Aucun token d'authentification trouvé. Veuillez vous reconnecter.");

  try {
    const response = await fetch(`https://gestion-ticket-back-78nj.onrender.com/stats/incidents-by-priority`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    
    if (!response.ok) throw new Error('Erreur lors de la récupération des incidents par priorité.');
    return await response.json();
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
}

export async function getNocOsticketCategories() {
  const token = getToken();
  if (!token) throw new Error("Aucun token d'authentification trouvé. Veuillez vous reconnecter.");

  try {
    const response = await fetch(`https://gestion-ticket-back-78nj.onrender.com/stats/noc-osticket-categories`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    
    if (!response.ok) throw new Error('Erreur lors de la récupération des catégories NOC Osticket.');
    return await response.json();
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
}

export async function getIncidentsByStatus() {
  const token = getToken();
  if (!token) throw new Error("Aucun token d'authentification trouvé. Veuillez vous reconnecter.");

  try {
    const response = await fetch(`https://gestion-ticket-back-78nj.onrender.com/stats/incidents-by-status`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    
    if (!response.ok) throw new Error('Erreur lors de la récupération des incidents par statut.');
    return await response.json();
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
}