import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import KpiCards from './components/KpiCards';
import RiskAlertBanner from './components/RiskAlertBanner';
import PredictionSimulationPanel from './components/PredictionSimulationPanel';
import ComparativeVolumeChart from './components/ComparativeVolumeChart';
import RiskPriorityChart from './components/RiskPriorityChart';
import RecommendationsModule from './components/RecommendationsModule';
import TicketsTable from './components/TicketsTable';
import TicketModal from './components/TicketModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import SlaCalendarView from './components/SlaCalendarView';
import AnalyticsModule from './components/AnalyticsModule';
import {
  fetchDbStatus,
  fetchFilterOptions,
  fetchHistoricalData,
  fetchPredictions,
  fetchRecommendations,
  fetchAnalyticsStatistics,
  createTicket,
  updateTicket,
  deleteTicket
} from './api';
import {
  Filter,
  Calendar,
  LayoutDashboard,
  BrainCircuit,
  Lightbulb,
  Database,
  BarChart3,
  Sparkles,
  SlidersHorizontal,
  RotateCcw,
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'recommendations' | 'tickets'
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState(null);
  const [filterOptions, setFilterOptions] = useState(null);
  const [filterFeedback, setFilterFeedback] = useState(null);

  // Filtros globales para datos históricos
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    prioridad: 'Todas',
    categoria: 'Todas'
  });

  // Parámetros del simulador de Machine Learning
  const [simulationParams, setSimulationParams] = useState({
    months_ahead: 4,
    prioridad: 'Todas',
    categoria: 'Todas'
  });

  const [historicalData, setHistoricalData] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [predictLoading, setPredictLoading] = useState(false);

  // Estados para Modal de Crear / Editar Ticket y Eliminar
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null); // null = Crear, object = Editar
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const [crudLoading, setCrudLoading] = useState(false);

  const handleOpenCreateTicket = () => {
    setSelectedTicket(null);
    setTicketModalOpen(true);
  };

  const handleEditTicket = (ticket) => {
    setSelectedTicket(ticket);
    setTicketModalOpen(true);
  };

  const handleDeleteTicket = (ticket) => {
    setTicketToDelete(ticket);
    setDeleteModalOpen(true);
  };

  const handleSaveTicket = async (payload, codigoTicket) => {
    setCrudLoading(true);
    try {
      if (codigoTicket) {
        await updateTicket(codigoTicket, payload);
        setFilterFeedback({
          type: 'success',
          message: `Solicitud '${codigoTicket}' actualizada exitosamente en la base de datos.`
        });
      } else {
        const created = await createTicket(payload);
        setFilterFeedback({
          type: 'success',
          message: `Solicitud '${created.codigo_ticket}' creada exitosamente.`
        });
      }
      setTicketModalOpen(false);
      setSelectedTicket(null);
      // Recargar datos analíticos y predicciones
      await handleApplyFilters();
    } catch (err) {
      console.error("Error al guardar ticket:", err);
      setFilterFeedback({
        type: 'error',
        message: err.message || "Error al procesar la solicitud."
      });
    } finally {
      setCrudLoading(false);
    }
  };

  const handleConfirmDelete = async (codigoTicket) => {
    setCrudLoading(true);
    try {
      await deleteTicket(codigoTicket);
      setDeleteModalOpen(false);
      setTicketToDelete(null);
      setFilterFeedback({
        type: 'success',
        message: `Solicitud '${codigoTicket}' eliminada permanentemente del sistema.`
      });
      // Recargar datos analíticos y predicciones
      await handleApplyFilters();
    } catch (err) {
      console.error("Error al eliminar ticket:", err);
      setFilterFeedback({
        type: 'error',
        message: err.message || "Error al eliminar la solicitud."
      });
    } finally {
      setCrudLoading(false);
    }
  };

  // Carga inicial
  const loadInitialData = async () => {
    setLoading(true);
    setFilterFeedback(null);
    try {
      const [statusRes, optionsRes, recsRes] = await Promise.all([
        fetchDbStatus().catch(() => null),
        fetchFilterOptions().catch(() => null),
        fetchRecommendations().catch(() => null)
      ]);

      setDbStatus(statusRes);
      setFilterOptions(optionsRes);
      setRecommendations(recsRes);

      // Cargar datos históricos iniciales
      const hist = await fetchHistoricalData(filters);
      setHistoricalData(hist);

      // Generar predicciones iniciales
      const pred = await fetchPredictions(simulationParams);
      setPredictions(pred);
    } catch (err) {
      console.error("Error al cargar datos iniciales:", err);
      setFilterFeedback({
        type: 'error',
        message: 'No se pudo conectar con el servidor o cargar los datos iniciales.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Actualizar datos históricos y modelos predictivos cuando cambian los filtros
  const handleApplyFilters = async (overrideFilters = null) => {
    const activeFilters = overrideFilters || filters;
    setFilterFeedback(null);

    // Validación de coherencia de fechas
    if (activeFilters.start_date && activeFilters.end_date) {
      if (activeFilters.start_date > activeFilters.end_date) {
        setFilterFeedback({
          type: 'warning',
          message: "La fecha 'Desde' no puede ser posterior a 'Hasta'."
        });
        return;
      }
    }

    setLoading(true);
    try {
      // 1. Consultar datos históricos con filtros aplicados
      const hist = await fetchHistoricalData(activeFilters);
      setHistoricalData(hist);

      // 2. Sincronizar parámetros de simulación y recalcular predicciones IA
      const updatedSimParams = {
        ...simulationParams,
        prioridad: activeFilters.prioridad,
        categoria: activeFilters.categoria
      };
      setSimulationParams(updatedSimParams);

      const pred = await fetchPredictions(updatedSimParams);
      setPredictions(pred);

      const totalFound = hist?.kpis_generales?.total_solicitudes ?? 0;
      if (totalFound === 0) {
        setFilterFeedback({
          type: 'warning',
          message: `No se encontraron registros en este rango o combinación. El dataset histórico comprende de ${filterOptions?.fecha_minima || '2023-01-01'} a ${filterOptions?.fecha_maxima || '2025-01-30'}.`
        });
      } else {
        const isFiltered = activeFilters.start_date || activeFilters.end_date || activeFilters.prioridad !== 'Todas' || activeFilters.categoria !== 'Todas';
        if (isFiltered) {
          setFilterFeedback({
            type: 'success',
            message: `Filtros aplicados exitosamente: ${totalFound.toLocaleString()} solicitudes analizadas.`
          });
        }
      }
    } catch (err) {
      console.error("Error al actualizar datos:", err);
      setFilterFeedback({
        type: 'error',
        message: "Error de comunicación con el backend al aplicar los filtros."
      });
    } finally {
      setLoading(false);
    }
  };

  // Restablecer todos los filtros al estado por defecto
  const handleResetFilters = async () => {
    const reset = { start_date: '', end_date: '', prioridad: 'Todas', categoria: 'Todas' };
    setFilters(reset);
    setFilterFeedback(null);
    await handleApplyFilters(reset);
  };

  // Actualizar predicción cuando cambian los parámetros de simulación
  const handleSimulationParamChange = async (key, val) => {
    const updated = { ...simulationParams, [key]: val };
    setSimulationParams(updated);
    
    // Si el usuario cambia prioridad o categoría en el simulador, sincronizar también el filtro superior
    if (key === 'prioridad' || key === 'categoria') {
      const updatedFilters = { ...filters, [key]: val };
      setFilters(updatedFilters);
      fetchHistoricalData(updatedFilters)
        .then(setHistoricalData)
        .catch(console.error);
    }

    setPredictLoading(true);
    try {
      const pred = await fetchPredictions(updated);
      setPredictions(pred);
    } catch (err) {
      console.error("Error al actualizar predicciones:", err);
    } finally {
      setPredictLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#ECEEF2] flex flex-row font-sans text-slate-800 antialiased p-2 sm:p-3 md:p-4 gap-2 sm:gap-3 md:gap-4 relative">
      
      {/* 1. LEFT DARK SIDEBAR (Completamente fijo en el lateral izquierdo sin scroll vertical) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dbStatus={dbStatus}
      />

      {/* Espaciador del ancho del Sidebar fijo para mantener la estructura flex */}
      <div className="w-20 md:w-24 shrink-0" aria-hidden="true" />

      {/* 2. MAIN APPLICATION CANVAS (Único contenedor con scroll vertical para el dashboard) */}
      <main className="flex-1 h-full min-h-0 max-h-full bg-[#F4F5F8] rounded-[24px] sm:rounded-[36px] shadow-soft-lg border border-white/70 p-4 sm:p-6 lg:p-8 flex flex-col overflow-y-auto overflow-x-hidden">
        
        {/* Top Header Bar */}
        <Header
          dbStatus={dbStatus}
          onRefresh={loadInitialData}
          loading={loading}
          onNewAction={handleOpenCreateTicket}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {activeTab !== 'calendar' && (
          <>
            {/* Global Filter Bar (Modern floating white pill bar) */}
            <div className="bg-white rounded-3xl p-4 shadow-soft border border-slate-100 mb-6 transition">
          <div className="flex flex-col xl:flex-row items-center justify-between gap-4">
            
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 w-full xl:w-auto shrink-0">
              <SlidersHorizontal className="w-4 h-4 text-[#FF5E7E]" />
              <div className="flex flex-col">
                <span>Filtros Históricos:</span>
                <span className="text-[10px] font-normal text-slate-400">
                  {filterOptions?.fecha_minima && filterOptions?.fecha_maxima 
                    ? `Dataset: ${filterOptions.fecha_minima} a ${filterOptions.fecha_maxima}` 
                    : 'Rango: 2023 - 2025'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full xl:w-auto flex-1">
              
              {/* Fecha Desde */}
              <div className="flex items-center bg-slate-50 rounded-2xl px-3.5 py-2 border border-slate-200/80 text-xs hover:border-slate-300 transition">
                <span className="text-slate-400 mr-2 text-[11px] font-medium shrink-0">Desde:</span>
                <input
                  type="date"
                  min={filterOptions?.fecha_minima || '2023-01-01'}
                  max={filterOptions?.fecha_maxima || '2025-01-30'}
                  value={filters.start_date}
                  onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                  className="bg-transparent text-slate-700 font-semibold focus:outline-none w-full cursor-pointer text-xs"
                />
              </div>

              {/* Fecha Hasta */}
              <div className="flex items-center bg-slate-50 rounded-2xl px-3.5 py-2 border border-slate-200/80 text-xs hover:border-slate-300 transition">
                <span className="text-slate-400 mr-2 text-[11px] font-medium shrink-0">Hasta:</span>
                <input
                  type="date"
                  min={filterOptions?.fecha_minima || '2023-01-01'}
                  max={filterOptions?.fecha_maxima || '2025-01-30'}
                  value={filters.end_date}
                  onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                  className="bg-transparent text-slate-700 font-semibold focus:outline-none w-full cursor-pointer text-xs"
                />
              </div>

              {/* Prioridad */}
              <select
                value={filters.prioridad}
                onChange={(e) => setFilters({ ...filters, prioridad: e.target.value })}
                className="bg-slate-50 border border-slate-200/80 rounded-2xl px-3.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#FF5E7E] cursor-pointer hover:border-slate-300 transition"
              >
                {(filterOptions?.prioridades || ['Todas', 'Crítica', 'Alta', 'Media', 'Baja']).map((p) => (
                  <option key={p} value={p}>
                    {p === 'Todas' ? 'Prioridad: Todas' : `Prioridad: ${p}`}
                  </option>
                ))}
              </select>

              {/* Categoría */}
              <select
                value={filters.categoria}
                onChange={(e) => setFilters({ ...filters, categoria: e.target.value })}
                className="bg-slate-50 border border-slate-200/80 rounded-2xl px-3.5 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#FF5E7E] cursor-pointer hover:border-slate-300 transition"
              >
                {(filterOptions?.categorias || [
                  'Todas',
                  'Infraestructura',
                  'Software',
                  'Accesos y Seguridad',
                  'Redes',
                  'Hardware',
                  'Soporte General'
                ]).map((c) => (
                  <option key={c} value={c}>
                    {c === 'Todas' ? 'Categoría: Todas' : `Categoría: ${c}`}
                  </option>
                ))}
              </select>

            </div>

            <div className="flex items-center gap-2 w-full xl:w-auto shrink-0">
              <button
                onClick={() => handleApplyFilters()}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#101420] hover:bg-slate-800 disabled:opacity-60 text-white rounded-full text-xs font-bold transition shadow-sm w-full sm:w-auto active:scale-95 cursor-pointer"
                title="Aplicar filtros a datos históricos y predicciones"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#FF5E7E]" />
                    <span>Aplicando...</span>
                  </>
                ) : (
                  <span>Aplicar Filtro</span>
                )}
              </button>
              <button
                onClick={handleResetFilters}
                disabled={loading}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-600 rounded-full text-xs font-medium transition w-full sm:w-auto flex items-center justify-center cursor-pointer"
                title="Restablecer filtros al valor por defecto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

          {/* Feedback banner tras aplicar filtros */}
          {filterFeedback && (
            <div
              className={`mt-3.5 p-3 rounded-2xl text-xs flex items-center justify-between gap-3 transition border ${
                filterFeedback.type === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : filterFeedback.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {filterFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className={`w-4 h-4 shrink-0 ${
                    filterFeedback.type === 'warning' ? 'text-amber-600' : 'text-rose-600'
                  }`} />
                )}
                <span className="font-medium truncate">{filterFeedback.message}</span>
              </div>
              <button
                onClick={() => setFilterFeedback(null)}
                className="text-[11px] font-bold underline hover:opacity-80 shrink-0 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Risk Alert Banner */}
        <div className="mb-6">
          <RiskAlertBanner
            recommendations={recommendations}
            onNavigateToRecs={() => setActiveTab('recommendations')}
          />
        </div>
      </>
    )}

        {/* ======================================================== */}
        {/* TAB 1: DASHBOARD & PREDICTIONS IA */}
        {/* ======================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* Top KPI Row (Hero Gradient Card + Donut Card + Compact Stat Pills) */}
            <KpiCards
              kpis={historicalData?.kpis_generales}
              distribucionPrioridad={historicalData?.distribucion_prioridad}
            />

            {/* Middle Section: Comparative Volume Chart & Post Stats / SLA Impact */}
            <div className="grid grid-cols-1 gap-6">
              <ComparativeVolumeChart
                historicalMonthly={historicalData?.tendencia_mensual}
                predictions={predictions}
              />
            </div>

            {/* Machine Learning Prediction Simulator */}
            <PredictionSimulationPanel
              filterOptions={filterOptions}
              simulationParams={simulationParams}
              onChangeParam={handleSimulationParamChange}
              predictions={predictions}
              loading={predictLoading}
            />

            {/* Banner de Acceso Rápido a Generación de Estadísticas Analytics */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-4 sm:p-5 shadow-soft border border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-white/10 text-[#FF5E7E]">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide">
                    Módulo de Analytics & Inteligencia Estadística
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    {historicalData?.estadisticas_detalladas?.resumen_ejecutivo || 'Cálculo dinámico de momentos estadísticos (P50-P95), distribución semanal y comportamiento por canal.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('analytics')}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#FF7A59] to-[#FF5E7E] hover:opacity-95 text-white font-bold text-xs shadow-coral transition whitespace-nowrap cursor-pointer active:scale-95"
              >
                Abrir Módulo Analytics &rarr;
              </button>
            </div>

            {/* Post Stats & Priority Risk Section */}
            <RiskPriorityChart
              probabilidadesPrioridad={predictions?.probabilidad_vencimiento_por_prioridad || historicalData?.tasa_vencimiento_por_prioridad}
              tiemposPrioridad={predictions?.tiempos_resolucion_por_prioridad || historicalData?.tiempos_promedio_por_prioridad}
              distribucionCategoria={historicalData?.distribucion_categoria}
              totalResueltas={historicalData?.kpis_generales ? (historicalData.kpis_generales.total_solicitudes - historicalData.kpis_generales.solicitudes_vencidas) : null}
              diasSemana={historicalData?.distribucion_dia_semana}
              slaCumplimiento={historicalData?.kpis_generales?.sla_cumplimiento_pct}
            />

            {/* Post Activity Table in Dashboard */}
            <div>
              <TicketsTable
                tickets={historicalData?.ultimas_solicitudes}
                rendimientoAgentes={historicalData?.rendimiento_agentes}
                onOpenCreate={handleOpenCreateTicket}
                onEditTicket={handleEditTicket}
                onDeleteTicket={handleDeleteTicket}
              />
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: MÓDULO DE ANALYTICS & ESTADÍSTICAS */}
        {/* ======================================================== */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <AnalyticsModule
              historicalData={historicalData}
              onRefresh={() => handleApplyFilters()}
              loading={loading}
              filterOptions={filterOptions}
              filters={filters}
            />
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: RECOMMENDATIONS STRATEGIES */}
        {/* ======================================================== */}
        {activeTab === 'recommendations' && (
          <div className="space-y-6">
            <RecommendationsModule
              recommendations={recommendations}
              setActiveTab={setActiveTab}
              onApplyFilter={handleApplyFilters}
              setFilters={setFilters}
              filters={filters}
            />
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: TICKETS EXPLORER */}
        {/* ======================================================== */}
        {activeTab === 'tickets' && (
          <div className="space-y-6">
            <TicketsTable
              tickets={historicalData?.ultimas_solicitudes}
              rendimientoAgentes={historicalData?.rendimiento_agentes}
              onOpenCreate={handleOpenCreateTicket}
              onEditTicket={handleEditTicket}
              onDeleteTicket={handleDeleteTicket}
            />
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: PLANIFICACIÓN SLA (CALENDARIO DE EVENTOS & TURNOS) */}
        {/* ======================================================== */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <SlaCalendarView />
          </div>
        )}

        {/* Modal de Creación / Edición de Ticket */}
        <TicketModal
          isOpen={ticketModalOpen}
          onClose={() => {
            setTicketModalOpen(false);
            setSelectedTicket(null);
          }}
          onSubmit={handleSaveTicket}
          initialData={selectedTicket}
          loading={crudLoading}
        />

        {/* Modal de Confirmación de Eliminación */}
        <DeleteConfirmModal
          isOpen={deleteModalOpen}
          ticket={ticketToDelete}
          onClose={() => {
            setDeleteModalOpen(false);
            setTicketToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          loading={crudLoading}
        />

        {/* Footer */}
        <footer className="mt-auto pt-8 pb-2 text-center text-xs text-slate-400">
          HelpPeople Hackathon #2 • Predicción y Gestión Inteligente de Solicitudes • Random Forest & Scikit-Learn
        </footer>

      </main>

    </div>
  );
}
