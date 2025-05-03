const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function Login(email, password) {
  try {
    const response = await fetch(`${API_URL}/login`, {
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
