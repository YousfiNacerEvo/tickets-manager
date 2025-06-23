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
 * Retrieves all information for a ticket by its ID
 * @param {string|number} ticketId
 * @param {string} token
 * @returns {Promise<Object>} Ticket information
 */
export async function getTicketById(ticketId, token) {
  if (!token) throw new Error("No authentication token found. Please log in again.");

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
      throw new Error(errorData.error || "Error while retrieving the ticket.");
    }

    const data = await response.json();

    // Ajouter l'URL de base du backend aux URLs des fichiers
    if (data && data.length > 0 && data[0].files) {
      data[0].files = data[0].files.map(file => ({
        ...file,
        url: `${API_URL}${file.url}` // Utiliser API_URL au lieu de API_URL
      }));
    }

    console.log('Ticket retrieved:', data);
    return data;
  } catch (error) {
    console.error('Backend error:', error);
    throw error;
  }
}

export async function getAllTickets(token) {
  if (!token) throw new Error("No authentication token found. Please log in again.");
  try {
    const response = await fetch(`${API_URL}/tickets`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    if (!response.ok) throw new Error('Error while retrieving tickets.');
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function updateTicket(ticketId, ticketData, token) {
  if (!token) throw new Error("No authentication token found. Please log in again.");
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
    if (!response.ok) throw new Error('Error while updating the ticket.');
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function uploadTicketImage(imageFile, token) {
  if (!token) throw new Error("No authentication token found. Please log in again.");
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
    if (!response.ok) throw new Error('Error while uploading the image.');
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function uploadTicketFiles(files, token) {
  if (!token) throw new Error("No authentication token found. Please log in again.");
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  
  try {
    console.log('Attempting upload to:', `${API_URL}/tickets/upload`);
    console.log('Token used:', token);
    
    const response = await fetch(`${API_URL}/tickets/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
      cache: 'no-store',
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        console.error('The server returned HTML instead of the expected JSON');
        throw new Error('The server is not accessible. Please check that the backend server is running.');
      }
      
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || 'Error while uploading files.';
      } catch (e) {
        errorMessage = `Server error (${response.status}): ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Unexpected content type:', contentType);
      throw new Error('Invalid server response');
    }

    const result = await response.json();
    console.log('Server response:', result);
    
    // Ajouter l'URL de base aux fichiers retournés
    return result.urls.map(url => ({
      url: `${API_URL}${url}`
    }));
  } catch (error) {
    console.error('Detailed error:', error);
    throw error;
  }
}

export async function sendTicketToBackend(ticketData, token) {
  if (!token) throw new Error("No authentication token found. Please log in again.");
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
    if (!response.ok) throw new Error('Error while creating the ticket.');
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function getTicketsByStation(token) {
  if (!token) throw new Error("No authentication token found. Please log in again.");
  try {
    const response = await fetch(`${API_URL}/stats/tickets-by-station`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    if (!response.ok) throw new Error('Error while retrieving statistics by station.');
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function getIncidentsByPriority(token) {
  if (!token) throw new Error("No authentication token found. Please log in again.");
  try {
    const response = await fetch(`${API_URL}/stats/incidents-by-priority`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    if (!response.ok) throw new Error('Error while retrieving incidents by priority.');
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function getNocOsticketCategories(token) {
  if (!token) throw new Error("No authentication token found. Please log in again.");
  try {
    const response = await fetch(`${API_URL}/stats/noc-osticket-categories`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    if (!response.ok) throw new Error('Error while retrieving NOC Osticket categories.');
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function getIncidentsByStatus(token) {
  if (!token) throw new Error("No authentication token found. Please log in again.");
  try {
    const response = await fetch(`${API_URL}/stats/incidents-by-status`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    if (!response.ok) throw new Error('Error while retrieving incidents by status.');
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

export async function getTicketComments(ticketId, token) {
  if (!token) throw new Error("No authentication token found. Please log in again.");
  try {
    const response = await fetch(`${API_URL}/tickets/${ticketId}/comments`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    if (!response.ok) throw new Error('Error while retrieving comments.');
    return await response.json();
  } catch (error) {
    console.error('Backend error:', error);
    throw error;
  }
}

export async function addTicketComment(ticketId, content, token) {
  if (!token) throw new Error("No authentication token found. Please log in again.");
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
    if (!response.ok) throw new Error('Error while adding comment.');
    return await response.json();
  } catch (error) {
    console.error('Backend error:', error);
    throw error;
  }
}