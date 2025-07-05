const API_URL ='https://gestion-ticket-back-78nj.onrender.com';
const API_URL_LOCAL = "http://localhost:10000";

export const sendTicketNotificationEmail = async (ticketId, userEmail, token, message, subject, isClientEmail = false) => {
  try {
    if (!ticketId || !userEmail) {
      throw new Error('Ticket ID and user email required');
    }

    const response = await fetch(`${API_URL}/api/send-ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ ticketId, userEmail, message, subject, isClientEmail }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error while sending email');
    }

    return data;
  } catch (error) {
    console.error('Error while sending email:', error);
    throw error;
  }
}; 