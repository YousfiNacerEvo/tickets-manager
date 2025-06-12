const API_URL = "https://gestion-ticket-back-78nj.onrender.com";
const API_URL_LOCAL = "http://localhost:10000";

export async function Login(email, password) {
  console.log("-ok",localStorage.getItem("token"))
  try {
    console.log("api url", API_URL);
    const response = await fetch(`${API_URL_LOCAL}/login`, {
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
    console.log("ca enrer dans la fonciton ")
    const response = await fetch(`${API_URL_LOCAL}/add-account`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    console.log("et ca cest apres le fetch")
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data;
  } catch (error) {
    console.error("Error:", error);
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
    const response = await fetch(`${API_URL_LOCAL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Une erreur est survenue lors de la demande de réinitialisation.');
    }

    return data;
  } catch (error) {
    console.error('Erreur dans requestPasswordReset:', error);
    throw error;
  }
}

export const updatePassword = async (password, token) => {
  try {
    const response = await fetch("http://localhost:10000/api/update-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password, token }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Une erreur est survenue");
    }

    return await response.json();
  } catch (error) {
    throw new Error(error.message || "Une erreur est survenue lors de la mise à jour du mot de passe");
  }
};
