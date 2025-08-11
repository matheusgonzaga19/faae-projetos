import { useMemo } from "react";
import type { TaskWithDetails } from "@shared/schema";

interface CalendarHeatmapProps {
  tasks: TaskWithDetails[];
  year: number;
  holidays?: Array<{ date: string; name: string; type: string }>;
}

export default function CalendarHeatmap({ tasks, year, holidays = [] }: CalendarHeatmapProps) {
  const heatmapData = useMemo(() => {
    // Generate all days for the year
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    const daysInYear: Array<{
      date: Date;
      day: number;
      month: number;
      activity: number;
      completedTasks: number;
      createdTasks: number;
    }> = [];

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      
      // Count completed tasks for this day
      const completedTasks = tasks.filter(task => {
        if (!task.completedAt) return false;
        const completedDate = new Date(task.completedAt).toISOString().split('T')[0];
        return completedDate === dateStr;
      }).length;

      // Count created tasks for this day
      const createdTasks = tasks.filter(task => {
        if (!task.createdAt) return false;
        const createdDate = new Date(task.createdAt).toISOString().split('T')[0];
        return createdDate === dateStr;
      }).length;

      // Calculate activity level (0-4)
      const totalActivity = completedTasks * 2 + createdTasks; // Weight completed tasks more
      let activityLevel = 0;
      if (totalActivity >= 1) activityLevel = 1;
      if (totalActivity >= 3) activityLevel = 2;
      if (totalActivity >= 5) activityLevel = 3;
      if (totalActivity >= 8) activityLevel = 4;

      daysInYear.push({
        date: new Date(d),
        day: d.getDate(),
        month: d.getMonth(),
        activity: activityLevel,
        completedTasks,
        createdTasks,
      });
    }

    return daysInYear;
  }, [tasks, year]);

  const months = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];

  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getActivityColor = (level: number) => {
    switch (level) {
      case 0:
        return 'bg-gray-100 dark:bg-gray-700';
      case 1:
        return 'bg-blue-200 dark:bg-blue-800';
      case 2:
        return 'bg-blue-400 dark:bg-blue-600';
      case 3:
        return 'bg-blue-600 dark:bg-blue-500';
      case 4:
        return 'bg-blue-800 dark:bg-blue-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700';
    }
  };

  const getCurrentMonth = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    if (year !== currentYear) return null;
    
    return heatmapData.filter(day => day.month === currentMonth);
  };

  const currentMonthData = getCurrentMonth();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Heatmap de Atividade - {year}</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <span>Menos</span>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-100 dark:bg-gray-700 rounded"></div>
            <div className="w-3 h-3 bg-blue-200 dark:bg-blue-800 rounded"></div>
            <div className="w-3 h-3 bg-blue-400 dark:bg-blue-600 rounded"></div>
            <div className="w-3 h-3 bg-blue-600 dark:bg-blue-500 rounded"></div>
            <div className="w-3 h-3 bg-blue-800 dark:bg-blue-400 rounded"></div>
          </div>
          <span>Mais</span>
        </div>
      </div>

      {/* Current Month View */}
      {currentMonthData && (
        <div className="mb-8">
          <h4 className="text-md font-medium mb-4">
            {months[new Date().getMonth()]} {year}
          </h4>
          <div className="grid grid-cols-7 gap-1 max-w-md">
            {/* Weekday headers */}
            {weekdays.map((day) => (
              <div key={day} className="text-center text-xs text-gray-500 dark:text-gray-400 py-2">
                {day}
              </div>
            ))}
            
            {/* Empty cells for start of month */}
            {Array.from({ length: new Date(year, new Date().getMonth(), 1).getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="w-8 h-8"></div>
            ))}
            
            {/* Days of current month */}
            {currentMonthData.map((day) => (
              <div
                key={day.date.toISOString()}
                className={`w-8 h-8 ${getActivityColor(day.activity)} rounded flex items-center justify-center text-xs font-semibold cursor-pointer hover:ring-2 hover:ring-blue-300 dark:hover:ring-blue-600 transition-all`}
                title={`${day.date.toLocaleDateString('pt-BR')} - ${day.completedTasks} tarefas concluídas, ${day.createdTasks} tarefas criadas`}
              >
                {day.activity > 0 ? (
                  <span className="text-white">{day.day}</span>
                ) : (
                  <span className="text-gray-600 dark:text-gray-400">{day.day}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Year Overview */}
      <div>
        <h4 className="text-md font-medium mb-4">Visão Geral do Ano</h4>
        <div className="grid grid-cols-12 gap-2">
          {months.map((month, monthIndex) => {
            const monthDays = heatmapData.filter(day => day.month === monthIndex);
            const monthActivity = monthDays.reduce((sum, day) => sum + day.activity, 0);
            const avgActivity = monthDays.length > 0 ? monthActivity / monthDays.length : 0;
            
            return (
              <div key={month} className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{month}</div>
                <div
                  className={`w-full h-8 ${getActivityColor(Math.round(avgActivity))} rounded flex items-center justify-center text-xs font-medium cursor-pointer hover:ring-2 hover:ring-blue-300 dark:hover:ring-blue-600 transition-all`}
                  title={`${month} - Atividade média: ${avgActivity.toFixed(1)}`}
                >
                  {monthDays.reduce((sum, day) => sum + day.completedTasks + day.createdTasks, 0)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {heatmapData.reduce((sum, day) => sum + day.completedTasks, 0)}
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300">Tarefas concluídas</div>
        </div>
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {heatmapData.reduce((sum, day) => sum + day.createdTasks, 0)}
          </div>
          <div className="text-sm text-green-700 dark:text-green-300">Tarefas criadas</div>
        </div>
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {heatmapData.filter(day => day.activity > 0).length}
          </div>
          <div className="text-sm text-purple-700 dark:text-purple-300">Dias ativos</div>
        </div>
      </div>
    </div>
  );
}
