'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, Download, FileDown } from "lucide-react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import "../../globals.css"
import { CustomCalendar } from "@/components/ui/custom-calendar";
import { fetchReportingData } from "@/services/reportingService";
import {
  getTicketsByStation,
  getIncidentsByPriority,
  getNocOsticketCategories,
  getIncidentsByStatus,
  getClientToken
} from '@/services/ticketservice';
import DashboardCharts from '../components/DashboardCharts';
import { useRouter } from 'next/navigation';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function ReportingPage() {
  const [date, setDate] = useState({ from: null, to: null });
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [assignedUser, setAssignedUser] = useState("");
  const [category, setCategory] = useState("");
  const [groupBy, setGroupBy] = useState("month");
  const [reportData, setReportData] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userChecked, setUserChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const chartsRef = useRef(null);

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'admin') {
      router.push('/dashboard');
      setIsAdmin(false);
    } else {
      setIsAdmin(true);
    }
    setUserChecked(true);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const token = getClientToken();
        if (!token) {
          throw new Error("No auth token found");
        }
        
        // Fetch reporting data
        const startDate = date.from ? date.from.toISOString() : new Date().toISOString();
        const endDate = date.to ? date.to.toISOString() : startDate;
        const reportingDataPromise = fetchReportingData({
          startDate,
          endDate,
          status,
          type,
          assignedUser,
          category,
          groupBy
        });

        // Fetch dashboard data
        const dashboardDataPromise = Promise.all([
          getTicketsByStation(token),
          getIncidentsByPriority(token),
          getNocOsticketCategories(token),
          getIncidentsByStatus(token)
        ]);

        const [reportingData, dashboardData] = await Promise.all([reportingDataPromise, dashboardDataPromise]);
        
        setReportData(reportingData);
        setDashboardStats({
          ticketsByStation: dashboardData[0],
          incidentsByPriority: dashboardData[1],
          nocOsticketCategories: dashboardData[2],
          incidentsByStatus: dashboardData[3]
        });

      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [isAdmin, date, status, type, assignedUser, category, groupBy]);

  if (!userChecked || !isAdmin) return null;

  const exportToExcel = () => {
    if (!dashboardStats) return;
    try {
      const workbook = XLSX.utils.book_new();

      // Feuille 1: Tickets par Client
      const ticketsByStationWS = XLSX.utils.json_to_sheet(
        dashboardStats.ticketsByStation.map(item => ({
          'Client': item.station,
          'Nombre de Tickets': item.count
        }))
      );
      XLSX.utils.book_append_sheet(workbook, ticketsByStationWS, 'Tickets par Client');

      // Feuille 2: Tickets par Priorité
      const priorityOrder = ["low", "medium", "high"];
      const priorityData = priorityOrder.map(priority => ({
        'Priorité': priority,
        'Nombre de Tickets': (dashboardStats.incidentsByPriority.find(item => item.priority === priority) || { count: 0 }).count
      }));
      const priorityWS = XLSX.utils.json_to_sheet(priorityData);
      XLSX.utils.book_append_sheet(workbook, priorityWS, 'Tickets par Priorité');

      // Feuille 3: Tickets par Station
      const stationData = dashboardStats.nocOsticketCategories.map(item => ({
        'Station': item.category,
        'Nombre de Tickets': item.count
      }));
      const stationWS = XLSX.utils.json_to_sheet(stationData);
      XLSX.utils.book_append_sheet(workbook, stationWS, 'Tickets par Station');

      // Feuille 4: Tickets par Statut
      const statusOrder = ["open", "closed", "in_progress"];
      const statusData = statusOrder.map(status => ({
        'Statut': status,
        'Nombre de Tickets': (dashboardStats.incidentsByStatus.find(item => item.status === status) || { count: 0 }).count
      }));
      const statusWS = XLSX.utils.json_to_sheet(statusData);
      XLSX.utils.book_append_sheet(workbook, statusWS, 'Tickets par Statut');

      XLSX.writeFile(workbook, 'dashboard-technique.xlsx');
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      alert('Erreur lors de l\'export Excel');
    }
  };

  const exportToPDF = async () => {
    if (!chartsRef.current) return;
    try {
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      let y = margin;

      // 1. Ajouter le logo
      const toDataURL = url => fetch(url)
        .then(response => response.blob())
        .then(blob => new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        }));

      try {
        const logoDataUrl = await toDataURL('/logo.png');
        const logoWidth = 60;
        const logoHeight = 30;
        const logoX = (pageWidth - logoWidth) / 2;
        pdf.addImage(logoDataUrl, 'PNG', logoX, y, logoWidth, logoHeight);
        y += logoHeight + 8;
      } catch (error) {
        console.error("Impossible de charger le logo pour le PDF", error);
      }
      
      // 2. Ajuster la taille des graphiques et améliorer la qualité
      const graphWidth = (pageWidth - margin * 3) / 2;
      const graphHeight = 65; // Augmentation de la hauteur pour une meilleure lisibilité

      const titles = [
        'Tickets By Client',
        'Tickets By Priority',
        'Tickets By Station',
        'Tickets By Status'
      ];
      
      const canvases = chartsRef.current.querySelectorAll('canvas');
      let i = 0;
      for (let row = 0; row < 2; row++) {
        let x = margin;
        for (let col = 0; col < 2; col++) {
          if (i >= canvases.length) break;
          pdf.setFontSize(12);
          pdf.text(titles[i], x + graphWidth / 2, y + 8, { align: 'center' });
          const imgData = canvases[i].toDataURL('image/png', 1.0);
          pdf.addImage(imgData, 'PNG', x, y + 10, graphWidth, graphHeight);
          x += graphWidth + margin;
          i++;
        }
        y += graphHeight + 18; // Ajustement de l'espacement vertical
      }
      pdf.save('dashboard-technique.pdf');
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      alert('Erreur lors de l\'export PDF. Veuillez réessayer.');
    }
  };

  const chartData = {
    labels: reportData?.stats.timeSeries.map(item => item.label) || [],
    datasets: [
      {
        label: 'total tickets',
        data: reportData?.stats.timeSeries.map(item => item.count) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Ticket evolution',
        color: '#1f2937'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#4b5563'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        ticks: {
          color: '#4b5563'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Report</h1>
        <div className="space-x-2">
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

      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-800">Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 text-white">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal text-white"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-white" />
                    {date.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "dd/MM/yyyy")} - {format(date.to, "dd/MM/yyyy")}
                        </>
                      ) : (
                        format(date.from, "dd/MM/yyyy")
                      )
                    ) : (
                      <span>Select the Period</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 max-w-xs mx-auto" align="start">
                  <CustomCalendar
                    selected={date}
                    onSelect={setDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader>
            <CardTitle className="text-gray-800">Filtres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="text-gray-800">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="open">Ouvert</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="closed">Fermé</SelectItem>
                </SelectContent>
              </Select>

              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="text-gray-800">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="incident">Incident</SelectItem>
                  <SelectItem value="request">Request</SelectItem>
                </SelectContent>
              </Select>

             

              
             
            </div>
          </CardContent>
        </Card> */}

        <Card>
          <CardHeader>
            <CardTitle className="text-gray-800">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-gray-800">Loading...</div>
            ) : reportData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-gray-600">Total tickets</div>
                    <div className="text-2xl font-bold text-gray-800">{reportData.stats.total}</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-gray-600">Tickets closed</div>
                    <div className="text-2xl font-bold text-gray-800">{reportData.stats.resolved}</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-gray-600">Average resolution time</div>
                    <div className="text-2xl font-bold text-gray-800">
                      {reportData?.stats?.averageResolutionTime && reportData.stats.resolved > 0
                        ? `${Math.round(reportData.stats.averageResolutionTime)} hours`
                        : '0 hours'}
                    </div>
                  </div>
                </div>
                <div className="w-full h-[300px]">
                  <Bar data={chartData} options={chartOptions} className="w-full h-full" />
                </div>
              </div>
            ) : (
              <div className="text-gray-800">No data</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-gray-800">tickets liste</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-gray-800">loading...</div>
          ) : reportData?.tickets ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-gray-800">ID</th>
                    <th className="text-left py-3 px-4 text-gray-800">Titre</th>
                    <th className="text-left py-3 px-4 text-gray-800">Statut</th>
                    <th className="text-left py-3 px-4 text-gray-800">Type</th>
                    <th className="text-left py-3 px-4 text-gray-800">Client</th>
                    <th className="text-left py-3 px-4 text-gray-800">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.tickets.map((ticket) => (
                    <tr key={ticket.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-800">{ticket.id}</td>
                      <td className="py-3 px-4 text-gray-800">{ticket.title}</td>
                      <td className="py-3 px-4 text-gray-800">{ticket.status}</td>
                      <td className="py-3 px-4 text-gray-800">{ticket.type}</td>
                      <td className="py-3 px-4 text-gray-800">{ticket.client}</td>
                      <td className="py-3 px-4 text-gray-800">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-gray-800">No data</div>
          )}
        </CardContent>
      </Card>
      <div ref={chartsRef} style={{ position: 'absolute', left: '-9999px', top: '-9999px', zIndex: -1, width: '1200px' }}>
        {dashboardStats && <DashboardCharts stats={dashboardStats} />}
      </div>
    </div>
  );
} 