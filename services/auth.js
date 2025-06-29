const API_URL = "https://gestion-ticket-back-78nj.onrender.com";
const API_URL_LOCAL = "http://localhost:10000";

export async function Login(email, password) {
  console.log("-ok",localStorage.getItem("token"))
  try {
    console.log("api url", API_URL);
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    console.log("Login successful:", data["session"]["access_token"]);
    // Stockage du token dans un cookie sécurisé
    document.cookie = `token=${data["session"]["access_token"]}; path=/; secure; samesite=strict`;
    localStorage.setItem("token", data["session"]["access_token"]);
    return data;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

export function Logout() {
  // Suppression du cookie
  document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

export function isAuthenticated() {
  return document.cookie.includes("token=");
}

export async function addAccount(email, password) {
  try {
    console.log("Start of addAccount function");
    const response = await fetch(`${API_URL}/add-account`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    
    console.log("Response received from server:", response.status);
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error while creating account');
    }
    
    console.log("Account created successfully:", data);
    return data;
  } catch (error) {
    console.error("Error in addAccount:", error);
    throw error;
  }
}

/**
 * Requests a password reset email for the given email address.
 * @param {string} email - The user's email address.
 * @returns {Promise<Object>} - The response data from the backend.
 * @throws {Error} - If the request fails or the backend returns an error.
 */
export async function requestPasswordReset(email) {
  try {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'An error occurred during the reset request.');
    }

    return data;
  } catch (error) {
    console.error('Error in requestPasswordReset:', error);
    throw error;
  }
}

export const updatePassword = async (password, token) => {
  try {
    const response = await fetch(`${API_URL}/api/update-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password, token }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "An error occurred");
    }

    return await response.json();
  } catch (error) {
    throw new Error(error.message || "An error occurred when updating the password");
  }
};

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
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend response updateTicket:', errorData);
      throw new Error(errorData.error || 'Error while updating the ticket.');
    }
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

/**
 * Réinitialise le mot de passe d'un utilisateur via le backend sécurisé.
 * @param {string} access_token - Le token reçu dans l'URL de réinitialisation.
 * @param {string} new_password - Le nouveau mot de passe choisi par l'utilisateur.
 * @returns {Promise<Object>} - La réponse du backend.
 * @throws {Error} - Si la requête échoue ou que le backend retourne une erreur.
 */
export async function resetPassword(access_token, new_password) {
  try {
    const response = await fetch(`${API_URL}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ access_token, new_password }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la réinitialisation du mot de passe.');
    }
    return data;
  } catch (error) {
    console.error('Erreur dans resetPassword:', error);
    throw error;
  }
}
