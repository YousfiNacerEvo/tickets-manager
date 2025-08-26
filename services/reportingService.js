const API_URL ='https://gestion-ticket-back-78nj.onrender.com';//http://localhost:10000
//https://gestion-ticket-back-78nj.onrender.com

export async function fetchReportingData({ startDate, endDate, status, type, assignedUser, category, groupBy }) {
  const queryParams = new URLSearchParams({
    startDate,
    endDate,
    ...(status && status !== 'all' && { status }),
    ...(type && type !== 'all' && { type }),
    ...(assignedUser && assignedUser !== 'all' && { assignedUser }),
    ...(category && category !== 'all' && { category }),
    groupBy: groupBy || 'month'
  });

  const response = await fetch(`${API_URL}/api/reporting?${queryParams}`);
  if (!response.ok) {
    throw new Error('Error while fetching data');
  }
  return response.json();
} 