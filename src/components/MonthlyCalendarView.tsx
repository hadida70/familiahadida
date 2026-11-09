import React, { useState, useMemo, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  Circle,
  Calendar as CalendarIcon,
  Trash2,
  Edit2,
  Send,
  Check,
  X,
  Clock,
} from 'lucide-react';
import { CalendarTask, Member } from '../types';
import { getMemberColorTheme } from '../lib/memberColors';

interface MonthlyCalendarViewProps {
  tasks: CalendarTask[];
  members: Member[];
  activeMember: Member | null;
  isAdmin?: boolean;
  selectedMemberFilter?: string;
  onSelectMemberFilter?: (memberId: string) => void;
  hideMemberFilterBar?: boolean;
  onAddTask?: (task: Partial<CalendarTask>) => void;
  onUpdateTask?: (id: string, task: Partial<CalendarTask>) => void;
  onToggleComplete: (task: CalendarTask) => void;
  onDeleteTask: (id: string) => void;
  onSendTaskAlert?: (task: CalendarTask) => void;
  fontSize?: 'normal' | 'large' | 'xlarge';
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const SHORT_MONTH_NAMES = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

const WEEKDAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export const MonthlyCalendarView: React.FC<MonthlyCalendarViewProps> = ({
  tasks,
  members,
  activeMember,
  isAdmin = false,
  selectedMemberFilter: externalMemberFilter,
  onSelectMemberFilter,
  hideMemberFilterBar = false,
  onAddTask,
  onUpdateTask,
  onToggleComplete,
  onDeleteTask,
  onSendTaskAlert,
}) => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());

  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;

  const [selectedDate, setSelectedDate] = useState<string>(todayString);
  const [isDayModalOpen, setIsDayModalOpen] = useState<boolean>(false);
  const [internalMemberFilter, setInternalMemberFilter] = useState<string>('all');

  const selectedMemberFilter =
    externalMemberFilter !== undefined ? externalMemberFilter : internalMemberFilter;

  const handleSetMemberFilter = (memberId: string) => {
    if (onSelectMemberFilter) {
      onSelectMemberFilter(memberId);
    } else {
      setInternalMemberFilter(memberId);
    }
  };

  // Fast task creation state (inside date click modal)
  const [quickTitle, setQuickTitle] = useState<string>('');
  const [quickAssigneeId, setQuickAssigneeId] = useState<string>(activeMember?.id || 'member_jaime');
  const quickInputRef = useRef<HTMLInputElement | null>(null);

  // Inline editing state for existing tasks
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleGoToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(todayString);
  };

  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setEditingTaskId(null);
    setIsDayModalOpen(true);
    setTimeout(() => quickInputRef.current?.focus(), 80);
  };

  // Helper to format date string nicely: "19 de Agosto (2026)"
  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const day = parseInt(parts[2], 10);
    const monthIdx = parseInt(parts[1], 10) - 1;
    const year = parts[0];
    return `${day} de ${MONTH_NAMES[monthIdx] || ''} (${year})`;
  };

  // Short date format for fast reading in the right panel: "18 Nov"
  const formatShortDate = (dateStr: string) => {
    if (!dateStr) return '';
    if (dateStr === todayString) return 'HOY';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const day = parseInt(parts[2], 10);
    const monthIdx = parseInt(parts[1], 10) - 1;
    return `${day} ${SHORT_MONTH_NAMES[monthIdx] || ''}`;
  };

  // Compute days in current month (filtered by selectedMemberFilter)
  const calendarGrid = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const totalDays = lastDayOfMonth.getDate();

    let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6;

    const getTasksForDate = (dateStr: string) =>
      tasks.filter(
        (t) =>
          t.date === dateStr &&
          (selectedMemberFilter === 'all' || t.assignedToId === selectedMemberFilter)
      );

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      tasks: CalendarTask[];
    }> = [];

    // Empty offset slots from previous month
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDayNum = prevMonthLastDay - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(
        prevDayNum
      ).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: prevDayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayString,
        isSelected: dateStr === selectedDate,
        tasks: getTasksForDate(dateStr),
      });
    }

    // Days in current month
    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(
        day
      ).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: dateStr === todayString,
        isSelected: dateStr === selectedDate,
        tasks: getTasksForDate(dateStr),
      });
    }

    // Fill remaining slots
    const totalSlots = Math.ceil(days.length / 7) * 7;
    const remainingSlots = totalSlots - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(
        i
      ).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: dateStr === todayString,
        isSelected: dateStr === selectedDate,
        tasks: getTasksForDate(dateStr),
      });
    }

    return days;
  }, [currentYear, currentMonth, tasks, selectedDate, todayString, selectedMemberFilter]);

  // Tasks for the currently selected date (shown inside the Date Modal)
  const displayedTasksForSelectedDate = useMemo(() => {
    return tasks.filter((t) => {
      if (t.date !== selectedDate) return false;
      if (selectedMemberFilter !== 'all' && t.assignedToId !== selectedMemberFilter) {
        return false;
      }
      return true;
    });
  }, [tasks, selectedDate, selectedMemberFilter]);

  // Next 7 Upcoming Events for the right-hand fast-reading panel
  const upcomingSevenEvents = useMemo(() => {
    const memberFiltered = tasks.filter(
      (t) => selectedMemberFilter === 'all' || t.assignedToId === selectedMemberFilter
    );

    // 1. Future or today uncompleted tasks (sorted ascending by date, then time)
    const futureUncompleted = memberFiltered
      .filter((t) => !t.completed && t.date >= todayString)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));

    if (futureUncompleted.length >= 7) {
      return futureUncompleted.slice(0, 7);
    }

    // 2. If fewer than 7, include recent uncompleted tasks so no active event is missed
    const pastUncompleted = memberFiltered
      .filter((t) => !t.completed && t.date < todayString)
      .sort((a, b) => b.date.localeCompare(a.date));

    const combined = [...futureUncompleted, ...pastUncompleted];
    if (combined.length >= 7) {
      return combined.slice(0, 7);
    }

    // 3. If still fewer than 7, fill with future completed tasks
    const futureCompleted = memberFiltered
      .filter((t) => t.completed && t.date >= todayString)
      .sort((a, b) => a.date.localeCompare(b.date));

    return [...combined, ...futureCompleted].slice(0, 7);
  }, [tasks, selectedMemberFilter, todayString]);

  // Direct Add Task inside Modal
  const handleDirectAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || !onAddTask) return;

    onAddTask({
      title: quickTitle.trim(),
      date: selectedDate || todayString,
      assignedToId: quickAssigneeId || activeMember?.id || 'member_jaime',
      category: 'General',
      urgent: false,
      completed: false,
    });

    setQuickTitle('');
  };

  // Start Inline Editing
  const handleStartEdit = (task: CalendarTask) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
  };

  // Save Inline Edit
  const handleSaveEdit = (taskId: string) => {
    if (!editTitle.trim() || !onUpdateTask) {
      setEditingTaskId(null);
      return;
    }
    onUpdateTask(taskId, { title: editTitle.trim() });
    setEditingTaskId(null);
  };

  // Member filter and quick assignee synchronization
  React.useEffect(() => {
    if (!isAdmin && activeMember) {
      setQuickAssigneeId(activeMember.id);
    } else if (selectedMemberFilter && selectedMemberFilter !== 'all') {
      setQuickAssigneeId(selectedMemberFilter);
    }
  }, [activeMember, isAdmin, selectedMemberFilter]);

  return (
    <div
      id="monthly-calendar-view"
      className={`space-y-4 ${hideMemberFilterBar ? 'w-full' : 'max-w-6xl mx-auto mb-12'}`}
    >
      {/* Member Filter Bar (Admin Only, hidden when unified with left sidebar) */}
      {isAdmin && !hideMemberFilterBar && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 shadow-2xs">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase shrink-0">
              Integrantes:
            </span>
            <button
              onClick={() => handleSetMemberFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer border ${
                selectedMemberFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-red-600 border-red-600 shadow-2xs ring-1 ring-red-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-red-300'
              }`}
            >
              Todos
            </button>
            {members.map((m) => {
              const isSelected = selectedMemberFilter === m.id;
              const mTheme = getMemberColorTheme(m, m.id);
              return (
                <button
                  key={m.id}
                  onClick={() => handleSetMemberFilter(isSelected ? 'all' : m.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border cursor-pointer ${
                    isSelected
                      ? `${mTheme.badge} shadow-2xs ring-2 ring-offset-1 font-black`
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${mTheme.dot}`} />
                  <span className="font-extrabold">{m.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Layout: Calendar on Left + Upcoming 7 Events Panel on Right */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch">
        {/* Left Column: Calendar Grid Card */}
        <div className="flex-1 min-w-0 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          {/* Month Navigation Toolbar */}
          <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </h3>
              <button
                onClick={handleGoToday}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                Hoy
              </button>
              <span className="hidden sm:inline-block text-[11px] text-slate-400 font-medium ml-1">
                Haz clic en cualquier fecha para agregar o ver tareas
              </span>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-red-600 transition-colors cursor-pointer"
                title="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-red-600 transition-colors cursor-pointer"
                title="Mes siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-center text-xs font-bold text-slate-500 dark:text-slate-400 py-2">
            {WEEKDAY_NAMES.map((name, i) => (
              <div key={name} className={i >= 5 ? 'text-red-500 font-extrabold' : ''}>
                {name}
              </div>
            ))}
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-800">
            {calendarGrid.map((day, idx) => {
              return (
                <div
                  key={day.dateStr + '-' + idx}
                  onClick={() => handleDateClick(day.dateStr)}
                  title={`Clic para agregar tarea el ${formatDateLabel(day.dateStr)}`}
                  className={`min-h-[74px] sm:min-h-[90px] p-1.5 sm:p-2 bg-white dark:bg-slate-900 transition-all cursor-pointer flex flex-col justify-between relative group hover:bg-red-50/30 dark:hover:bg-slate-800/80 ${
                    !day.isCurrentMonth ? 'opacity-35 bg-slate-50/50 dark:bg-slate-950/40' : ''
                  } ${
                    day.isSelected
                      ? 'ring-2 ring-red-600 dark:ring-red-500 z-10 bg-red-50/15 dark:bg-red-950/20'
                      : ''
                  }`}
                >
                  {/* Day Number + Hover Add Icon / Count */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center ${
                        day.isToday
                          ? 'bg-red-600 text-white font-black shadow-xs'
                          : day.isSelected
                          ? 'text-red-600 font-extrabold'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {day.dayNumber}
                    </span>

                    <div className="flex items-center gap-1">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 rounded-full bg-red-100 dark:bg-red-950 text-red-600 flex items-center justify-center">
                        <Plus className="w-3 h-3" />
                      </span>
                      {day.tasks.length > 0 && (
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {day.tasks.length}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Desktop: Task Pills with Member Unique Colors */}
                  <div className="hidden sm:block space-y-1 my-1 overflow-hidden max-h-[46px]">
                    {day.tasks.slice(0, 2).map((t) => {
                      const assignee = members.find((m) => m.id === t.assignedToId);
                      const mTheme = getMemberColorTheme(assignee, t.assignedToId);

                      return (
                        <div
                          key={t.id}
                          className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium bg-white dark:bg-slate-900 border ${mTheme.border} shadow-2xs flex items-center gap-1`}
                          title={`${assignee ? assignee.name + ': ' : ''}${t.title}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${mTheme.dot}`} />
                          <span className="font-black shrink-0">
                            {assignee ? assignee.name : 'Familia'}:
                          </span>
                          <span
                            className={`truncate ${
                              t.completed
                                ? 'line-through opacity-60 text-slate-500'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {t.title}
                          </span>
                        </div>
                      );
                    })}
                    {day.tasks.length > 2 && (
                      <div className="text-[9px] text-slate-500 dark:text-slate-400 font-bold pl-1">
                        +{day.tasks.length - 2} más...
                      </div>
                    )}
                  </div>

                  {/* Mobile: Colored dots per member */}
                  <div className="flex sm:hidden items-center gap-1 mt-1 justify-end flex-wrap">
                    {day.tasks.slice(0, 5).map((t) => {
                      const assignee = members.find((m) => m.id === t.assignedToId);
                      const mTheme = getMemberColorTheme(assignee, t.assignedToId);
                      return (
                        <span
                          key={t.id}
                          className={`w-2 h-2 rounded-full shadow-2xs ${mTheme.dot}`}
                          title={assignee ? assignee.name : 'Familia'}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Próximos 7 Eventos Panel (Fast Reading) */}
        <div className="w-full lg:w-80 xl:w-96 shrink-0 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col overflow-hidden">
          {/* Panel Header */}
          <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 flex items-center justify-center text-red-600 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                  Próximos Eventos
                </h3>
                <p className="text-[10px] font-semibold text-slate-400">
                  Lectura rápida ({upcomingSevenEvents.length} de 7)
                </p>
              </div>
            </div>

            <button
              onClick={() => handleDateClick(selectedDate || todayString)}
              className="px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer flex items-center gap-1 shrink-0"
              title="Agregar nueva tarea"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva</span>
            </button>
          </div>

          {/* 7 Events List */}
          <div className="p-3 space-y-2 flex-1 overflow-y-auto max-h-[540px]">
            {upcomingSevenEvents.length > 0 ? (
              upcomingSevenEvents.map((task) => {
                const assignee = members.find((m) => m.id === task.assignedToId);
                const mTheme = getMemberColorTheme(assignee, task.assignedToId);
                const isTodayTask = task.date === todayString;
                const isFutureTask = task.date >= todayString;

                return (
                  <div
                    key={task.id}
                    onClick={() => {
                      const parts = task.date.split('-');
                      if (parts.length === 3) {
                        setCurrentYear(parseInt(parts[0], 10));
                        setCurrentMonth(parseInt(parts[1], 10) - 1);
                      }
                      handleDateClick(task.date);
                    }}
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer group hover:shadow-xs flex items-start gap-2.5 ${
                      task.completed
                        ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-65'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-red-300 dark:hover:border-red-800'
                    }`}
                  >
                    {/* Complete Toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleComplete(task);
                      }}
                      className="mt-0.5 text-red-600 hover:text-red-700 shrink-0 cursor-pointer"
                      title={task.completed ? 'Marcar pendiente' : 'Marcar completado'}
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100 dark:fill-emerald-950" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        {/* Date Pill */}
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-tight ${
                            isTodayTask
                              ? 'bg-red-600 text-white'
                              : isFutureTask
                              ? 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {formatShortDate(task.date)}
                        </span>

                        {/* Member Badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black border ${mTheme.badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${mTheme.dot}`} />
                          <span className="truncate max-w-[90px]">
                            {assignee ? assignee.name : 'Familia'}
                          </span>
                        </span>
                      </div>

                      <p
                        className={`text-xs font-bold leading-snug break-words ${
                          task.completed
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {task.title}
                      </p>
                    </div>

                    {/* Quick Delete on Hover (Admin) */}
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTask(task.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all shrink-0 cursor-pointer"
                        title="Eliminar evento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 my-2">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Sin próximos eventos
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Haz clic en cualquier fecha del calendario para agregar una tarea.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Opened directly when clicking a date in the calendar */}
      {isDayModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsDayModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {formatDateLabel(selectedDate)}
                    </h3>
                    {selectedDate === todayString && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 dark:bg-red-950 text-red-600">
                        HOY
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Agregar nueva tarea o gestionar eventos del día
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsDayModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Direct Add New Task Form */}
              {onAddTask && (
                <form
                  onSubmit={handleDirectAddTask}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5"
                >
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Nueva Tarea para este día
                  </label>
                  <input
                    ref={quickInputRef}
                    type="text"
                    required
                    value={quickTitle}
                    onChange={(e) => setQuickTitle(e.target.value)}
                    placeholder="Escribe la tarea o evento aquí..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">Integrante:</span>
                      {isAdmin ? (
                        <select
                          value={quickAssigneeId}
                          onChange={(e) => setQuickAssigneeId(e.target.value)}
                          className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-red-300 dark:border-red-900 text-xs font-bold text-red-600 dark:text-red-400 outline-none hover:border-red-500 shadow-2xs"
                        >
                          {members.map((m) => (
                            <option
                              key={m.id}
                              value={m.id}
                              className="text-slate-900 dark:text-white font-medium"
                            >
                              {m.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-red-300 dark:border-red-900 text-xs font-bold text-red-600 dark:text-red-400">
                          {activeMember?.name || 'Familiar'}
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Agregar Tarea</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Existing Tasks for Selected Date */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Tareas del día ({displayedTasksForSelectedDate.length})
                  </span>
                </div>

                {displayedTasksForSelectedDate.length > 0 ? (
                  <div className="space-y-2">
                    {displayedTasksForSelectedDate.map((task) => {
                      const assignee = members.find((m) => m.id === task.assignedToId);
                      const isInlineEditing = editingTaskId === task.id;
                      const mTheme = getMemberColorTheme(assignee, task.assignedToId);

                      return (
                        <div
                          key={task.id}
                          className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                            task.completed
                              ? 'bg-slate-50/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-75'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            <button
                              onClick={() => onToggleComplete(task)}
                              className="mt-0.5 text-red-600 hover:text-red-700 shrink-0 cursor-pointer"
                            >
                              {task.completed ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100 dark:fill-emerald-950" />
                              ) : (
                                <Circle className="w-5 h-5" />
                              )}
                            </button>

                            <div className="min-w-0 flex-1">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-black border mb-1 ${mTheme.badge}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${mTheme.dot}`} />
                                <span>{assignee ? assignee.name : 'Familia'}</span>
                              </span>

                              {isInlineEditing ? (
                                <div className="flex items-center gap-1.5 mt-1">
                                  <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveEdit(task.id);
                                      if (e.key === 'Escape') setEditingTaskId(null);
                                    }}
                                    className="flex-1 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-red-500 text-xs text-slate-900 dark:text-white"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleSaveEdit(task.id)}
                                    className="p-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingTaskId(null)}
                                    className="p-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <p
                                  className={`text-sm font-bold text-slate-900 dark:text-white break-words ${
                                    task.completed ? 'line-through text-slate-400' : ''
                                  }`}
                                >
                                  {task.title}
                                </p>
                              )}
                            </div>
                          </div>

                          {isAdmin && (
                            <div className="flex items-center gap-1 shrink-0">
                              {onSendTaskAlert && (
                                <button
                                  onClick={() => onSendTaskAlert(task)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                                  title="Enviar recordatorio"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleStartEdit(task)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Editar tarea"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteTask(task.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                                title="Eliminar tarea"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
                    <p className="text-xs text-slate-400">
                      No hay tareas registradas para esta fecha.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
