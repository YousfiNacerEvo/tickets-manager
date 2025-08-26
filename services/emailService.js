const API_URL ='https://gestion-ticket-back-78nj.onrender.com';//http://localhost:10000
//https://gestion-ticket-back-78nj.onrender.com
export const sendTicketNotificationEmail = async (ticketId, userEmail, token, message, subject, isClientEmail = false, isUpdate = false) => {
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
      body: JSON.stringify({ ticketId, userEmail, message, subject, isClientEmail, isUpdate }),
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