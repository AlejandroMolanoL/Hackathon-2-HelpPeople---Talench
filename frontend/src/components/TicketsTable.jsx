import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MoreHorizontal,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  UserCheck,
  Plus,
  Pencil,
  Trash2,
  Award,
  Star,
  ShieldCheck,
  Flame,
  ArrowUpDown
} from 'lucide-react';

/**
 * Función que permite medir el rendimiento de los agentes técnicos
 * calculando:
 * - Cantidad de tickets resueltos vs asignados
 * - Tiempo de respuesta / resolución promedio en horas
 * - Cumplimiento de SLA y satisfacción del cliente
 * - Score global ponderado y clasificación de nivel
 */
export function calcularRendimientoAgentes(ticketList = []) {
  if (!ticketList || ticketList.length === 0) return [];

  const agentsMap = {};
  let totalTeamHours = 0;
  let countTeamHours = 0;

  ticketList.forEach((t) => {
    const agente = (t.agente_asignado || 'Sin Asignar').trim();
    if (!agente || agente === 'Sin Asignar') return;

    if (!agentsMap[agente]) {
      agentsMap[agente] = {
        agente,
        total_asignados: 0,
        tickets_resueltos: 0,
        tickets_en_curso: 0,
        tickets_vencidos: 0,
        sla_cumplidos_count: 0,
        sum_horas: 0,
        count_horas: 0,
        sum_satisfaccion: 0,
        count_satisfaccion: 0
      };
    }

    const item = agentsMap[agente];
    item.total_asignados += 1;

    const estado = (t.estado || '').trim();
    if (estado === 'Cerrada') {
      item.tickets_resueltos += 1;
    } else if (estado === 'Abierta' || estado === 'En Proceso') {
      item.tickets_en_curso += 1;
    }

    if (estado === 'Vencida' || t.sla_cumplido === 0) {
      item.tickets_vencidos += 1;
    }

    if (t.sla_cumplido === 1) {
      item.sla_cumplidos_count += 1;
    }

    const horas = parseFloat(t.tiempo_resolucion_horas);
    if (!isNaN(horas) && horas > 0) {
      item.sum_horas += horas;
      item.count_horas += 1;
      totalTeamHours += horas;
      countTeamHours += 1;
    }

    const sat = parseFloat(t.satisfaccion_cliente);
    if (!isNaN(sat) && sat > 0) {
      item.sum_satisfaccion += sat;
      item.count_satisfaccion += 1;
    }
  });

  const benchmarkHoras = countTeamHours > 0 ? totalTeamHours / countTeamHours : 35.0;

  const result = Object.values(agentsMap).map((item) => {
    const total = item.total_asignados;
    const resueltos = item.tickets_resueltos;
    const tasa_resolucion_pct = total > 0 ? Number(((resueltos / total) * 100).toFixed(2)) : 0;
    const tiempo_respuesta_promedio_horas =
      item.count_horas > 0 ? Number((item.sum_horas / item.count_horas).toFixed(2)) : 0;
    const sla_cumplimiento_pct =
      total > 0 ? Number(((item.sla_cumplidos_count / total) * 100).toFixed(2)) : 0;
    const satisfaccion_promedio =
      item.count_satisfaccion > 0
        ? Number((item.sum_satisfaccion / item.count_satisfaccion).toFixed(2))
        : 0;

    const eficiencia_tiempo = Math.max(
      0,
      Math.min(100, (1.5 - tiempo_respuesta_promedio_horas / (benchmarkHoras * 1.5)) * 100)
    );
    const sat_score = satisfaccion_promedio > 0 ? (satisfaccion_promedio / 5.0) * 100 : 70;

    let score =
      tasa_resolucion_pct * 0.35 +
      sla_cumplimiento_pct * 0.35 +
      eficiencia_tiempo * 0.2 +
      sat_score * 0.1;
    score = Number(Math.max(0, Math.min(100, score)).toFixed(1));

    let nivel = 'Requiere Atención';
    if (score >= 85) nivel = 'Excelente';
    else if (score >= 75) nivel = 'Óptimo';
    else if (score >= 60) nivel = 'Aceptable';

    return {
      agente: item.agente,
      total_asignados: total,
      tickets_resueltos: resueltos,
      tickets_en_curso: item.tickets_en_curso,
      tickets_vencidos: item.tickets_vencidos,
      tasa_resolucion_pct,
      tiempo_respuesta_promedio_horas,
      sla_cumplimiento_pct,
      satisfaccion_promedio,
      score_rendimiento: score,
      nivel_rendimiento: nivel
    };
  });

  result.sort(
    (a, b) =>
      b.tickets_resueltos - a.tickets_resueltos ||
      a.tiempo_respuesta_promedio_horas - b.tiempo_respuesta_promedio_horas
  );
  return result;
}

