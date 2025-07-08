"use client";

import { useEffect, useState } from "react";
import {
  getDashboardAnalytics,
  getDashboardTimeSeries,
  DashboardAnalytics,
  TimeSeriesDayData,
} from "@/actions/dashboard";
import TimeSeriesChart from "@/components/dashboard/TimeSeriesChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Phone,
  MessageCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Users,
} from "lucide-react";

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesDayData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [analyticsData, timeSeriesData] = await Promise.all([
          getDashboardAnalytics(),
          getDashboardTimeSeries(30),
        ]);
        setAnalytics(analyticsData);
        setTimeSeries(timeSeriesData);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading || !analytics) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-slate-500">Cargando...</div>
      </div>
    );
  }

  const {
    voice: {
      totalCalls,
      totalDurationSeconds,
      averageDurationSeconds,
      totalCost,
      successRate,
    },
    chat: { totalMessages, totalSessions, averageMessagesPerSession },
  } = analytics;

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${Math.floor(seconds % 60)}s`;
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-light text-slate-800">
            Panel de Control
          </h1>
          <p className="text-slate-500 text-sm">
            Análisis completo de tu actividad
          </p>
        </div>

        {/* Charts Section */}
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-normal text-slate-700 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-slate-500" />
              Tendencias de los últimos 30 días
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TimeSeriesChart data={timeSeries} />
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Voice Analytics Cards */}
          <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-normal text-slate-500 flex items-center justify-between uppercase tracking-wider">
                <span>Total de Llamadas</span>
                <Phone className="h-3 w-3" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-light text-slate-800">
                {totalCalls.toLocaleString()}
              </div>
              <p className="text-slate-400 text-xs mt-1">Llamadas procesadas</p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-normal text-slate-500 flex items-center justify-between uppercase tracking-wider">
                <span>Duración Total</span>
                <Clock className="h-3 w-3" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-light text-slate-800">
                {formatDuration(totalDurationSeconds)}
              </div>
              <p className="text-slate-400 text-xs mt-1">
                Tiempo total de conversación
              </p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-normal text-slate-500 flex items-center justify-between uppercase tracking-wider">
                <span>Duración Promedio</span>
                <Clock className="h-3 w-3" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-light text-slate-800">
                {formatDuration(averageDurationSeconds)}
              </div>
              <p className="text-slate-400 text-xs mt-1">Por llamada</p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-normal text-slate-500 flex items-center justify-between uppercase tracking-wider">
                <span>Costo Total</span>
                <DollarSign className="h-3 w-3" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-light text-slate-800">
                ${totalCost.toFixed(2)}
              </div>
              <p className="text-slate-400 text-xs mt-1">Inversión total</p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-normal text-slate-500 flex items-center justify-between uppercase tracking-wider">
                <span>Tasa de Éxito</span>
                <TrendingUp className="h-3 w-3" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-light text-slate-800">
                {successRate.toFixed(1)}%
              </div>
              <p className="text-slate-400 text-xs mt-1">Llamadas exitosas</p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-normal text-slate-500 flex items-center justify-between uppercase tracking-wider">
                <span>Total Mensajes</span>
                <MessageCircle className="h-3 w-3" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-light text-slate-800">
                {totalMessages.toLocaleString()}
              </div>
              <p className="text-slate-400 text-xs mt-1">
                Mensajes de WhatsApp
              </p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-normal text-slate-500 flex items-center justify-between uppercase tracking-wider">
                <span>Total Sesiones</span>
                <Users className="h-3 w-3" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-light text-slate-800">
                {totalSessions.toLocaleString()}
              </div>
              <p className="text-slate-400 text-xs mt-1">
                Conversaciones únicas
              </p>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-normal text-slate-500 flex items-center justify-between uppercase tracking-wider">
                <span>Mensajes por Sesión</span>
                <MessageCircle className="h-3 w-3" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-light text-slate-800">
                {averageMessagesPerSession.toFixed(1)}
              </div>
              <p className="text-slate-400 text-xs mt-1">
                Promedio de interacción
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
