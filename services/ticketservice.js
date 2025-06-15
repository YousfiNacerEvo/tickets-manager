const API_URL = "https://gestion-ticket-back-3.onrender.com"
const API_URL_LOCAL = "http://localhost:10000";
/**
 * Récupère toutes les informations d'un ticket par son ID
 * @param {string|number} ticketId
 * @param {string} token
 * @returns {Promise<Object>} Les informations du ticket
 */
export async function getTicketById(ticketId) {
  const token = getToken();
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
        url: `${API_URL}${file.url}` // Ajouter l'URL de base
      }));
    }

    console.log('Ticket récupéré:', data);
    return data;
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
    const response = await fetch(`${API_URL}/tickets/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) throw new Error('Erreur lors de l\'upload de l\'image.');

    const data = await response.json();
    return `${API_URL}${data.imageUrl}`;
  } catch (error) {
    console.error('Erreur backend:', error);
    throw error;
  }
}

/**
 * Upload des fichiers pour un ticket
 * @param {File[]} files - Les fichiers à uploader
 * @returns {Promise<string[]>} Les URLs des fichiers uploadés
 */
export async function uploadTicketFiles(files) {
  const token = getToken();
  if (!token) throw new Error("Aucun token d'authentification trouvé. Veuillez vous reconnecter.");

  try {
    const formData = new FormData();
    
    // Vérifier si files est un tableau ou un FileList
    const filesArray = Array.isArray(files) ? files : Array.from(files);
    
    // Ajouter chaque fichier au FormData
    filesArray.forEach((file, index) => {
      formData.append('files', file);
    });

    console.log('Envoi des fichiers:', filesArray);

    const response = await fetch(`${API_URL}/tickets/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erreur lors de l'upload des fichiers.");
    }

    const data = await response.json();
    console.log('Réponse du serveur:', data);
    return data.urls;
  } catch (error) {
    console.error('Erreur lors de l\'upload des fichiers:', error);
    throw error;
  }
}

// Fonction pour envoyer le ticket au backend
export async function sendTicketToBackend(ticketData) {
  const token = getToken();
  if (!token) throw new Error("Aucun token d'authentification trouvé. Veuillez vous reconnecter.");

  try {
    // Upload des fichiers si présents
    let uploadedFiles = [];
    if (ticketData.files && ticketData.files.length > 0) {
      uploadedFiles = await uploadTicketFiles(ticketData.files);
    }

    // On crée une copie des données du ticket sans les fichiers
    const { files, ...ticketDataWithoutFiles } = ticketData;
    
    // On ajoute les URLs des fichiers si elles existent
    const finalTicketData = {
      ...ticketDataWithoutFiles,
      files: uploadedFiles.map(url => ({
        url,
        name: url.split('/').pop(),
        type: url.split('.').pop()
      })),
      client: ticketData.client || '',
      station: ticketData.station || '',
      client_phone: ticketData.clientPhone || '',
      client_email: ticketData.clientEmail || '',
    };

    console.log('Données envoyées au backend:', finalTicketData);

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

export async function getIncidentsByPriority() {
  const token = getToken();
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

export async function getNocOsticketCategories() {
  const token = getToken();
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

export async function getIncidentsByStatus() {
  const token = getToken();
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

/**
 * Récupère les commentaires d'un ticket
 * @param {string|number} ticketId - ID du ticket
 * @returns {Promise<Array>} Liste des commentaires
 */
export async function getTicketComments(ticketId) {
  const token = getToken();
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

/**
 * Ajoute un commentaire à un ticket
 * @param {string|number} ticketId - ID du ticket
 * @param {string} content - Contenu du commentaire
 * @returns {Promise<Object>} Le commentaire ajouté
 */
export async function addTicketComment(ticketId, content) {
  const token = getToken();
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