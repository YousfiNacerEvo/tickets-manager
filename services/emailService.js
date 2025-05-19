const API_URL ='https://gestion-ticket-back-78nj.onrender.com';

export const sendTicketNotificationEmail = async (ticketId, userEmail) => {
  try {
    const response = await fetch(`${API_URL}/api/send-ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ ticketId, userEmail }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de l\'envoi de l\'email');
    }

    return data;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    throw error;
  }
}; 