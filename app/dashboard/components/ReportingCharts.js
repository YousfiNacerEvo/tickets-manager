"use client";
import React from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import Chart from 'chart.js/auto';

const statusOrder = ["open", "closed", "in_progress"];
const statusColors = [
  '#60a5fa', // open
  '#f87171', // closed
  '#bef264'  // in_progress
];
const statusBorderColors = [
  '#2563eb',
  '#dc2626',
  '#65a30d'
];

export default function ReportingCharts({ stats, chartRefs }) {
  if (!stats) return null;

  // Filtrage dynamique : on ne garde que les statuts avec au moins 1 ticket
  const statusCountsRaw = statusOrder.map(
    status => (stats.incidentsByStatus.find(item => item.status === status) || { count: 0 }).count
  );
  const filtered = statusOrder
    .map((status, idx) => ({
      label: status,
      value: statusCountsRaw[idx],
      color: statusColors[idx],
      borderColor: statusBorderColors[idx]
    }))
    .filter(item => item.value > 0);

  const statusLabels = filtered.map(item => item.label);
  const statusCounts = filtered.map(item => item.value);
  const pieColors = filtered.map(item => item.color);
  const pieBorderColors = filtered.map(item => item.borderColor);
  const totalTickets = statusCounts.reduce((a, b) => a + b, 0);

  const incidentsByStatusPieData = {
    labels: statusLabels,
    datasets: [
      {
        label: "Tickets par statut",
        data: statusCounts,
        backgroundColor: pieColors,
        borderColor: pieBorderColors,
        borderWidth: 1
      },
    ],
  };

  const pieOptions = {
    plugins: {
      legend: { position: 'bottom' }
    }
  };

  // Préparation des données pour l'histogramme groupé par période/statut
  const timeSeriesByStatus = stats.timeSeriesByStatus || [];
  const periodLabels = timeSeriesByStatus.map(item => item.displayLabel || item.label);
  const barChartData = {
    labels: periodLabels,
    datasets: statusOrder.map((status, idx) => ({
      label: status,
      data: timeSeriesByStatus.map(item => item[status] || 0),
      backgroundColor: statusColors[idx],
      borderColor: statusBorderColors[idx],
      borderWidth: 1
    }))
  };
  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: false }
    },
    scales: {
      y: { beginAtZero: true },
      x: {}
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {/* Pie Chart: Tickets par statut */}
      <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center w-full relative">
        <h2 className="text-lg font-semibold mb-2 text-black">Number of Tickets</h2>
        <div style={{ height: '300px', width: '100%', position: 'relative' }}>
          {statusCounts.length > 0 ? (
            <Pie data={incidentsByStatusPieData} options={pieOptions} ref={el => chartRefs && (chartRefs.pie = el)} />
          ) : (
            <div className="text-gray-400 h-full flex items-center justify-center">No data</div>
          )}
        </div>
      </div>
      {/* Bar Chart: Tickets par statut et par période */}
      <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center w-full">
        <h2 className="text-lg font-semibold mb-2 text-black">Ticket Status Per Month</h2>
        {/* Total au-dessus de l'histogramme */}
        <div className="mb-2 text-xl font-bold text-blue-700">Total: {totalTickets}</div>
        <div style={{ height: '300px', width: '100%' }}>
          {periodLabels.length > 0 && barChartData.datasets.some(ds => ds.data.some(v => v > 0)) ? (
            <Bar data={barChartData} options={barChartOptions} ref={el => chartRefs && (chartRefs.bar = el)} />
          ) : (
            <div className="text-gray-400 h-full flex items-center justify-center">No data</div>
          )}
        </div>
      </div>
    </div>
  );
} 