import React, { useState, useEffect } from 'react';
import {
  Lightbulb,
  CheckCircle2,
  ArrowUpRight,
  ShieldCheck,
  Users,
  Zap,
  AlertTriangle,
  Sparkles,
  Calendar,
  ArrowRight,
  Clock,
  Settings,
  X,
  ExternalLink,
  RefreshCw,
  RotateCcw,
  Check,
  Eye
} from 'lucide-react';
import { createSlaEvent } from '../api';

const STORAGE_KEY = 'helppeople_applied_strategies';

export default function RecommendationsModule({
  recommendations,
  setActiveTab,
  onApplyFilter,
  setFilters,
  filters
}) {
  const [appliedStrategies, setAppliedStrategies] = useState({});
  const [selectedRec, setSelectedRec] = useState(null); // Recomendación para modal
  const [modalOpen, setModalOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Formulario configurable para la aplicación de la recomendación
  const [strategyConfig, setStrategyConfig] = useState({
    responsable: '',
    tipoEvento: 'Turno de Soporte',
    metaSla: '',
    notas: '',
    fechaInicio: '',
    fechaFin: '',
    prioridad: 'Alta'
  });

  // Cargar estrategias aplicadas desde localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setAppliedStrategies(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("No se pudo cargar el historial de estrategias aplicadas:", e);
    }
  }, []);

  const saveAppliedStrategies = (updated) => {
    setAppliedStrategies(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn("No se pudo guardar el historial de estrategias:", e);
    }
  };

  if (!recommendations) return null;

  const getPriorityBadge = (nivel) => {
    switch (nivel) {
      case 'Crítica':
        return 'bg-rose-50 text-rose-600 border-rose-200';
      case 'Alta':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Media':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  const getTypeIcon = (tipo) => {
    switch (tipo) {
      case 'Alerta SLA':
        return AlertTriangle;
      case 'Cuello de Botella':
        return Zap;
      case 'Capacidad de Equipo':
        return Users;
      default:
        return ShieldCheck;
    }
  };

  // Abrir modal de aplicación con valores pre-configurados según la recomendación
  const handleOpenApplyModal = (rec) => {
    setSelectedRec(rec);

    const now = new Date();
    const isoDate = now.toISOString().slice(0, 10);
    const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    let defaultResponsable = 'Equipo de Guardia L2';
    let defaultTipo = 'Turno de Soporte';
    let defaultMeta = rec.estimacion_mejora || 'Reducción de tiempos en 30%';

    if (rec.id === 'REC-001') {
      defaultResponsable = 'Equipo de Triage y Guardia L2';
      defaultTipo = 'Turno de Soporte';
      defaultMeta = 'Respuesta inicial < 30 min para tickets Críticos';
    } else if (rec.id === 'REC-002') {
      defaultResponsable = 'Especialistas Sénior de Infraestructura';
      defaultTipo = 'Turno de Soporte';
      defaultMeta = 'Reducción de incidentes vencidos en 40%';
    } else if (rec.id === 'REC-003') {
      defaultResponsable = 'Equipo de Automatización y Chatbot IA';
      defaultTipo = 'Revisión SLA';
      defaultMeta = 'Ahorro de hasta 4.2h promedio por solicitud';
    } else if (rec.id === 'REC-004') {
      defaultResponsable = 'Supervisores de Turno (8 Agentes)';
      defaultTipo = 'Turno de Soporte';
      defaultMeta = 'SLA Global > 92%';
    }

    setStrategyConfig({
      responsable: defaultResponsable,
      tipoEvento: defaultTipo,
      metaSla: defaultMeta,
      notas: rec.accion_sugerida || 'Implementación de política recomendada por IA.',
      fechaInicio: `${isoDate} 08:00`,
      fechaFin: `${futureDate} 18:00`,
      prioridad: rec.nivel_prioridad || 'Alta'
    });

    setModalOpen(true);
  };

  // Confirmar y aplicar la estrategia
  const handleConfirmApply = async () => {
    if (!selectedRec) return;
    setApplying(true);
    setFeedback(null);

    const recId = selectedRec.id || selectedRec.titulo;

    try {
      // 1. Crear evento operativo en el Calendario SLA a través de la API
      const eventPayload = {
        titulo: `Estrategia IA: ${selectedRec.titulo}`,
        tipo: strategyConfig.tipoEvento,
        fecha_inicio: strategyConfig.fechaInicio,
        fecha_fin: strategyConfig.fechaFin,
        prioridad: strategyConfig.prioridad,
        responsable: strategyConfig.responsable,
        estado: 'En Curso',
        meta_sla: strategyConfig.metaSla,
        descripcion: `${strategyConfig.notas} | ID: ${recId}`
      };

      let createdEvent = null;
      try {
        createdEvent = await createSlaEvent(eventPayload);
      } catch (err) {
        console.warn("Aviso al crear evento SLA (guardando localmente):", err);
      }

      // 2. Persistir estado de estrategia aplicada
      const appliedInfo = {
        recId,
        titulo: selectedRec.titulo,
        tipo: selectedRec.tipo,
        nivel_prioridad: selectedRec.nivel_prioridad || 'Alta',
        appliedAt: new Date().toLocaleString(),
        eventId: createdEvent?.id || null,
        responsable: strategyConfig.responsable,
        metaSla: strategyConfig.metaSla
      };

      const updated = {
        ...appliedStrategies,
        [recId]: appliedInfo
      };
      saveAppliedStrategies(updated);

      setModalOpen(false);
      setFeedback({
        type: 'success',
        recId,
        message: `¡Estrategia '${selectedRec.titulo}' aplicada exitosamente! Se ha programado la guardia operativa en el Calendario SLA.`
      });
    } catch (err) {
      console.error("Error al aplicar la recomendación:", err);
      setFeedback({
        type: 'error',
        message: err.message || "Error al aplicar la estrategia en el sistema."
      });
    } finally {
      setApplying(false);
    }
  };

  // Revertir / Desactivar una estrategia aplicada
  const handleRevertStrategy = (recId, recTitle) => {
    const updated = { ...appliedStrategies };
    delete updated[recId];
    saveAppliedStrategies(updated);

    setFeedback({
      type: 'info',
      message: `Estrategia '${recTitle}' desactivada y vuelta a estado pendiente.`
    });
  };

  // Navegar a Planificación SLA
  const handleGoToCalendar = () => {
    if (setActiveTab) setActiveTab('calendar');
  };

  // Navegar a Tickets con el filtro correspondiente
  const handleGoToFilteredTickets = (rec) => {
    if (!setActiveTab) return;

    if (rec.id === 'REC-001' || rec.titulo.toLowerCase().includes('crítico')) {
      if (setFilters) setFilters((prev) => ({ ...prev, prioridad: 'Crítica' }));
      if (onApplyFilter) onApplyFilter({ ...filters, prioridad: 'Crítica' });
    } else if (rec.id === 'REC-002' || rec.titulo.toLowerCase().includes('infraestructura')) {
      if (setFilters) setFilters((prev) => ({ ...prev, categoria: 'Infraestructura' }));
      if (onApplyFilter) onApplyFilter({ ...filters, categoria: 'Infraestructura' });
    }

    setActiveTab('tickets');
  };

  const totalRecs = recommendations.recomendaciones?.length || 0;
  const totalApplied = Object.keys(appliedStrategies).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* 1. MODULE HEADER & STATUS BAR */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-soft border border-slate-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-[#FF7A59] to-[#FF5E7E] text-white shadow-coral">
              <Lightbulb className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Estrategias y Recomendaciones Operativas Automatizadas
                </h2>
                <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-50 text-[#FF5E7E] border border-rose-100">
                  IA Prescriptiva
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Planes de acción generados por Random Forest a partir de los patrones de vencimiento y demanda proyectada.
              </p>
            </div>
          </div>

          {/* Quick Metrics & Applied Counter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-slate-600 font-medium">Estrategias Activas:</span>
              <span className="font-extrabold text-slate-900">
                {totalApplied} de {totalRecs}
              </span>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200 text-xs">
              <span className="text-slate-500 font-medium">Riesgo Global:</span>
              <span className={`font-extrabold uppercase ${
                recommendations.alerta_riesgo_general === 'Crítico' ? 'text-rose-600' : 'text-amber-600'
              }`}>
                {recommendations.alerta_riesgo_general} ({recommendations.tasa_riesgo_vencimiento_global}%)
              </span>
            </div>
          </div>

        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div className={`mt-4 p-4 rounded-2xl text-xs flex items-center justify-between gap-3 border transition animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : feedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}>
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{feedback.message}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {feedback.type === 'success' && (
                <button
                  onClick={handleGoToCalendar}
                  className="px-3 py-1 rounded-full bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 transition"
                >
                  Ver en Calendario SLA &rarr;
                </button>
              )}
              <button
                onClick={() => setFeedback(null)}
                className="text-[11px] font-bold underline hover:opacity-80 cursor-pointer ml-2"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

      </div>

      {/* 2. RECOMMENDATIONS CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {recommendations.recomendaciones?.map((rec, i) => {
          const recId = rec.id || rec.titulo;
          const isApplied = !!appliedStrategies[recId];
          const appliedData = appliedStrategies[recId];
          const IconComponent = getTypeIcon(rec.tipo);
          const nivel = rec.nivel_prioridad || rec.prioridad_atencion || 'Preventiva';
          const impacto = rec.estimacion_mejora || rec.impacto_esperado || "Reducción SLA -15%";

          return (
            <div
              key={recId || i}
              className={`bg-white rounded-3xl p-6 shadow-soft border flex flex-col justify-between transition-all duration-200 hover:shadow-md ${
                isApplied
                  ? 'border-emerald-300 ring-2 ring-emerald-100 bg-gradient-to-b from-emerald-50/20 to-white'
                  : 'border-slate-100 hover:border-slate-300'
              }`}
            >
              <div className="space-y-3.5">
                
                {/* Header: Type, Priority Badge & Applied State */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl ${isApplied ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-[#101420]'}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-900">{rec.tipo}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isApplied && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <Check className="w-3 h-3" />
                        <span>Activa</span>
                      </span>
                    )}
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getPriorityBadge(nivel)}`}>
                      {nivel}
                    </span>
                  </div>
                </div>

                {/* Title & Diagnostic */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {rec.titulo}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1.5">
                    {rec.descripcion}
                  </p>
                </div>

                {/* Action Suggestion Box */}
                {rec.accion_sugerida && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-700 font-bold text-[11px]">
                      <Zap className="w-3.5 h-3.5 text-[#FF5E7E]" />
                      <span>Acción Sugerida por IA:</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[11.5px]">
                      {rec.accion_sugerida}
                    </p>
                  </div>
                )}

              </div>

              {/* Action Plan Footer */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF5E7E] shrink-0" />
                  <span className="truncate">
                    Impacto: <strong className="text-slate-700">{impacto}</strong>
                  </span>
                </div>

                {/* Interactive CTAs */}
                <div className="flex items-center gap-2 shrink-0">
                  {isApplied ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleGoToCalendar}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                        title="Ver el evento de soporte programado en el Calendario SLA"
                      >
                        <Calendar className="w-3.5 h-3.5 text-slate-600" />
                        <span>Ver en Calendario</span>
                      </button>

                      {(rec.id === 'REC-001' || rec.id === 'REC-002') && (
                        <button
                          onClick={() => handleGoToFilteredTickets(rec)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                          title="Explorar tickets filtrados por esta estrategia"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                          <span>Ver Tickets</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleRevertStrategy(recId, rec.titulo)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Desactivar / Revertir estrategia"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOpenApplyModal(rec)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#101420] hover:bg-slate-800 text-white font-bold text-xs shadow-sm hover:shadow transition active:scale-95 cursor-pointer"
                    >
                      <span>Aplicar</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#FF5E7E]" />
                    </button>
                  )}
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* 3. MODAL DE EJECUCIÓN Y APLICACIÓN DE ESTRATEGIA */}
      {modalOpen && selectedRec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 relative max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-gradient-to-tr from-[#FF7A59] to-[#FF5E7E] text-white shadow-coral">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Ejecutar Estrategia
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityBadge(selectedRec.nivel_prioridad)}`}>
                      {selectedRec.nivel_prioridad || 'Alta'}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 mt-0.5 leading-snug">
                    {selectedRec.titulo}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Diagnostic & Action Summary */}
            <div className="space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                {selectedRec.descripcion}
              </p>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                <span className="font-bold text-slate-800 text-[11px] block">
                  🎯 Meta / Impacto Operativo:
                </span>
                <p className="text-slate-600 text-[11.5px]">
                  {selectedRec.estimacion_mejora || selectedRec.impacto_esperado || "Reducción significativa de tiempos de resolución."}
                </p>
              </div>
            </div>

            {/* Form Configuration for Calendar SLA Event Creation */}
            <div className="space-y-3.5 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-900 block">
                Configuración del Evento Operativo en Planificación SLA:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-500 font-semibold mb-1 text-[11px]">
                    Equipo / Responsable Asignado
                  </label>
                  <input
                    type="text"
                    value={strategyConfig.responsable}
                    onChange={(e) => setStrategyConfig({ ...strategyConfig, responsable: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#FF5E7E]"
                    placeholder="Ej. Equipo Guardia L2"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1 text-[11px]">
                    Tipo de Planificación
                  </label>
                  <select
                    value={strategyConfig.tipoEvento}
                    onChange={(e) => setStrategyConfig({ ...strategyConfig, tipoEvento: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#FF5E7E]"
                  >
                    <option value="Turno de Soporte">Turno de Soporte</option>
                    <option value="Revisión SLA">Revisión SLA</option>
                    <option value="Ventana de Mantenimiento">Ventana de Mantenimiento</option>
                    <option value="Despliegue">Despliegue / Automatización</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1 text-[11px]">
                    Fecha y Hora de Inicio
                  </label>
                  <input
                    type="text"
                    value={strategyConfig.fechaInicio}
                    onChange={(e) => setStrategyConfig({ ...strategyConfig, fechaInicio: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#FF5E7E]"
                    placeholder="YYYY-MM-DD HH:MM"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1 text-[11px]">
                    Fecha y Hora de Fin
                  </label>
                  <input
                    type="text"
                    value={strategyConfig.fechaFin}
                    onChange={(e) => setStrategyConfig({ ...strategyConfig, fechaFin: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#FF5E7E]"
                    placeholder="YYYY-MM-DD HH:MM"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1 text-[11px]">
                  Meta Operativa SLA
                </label>
                <input
                  type="text"
                  value={strategyConfig.metaSla}
                  onChange={(e) => setStrategyConfig({ ...strategyConfig, metaSla: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#FF5E7E]"
                  placeholder="Ej. Reducción 35% en respuesta inicial"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={applying}
                className="px-4 py-2.5 rounded-full text-slate-600 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmApply}
                disabled={applying}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#FF7A59] via-[#FF5875] to-[#FF3D8B] hover:opacity-95 text-white text-xs font-bold shadow-coral transition active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {applying ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Aplicando en Sistema...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirmar y Aplicar Estrategia</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
