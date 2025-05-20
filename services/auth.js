const API_URL = "https://gestion-ticket-back-78nj.onrender.com";
const API_URL_LOCAL = "http://localhost:10000";

export async function Login(email, password) {
  console.log(localStorage.getItem("token"))
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
    const response = await fetch(`${API_URL}/add-account`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

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

export const forgetPassword = async (email) => {
  try {
    const response = await fetch("https://gestion-ticket-back-78nj.onrender.com/api/forget-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Une erreur est survenue");
    }

    return await response.json();
  } catch (error) {
    throw new Error(error.message || "Une erreur est survenue lors de la réinitialisation du mot de passe");
  }
};

export const updatePassword = async (password) => {
  try {
    const response = await fetch("https://gestion-ticket-back-78nj.onrender.com/api/update-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ password }),
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
