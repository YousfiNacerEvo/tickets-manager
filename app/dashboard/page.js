"use client";
import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register required chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function StatisticsPage() {
  const [createdTickets, setCreatedTickets] = useState([]);
  const [closedTickets, setClosedTickets] = useState([]);
  const [interval, setInterval] = useState('day'); // 'day' | 'month' | 'year'
  const [loading, setLoading] = useState(true);

  const API_URL = "https://gestion-ticket-back-3.onrender.com";

useEffect(() => {
  async function fetchData() {
    try {
      // Ajoute le token si besoin (ex: depuis localStorage)
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const [createdRes, closedRes] = await Promise.all([
        fetch(`${API_URL}/tickets-stats?status=open&groupBy=${interval}`, { headers }),
        fetch(`${API_URL}/tickets-stats?status=closed&groupBy=${interval}`, { headers }),
      ]);
      setCreatedTickets(await createdRes.json());
      setClosedTickets(await closedRes.json());
    } catch (error) {
      console.error('Error fetching ticket data:', error);
    } finally {
      setLoading(false);
    }
  }
  fetchData();
}, [interval]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  console.log('Created Tickets:', createdTickets);
  console.log('Closed Tickets:', closedTickets);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Évolution des tickets',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  const createdChartData = {
    labels: createdTickets.map(item => item.label),
    datasets: [
      {
        label: 'Tickets Créés',
        data: createdTickets.map(item => item.count),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.4,
        fill: false,
      },
    ],
  };

  const closedChartData = {
    labels: closedTickets.map(item => item.label),
    datasets: [
      {
        label: 'Tickets Fermés',
        data: closedTickets.map(item => item.count),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        tension: 0.4,
        fill: false,
      },
    ],
  };

  console.log('Created Chart Data:', createdChartData);
  console.log('Closed Chart Data:', closedChartData);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Statistiques des Tickets</h1>
      
      <div className="flex justify-center gap-4 mb-8">
        {['day', 'month', 'year'].map((int) => (
          <button
            key={int}
            onClick={() => setInterval(int)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              interval === int
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {int === 'day' ? 'Jour' : int === 'month' ? 'Mois' : 'Année'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Tickets Créés</h2>
          <div style={{ height: '400px', position: 'relative' }}>
            <Line data={createdChartData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Tickets Fermés</h2>
          <div style={{ height: '400px', position: 'relative' }}>
            <Line data={closedChartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
} 