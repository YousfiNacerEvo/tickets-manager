"use client";
import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function DashboardCharts({ stats }) {
  if (!stats) {
    return null;
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center w-full">
        <h2 className="text-lg font-semibold mb-2 text-black">Tickets By Client</h2>
        <div style={{ height: '300px', width: '100%' }}>
          <Bar options={chartOptions} data={ticketsByStationData} />
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center w-full">
        <h2 className="text-lg font-semibold mb-2 text-black">Tickets By Priority</h2>
        <div style={{ height: '300px', width: '100%' }}>
          <Bar options={chartOptions} data={incidentsByPriorityData} />
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center w-full">
        <h2 className="text-lg font-semibold mb-2 text-black">Tickets By Station</h2>
        <div style={{ height: '300px', width: '100%' }}>
          <Bar options={chartOptions} data={nocOsticketCategoriesData} />
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center w-full">
        <h2 className="text-lg font-semibold mb-2 text-black">Tickets By Status</h2>
        <div style={{ height: '300px', width: '100%' }}>
          <Bar options={chartOptions} data={incidentsByStatusData} />
        </div>
      </div>
    </div>
  );
} 