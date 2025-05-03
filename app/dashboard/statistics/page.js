"use client";
import React, { useEffect, useState } from 'react';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
} from 'chart.js';
import { getTicketStats } from '@/services/ticketservice';

// Enregistrer les composants nécessaires
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
);

export default function StatisticsPage() {
  const [stats, setStats] = useState({
    daily: [],
    monthly: [],
    byType: {},
    byPriority: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getTicketStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Configuration des graphiques
  const dailyChartData = {
    labels: stats.daily.map(item => item.date),
    datasets: [
      {
        label: 'Tickets Résolus',
        data: stats.daily.map(item => item.count),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.4,
      },
    ],
  };

  const monthlyChartData = {
    labels: stats.monthly.map(item => item.month),
    datasets: [
      {
        label: 'Tickets par Mois',
        data: stats.monthly.map(item => item.count),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
      },
    ],
  };

  const typeChartData = {
    labels: Object.keys(stats.byType),
    datasets: [
      {
        data: Object.values(stats.byType),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
        ],
      },
    ],
  };

  const priorityChartData = {
    labels: Object.keys(stats.byPriority),
    datasets: [
      {
        label: 'Tickets par Priorité',
        data: Object.values(stats.byPriority),
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgb(59, 130, 246)',
        pointBackgroundColor: 'rgb(59, 130, 246)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Statistiques des Tickets</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Graphique quotidien */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Tickets Résolus par Jour</h2>
          <div className="h-80">
            <Line data={dailyChartData} options={chartOptions} />
          </div>
        </div>

        {/* Graphique mensuel */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Tickets par Mois</h2>
          <div className="h-80">
            <Bar data={monthlyChartData} options={chartOptions} />
          </div>
        </div>

        {/* Graphique par type */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Répartition par Type</h2>
          <div className="h-80">
            <Doughnut data={typeChartData} options={chartOptions} />
          </div>
        </div>

        {/* Graphique par priorité */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Statistiques par Priorité</h2>
          <div className="h-80">
            <Radar data={priorityChartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
} 