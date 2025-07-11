'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { format, addMonths, startOfMonth, endOfMonth, max, min, isAfter, isBefore } from "date-fns";
import { fr, enUS } from "date-fns/locale";
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
import ReportingCharts from '../components/ReportingCharts';
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

function buildReportingStats(reportData, startDate, endDate) {
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

  // --- Nouvelle logique timeSeriesByStatus ---
  let timeSeriesByStatus = [];
  if (reportData.tickets && startDate && endDate) {
    // Découper la période sélectionnée en mois partiels
    const start = new Date(startDate);
    const end = new Date(endDate);
    let current = startOfMonth(start);
    while (isBefore(current, end) || current.getMonth() === end.getMonth() && current.getFullYear() === end.getFullYear()) {
      // Début réel de la sous-période
      const periodStart = max([current, start]);
      // Fin réelle de la sous-période
      const periodEnd = min([endOfMonth(current), end]);
      // Filtrer les tickets dans cette sous-période
      const ticketsForPeriod = reportData.tickets.filter(ticket => {
        const d = new Date(ticket.created_at);
        return d >= periodStart && d <= periodEnd;
      });
      // Compter par statut
      const obj = {
        label: format(current, 'MMMM yyyy', { locale: enUS }),
        displayLabel: format(current, 'MMMM yyyy', { locale: enUS })
      };
      const statusOrder = ["open", "closed", "in_progress"];
      statusOrder.forEach(status => {
        obj[status] = ticketsForPeriod.filter(t => t.status === status).length;
      });
      timeSeriesByStatus.push(obj);
      current = addMonths(current, 1);
      if (isAfter(current, end)) break;
    }
  }
  // ---

  return {
    ticketsByStation,
    incidentsByPriority,
    nocOsticketCategories,
    incidentsByStatus,
    timeSeriesByStatus // Ajouté pour l'histogramme groupé
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
    setUserChecked(true);
  }, []);

  useEffect(() => {
    if (!userChecked) return;
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
  }, [userChecked, startDate, endDate, status, type, assignedUser, category, groupBy]);

  if (!userChecked) return null;

  const exportToExcel = () => {
    if (!reportData) return;
    try {
      const stats = buildReportingStats(reportData, startDate, endDate);
      const workbook = XLSX.utils.book_new();

      // Feuille 1: Tickets by Month (nouveau)
      const monthWS = XLSX.utils.json_to_sheet(
        (stats.timeSeriesByStatus || []).map(item => ({
          'Month': item.displayLabel || item.label,
          'Open': item.open,
          'Closed': item.closed,
          'In Progress': item.in_progress
        }))
      );
      XLSX.utils.book_append_sheet(workbook, monthWS, 'Tickets By Month');

      // Feuille 2: Tickets par Client
      const ticketsByStationWS = XLSX.utils.json_to_sheet(
        stats.ticketsByStation.map(item => ({
          'Client': item.station,
          'Number of Tickets': item.count
        }))
      );
      XLSX.utils.book_append_sheet(workbook, ticketsByStationWS, 'Tickets par Client');

      // Feuille 3: Tickets par Priorité
      const priorityOrder = ["low", "medium", "high"];
      const priorityData = priorityOrder.map(priority => ({
        'Priorité': priority,
        'Number of Tickets': (stats.incidentsByPriority.find(item => item.priority === priority) || { count: 0 }).count
      }));
      const priorityWS = XLSX.utils.json_to_sheet(priorityData);
      XLSX.utils.book_append_sheet(workbook, priorityWS, 'Tickets par Priorité');

      // Feuille 4: Tickets par Station
      const stationWS = XLSX.utils.json_to_sheet(
        stats.nocOsticketCategories.map(item => ({
          'Station': item.category,
          'Number of Tickets': item.count
        }))
      );
      XLSX.utils.book_append_sheet(workbook, stationWS, 'Tickets par Station');

      // Feuille 5: Tickets par Statut
      const statusOrder = ["open", "closed", "in_progress"];
      const statusData = statusOrder.map(status => ({
        'Statut': status,
        'Number of Tickets': (stats.incidentsByStatus.find(item => item.status === status) || { count: 0 }).count
      }));
      const statusWS = XLSX.utils.json_to_sheet(statusData);
      XLSX.utils.book_append_sheet(workbook, statusWS, 'Tickets par Statut');

      XLSX.writeFile(workbook, 'reporting.xlsx');
    } catch (error) {
      console.error('Error while exporting Excel:', error);
      alert('Error while exporting Excel');
    }
  };

  const exportToPDF = async () => {
    let tries = 0;
    const maxTries = 5;
    async function doExport() {
      // Vérifier que les refs sont prêtes
      if (!chartRefs.current || !chartRefs.current.pie || !chartRefs.current.bar) {
        if (tries < maxTries) {
          tries++;
          setTimeout(doExport, 300);
          return;
        } else {
          alert('Charts are not ready for export. Please try again.');
          return;
        }
      }
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

        // 2. Capturer les deux nouveaux graphiques (Pie et Bar) avec ratio adapté
        // Pie chart petit, Bar chart petit
        const pieWidth = 90, pieHeight = 90;
        const barWidth = 140, barHeight = 90;
        // Positionnement
        const pieX = margin;
        const barX = pieX + pieWidth + margin;
        pdf.setFontSize(12);
        pdf.text('Number of Tickets', pieX + pieWidth / 2, y + 8, { align: 'center' });
        pdf.text('Ticket Status Per Month', barX + barWidth / 2, y + 8, { align: 'center' });
        // Pie chart
        const pieInstance = chartRefs.current.pie && chartRefs.current.pie.chartInstance ? chartRefs.current.pie.chartInstance : chartRefs.current.pie;
        if (pieInstance && pieInstance.toBase64Image) {
          const imgData = pieInstance.toBase64Image();
          pdf.addImage(imgData, 'PNG', pieX, y + 10, pieWidth, pieHeight);
        }
        // Bar chart
        const barInstance = chartRefs.current.bar && chartRefs.current.bar.chartInstance ? chartRefs.current.bar.chartInstance : chartRefs.current.bar;
        if (barInstance && barInstance.toBase64Image) {
          const imgData = barInstance.toBase64Image();
          pdf.addImage(imgData, 'PNG', barX, y + 10, barWidth, barHeight);
        }
        y += Math.max(pieHeight, barHeight) + 18;

        // 3. Tickets List (une seule fois, sans doublon d'en-tête)
        if (reportData && reportData.tickets && reportData.tickets.length > 0) {
          y += 10;
          pdf.setFontSize(14);
          pdf.text('Tickets List', margin, y);
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
          autoTable(pdf, {
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
          pdf.text('Tickets List', margin, y);
          y += 4;
          pdf.setFontSize(10);
          pdf.text('No data found for this period.', margin, y + 6);
        }

        pdf.save('reporting.pdf');
      } catch (error) {
        console.error('Error while exporting PDF:', error);
        alert('Error while exporting PDF. Please try again.');
      }
    }
    doExport();
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
              <button
                onClick={() => { setStartDate(""); setEndDate(""); }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-lg text-sm font-medium transition-colors mt-6"
                style={{ height: '40px', alignSelf: 'end' }}
              >
                Reset Dates
              </button>
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
                  <ReportingCharts stats={buildReportingStats(reportData, startDate, endDate)} />
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
          <CardTitle className="text-gray-800">Tickets List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-gray-800">Loading...</div>
          ) : reportData?.tickets ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-gray-800">ID</th>
                    <th className="text-left py-3 px-4 text-gray-800">Title</th>
                    <th className="text-left py-3 px-4 text-gray-800">Status</th>
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
        {reportData && <ReportingCharts stats={buildReportingStats(reportData, startDate, endDate)} chartRefs={chartRefs.current} />}
      </div>
    </div>
  );
} 