import type { DashboardStats, UserStats } from "@/types";

interface MetricsCardsProps {
  stats?: DashboardStats;
  userStats?: UserStats;
}

export default function MetricsCards({ stats, userStats }: MetricsCardsProps) {
  const metrics = [
    {
      title: "Tarefas Concluídas",
      value: stats?.completedTasks || 0,
      change: userStats ? Math.round(userStats.efficiency) : 0,
      changeType: "positive" as const,
      icon: "fas fa-check-circle",
      iconColor: "text-green-500",
      iconBg: "bg-green-500 bg-opacity-10",
    },
    {
      title: "Projetos Ativos",
      value: stats?.activeProjects || 0,
      change: 0,
      changeType: "neutral" as const,
      icon: "fas fa-project-diagram",
      iconColor: "text-blue-600",
      iconBg: "bg-blue-600 bg-opacity-10",
    },
    {
      title: "Horas Trabalhadas",
      value: Number(stats?.totalHours || 0).toFixed(2),
      change: `+${Number(userStats?.hoursWorked || 0).toFixed(2)}`,
      changeType: "positive" as const,
      icon: "fas fa-clock",
      iconColor: "text-amber-500",
      iconBg: "bg-amber-500 bg-opacity-10",
    },
    {
      title: "Eficiência",
      value: `${Math.round(stats?.efficiency || 0)}%`,
      change: Math.round(userStats?.efficiency || 0),
      changeType: stats?.efficiency && stats.efficiency > 80 ? "positive" : "warning" as const,
      icon: "fas fa-chart-line",
      iconColor: "text-purple-500",
      iconBg: "bg-purple-500 bg-opacity-10",
    },
  ];

  const getChangeColor = (type: "positive" | "negative" | "neutral" | "warning") => {
    switch (type) {
      case "positive":
        return "text-green-600 dark:text-green-400";
      case "negative":
        return "text-red-600 dark:text-red-400";
      case "warning":
        return "text-amber-600 dark:text-amber-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getChangeIcon = (type: "positive" | "negative" | "neutral" | "warning") => {
    switch (type) {
      case "positive":
        return "fas fa-arrow-up";
      case "negative":
        return "fas fa-arrow-down";
      case "warning":
        return "fas fa-exclamation-triangle";
      default:
        return "fas fa-minus";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                {metric.title}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {metric.value}
              </p>
              {metric.change !== 0 && (
                <p className={`text-sm flex items-center mt-2 ${getChangeColor(metric.changeType)}`}>
                  <i className={`${getChangeIcon(metric.changeType)} mr-1`}></i>
                  {metric.changeType === "positive" && "+"}
                  {metric.change}
                  {metric.title === "Eficiência" ? "%" : ""}
                </p>
              )}
            </div>
            <div className={`w-12 h-12 ${metric.iconBg} rounded-lg flex items-center justify-center`}>
              <i className={`${metric.icon} ${metric.iconColor} text-xl`}></i>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
