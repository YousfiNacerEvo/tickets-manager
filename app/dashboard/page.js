"use client";
import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
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
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
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
  const dashboardRef = useRef(null);

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
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 12
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: {
            size: 10
          }
        }
      },
      x: {
        ticks: {
          font: {
            size: 10
          }
        }
      }
    }
  };

  const ticketsByStationData = {
    labels: stats.ticketsByStation.map(item => item.station),
    datasets: [
      {
        label: 'total tickets ',
        data: stats.ticketsByStation.map(item => item.count),
        backgroundColor: '#3498db',
        borderColor: '#2980b9',
        borderWidth: 1
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
        label: "total incidents",
        data: priorityCounts,
        backgroundColor: '#2c3e50',
        borderColor: '#34495e',
        borderWidth: 1
      },
    ],
  };

  const nocOsticketCategoriesData = {
    labels: stats.nocOsticketCategories.map(item => item.category),
    datasets: [
      {
        label: 'total de tickets',
        data: stats.nocOsticketCategories.map(item => item.count),
        backgroundColor: '#1B2D2F',
        borderColor: '#1B2D2F',
        borderWidth: 1
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
        label: "total incidents",
        data: statusCounts,
        backgroundColor: '#155DFC',
        borderColor: '#155DFC',
        borderWidth: 1
      },
    ],
  };

  // Nouvelle fonction pour exporter en PDF (logo centré, 2x2 en dessous)
  const exportToPDF = async () => {
    try {
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      const graphWidth = (pageWidth - margin * 3) / 2;
      const graphHeight = 50; // réduit pour tout faire tenir
      let y = margin;

      // Logo centré
      const logoImg = document.querySelector('img[alt="ASBU Logo"]');
      let logoHeight = 30;
      let logoWidth = 60;
      if (logoImg) {
        const toDataURL = url => fetch(url)
          .then(response => response.blob())
          .then(blob => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          }));
        const logoDataUrl = await toDataURL(logoImg.src);
        const logoX = (pageWidth - logoWidth) / 2;
        pdf.addImage(logoDataUrl, 'PNG', logoX, y, logoWidth, logoHeight);
      }
      y += logoHeight + 8; // espace sous le logo

      // Titres des graphiques
      const titles = [
        'Tickets By Client',
        'Tickets By Priority',
        'Tickets By Station',
        'Tickets By Status'
      ];
      // Récupérer tous les canvas (dans l'ordre d'affichage)
      const canvases = document.querySelectorAll('canvas');
      let i = 0;
      for (let row = 0; row < 2; row++) {
        let x = margin;
        for (let col = 0; col < 2; col++) {
          if (i >= canvases.length) break;
          // Titre
          pdf.setFontSize(12);
          pdf.text(titles[i], x + graphWidth / 2, y + 8, { align: 'center' });
          // Image du graphique
          const imgData = canvases[i].toDataURL('image/png', 1.0);
          pdf.addImage(imgData, 'PNG', x, y + 10, graphWidth, graphHeight);
          x += graphWidth + margin;
          i++;
        }
        y += graphHeight + 18; // réduit l'espacement vertical
      }
      pdf.save('dashboard-technique.pdf');
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      alert('Erreur lors de l\'export PDF. Veuillez réessayer.');
    }
  };

  // Fonction pour exporter en Excel
  const exportToExcel = () => {
    try {
      // Préparer les données pour Excel
      const workbook = XLSX.utils.book_new();

      // Feuille 1: Tickets par Client
      const ticketsByStationWS = XLSX.utils.json_to_sheet(
        stats.ticketsByStation.map(item => ({
          'Client': item.station,
          'Nombre de Tickets': item.count
        }))
      );
      XLSX.utils.book_append_sheet(workbook, ticketsByStationWS, 'Tickets par Client');

      // Feuille 2: Tickets par Priorité
      const priorityData = priorityOrder.map(priority => ({
        'Priorité': priority,
        'Nombre de Tickets': (stats.incidentsByPriority.find(item => item.priority === priority) || { count: 0 }).count
      }));
      const priorityWS = XLSX.utils.json_to_sheet(priorityData);
      XLSX.utils.book_append_sheet(workbook, priorityWS, 'Tickets par Priorité');

      // Feuille 3: Tickets par Station
      const stationData = stats.nocOsticketCategories.map(item => ({
        'Station': item.category,
        'Nombre de Tickets': item.count
      }));
      const stationWS = XLSX.utils.json_to_sheet(stationData);
      XLSX.utils.book_append_sheet(workbook, stationWS, 'Tickets par Station');

      // Feuille 4: Tickets par Statut
      const statusData = statusOrder.map(status => ({
        'Statut': status,
        'Nombre de Tickets': (stats.incidentsByStatus.find(item => item.status === status) || { count: 0 }).count
      }));
      const statusWS = XLSX.utils.json_to_sheet(statusData);
      XLSX.utils.book_append_sheet(workbook, statusWS, 'Tickets par Statut');

      // Sauvegarder le fichier
      XLSX.writeFile(workbook, 'dashboard-technique.xlsx');
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      alert('Erreur lors de l\'export Excel');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Technique</h1>
        <div className="flex gap-2">
          <button
            onClick={exportToPDF}
            className="bg-[#155DFC] hover:bg-[#3498DB] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            📄 Exporter PDF
          </button>
          <button
            onClick={exportToExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            📊 Exporter Excel
          </button>
        </div>
      </div>
      
      <div ref={dashboardRef} className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4">
        {/* Logo ASBU */}
        <div className="lg:col-span-2 xl:col-span-2 flex justify-start mb-4">
          <div className="text-left">
            <Image
              src="/logo.png"
              alt="ASBU Logo"
              width={120}
              height={70}
              className="object-contain"
            />
          </div>
        </div>
        {/* NOC Ticket By Station */}
        <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center">
          <h2 className="text-lg font-semibold mb-2 text-black">Tickets By Client</h2>
          <div style={{ height: '250px', width: '100%' }}>
            <Bar options={chartOptions} data={ticketsByStationData} />
          </div>
        </div>
        {/* STE iDirect Incidents By Priority */}
        <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center">
          <h2 className="text-lg font-semibold mb-2 text-black">Tickets By Priority</h2>
          <div style={{ height: '250px', width: '100%' }}>
            <Bar options={chartOptions} data={incidentsByPriorityData} />
          </div>
        </div>
        {/* NOC Osticket Categories */}
        <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center">
          <h2 className="text-lg font-semibold mb-2 text-black">Tickets By Station</h2>
          <div style={{ height: '250px', width: '100%' }}>
            <Bar options={chartOptions} data={nocOsticketCategoriesData} />
          </div>
        </div>
        {/* STE iDirect Incidents By Status */}
        <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center">
          <h2 className="text-lg font-semibold mb-2 text-black">Tickets By Status</h2>
          <div style={{ height: '250px', width: '100%' }}>
            <Bar options={chartOptions} data={incidentsByStatusData} />
          </div>
        </div>
      </div>
    </div>
  );
} 