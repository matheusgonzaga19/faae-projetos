import { useMemo } from "react";
import { Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { CHART_COLORS, STATUS_LABELS, PRIORITY_LABELS } from "@/lib/constants";
import type { TaskWithDetails } from "@/types";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

interface ChartsProps {
  tasks: TaskWithDetails[];
}

export default function Charts({ tasks }: ChartsProps) {
  const taskDistributionData = useMemo(() => {
    const statusCounts = {
      aberta: 0,
      em_andamento: 0,
      concluida: 0,
      cancelada: 0,
    };

    tasks.forEach((task) => {
      statusCounts[task.status as keyof typeof statusCounts]++;
    });

    return {
      labels: Object.keys(statusCounts).map(status => STATUS_LABELS[status as keyof typeof STATUS_LABELS]),
      datasets: [
        {
          data: Object.values(statusCounts),
          backgroundColor: [
            CHART_COLORS.info,
            CHART_COLORS.warning,
            CHART_COLORS.success,
            CHART_COLORS.danger,
          ],
          borderWidth: 0,
        },
      ],
    };
  }, [tasks]);

  const priorityDistributionData = useMemo(() => {
    const priorityCounts = {
      baixa: 0,
      media: 0,
      alta: 0,
      critica: 0,
    };

    tasks.forEach((task) => {
      priorityCounts[task.priority as keyof typeof priorityCounts]++;
    });

    return {
      labels: Object.keys(priorityCounts).map(priority => 
        PRIORITY_LABELS[priority as keyof typeof PRIORITY_LABELS]
      ),
      datasets: [
        {
          label: "Número de Tarefas",
          data: Object.values(priorityCounts),
          backgroundColor: [
            CHART_COLORS.success,
            CHART_COLORS.warning,
            CHART_COLORS.accent,
            CHART_COLORS.danger,
          ],
        },
      ],
    };
  }, [tasks]);

  const productivityData = useMemo(() => {
    // Get last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    const completedByDay = last7Days.map(date => {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      return tasks.filter(task => {
        if (!task.completedAt) return false;
        const completedDate = new Date(task.completedAt);
        return completedDate >= dayStart && completedDate <= dayEnd;
      }).length;
    });

    return {
      labels: last7Days.map(date => 
        date.toLocaleDateString('pt-BR', { weekday: 'short' })
      ),
      datasets: [
        {
          label: "Tarefas Concluídas",
          data: completedByDay,
          borderColor: CHART_COLORS.primary,
          backgroundColor: CHART_COLORS.primary + '20',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, [tasks]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
    },
  };

  const barChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      {/* Task Distribution Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Distribuição de Tarefas</h3>
          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <i className="fas fa-ellipsis-h"></i>
          </button>
        </div>
        <div className="relative h-64">
          <Doughnut data={taskDistributionData} options={chartOptions} />
        </div>
      </div>

      {/* Priority Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Distribuição por Prioridade</h3>
          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <i className="fas fa-ellipsis-h"></i>
          </button>
        </div>
        <div className="relative h-64">
          <Bar data={priorityDistributionData} options={barChartOptions} />
        </div>
      </div>

      {/* Productivity Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 lg:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Produtividade dos Últimos 7 Dias</h3>
          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <i className="fas fa-ellipsis-h"></i>
          </button>
        </div>
        <div className="relative h-64">
          <Bar data={productivityData} options={barChartOptions} />
        </div>
      </div>
    </div>
  );
}
