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
import DashboardCharts from './components/DashboardCharts';

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
          throw new Error("No authentication token found. Please log in again.");
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
        label: 'total tickets',
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
      // Récupérer tous les canvases (dans l'ordre d'affichage)
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
        y += graphHeight + 18; // reduce vertical spacing
      }
      pdf.save('dashboard-technique.pdf');
    } catch (error) {
      console.error('Error while exporting PDF:', error);
      alert('Error while exporting PDF. Please try again.');
    }
  };

  // Function to export to Excel
  const exportToExcel = () => {
    try {
      // Préparer les données pour Excel
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Tickets by Client
      const ticketsByStationWS = XLSX.utils.json_to_sheet(
        stats.ticketsByStation.map(item => ({
          'Client': item.station,
          'Number of Tickets': item.count
        }))
      );
      XLSX.utils.book_append_sheet(workbook, ticketsByStationWS, 'Tickets by Client');

      // Sheet 2: Tickets by Priority
      const priorityData = priorityOrder.map(priority => ({
        'Priority': priority,
        'Number of Tickets': (stats.incidentsByPriority.find(item => item.priority === priority) || { count: 0 }).count
      }));
      const priorityWS = XLSX.utils.json_to_sheet(priorityData);
      XLSX.utils.book_append_sheet(workbook, priorityWS, 'Tickets by Priority');

      // Sheet 3: Tickets by Station
      const stationData = stats.nocOsticketCategories.map(item => ({
        'Station': item.category,
        'Number of Tickets': item.count
      }));
      const stationWS = XLSX.utils.json_to_sheet(stationData);
      XLSX.utils.book_append_sheet(workbook, stationWS, 'Tickets by Station');

      // Sheet 4: Tickets by Status
      const statusData = statusOrder.map(status => ({
        'Status': status,
        'Number of Tickets': (stats.incidentsByStatus.find(item => item.status === status) || { count: 0 }).count
      }));
      const statusWS = XLSX.utils.json_to_sheet(statusData);
      XLSX.utils.book_append_sheet(workbook, statusWS, 'Tickets by Status');

      // Save the file
      XLSX.writeFile(workbook, 'dashboard-technique.xlsx');
    } catch (error) {
      console.error('Error while exporting Excel:', error);
      alert('Error while exporting Excel');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Technical Dashboard</h1>
      </div>
      
      <div className="w-full">
        {/* Logo ASBU */}
        <div className="flex justify-start mb-4">
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
        <DashboardCharts stats={stats} />
      </div>
    </div>
  );
} 