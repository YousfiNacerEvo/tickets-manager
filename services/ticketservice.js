// services/ticketservice.js
// Toutes les fonctions attendent le token en argument (récupéré côté serveur dans la page avec cookies() ou côté client avec localStorage)

const API_URL = "https://gestion-ticket-back-78nj.onrender.com"
const API_URL_LOCAL = "http://localhost:10000";

// Utilitaire pour récupérer le token côté client
export function getClientToken() {
  if (typeof document !== 'undefined') {
    // D'abord vérifier dans les cookies
    const cookieMatch = document.cookie.match(/(?:^|; )token=([^;]*)/);
    if (cookieMatch) {
      return decodeURIComponent(cookieMatch[1]);
    }
    
    // Ensuite vérifier dans le localStorage
    const localStorageToken = localStorage.getItem('token');
    if (localStorageToken) {
      return localStorageToken;
    }
  }
  return null;
}

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
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erreur lors de la récupération du ticket.");
    }

    const data = await response.json();

    // Ajouter l'URL de base du backend aux URLs des fichiers
    if (data && data.length > 0 && data[0].files) {
      data[0].files = data[0].files.map(file => ({
        ...file,
        url: `${API_URL}${file.url}` // Utiliser API_URL au lieu de API_URL
      }));
    }

    console.log('Ticket récupéré:', data);
    return data;
  } catch (error) {
    console.error('Erreur backend:', error);
    throw error;
  }
}

export async function getAllTickets(token) {
  if (!token) throw new Error("Aucun token d'authentification trouvé. Veuillez vous reconnecter.");
  try {
    const response = await fetch(`${API_URL}/tickets`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    if (!response.ok) throw new Error('Erreur lors de la récupération des tickets.');
    return await response.json();
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
}

export async function updateTicket(ticketId, ticketData, token) {
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
    console.error('Erreur:', error);
    throw error;
  }
}

export async function uploadTicketImage(imageFile, token) {
  if (!token) throw new Error("Aucun token d'authentification trouvé. Veuillez vous reconnecter.");
  const formData = new FormData();
  formData.append('image', imageFile);
  try {
    const response = await fetch(`${API_URL}/tickets/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
      cache: 'no-store',
    });
    if (!response.ok) throw new Error('Erreur lors de l\'upload de l\'image.');
    return await response.json();
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
}

export async function uploadTicketFiles(files, token) {
  if (!token) throw new Error("Aucun token d'authentification trouvé. Veuillez vous reconnecter.");
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  
  try {
    console.log('Tentative d\'upload vers:', `${API_URL}/tickets/upload`);
    console.log('Token utilisé:', token);
    
    const response = await fetch(`${API_URL}/tickets/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
      cache: 'no-store',
    });

    console.log('Status de la réponse:', response.status);
    console.log('Headers de la réponse:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        console.error('Le serveur a renvoyé du HTML au lieu du JSON attendu');
        throw new Error('Le serveur n\'est pas accessible. Veuillez vérifier que le serveur backend est en cours d\'exécution.');
      }
      
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || 'Erreur lors de l\'upload des fichiers.';
      } catch (e) {
        errorMessage = `Erreur serveur (${response.status}): ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Type de contenu inattendu:', contentType);
      throw new Error('Réponse invalide du serveur');
    }

    const result = await response.json();
    console.log('Réponse du serveur:', result);
    
    // Ajouter l'URL de base aux fichiers retournés
    return result.urls.map(url => ({
      url: `${API_URL}${url}`
    }));
  } catch (error) {
    console.error('Erreur détaillée:', error);
    throw error;
  }
}

export async function sendTicketToBackend(ticketData, token) {
  if (!token) throw new Error("Aucun token d'authentification trouvé. Veuillez vous reconnecter.");
  try {
    const response = await fetch(`${API_URL}/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(ticketData),
      cache: 'no-store',
    });
    if (!response.ok) throw new Error('Erreur lors de la création du ticket.');
    return await response.json();
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
}

export async function getTicketsByStation(token) {
  if (!token) throw new Error("Aucun token d'authentification trouvé. Veuillez vous reconnecter.");
  try {
    const response = await fetch(`${API_URL}/stats/tickets-by-station`, {
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

export async function getIncidentsByPriority(token) {
  if (!token) throw new Error("Aucun token d'authentification trouvé. Veuillez vous reconnecter.");
  try {
    const response = await fetch(`${API_URL}/stats/incidents-by-priority`, {
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

export async function getNocOsticketCategories(token) {
  if (!token) throw new Error("Aucun token d'authentification trouvé. Veuillez vous reconnecter.");
  try {
    const response = await fetch(`${API_URL}/stats/noc-osticket-categories`, {
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

export async function getIncidentsByStatus(token) {
  if (!token) throw new Error("Aucun token d'authentification trouvé. Veuillez vous reconnecter.");
  try {
    const response = await fetch(`${API_URL}/stats/incidents-by-status`, {
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

export async function getTicketComments(ticketId, token) {
  if (!token) throw new Error("Aucun token d'authentification trouvé. Veuillez vous reconnecter.");
  try {
    const response = await fetch(`${API_URL}/tickets/${ticketId}/comments`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    if (!response.ok) throw new Error('Erreur lors de la récupération des commentaires.');
    return await response.json();
  } catch (error) {
    console.error('Erreur backend:', error);
    throw error;
  }
}

export async function addTicketComment(ticketId, content, token) {
  if (!token) throw new Error("Aucun token d'authentification trouvé. Veuillez vous reconnecter.");
  try {
    const response = await fetch(`${API_URL}/tickets/${ticketId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
      cache: 'no-store',
    });
    if (!response.ok) throw new Error('Erreur lors de l\'ajout du commentaire.');
    return await response.json();
  } catch (error) {
    console.error('Erreur backend:', error);
    throw error;
  }
}