'use client';

import { useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const startDate = date.from ? date.from.toISOString() : new Date().toISOString();
      const endDate = date.to ? date.to.toISOString() : startDate;
      let reportingData = await fetchReportingData({
        startDate,
        endDate,
        status,
        type,
        assignedUser,
        category,
        groupBy
      });
      setReportData(reportingData);
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [date, status, type, assignedUser, category, groupBy]);

  const exportToExcel = () => {
    if (!reportData?.tickets) return;

    const worksheet = XLSX.utils.json_to_sheet(reportData.tickets);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");
    XLSX.writeFile(workbook, "rapport_tickets.xlsx");
  };

  const exportToPDF = () => {
    if (!reportData?.tickets) return;

    const doc = new jsPDF();
    // Titre
    doc.setFontSize(16);
    doc.text("Rapport des Tickets", 14, 15);
    // Statistiques
    doc.setFontSize(12);
    doc.text(`Total des tickets: ${reportData.stats.total}`, 14, 30);
    doc.text(`Temps moyen de résolution: ${Math.round(reportData.stats.averageResolutionTime / (1000 * 60 * 60))} heures`, 14, 40);
    // Tableau des tickets
    const tableColumn = ["ID", "Titre", "Statut", "Type", "Client", "Date"];
    const tableRows = reportData.tickets.map(ticket => [
      ticket.id,
      ticket.title,
      ticket.status,
      ticket.type,
      ticket.client,
      new Date(ticket.created_at).toLocaleDateString()
    ]);
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
    });
    doc.save("rapport_tickets.pdf");
  };

  const chartData = {
    labels: reportData?.stats.timeSeries.map(item => item.label) || [],
    datasets: [
      {
        label: 'Nombre de tickets',
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
        text: 'Évolution des tickets',
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
        <h1 className="text-2xl font-bold text-gray-800">Rapports</h1>
        <div className="space-x-2">
          <Button onClick={exportToExcel} variant="outline" className="text-gray-800 hover:bg-gray-100">
            <FileDown className="mr-2 h-4 w-4" />
            Excel
          </Button>
          <Button onClick={exportToPDF} variant="outline" className="text-gray-800 hover:bg-gray-100">
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-800">Période</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal text-gray-800"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "dd/MM/yyyy")} - {format(date.to, "dd/MM/yyyy")}
                        </>
                      ) : (
                        format(date.from, "dd/MM/yyyy")
                      )
                    ) : (
                      <span>Sélectionner une période</span>
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

        <Card>
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
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gray-800">Résumé</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-gray-800">Chargement...</div>
            ) : reportData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-gray-600">Total des tickets</div>
                    <div className="text-2xl font-bold text-gray-800">{reportData.stats.total}</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-gray-600">Tickets résolus</div>
                    <div className="text-2xl font-bold text-gray-800">{reportData.stats.resolved}</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-gray-600">Temps moyen de résolution</div>
                    <div className="text-2xl font-bold text-gray-800">
                      {reportData?.stats?.averageResolutionTime && reportData.stats.resolved > 0
                        ? `${Math.round(reportData.stats.averageResolutionTime)} heures`
                        : '0 heures'}
                    </div>
                  </div>
                </div>
                <div className="h-[300px]">
                  <Bar data={chartData} options={chartOptions} />
                </div>
              </div>
            ) : (
              <div className="text-gray-800">Aucune donnée disponible</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-gray-800">Liste des tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-gray-800">Chargement...</div>
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
            <div className="text-gray-800">Aucun ticket trouvé</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 