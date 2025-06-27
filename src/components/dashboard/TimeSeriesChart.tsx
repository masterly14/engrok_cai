"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { TimeSeriesDayData } from "@/actions/dashboard";
import { useMemo } from "react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Props {
  data: TimeSeriesDayData[];
}

export default function TimeSeriesChart({ data }: Props) {
  const chartData = useMemo(() => {
    const labels = data.map((d) => {
      const date = new Date(d.date);
      return date.toLocaleDateString('es-ES', { 
        month: 'short', 
        day: 'numeric' 
      });
    });

    return {
      labels,
      datasets: [
        {
          label: "Mensajes WhatsApp",
          data: data.map((d) => d.messages),
          borderColor: "#64748b",
          backgroundColor: "rgba(100, 116, 139, 0.05)",
          borderWidth: 1.5,
          tension: 0.3,
          fill: true,
          pointBackgroundColor: "#64748b",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 1,
          pointRadius: 2,
          pointHoverRadius: 4,
        },
        {
          label: "Llamadas Vapi",
          data: data.map((d) => d.calls),
          borderColor: "#94a3b8",
          backgroundColor: "rgba(148, 163, 184, 0.05)",
          borderWidth: 1.5,
          tension: 0.3,
          fill: true,
          pointBackgroundColor: "#94a3b8",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 1,
          pointRadius: 2,
          pointHoverRadius: 4,
        },
      ],
    };
  }, [data]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      plugins: {
        legend: {
          position: "top" as const,
          labels: {
            font: {
              size: 12,
              weight: 400,
            },
            color: '#64748b',
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 16,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          titleColor: '#1e293b',
          bodyColor: '#64748b',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          cornerRadius: 6,
          padding: 10,
          displayColors: true,
          callbacks: {
            title: function(context: any) {
              return `${context[0].label}`;
            },
            label: function(context: any) {
              return `${context.dataset.label}: ${context.parsed.y}`;
            }
          }
        },
      },
      scales: {
        x: {
          grid: {
            display: true,
            color: 'rgba(148, 163, 184, 0.1)',
            drawBorder: false,
          },
          ticks: {
            color: '#94a3b8',
            font: {
              size: 11,
            },
          },
          border: {
            display: false,
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            display: true,
            color: 'rgba(148, 163, 184, 0.1)',
            drawBorder: false,
          },
          ticks: {
            color: '#94a3b8',
            font: {
              size: 11,
            },
            callback: function(value: any) {
              return Number.isInteger(value) ? value : '';
            },
          },
          border: {
            display: false,
          },
        },
      },
      elements: {
        line: {
          borderJoinStyle: 'round' as const,
        },
        point: {
          hoverBorderWidth: 2,
        },
      },
    }),
    []
  );

  return (
    <div className="h-80 w-full">
      <Line options={options} data={chartData} />
    </div>
  );
}