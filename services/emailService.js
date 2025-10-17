const API_URL ='https://gestion-ticket-back-78nj.onrender.com';//http://localhost:10000
//https://gestion-ticket-back-78nj.onrender.com

function createTimeoutController(timeoutMs = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort('timeout'), timeoutMs);
  return { controller, clear: () => clearTimeout(timeoutId) };
}

export const sendTicketNotificationEmail = async (ticketId, userEmail, token, message, subject, isClientEmail = false, isUpdate = false) => {
  try {
    if (!ticketId || !userEmail) {
      throw new Error('Ticket ID and user email required');
    }

    const { controller, clear } = createTimeoutController(12000);

    const response = await fetch(`${API_URL}/api/send-ticket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ ticketId, userEmail, message, subject, isClientEmail, isUpdate }),
      signal: controller.signal,
      keepalive: true,
    }).finally(() => clear());

    let data = null;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    }

    if (!response.ok) {
      const messageFromBody = data && (data.message || data.error);
      throw new Error(messageFromBody || 'Error while sending email');
    }

    return data || { success: true };
  } catch (error) {
    if (error && (error.name === 'AbortError' || error.code === 'ABORT_ERR')) {
      console.warn('Email request aborted (navigation or timeout).');
      return { success: false, aborted: true };
    }
    console.error('Error while sending email:', error);
    throw error;
  }
};