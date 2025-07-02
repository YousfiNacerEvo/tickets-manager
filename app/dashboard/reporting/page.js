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
import Chart from 'chart.js/auto';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function toLocalDateString(date) {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildReportingStats(reportData) {
  if (!reportData) return null;
  // Générer le même format que dashboardStats mais à partir de reportData filtré
  // Tickets By Client
  const ticketsByStation = [];
  const stationMap = {};
  reportData.tickets.forEach(ticket => {
    if (!stationMap[ticket.client]) stationMap[ticket.client] = 0;
    stationMap[ticket.client]++;
  });
  for (const station in stationMap) {
    ticketsByStation.push({ station, count: stationMap[station] });
  }
  // Tickets By Priority
  const incidentsByPriority = [];
  const priorityOrder = ["low", "medium", "high"];
  priorityOrder.forEach(priority => {
    const count = reportData.tickets.filter(ticket => (ticket.priority || ticket.type) === priority).length;
    incidentsByPriority.push({ priority, count });
  });
  // Tickets By Station (catégorie)
  const nocOsticketCategories = [];
  const catMap = {};
  reportData.tickets.forEach(ticket => {
    if (!catMap[ticket.station]) catMap[ticket.station] = 0;
    catMap[ticket.station]++;
  });
  for (const category in catMap) {
    nocOsticketCategories.push({ category, count: catMap[category] });
  }
  // Tickets By Status
  const incidentsByStatus = [];
  const statusOrder = ["open", "closed", "in_progress"];
  statusOrder.forEach(status => {
    const count = reportData.tickets.filter(ticket => ticket.status === status).length;
    incidentsByStatus.push({ status, count });
  });
  return {
    ticketsByStation,
    incidentsByPriority,
    nocOsticketCategories,
    incidentsByStatus
  };
}

export default function ReportingPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
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
  const [openStart, setOpenStart] = useState(false);
  const [openEnd, setOpenEnd] = useState(false);
  const chartRefs = useRef({});

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
        // Utiliser startDate et endDate au format ISO complet pour couvrir toute la journée
        const today = new Date();
        const start = startDate ? `${startDate}T00:00:00Z` : today.toISOString().split('T')[0] + 'T00:00:00Z';
        const end = endDate ? `${endDate}T23:59:59Z` : start;
        const reportingDataPromise = fetchReportingData({
          startDate: start,
          endDate: end,
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
  }, [isAdmin, startDate, endDate, status, type, assignedUser, category, groupBy]);

  if (!userChecked || !isAdmin) return null;

  const exportToExcel = () => {
    if (!reportData) return;
    try {
      const stats = buildReportingStats(reportData);
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
      const priorityOrder = ["low", "medium", "high"];
      const priorityData = priorityOrder.map(priority => ({
        'Priorité': priority,
        'Nombre de Tickets': (stats.incidentsByPriority.find(item => item.priority === priority) || { count: 0 }).count
      }));
      const priorityWS = XLSX.utils.json_to_sheet(priorityData);
      XLSX.utils.book_append_sheet(workbook, priorityWS, 'Tickets par Priorité');

      // Feuille 3: Tickets par Station
      const stationWS = XLSX.utils.json_to_sheet(
        stats.nocOsticketCategories.map(item => ({
          'Station': item.category,
          'Nombre de Tickets': item.count
        }))
      );
      XLSX.utils.book_append_sheet(workbook, stationWS, 'Tickets par Station');

      // Feuille 4: Tickets par Statut
      const statusOrder = ["open", "closed", "in_progress"];
      const statusData = statusOrder.map(status => ({
        'Statut': status,
        'Nombre de Tickets': (stats.incidentsByStatus.find(item => item.status === status) || { count: 0 }).count
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
    try {
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.default || jsPDFModule.jsPDF;
      const autoTableModule = await import('jspdf-autotable');
      const autoTable = autoTableModule.default || autoTableModule;
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

      // 2. Capturer les images des graphiques du dashboard
      const chartImages = [
        { title: 'Tickets By Client', ref: chartRefs.current.client },
        { title: 'Tickets By Priority', ref: chartRefs.current.priority },
        { title: 'Tickets By Station', ref: chartRefs.current.station },
        { title: 'Tickets By Status', ref: chartRefs.current.status },
      ];
      const graphWidth = (pageWidth - margin * 3) / 2;
      const graphHeight = 65;
      let i = 0;
      for (let row = 0; row < 2; row++) {
        let x = margin;
        for (let col = 0; col < 2; col++) {
          if (i >= chartImages.length) break;
          pdf.setFontSize(12);
          pdf.text(chartImages[i].title, x + graphWidth / 2, y + 8, { align: 'center' });
          const chartInstance = chartImages[i].ref && chartImages[i].ref.chartInstance ? chartImages[i].ref.chartInstance : chartImages[i].ref;
          if (chartInstance && chartInstance.toBase64Image) {
            const imgData = chartInstance.toBase64Image();
            pdf.addImage(imgData, 'PNG', x, y + 10, graphWidth, graphHeight);
          }
          x += graphWidth + margin;
          i++;
        }
        y += graphHeight + 18;
      }

      // 3. Ajouter la liste des tickets
      if (reportData && reportData.tickets && reportData.tickets.length > 0) {
        console.log('Exemple de ticket :', reportData.tickets[0]);
        y += 10;
        pdf.setFontSize(14);
        pdf.text('Tickets liste', margin, y);
        y += 4;
        const ticketRows = reportData.tickets.map(ticket => {
          const dateValue = ticket.createdAt || ticket.date || ticket.created_at || ticket.updatedAt || '';
          return [
            ticket.id || '',
            ticket.title || '',
            ticket.status || '',
            ticket.type || '',
            ticket.client || '',
            dateValue ? (new Date(dateValue)).toLocaleDateString() : ''
          ];
        });
        pdf.autoTable({
          head: [["ID", "Title", "Status", "Type", "Client", "Date"]],
          body: ticketRows,
          startY: y,
          theme: 'grid',
          headStyles: { fillColor: [21, 93, 252] },
          styles: { fontSize: 10 },
          margin: { left: margin, right: margin }
        });
      } else {
        y += 10;
        pdf.setFontSize(14);
        pdf.text('Tickets liste', margin, y);
        y += 4;
        pdf.setFontSize(10);
        pdf.text('Aucun ticket trouvé pour cette période.', margin, y + 6);
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
            📄 Export PDF
          </button>
          <button
            onClick={exportToExcel}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            📊 Export Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-800">Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              <div className="flex flex-col">
                <label htmlFor="start-date" className="text-gray-700 text-sm mb-1">Start Date</label>
                <Popover open={openStart} onOpenChange={setOpenStart}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal text-gray-900 bg-white border border-gray-300"
                    >
                      {startDate ? (
                        format(new Date(startDate), "dd/MM/yyyy")
                      ) : (
                        <span>Select start date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 max-w-xs mx-auto" align="start">
                    <CustomCalendar
                      selected={{ from: startDate ? new Date(startDate) : null, to: null }}
                      onSelect={({ from }) => {
                        setStartDate(from ? toLocalDateString(from) : "");
                        setOpenStart(false);
                      }}
                      single={true}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex flex-col">
                <label htmlFor="end-date" className="text-gray-700 text-sm mb-1">End Date</label>
                <Popover open={openEnd} onOpenChange={setOpenEnd}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal text-gray-900 bg-white border border-gray-300"
                    >
                      {endDate ? (
                        format(new Date(endDate), "dd/MM/yyyy")
                      ) : (
                        <span>Select end date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 max-w-xs mx-auto" align="start">
                    <CustomCalendar
                      selected={{ from: endDate ? new Date(endDate) : null, to: null }}
                      onSelect={({ from }) => {
                        setEndDate(from ? toLocalDateString(from) : "");
                        setOpenEnd(false);
                      }}
                      single={true}
                    />
                  </PopoverContent>
                </Popover>
              </div>
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
              <>
                <div className="my-8">
                  <DashboardCharts stats={buildReportingStats(reportData)} />
                </div>
                <div className="space-y-4 mt-6">
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
              </>
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
        {reportData && <DashboardCharts stats={buildReportingStats(reportData)} chartRefs={chartRefs.current} />}
      </div>
    </div>
  );
} 