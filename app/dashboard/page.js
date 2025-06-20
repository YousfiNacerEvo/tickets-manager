"use client";
import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import {
  getTicketsByStation,
  getIncidentsByPriority,
  getNocOsticketCategories,
  getIncidentsByStatus,
  getClientToken
} from '@/services/ticketservice';

// Enregistrer les composants Chart.js nécessaires
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    ticketsByStation: [],
    incidentsByPriority: [],
    nocOsticketCategories: [],
    incidentsByStatus: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = getClientToken();
        if (!token) {
          throw new Error("Aucun token d'authentification trouvé. Veuillez vous reconnecter.");
        }

        const [
          ticketsByStation,
          incidentsByPriority,
          nocOsticketCategories,
          incidentsByStatus
        ] = await Promise.all([
          getTicketsByStation(token),
          getIncidentsByPriority(token),
          getNocOsticketCategories(token),
          getIncidentsByStatus(token)
        ]);

        setStats({
          ticketsByStation,
          incidentsByPriority,
          nocOsticketCategories,
          incidentsByStatus
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Rafraîchir les données toutes les 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        Erreur: {error}
      </div>
    );
  }

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
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  const ticketsByStationData = {
    labels: stats.ticketsByStation.map(item => item.station),
    datasets: [
      {
        label: 'Nombre de tickets',
        data: stats.ticketsByStation.map(item => item.count),
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };

  // Mapping des priorités pour l'affichage
  const priorityMap = {
    low: "low",
    medium: "medium",
    high: "high"
  };
  const priorityOrder = ["low", "medium", "high"];
  const priorityLabels = priorityOrder;
  const priorityCounts = priorityOrder.map(
    priority => (stats.incidentsByPriority.find(item => item.priority === priority) || { count: 0 }).count
  );

  const incidentsByPriorityData = {
    labels: priorityLabels,
    datasets: [
      {
        label: "Nombre d'incidents",
        data: priorityCounts,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      },
    ],
  };

  const nocOsticketCategoriesData = {
    labels: stats.nocOsticketCategories.map(item => item.category),
    datasets: [
      {
        label: 'Nombre de tickets',
        data: stats.nocOsticketCategories.map(item => item.count),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
    ],
  };

  // Ordre et exhaustivité pour les statuts
  const statusOrder = ["open", "closed", "in_progress"];
  const statusLabels = statusOrder;
  const statusCounts = statusOrder.map(
    status => (stats.incidentsByStatus.find(item => item.status === status) || { count: 0 }).count
  );

  const incidentsByStatusData = {
    labels: statusLabels,
    datasets: [
      {
        label: "Nombre d'incidents",
        data: statusCounts,
        backgroundColor: 'rgba(16, 32, 82, 0.5)',
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard Technique</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* NOC Ticket By Station */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-black">Tickets By Client</h2>
          <div style={{ height: '400px' }}>
            <Bar options={chartOptions} data={ticketsByStationData} />
          </div>
        </div>

        {/* STE iDirect Incidents By Priority */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-black">Tickets By Priority</h2>
          <div style={{ height: '400px' }}>
            <Bar options={chartOptions} data={incidentsByPriorityData} />
          </div>
        </div>

        {/* NOC Osticket Categories */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-black">Tickets By Sation</h2>
          <div style={{ height: '400px' }}>
            <Bar options={chartOptions} data={nocOsticketCategoriesData} />
          </div>
        </div>

        {/* STE iDirect Incidents By Status */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-black">Tickets  By Status</h2>
          <div style={{ height: '400px' }}>
            <Bar options={chartOptions} data={incidentsByStatusData} />
          </div>
        </div>
      </div>
    </div>
  );
} 