export default function TicketsTable({
  tickets = [],
  rendimientoAgentes = null,
  onOpenCreate,
  onEditTicket,
  onDeleteTicket
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('activity'); // 'activity' | 'agents'
  const [currentPage, setCurrentPage] = useState(1);
  const [agentSort, setAgentSort] = useState('resolved'); // 'resolved' | 'time' | 'sla' | 'score'
  const [openDropdownCode, setOpenDropdownCode] = useState(null);
  const dropdownRef = useRef(null);
  const pageSize = 5;

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownCode(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset de página al cambiar de pestaña
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // Filtrado local de tickets
  const filteredTickets = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return tickets.filter((t) => {
      return (
        t.codigo_ticket?.toLowerCase().includes(term) ||
        t.departamento_solicitante?.toLowerCase().includes(term) ||
        t.agente_asignado?.toLowerCase().includes(term) ||
        t.categoria?.toLowerCase().includes(term) ||
        t.prioridad?.toLowerCase().includes(term) ||
        t.estado?.toLowerCase().includes(term)
      );
    });
  }, [tickets, searchTerm]);

  // Cálculo de agentes (usando datos del backend si existen o fallback a cálculo local)
  const agentsList = useMemo(() => {
    let list = [];
    if (rendimientoAgentes && Array.isArray(rendimientoAgentes) && rendimientoAgentes.length > 0) {
      list = [...rendimientoAgentes];
    } else {
      list = calcularRendimientoAgentes(tickets);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter((ag) => ag.agente?.toLowerCase().includes(term));
    }

    // Ordenamiento dinámico
    list.sort((a, b) => {
      if (agentSort === 'resolved') {
        return b.tickets_resueltos - a.tickets_resueltos || a.tiempo_respuesta_promedio_horas - b.tiempo_respuesta_promedio_horas;
      }
      if (agentSort === 'time') {
        return a.tiempo_respuesta_promedio_horas - b.tiempo_respuesta_promedio_horas || b.tickets_resueltos - a.tickets_resueltos;
      }
      if (agentSort === 'sla') {
        return b.sla_cumplimiento_pct - a.sla_cumplimiento_pct || b.tickets_resueltos - a.tickets_resueltos;
      }
      if (agentSort === 'score') {
        return b.score_rendimiento - a.score_rendimiento || b.tickets_resueltos - a.tickets_resueltos;
      }
      return 0;
    });

    return list;
  }, [rendimientoAgentes, tickets, searchTerm, agentSort]);

  // Resumen general del equipo de agentes
  const teamSummary = useMemo(() => {
    const baseList = (rendimientoAgentes && rendimientoAgentes.length > 0)
      ? rendimientoAgentes
      : calcularRendimientoAgentes(tickets);

    if (!baseList || baseList.length === 0) return null;

    const topResolvedAgent = [...baseList].sort((a, b) => b.tickets_resueltos - a.tickets_resueltos)[0];
    const fastestAgent = [...baseList]
      .filter((a) => a.tiempo_respuesta_promedio_horas > 0)
      .sort((a, b) => a.tiempo_respuesta_promedio_horas - b.tiempo_respuesta_promedio_horas)[0];

    const totalResueltos = baseList.reduce((acc, curr) => acc + (curr.tickets_resueltos || 0), 0);
    const totalAsignados = baseList.reduce((acc, curr) => acc + (curr.total_asignados || 0), 0);
    const avgTime = baseList.length > 0
      ? (baseList.reduce((acc, curr) => acc + (curr.tiempo_respuesta_promedio_horas || 0), 0) / baseList.length).toFixed(1)
      : '0.0';
    const avgSLA = baseList.length > 0
      ? (baseList.reduce((acc, curr) => acc + (curr.sla_cumplimiento_pct || 0), 0) / baseList.length).toFixed(1)
      : '0.0';

    return {
      topResolvedAgent,
      fastestAgent,
      totalResueltos,
      totalAsignados,
      avgTime,
      avgSLA
    };
  }, [rendimientoAgentes, tickets]);

  // Paginación
  const isAgentTab = activeTab === 'agents';
  const totalItems = isAgentTab ? agentsList.length : filteredTickets.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;

  const currentTickets = filteredTickets.slice(startIndex, startIndex + pageSize);
  const currentAgents = agentsList.slice(startIndex, startIndex + pageSize);

  // Avatar colors
  const getAvatarGradient = (index) => {
    const gradients = [
      'from-amber-400 to-orange-500',
      'from-rose-400 to-pink-500',
      'from-blue-400 to-indigo-500',
      'from-emerald-400 to-teal-500',
      'from-purple-400 to-pink-500',
      'from-cyan-400 to-blue-600',
      'from-violet-400 to-purple-600',
      'from-teal-400 to-emerald-600'
    ];
    return gradients[index % gradients.length];
  };

  const getInitials = (name) => {
    if (!name) return 'AG';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getPriorityBadgeClass = (prioridad) => {
    switch (prioridad) {
      case 'Crítica':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Alta':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Media':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadge = (estado) => {
    switch (estado) {
      case 'Vencida':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
            <ArrowDownRight className="w-3.5 h-3.5" />
            Vencida
          </span>
        );
      case 'Cerrada':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
            <ArrowUpRight className="w-3.5 h-3.5" />
            Cerrada
          </span>
        );
      case 'En Proceso':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Clock className="w-3 h-3" />
            En Proceso
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-600 border border-sky-100">
            <Layers className="w-3 h-3" />
            Abierta
          </span>
        );
    }
  };

  const getNivelBadge = (nivel) => {
    switch (nivel) {
      case 'Excelente':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Óptimo':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Aceptable':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-soft border border-slate-100 space-y-5">
      {/* Top Header with Tabs, Search & Action Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => handleTabChange('activity')}
            className={`pb-2 text-sm font-bold transition relative cursor-pointer ${
              activeTab === 'activity'
                ? 'text-slate-900'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Actividad de Tickets
            {activeTab === 'activity' && (
              <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#101420] rounded-full" />
            )}
          </button>

          <button
            onClick={() => handleTabChange('agents')}
            className={`pb-2 text-sm font-bold transition relative cursor-pointer flex items-center gap-2 ${
              activeTab === 'agents'
                ? 'text-slate-900'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span>Rendimiento Agentes</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-600">
              {agentsList.length}
            </span>
            {activeTab === 'agents' && (
              <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#101420] rounded-full" />
            )}
          </button>
        </div>

        {/* Right Controls: Search + Selector + Button */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Ordenamiento para Rendimiento de Agentes */}
          {activeTab === 'agents' && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-full px-3 py-1.5 text-xs text-slate-700">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={agentSort}
                onChange={(e) => {
                  setAgentSort(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="resolved">Más Resueltos</option>
                <option value="time">Menor Tiempo Respuesta</option>
                <option value="sla">Mayor SLA</option>
                <option value="score">Mejor Score</option>
              </select>
            </div>
          )}

          {/* Minimal Search Input */}
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={
                activeTab === 'agents' ? 'Buscar agente...' : 'Filtrar por ticket o agente...'
              }
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-full pl-8 pr-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#FF5E7E]"
            />
          </div>

          {/* New Ticket CTA button */}
          {onOpenCreate && (
            <button
              onClick={onOpenCreate}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#101420] hover:bg-slate-800 text-white rounded-full text-xs font-bold transition shadow-sm active:scale-95 shrink-0 cursor-pointer"
              title="Registrar nueva solicitud de soporte"
            >
              <Plus className="w-3.5 h-3.5 text-[#FF5E7E]" />
              <span>Nuevo Ticket</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* VISTA 1: ACTIVIDAD DE TICKETS */}
      {/* ========================================================= */}
      {activeTab === 'activity' && (
        <div className="space-y-3 relative" ref={dropdownRef}>
          {currentTickets.length > 0 ? (
            currentTickets.map((t, idx) => {
              const isMenuOpen = openDropdownCode === t.codigo_ticket;

              return (
                <div
                  key={t.codigo_ticket || idx}
                  className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50/80 transition duration-150 gap-4 relative group"
                >
                  {/* Left: Avatar Thumbnail & Title */}
                  <div
                    className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
                    onClick={() => onEditTicket && onEditTicket(t)}
                    title="Haz clic para ver o editar este ticket"
                  >
                    <div
                      className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${getAvatarGradient(
                        idx
                      )} flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0`}
                    >
                      {t.categoria ? t.categoria.substring(0, 2).toUpperCase() : 'TK'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate hover:text-[#FF5E7E] transition">
                          {t.departamento_solicitante || 'Solicitud de Soporte TI'} - {t.codigo_ticket}
                        </span>
                        <ExternalLink className="w-3 h-3 text-slate-400 shrink-0 group-hover:text-slate-700 transition" />
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                        Agente: <strong className="text-slate-600 font-semibold">{t.agente_asignado || 'Equipo TI'}</strong> • {t.fecha_solicitud?.slice(0, 10)}
                      </div>
                    </div>
                  </div>

                  {/* Priority Pill Tag */}
                  <div className="hidden lg:flex items-center">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getPriorityBadgeClass(
                        t.prioridad
                      )}`}
                    >
                      {t.prioridad || 'Media'}
                    </span>
                  </div>

                  {/* Category Pill Tag */}
                  <div className="hidden md:flex items-center">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                      {t.categoria || 'Soporte'}
                    </span>
                  </div>

                  {/* Metric with circle icon */}
                  <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <div className="w-5 h-5 rounded-full bg-[#101420] text-white flex items-center justify-center text-[10px]">
                      #
                    </div>
                    <span>
                      {t.tiempo_resolucion_horas
                        ? `${t.tiempo_resolucion_horas}h`
                        : 'En curso'}
                    </span>
                  </div>

                  {/* Trend Badge / Estado Pill */}
                  <div className="flex items-center">{getStatusBadge(t.estado)}</div>

                  {/* 3-dots action menu with Dropdown */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdownCode(isMenuOpen ? null : t.codigo_ticket);
                      }}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                        isMenuOpen
                          ? 'bg-slate-200 text-slate-900'
                          : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                      title="Opciones de solicitud"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {/* Dropdown Popover */}
                    {isMenuOpen && (
                      <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                        <button
                          onClick={() => {
                            setOpenDropdownCode(null);
                            if (onEditTicket) onEditTicket(t);
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5 text-blue-600" />
                          <span>Editar Solicitud</span>
                        </button>

                        <div className="my-1 border-t border-slate-100" />

                        <button
                          onClick={() => {
                            setOpenDropdownCode(null);
                            if (onDeleteTicket) onDeleteTicket(t);
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          <span>Eliminar Solicitud</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              No se encontraron tickets con los filtros aplicados.
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* VISTA 2: RENDIMIENTO DE AGENTES */}
      {/* ========================================================= */}
      {activeTab === 'agents' && (
        <div className="space-y-4">
          {/* Quick Metrics Bar for Agents Team */}
          {teamSummary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-slate-50/70 rounded-2xl border border-slate-100">
              {/* Top Performer */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-400 font-medium">Mayor Volumen Resuelto</div>
                  <div className="text-xs font-bold text-slate-800 truncate">
                    {teamSummary.topResolvedAgent?.agente || 'N/A'}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold">
                    {teamSummary.topResolvedAgent?.tickets_resueltos || 0} tickets resueltos
                  </div>
                </div>
              </div>

              {/* Fastest Agent */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-400 font-medium">Respuesta Más Rápida</div>
                  <div className="text-xs font-bold text-slate-800 truncate">
                    {teamSummary.fastestAgent?.agente || 'N/A'}
                  </div>
                  <div className="text-[10px] text-indigo-600 font-semibold">
                    {teamSummary.fastestAgent?.tiempo_respuesta_promedio_horas || 0}h promedio
                  </div>
                </div>
              </div>

              {/* Total Team Resolved */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-400 font-medium">Total Resueltos Equipo</div>
                  <div className="text-xs font-bold text-slate-800">
                    {teamSummary.totalResueltos} / {teamSummary.totalAsignados}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {teamSummary.totalAsignados > 0
                      ? `${((teamSummary.totalResueltos / teamSummary.totalAsignados) * 100).toFixed(1)}% tasa cierre`
                      : '0%'}
                  </div>
                </div>
              </div>

              {/* Team Avg Response Time & SLA */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-400 font-medium">Promedio Equipo</div>
                  <div className="text-xs font-bold text-slate-800">
                    {teamSummary.avgTime}h respuesta
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Cumplimiento SLA: {teamSummary.avgSLA}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Agents List Rows */}
          <div className="space-y-3">
            {currentAgents.length > 0 ? (
              currentAgents.map((ag, idx) => (
                <div
                  key={ag.agente || idx}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl hover:bg-slate-50/80 transition duration-150 gap-4 border border-slate-100/70"
                >
                  {/* Left: Avatar + Agent Info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${getAvatarGradient(
                        idx
                      )} flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0`}
                    >
                      {getInitials(ag.agente)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {ag.agente}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getNivelBadge(
                            ag.nivel_rendimiento
                          )}`}
                        >
                          {ag.nivel_rendimiento}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 truncate flex items-center gap-2">
                        <span>Especialista de Soporte HelpPeople</span>
                        <span>•</span>
                        <span>{ag.total_asignados} asignados</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle / Right: Metrics */}
                  <div className="flex flex-wrap items-center gap-3 md:gap-5 justify-between md:justify-end">
                    
                    {/* Métrica 1: Cantidad de Tickets Resueltos */}
                    <div className="flex flex-col items-start md:items-end min-w-[110px]">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{ag.tickets_resueltos} resueltos</span>
                      </div>
                      <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(5, (ag.tickets_resueltos / (ag.total_asignados || 1)) * 100)
                            )}%`
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 font-medium">
                        {ag.tasa_resolucion_pct}% del total
                      </span>
                    </div>

                    {/* Métrica 2: Tiempo de Respuesta / Resolución */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200/60 text-xs font-bold text-slate-800">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{ag.tiempo_respuesta_promedio_horas}h</span>
                      <span className="text-[10px] text-slate-400 font-normal">resp.</span>
                    </div>

                    {/* Métrica 3: Cumplimiento SLA */}
                    <div className="hidden lg:flex flex-col items-end">
                      <span className="text-xs font-semibold text-slate-700">
                        SLA: <strong className="text-slate-900 font-bold">{ag.sla_cumplimiento_pct}%</strong>
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {ag.tickets_vencidos} vencidos
                      </span>
                    </div>

                    {/* Métrica 4: Satisfacción de Cliente */}
                    {ag.satisfaccion_promedio > 0 && (
                      <div className="hidden sm:flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/60">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{ag.satisfaccion_promedio}</span>
                      </div>
                    )}

                    {/* Puntuación General / Score */}
                    <div className="flex items-center gap-1.5 bg-[#101420] text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
                      <Flame className="w-3.5 h-3.5 text-[#FF5E7E]" />
                      <span>{ag.score_rendimiento} pts</span>
                    </div>

                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                No se encontraron agentes con los filtros especificados.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
        <span>
          Mostrando <strong>{totalItems > 0 ? startIndex + 1 : 0}</strong> a{' '}
          <strong>{Math.min(startIndex + pageSize, totalItems)}</strong> de{' '}
          <strong>{totalItems}</strong> {isAgentTab ? 'agentes' : 'solicitudes'}
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-slate-700">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
