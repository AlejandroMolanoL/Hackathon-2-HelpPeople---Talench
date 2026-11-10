import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Shield,
  Tag,
  User,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Search,
  List,
  CalendarDays,
  CalendarRange,
  Edit2,
  Trash2,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Info,
  Check,
  X,
  Target
} from 'lucide-react';
import {
  fetchSlaEvents,
  createSlaEvent,
  updateSlaEvent,
  deleteSlaEvent,
  fetchSlaTicketDeadlines
} from '../api';
import SlaEventModal from './SlaEventModal';
import SlaDeleteModal from './SlaDeleteModal';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const TIPOS_PLANIFICACION = [
  'Todos',
  'Ventana de Mantenimiento',
  'Turno de Soporte',
  'Revisión SLA',
  'Auditoría',
  'Despliegue',
  'Capacitación'
];

const PRIORIDADES = ['Todas', 'Crítica', 'Alta', 'Media', 'Baja'];

const ESTADOS = ['Todos', 'Programado', 'En Curso', 'Completado', 'Cancelado'];

export default function SlaCalendarView() {
  // Fecha actual de referencia en el calendario
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'week' | 'agenda'
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [ticketDeadlines, setTicketDeadlines] = useState([]);
  const [showDeadlines, setShowDeadlines] = useState(false);

  // Filtros
  const [filterType, setFilterType] = useState('Todos');
  const [filterPriority, setFilterPriority] = useState('Todas');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Modales
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null); // null = crear, object = editar
  const [createDefaultDate, setCreateDefaultDate] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Modal de vista detallada rápida
  const [detailEvent, setDetailEvent] = useState(null);

  // Cargar eventos desde backend
  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await fetchSlaEvents({
        prioridad: filterPriority,
        tipo: filterType,
        estado: filterStatus
      });
      setEvents(data);

      if (showDeadlines) {
        const deadlines = await fetchSlaTicketDeadlines({ limit: 80 });
        setTicketDeadlines(deadlines);
      }
    } catch (err) {
      console.error('Error al cargar eventos SLA:', err);
      setFeedback({
        type: 'error',
        message: 'No se pudieron sincronizar los eventos de planificación SLA con el servidor.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [filterPriority, filterType, filterStatus, showDeadlines]);

  // Manejo de Creación / Edición
  const handleOpenCreate = (dateStr = null) => {
    setSelectedEvent(null);
    setCreateDefaultDate(dateStr);
    setModalOpen(true);
  };

  const handleOpenEdit = (event, e = null) => {
    if (e) e.stopPropagation();
    setSelectedEvent(event);
    setCreateDefaultDate(null);
    setDetailEvent(null);
    setModalOpen(true);
  };

  const handleOpenDelete = (event, e = null) => {
    if (e) e.stopPropagation();
    setEventToDelete(event);
    setDetailEvent(null);
    setDeleteModalOpen(true);
  };

  const handleSaveEvent = async (formData, id) => {
    setActionLoading(true);
    try {
      if (id) {
        await updateSlaEvent(id, formData);
        setFeedback({
          type: 'success',
          message: `Planificación #${id} '${formData.titulo}' actualizada exitosamente.`
        });
      } else {
        const created = await createSlaEvent(formData);
        setFeedback({
          type: 'success',
          message: `Planificación '${created.titulo}' registrada en el calendario.`
        });
      }
      setModalOpen(false);
      setSelectedEvent(null);
      await loadEvents();
    } catch (err) {
      console.error('Error al guardar planificación:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Error al guardar la planificación en el servidor.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async (id) => {
    setActionLoading(true);
    try {
      await deleteSlaEvent(id);
      setDeleteModalOpen(false);
      setEventToDelete(null);
      setFeedback({
        type: 'success',
        message: `Planificación SLA #${id} eliminada correctamente.`
      });
      await loadEvents();
    } catch (err) {
      console.error('Error al eliminar planificación:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Error al eliminar la planificación.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Navegación de Fecha
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Filtrado local por búsqueda
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const q = searchQuery.toLowerCase().trim();
    return events.filter(
      (ev) =>
        ev.titulo?.toLowerCase().includes(q) ||
        ev.responsable?.toLowerCase().includes(q) ||
        ev.meta_sla?.toLowerCase().includes(q) ||
        ev.tipo?.toLowerCase().includes(q) ||
        ev.descripcion?.toLowerCase().includes(q)
    );
  }, [events, searchQuery]);

  // Cálculos de KPI de la Planificación SLA
  const stats = useMemo(() => {
    const total = filteredEvents.length;
    const criticos = filteredEvents.filter((e) => e.prioridad === 'Crítica' || e.prioridad === 'Alta').length;
    const activos = filteredEvents.filter((e) => e.estado === 'En Curso' || e.estado === 'Programado').length;
    const completados = filteredEvents.filter((e) => e.estado === 'Completado').length;
    return { total, criticos, activos, completados };
  }, [filteredEvents]);

  // Helper para armar días del mes (Lunes = 0)
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Ajuste lunes primer día (0 = Lun, 6 = Dom)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    // Días del mes anterior
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevDate = new Date(year, month - 1, d);
      const dateStr = prevDate.toISOString().substring(0, 10);
      days.push({
        date: prevDate,
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: false
      });
    }

    // Días del mes actual
    const todayStr = new Date().toISOString().substring(0, 10);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const thisDate = new Date(year, month, d);
      // Formato YYYY-MM-DD local seguro
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateStr = `${year}-${monthStr}-${dayStr}`;
      days.push({
        date: thisDate,
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr
      });
    }

    // Días del mes siguiente para completar múltiplos de 7 (mínimo 35 o 42)
    const remaining = (7 - (days.length % 7)) % 7;
    const totalCells = days.length + remaining < 35 ? 35 : days.length + remaining;
    const needNext = totalCells - days.length;
    for (let d = 1; d <= needNext; d++) {
      const nextDate = new Date(year, month + 1, d);
      const nextMonthStr = String(nextDate.getMonth() + 1).padStart(2, '0');
      const nextDayStr = String(d).padStart(2, '0');
      const dateStr = `${nextDate.getFullYear()}-${nextMonthStr}-${nextDayStr}`;
      days.push({
        date: nextDate,
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: false
      });
    }

    return days;
  }, [currentDate]);

  // Helper para armar días de la semana actual
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // lunes
    const monday = new Date(curr.setDate(diff));

    const days = [];
    const todayStr = new Date().toISOString().substring(0, 10);

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const year = d.getFullYear();
      const monthStr = String(d.getMonth() + 1).padStart(2, '0');
      const dayStr = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${monthStr}-${dayStr}`;
      days.push({
        date: d,
        dateStr,
        dayNumber: d.getDate(),
        name: WEEKDAY_NAMES[i],
        isToday: dateStr === todayStr
      });
    }
    return days;
  }, [currentDate]);

  // Helper para obtener eventos correspondientes a una fecha específica YYYY-MM-DD
  const getEventsForDate = (dateStr) => {
    return filteredEvents.filter((ev) => {
      if (!ev.fecha_inicio) return false;
      const start = ev.fecha_inicio.substring(0, 10);
      const end = ev.fecha_fin ? ev.fecha_fin.substring(0, 10) : start;
      return dateStr >= start && dateStr <= end;
    });
  };

  // Helper para obtener tickets venciendo en esa fecha
  const getDeadlinesForDate = (dateStr) => {
    if (!showDeadlines) return [];
    return ticketDeadlines.filter((t) => {
      if (!t.fecha_limite_sla) return false;
      return t.fecha_limite_sla.substring(0, 10) === dateStr;
    });
  };

  const getPriorityStyle = (prioridad) => {
    switch (prioridad) {
      case 'Crítica':
        return {
          chip: 'bg-rose-50 text-rose-800 border-rose-200/80 hover:bg-rose-100',
          dot: 'bg-rose-500',
          badge: 'bg-rose-100 text-rose-700 border-rose-200'
        };
      case 'Alta':
        return {
          chip: 'bg-amber-50 text-amber-900 border-amber-200/80 hover:bg-amber-100',
          dot: 'bg-amber-500',
          badge: 'bg-amber-100 text-amber-800 border-amber-200'
        };
      case 'Media':
        return {
          chip: 'bg-blue-50 text-blue-900 border-blue-200/80 hover:bg-blue-100',
          dot: 'bg-blue-500',
          badge: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      case 'Baja':
      default:
        return {
          chip: 'bg-emerald-50 text-emerald-900 border-emerald-200/80 hover:bg-emerald-100',
          dot: 'bg-emerald-500',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-200'
        };
    }
  };

  const getStatusBadge = (estado) => {
    switch (estado) {
      case 'En Curso':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">En Curso</span>;
      case 'Completado':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Completado</span>;
      case 'Cancelado':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Cancelado</span>;
      case 'Programado':
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">Programado</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. TOP HEADER & METRIC SUMMARY */}
      <div className="bg-white rounded-3xl p-6 shadow-soft border border-slate-100">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF5E7E] to-[#FFA07A] text-white flex items-center justify-center shadow-md shadow-rose-500/20">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 leading-tight">
                  Planificación & Cronograma de SLA
                </h1>
                <p className="text-xs text-slate-500">
                  Gestión integral de ventanas de mantenimiento, turnos de guardia, revisiones y metas operativas de SLA
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => handleOpenCreate()}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#FF5E7E] to-[#FF8A65] text-white font-bold text-xs shadow-md shadow-rose-500/25 hover:opacity-95 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Nueva Planificación SLA
            </button>
            <button
              onClick={loadEvents}
              disabled={loading}
              title="Sincronizar eventos"
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Feedback Alert Banner */}
        {feedback && (
          <div
            className={`mt-4 p-3.5 rounded-2xl text-xs flex items-center justify-between gap-3 border ${
              feedback.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {feedback.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <span className="font-medium truncate">{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs font-bold underline hover:opacity-80 shrink-0 cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* 4 Mini KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-medium">Total Planificado</div>
              <div className="text-lg font-black text-slate-800">{stats.total}</div>
            </div>
          </div>

          <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-medium">Críticos / Alta Prioridad</div>
              <div className="text-lg font-black text-rose-600">{stats.criticos}</div>
            </div>
          </div>

          <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-medium">Activos / En Curso</div>
              <div className="text-lg font-black text-purple-700">{stats.activos}</div>
            </div>
          </div>

          <div className="bg-slate-50/80 rounded-2xl p-3.5 border border-slate-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-medium">Completados</div>
              <div className="text-lg font-black text-emerald-600">{stats.completados}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CALENDAR CONTROL & FILTER BAR */}
      <div className="bg-white rounded-3xl p-4 shadow-soft border border-slate-100 flex flex-col xl:flex-row items-center justify-between gap-4">
        
        {/* Left: Navigation Buttons & Month Title */}
        <div className="flex items-center gap-3 w-full xl:w-auto justify-between xl:justify-start">
          <div className="flex items-center gap-1.5 bg-slate-100/90 rounded-2xl p-1 border border-slate-200/60">
            <button
              onClick={handlePrev}
              title="Mes / Semana anterior"
              className="p-1.5 rounded-xl hover:bg-white text-slate-700 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 rounded-xl text-xs font-bold hover:bg-white text-slate-700 transition"
            >
              Hoy
            </button>
            <button
              onClick={handleNext}
              title="Mes / Semana siguiente"
              className="p-1.5 rounded-xl hover:bg-white text-slate-700 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
            {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
          </div>
        </div>

        {/* Center: Search input */}
        <div className="relative w-full xl:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar eventos o responsables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5E7E]/30 focus:border-[#FF5E7E] transition"
          />
        </div>

        {/* Right: Filters & View Mode Tabs */}
        <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto justify-end">
          
          {/* Tipo Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#FF5E7E]/30"
          >
            {TIPOS_PLANIFICACION.map((t) => (
              <option key={t} value={t}>Tipo: {t}</option>
            ))}
          </select>

          {/* Prioridad Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#FF5E7E]/30"
          >
            {PRIORIDADES.map((p) => (
              <option key={p} value={p}>Prioridad: {p}</option>
            ))}
          </select>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-100/90 rounded-2xl p-1 border border-slate-200/60">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                viewMode === 'month'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Mes
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                viewMode === 'week'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              Semana
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                viewMode === 'agenda'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Lista
            </button>
          </div>
        </div>
      </div>

      {/* 3. CALENDAR BODY ACCORDING TO VIEW MODE */}

      {/* VIEW 1: MONTH GRID VIEW */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden">
          {/* Day of Week Header */}
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/70 text-center py-2.5 text-xs font-bold text-slate-600">
            {WEEKDAY_NAMES.map((dayName, idx) => (
              <div key={dayName} className={idx >= 5 ? 'text-rose-500' : ''}>
                {dayName}
              </div>
            ))}
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
            {calendarDays.map((cell, idx) => {
              const dayEvents = getEventsForDate(cell.dateStr);
              const dayDeadlines = getDeadlinesForDate(cell.dateStr);

              return (
                <div
                  key={cell.dateStr + idx}
                  className={`min-h-[115px] sm:min-h-[135px] p-2 flex flex-col transition group relative ${
                    cell.isCurrentMonth
                      ? 'bg-white hover:bg-slate-50/50'
                      : 'bg-slate-50/40 text-slate-300'
                  }`}
                >
                  {/* Cell Top Bar: Date Number & Quick Add Button */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        cell.isToday
                          ? 'bg-[#FF5E7E] text-white shadow-sm shadow-rose-500/40'
                          : cell.isCurrentMonth
                          ? 'text-slate-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {/* Quick "+" Add Button on hover */}
                    <button
                      onClick={() => handleOpenCreate(cell.dateStr)}
                      title={`Planificar evento el ${cell.dateStr}`}
                      className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-lg bg-slate-100 hover:bg-[#FF5E7E] hover:text-white text-slate-500 flex items-center justify-center transition duration-150"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Event Chips List */}
                  <div className="flex-1 space-y-1 overflow-hidden">
                    {dayEvents.slice(0, 3).map((ev) => {
                      const style = getPriorityStyle(ev.prioridad);
                      return (
                        <div
                          key={ev.id}
                          onClick={() => setDetailEvent(ev)}
                          title={`${ev.titulo} (${ev.prioridad} - ${ev.tipo})`}
                          className={`px-2 py-1 rounded-xl text-[10px] font-semibold border flex items-center justify-between gap-1 cursor-pointer transition truncate ${style.chip}`}
                        >
                          <div className="flex items-center gap-1 min-w-0 truncate">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
                            <span className="truncate">{ev.titulo}</span>
                          </div>
                          <span className="text-[9px] opacity-75 shrink-0 hidden sm:inline">
                            {ev.fecha_inicio ? ev.fecha_inicio.substring(11, 16) : ''}
                          </span>
                        </div>
                      );
                    })}

                    {/* Badge +X more if > 3 */}
                    {dayEvents.length > 3 && (
                      <button
                        onClick={() => {
                          setCurrentDate(cell.date);
                          setViewMode('week');
                        }}
                        className="text-[10px] font-bold text-slate-500 hover:text-[#FF5E7E] px-1 py-0.5 rounded transition block"
                      >
                        +{dayEvents.length - 3} más...
                      </button>
                    )}

                    {/* Ticket deadlines if toggle is on */}
                    {dayDeadlines.map((t) => (
                      <div
                        key={t.codigo_ticket}
                        className="px-1.5 py-0.5 rounded-lg text-[9px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60 truncate flex items-center gap-1"
                        title={`Vencimiento SLA: ${t.codigo_ticket} (${t.prioridad})`}
                      >
                        <Clock className="w-2.5 h-2.5 shrink-0 text-rose-500" />
                        <span className="truncate">{t.codigo_ticket}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: WEEK COLUMNS VIEW */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {weekDays.map((day) => {
              const dayEvents = getEventsForDate(day.dateStr);

              return (
                <div
                  key={day.dateStr}
                  className={`rounded-2xl p-3 border flex flex-col min-h-[350px] ${
                    day.isToday
                      ? 'bg-rose-50/30 border-[#FF5E7E]/40'
                      : 'bg-slate-50/50 border-slate-200/70'
                  }`}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                    <div>
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        {day.name}
                      </div>
                      <div className={`text-base font-black ${day.isToday ? 'text-[#FF5E7E]' : 'text-slate-800'}`}>
                        {day.dayNumber}
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenCreate(day.dateStr)}
                      title="Agregar evento en este día"
                      className="p-1 rounded-xl bg-white hover:bg-[#FF5E7E] hover:text-white text-slate-500 shadow-sm border border-slate-200 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Day Events */}
                  <div className="flex-1 space-y-2.5 overflow-y-auto">
                    {dayEvents.length === 0 ? (
                      <div className="h-28 flex flex-col items-center justify-center text-center text-slate-400 text-[11px]">
                        <span>Sin planificaciones</span>
                      </div>
                    ) : (
                      dayEvents.map((ev) => {
                        const style = getPriorityStyle(ev.prioridad);
                        return (
                          <div
                            key={ev.id}
                            className={`p-2.5 rounded-2xl border text-xs shadow-sm bg-white space-y-1.5 transition hover:shadow-md ${style.badge}`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className="font-bold text-slate-900 leading-tight">
                                {ev.titulo}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={(e) => handleOpenEdit(ev, e)}
                                  title="Editar"
                                  className="text-slate-400 hover:text-blue-600 p-0.5 rounded transition"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => handleOpenDelete(ev, e)}
                                  title="Eliminar"
                                  className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            <div className="text-[10px] text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{ev.fecha_inicio.substring(11, 16)} - {ev.fecha_fin.substring(11, 16)}</span>
                            </div>

                            {ev.responsable && (
                              <div className="text-[10px] text-slate-600 flex items-center gap-1 truncate">
                                <User className="w-3 h-3 text-slate-400" />
                                <span className="truncate">{ev.responsable}</span>
                              </div>
                            )}

                            {ev.meta_sla && (
                              <div className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 truncate">
                                🎯 {ev.meta_sla}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: AGENDA / LIST VIEW */}
      {viewMode === 'agenda' && (
        <div className="bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800">
              Listado Cronológico de Planificaciones SLA ({filteredEvents.length})
            </h3>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <CalendarIcon className="w-10 h-10 mx-auto opacity-30" />
              <p className="text-sm font-semibold">No se encontraron eventos con los filtros actuales.</p>
              <button
                onClick={() => handleOpenCreate()}
                className="mt-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#FF5E7E] hover:opacity-95 shadow"
              >
                Crear Primera Planificación SLA
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredEvents.map((ev) => {
                const style = getPriorityStyle(ev.prioridad);
                return (
                  <div
                    key={ev.id}
                    className="p-4 sm:p-5 hover:bg-slate-50/70 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      {/* Priority Icon Pill */}
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${style.badge}`}>
                        <Shield className="w-5 h-5" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{ev.titulo}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${style.badge}`}>
                            {ev.prioridad}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                            {ev.tipo}
                          </span>
                          {getStatusBadge(ev.estado)}
                        </div>

                        {ev.descripcion && (
                          <p className="text-xs text-slate-500 max-w-2xl line-clamp-2">
                            {ev.descripcion}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <strong>{ev.fecha_inicio}</strong> hasta <strong>{ev.fecha_fin}</strong>
                          </span>
                          {ev.responsable && (
                            <span className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              {ev.responsable}
                            </span>
                          )}
                          {ev.meta_sla && (
                            <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                              <Target className="w-3.5 h-3.5 text-emerald-600" />
                              {ev.meta_sla}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      <button
                        onClick={() => handleOpenEdit(ev)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleOpenDelete(ev)}
                        className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. QUICK EVENT DETAIL MODAL (Al hacer click en un chip del calendario) */}
      {detailEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div
            className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-lg overflow-hidden text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${getPriorityStyle(detailEvent.prioridad).badge}`}>
                    <CalendarIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-tight">
                      {detailEvent.titulo}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPriorityStyle(detailEvent.prioridad).badge}`}>
                        {detailEvent.prioridad}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {detailEvent.tipo}
                      </span>
                      {getStatusBadge(detailEvent.estado)}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setDetailEvent(null)}
                  className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Horario de Inicio:</span>
                  <span className="font-bold text-slate-800">{detailEvent.fecha_inicio}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Horario de Fin:</span>
                  <span className="font-bold text-slate-800">{detailEvent.fecha_fin}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Responsable / Equipo:</span>
                  <span className="font-bold text-slate-800">{detailEvent.responsable || 'Sin Asignar'}</span>
                </div>
                {detailEvent.meta_sla && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Meta / Compromiso SLA:</span>
                    <span className="font-bold text-emerald-700">{detailEvent.meta_sla}</span>
                  </div>
                )}
                {detailEvent.descripcion && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-500 block mb-1">Descripción:</span>
                    <p className="text-slate-700 leading-relaxed">{detailEvent.descripcion}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleOpenDelete(detailEvent)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDetailEvent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(detailEvent)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 flex items-center gap-1.5 transition shadow"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL DE CREAR / EDITAR */}
      <SlaEventModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedEvent(null);
          setCreateDefaultDate(null);
        }}
        onSubmit={handleSaveEvent}
        initialData={selectedEvent}
        defaultDate={createDefaultDate}
        loading={actionLoading}
      />

      {/* 6. MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <SlaDeleteModal
        isOpen={deleteModalOpen}
        event={eventToDelete}
        onClose={() => {
          setDeleteModalOpen(false);
          setEventToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        loading={actionLoading}
      />

    </div>
  );
}

