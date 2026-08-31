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
  Search,
} from 'lucide-react';
import { CalendarTask, Member } from '../types';

interface MonthlyCalendarViewProps {
  tasks: CalendarTask[];
  members: Member[];
  activeMember: Member | null;
  isAdmin?: boolean;
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

const WEEKDAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export const MonthlyCalendarView: React.FC<MonthlyCalendarViewProps> = ({
  tasks,
  members,
  activeMember,
  isAdmin = false,
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
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fast inline task creation state
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

  // Helper to format date string nicely: "19 de Agosto"
  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const day = parseInt(parts[2], 10);
    const monthIdx = parseInt(parts[1], 10) - 1;
    const year = parts[0];
    return `${day} de ${MONTH_NAMES[monthIdx] || ''} (${year})`;
  };

  // Compute days in current month
  const calendarGrid = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const totalDays = lastDayOfMonth.getDate();

    let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6;

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
        tasks: tasks.filter((t) => t.date === dateStr),
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
        tasks: tasks.filter((t) => t.date === dateStr),
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
        tasks: tasks.filter((t) => t.date === dateStr),
      });
    }

    return days;
  }, [currentYear, currentMonth, tasks, selectedDate, todayString]);

  // Tasks for the selected date or all tasks matching search
  const displayedTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (selectedDate && t.date !== selectedDate) {
        return false;
      }
      if (selectedMemberFilter !== 'all' && t.assignedToId !== selectedMemberFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const assignee = members.find((m) => m.id === t.assignedToId);
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchMember = assignee?.name.toLowerCase().includes(q) || false;
        const matchDate = t.date.includes(q);
        return matchTitle || matchMember || matchDate;
      }
      return true;
    });
  }, [tasks, selectedDate, selectedMemberFilter, searchQuery, members]);

  // Direct Inline Add Task
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
    }
  }, [activeMember, isAdmin]);

  return (
    <div id="monthly-calendar-view" className="space-y-4 max-w-4xl mx-auto mb-12">
      {/* Member Filter Bar (Admin Only) */}
      {isAdmin && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 shadow-2xs">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase shrink-0">
              Integrantes:
            </span>
            <button
              onClick={() => setSelectedMemberFilter('all')}
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
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMemberFilter(isSelected ? 'all' : m.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border cursor-pointer ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 text-red-600 border-red-600 shadow-2xs ring-1 ring-red-500/20 font-black'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-red-200 dark:border-red-950 hover:border-red-500'
                  }`}
                >
                  <span className="font-extrabold">{m.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Calendar Grid Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        {/* Month Navigation Toolbar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h3>
            <button
              onClick={handleGoToday}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              Hoy
            </button>
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
                onClick={() => {
                  setSelectedDate(day.dateStr);
                  setTimeout(() => quickInputRef.current?.focus(), 100);
                }}
                className={`min-h-[74px] sm:min-h-[92px] p-1.5 sm:p-2 bg-white dark:bg-slate-900 transition-all cursor-pointer flex flex-col justify-between relative group hover:bg-slate-50 dark:hover:bg-slate-800/80 ${
                  !day.isCurrentMonth ? 'opacity-35 bg-slate-50/50 dark:bg-slate-950/40' : ''
                } ${
                  day.isSelected
                    ? 'ring-2 ring-red-600 dark:ring-red-500 z-10 bg-red-50/15 dark:bg-red-950/20'
                    : ''
                }`}
              >
                {/* Day Number */}
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

                  {day.tasks.length > 0 && (
                    <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {day.tasks.length}
                    </span>
                  )}
                </div>

                {/* Desktop: Task Pills in white with red accent */}
                <div className="hidden sm:block space-y-1 my-1 overflow-hidden max-h-[46px]">
                  {day.tasks.slice(0, 2).map((t) => {
                    const assignee = members.find((m) => m.id === t.assignedToId);

                    return (
                      <div
                        key={t.id}
                        className="text-[10px] px-1.5 py-0.5 rounded truncate font-medium bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/60 shadow-2xs"
                        title={`${assignee ? assignee.name + ': ' : ''}${t.title}`}
                      >
                        <span className="font-extrabold mr-1 text-red-600 dark:text-red-400">
                          {assignee ? assignee.name : 'Familia'}:
                        </span>
                        <span className={t.completed ? 'line-through opacity-60 text-slate-500' : 'text-slate-800 dark:text-slate-200'}>
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

                {/* Mobile: Red dots */}
                <div className="flex sm:hidden items-center gap-1 mt-1 justify-end flex-wrap">
                  {day.tasks.slice(0, 4).map((t) => (
                    <span
                      key={t.id}
                      className="w-2 h-2 rounded-full bg-red-500"
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task List Section: Día · Nombre Integrante (con Color) · Tarea */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-4">
        {/* Selected Date Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-red-500" />
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
              {selectedDate ? formatDateLabel(selectedDate) : 'Todas las Tareas'}
            </h3>
            {selectedDate === todayString && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 dark:bg-red-950 text-red-600">
                HOY
              </span>
            )}
          </div>

          <span className="text-xs text-slate-400 font-semibold">
            {displayedTasks.length} {displayedTasks.length === 1 ? 'tarea' : 'tareas'}
          </span>
        </div>

        {/* Inline Quick Add: Día · Nombre Integrante con Color · Tarea */}
        {onAddTask && (
          <form
            onSubmit={handleDirectAddTask}
            className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shadow-2xs"
          >
            {/* Input Tarea */}
            <input
              ref={quickInputRef}
              type="text"
              required
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="Escribe la tarea aquí..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            <div className="flex items-center gap-1.5 shrink-0 justify-between sm:justify-start">
              {/* Select Integrante */}
              <div className="relative flex items-center">
                {isAdmin ? (
                  <select
                    value={quickAssigneeId}
                    onChange={(e) => setQuickAssigneeId(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-red-300 dark:border-red-900 text-xs font-bold text-red-600 dark:text-red-400 outline-none hover:border-red-500 shadow-2xs"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id} className="text-slate-900 dark:text-white font-medium">
                        {m.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-red-300 dark:border-red-900 text-xs font-bold text-red-600 dark:text-red-400 select-none shadow-2xs">
                    {activeMember?.name || 'Familiar'}
                  </div>
                )}
              </div>

              {/* Botón Agregar */}
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar</span>
              </button>
            </div>
          </form>
        )}

        {/* Search bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por día, integrante o tarea..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/30"
          />
        </div>

        {/* Tasks List: Formato: [Día] · [Nombre Integrante con borde rojo] · [Tarea] */}
        {displayedTasks.length > 0 ? (
          <div className="space-y-2.5 pt-1">
            {displayedTasks.map((task) => {
              const assignee = members.find((m) => m.id === task.assignedToId);
              const isInlineEditing = editingTaskId === task.id;

              return (
                <div
                  key={task.id}
                  id={`calendar-task-${task.id}`}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    task.completed
                      ? 'bg-slate-50/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-75'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs hover:border-slate-300'
                  }`}
                >
                  {/* Checkbox + Info: Día · Integrante (Borde Rojo) · Tarea */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => onToggleComplete(task)}
                      className="mt-0.5 transition-colors cursor-pointer shrink-0 text-red-600 hover:text-red-700"
                      title={task.completed ? 'Marcar como pendiente' : 'Marcar como completada'}
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100 dark:fill-emerald-950" />
                      ) : (
                        <Circle className="w-5 h-5 hover:opacity-80" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      {/* Día + Nombre Integrante: Fondo blanco borde rojo */}
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        {/* Día */}
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          <CalendarIcon className="w-3 h-3 text-slate-500" />
                          <span>Día: {task.date}</span>
                        </span>

                        {/* Nombre Integrante: Fondo blanco borde rojo */}
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 border border-red-600 dark:border-red-500 shadow-2xs"
                        >
                          <span>{assignee ? assignee.name : 'Sin Asignar'}</span>
                        </span>
                      </div>

                      {/* Tarea */}
                      {isInlineEditing ? (
                        <div className="flex items-center gap-2 mt-1">
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
                            title="Guardar cambio"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingTaskId(null)}
                            className="p-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                            title="Cancelar"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="mt-0.5">
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1.5">
                            Tarea:
                          </span>
                          <span
                            className={`text-sm font-bold text-slate-900 dark:text-white ${
                              task.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
                            }`}
                          >
                            {task.title}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions (Admin only for edit/delete/alert; members can add and toggle completion) */}
                  {isAdmin && (
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
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
          <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center gap-1.5">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              No hay tareas para este día
            </p>
            <p className="text-[11px] text-slate-400">
              Escribe en el campo superior para agregar una nueva tarea.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
