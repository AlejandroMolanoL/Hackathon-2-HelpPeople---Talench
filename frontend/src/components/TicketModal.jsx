import React, { useState, useEffect } from 'react';
import {
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  User,
  Building,
  Tag,
  Radio,
  Sparkles,
  Save,
  Calendar
} from 'lucide-react';
import { fetchNextTicketCode } from '../api';

const PRIORIDADES = ['Crítica', 'Alta', 'Media', 'Baja'];
const ESTADOS = ['Abierta', 'En Proceso', 'Cerrada', 'Vencida'];
const CATEGORIAS = [
  'Infraestructura',
  'Software',
  'Accesos y Seguridad',
  'Redes',
  'Hardware',
  'Soporte General'
];
const DEPARTAMENTOS = [
  'TI y Desarrollo',
  'Operaciones',
  'Atención al Cliente',
  'Ventas',
  'Logística',
  'Legal',
  'Finanzas',
  'Recursos Humanos'
];
const AGENTES = [
  'Valentina Morales',
  'Carlos Méndez',
  'Laura Gómez',
  'Santiago Ruiz',
  'Diana Castro',
  'Andrés Pérez',
  'Sin Asignar'
];
const CANALES = [
  'Portal Web',
  'Correo Electrónico',
  'Chatbot HelpPeople',
  'Teléfono'
];

export default function TicketModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null, // If provided, we are editing. If null, creating.
  loading = false
}) {
  const isEditing = Boolean(initialData && initialData.codigo_ticket);

  const getInitialState = () => {
    if (initialData) {
      let formattedFecha = '';
      if (initialData.fecha_solicitud) {
        // Formato para input datetime-local: YYYY-MM-DDTHH:MM
        try {
          const d = new Date(initialData.fecha_solicitud);
          if (!isNaN(d.getTime())) {
            formattedFecha = d.toISOString().slice(0, 16);
          }
        } catch {
          formattedFecha = '';
        }
      }

      return {
        codigo_ticket: initialData.codigo_ticket || '',
        departamento_solicitante: initialData.departamento_solicitante || 'TI y Desarrollo',
        agente_asignado: initialData.agente_asignado || 'Valentina Morales',
        prioridad: initialData.prioridad || 'Media',
        categoria: initialData.categoria || 'Software',
        estado: initialData.estado || 'Abierta',
        canal_origen: initialData.canal_origen || 'Portal Web',
        fecha_solicitud: formattedFecha,
        tiempo_resolucion_horas: initialData.tiempo_resolucion_horas ?? '',
        satisfaccion_cliente: initialData.satisfaccion_cliente ?? 5,
        sla_cumplido: initialData.sla_cumplido ?? 1
      };
    }

    const nowIso = new Date().toISOString().slice(0, 16);
    return {
      codigo_ticket: '',
      departamento_solicitante: 'TI y Desarrollo',
      agente_asignado: 'Valentina Morales',
      prioridad: 'Media',
      categoria: 'Software',
      estado: 'Abierta',
      canal_origen: 'Portal Web',
      fecha_solicitud: nowIso,
      tiempo_resolucion_horas: '',
      satisfaccion_cliente: 5,
      sla_cumplido: 1
    };
  };

  const [formData, setFormData] = useState(getInitialState);
  const [suggestedCode, setSuggestedCode] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialState());
      setError(null);

      if (!isEditing) {
        fetchNextTicketCode()
          .then((code) => {
            if (code) setSuggestedCode(code);
          })
          .catch(() => {});
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    // Validaciones básicas
    if (!formData.departamento_solicitante.trim()) {
      setError('Por favor indica el departamento solicitante.');
      return;
    }

    const payload = { ...formData };
    
    // Al crear un ticket, el código SIEMPRE se genera automáticamente en el backend
    if (!isEditing) {
      delete payload.codigo_ticket;
    }

    // Convertir horas a número si existen
    if (payload.tiempo_resolucion_horas !== '' && payload.tiempo_resolucion_horas !== null) {
      payload.tiempo_resolucion_horas = parseFloat(payload.tiempo_resolucion_horas);
    } else {
      payload.tiempo_resolucion_horas = null;
    }

    if (payload.satisfaccion_cliente !== '' && payload.satisfaccion_cliente !== null) {
      payload.satisfaccion_cliente = parseFloat(payload.satisfaccion_cliente);
    }

    payload.sla_cumplido = parseInt(payload.sla_cumplido, 10);

    onSubmit(payload, isEditing ? initialData.codigo_ticket : null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-[28px] shadow-2xl border border-slate-100 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#101420] text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <Sparkles className="w-5 h-5 text-[#FF5E7E]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {isEditing ? `Editar Solicitud • ${initialData.codigo_ticket}` : 'Nueva Solicitud de Soporte'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {isEditing
                  ? 'Modifica los parámetros y actualiza el estado de la solicitud'
                  : 'Registra un nuevo ticket de soporte con análisis automático de SLA'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Código de Ticket (100% Automático) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Número de Solicitud</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                  {isEditing ? 'Registrado' : 'Automático'}
                </span>
              </label>
              <div className="w-full bg-slate-100 border border-slate-200/90 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 font-bold flex items-center justify-between shadow-inner">
                <span className="font-mono text-xs text-slate-800">
                  {isEditing ? initialData.codigo_ticket : (suggestedCode || 'Asignación correlativa automática')}
                </span>
                <Sparkles className="w-4 h-4 text-[#FF5E7E]" />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {isEditing ? 'Código identificador único de la solicitud.' : 'El número correlativo es generado de forma 100% automática por el sistema.'}
              </span>
            </div>

            {/* Fecha Solicitud */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Fecha y Hora de Solicitud
              </label>
              <input
                type="datetime-local"
                value={formData.fecha_solicitud}
                onChange={(e) => setFormData({ ...formData, fecha_solicitud: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF5E7E]/30 focus:border-[#FF5E7E] transition cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Prioridad */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nivel de Prioridad
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {PRIORIDADES.map((p) => {
                  const isSelected = formData.prioridad === p;
                  return (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setFormData({ ...formData, prioridad: p })}
                      className={`py-2 text-[11px] font-bold rounded-xl border transition cursor-pointer text-center ${
                        isSelected
                          ? p === 'Crítica'
                            ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-sm'
                            : p === 'Alta'
                            ? 'bg-amber-50 border-amber-400 text-amber-700 shadow-sm'
                            : p === 'Media'
                            ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-sm'
                            : 'bg-slate-100 border-slate-400 text-slate-800 shadow-sm'
                          : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Estado Actual
              </label>
              <select
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF5E7E]/30 focus:border-[#FF5E7E] transition cursor-pointer"
              >
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Categoría */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Categoría del Servicio
              </label>
              <select
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF5E7E]/30 focus:border-[#FF5E7E] transition cursor-pointer"
              >
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Canal de Origen */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Canal de Recepción
              </label>
              <select
                value={formData.canal_origen}
                onChange={(e) => setFormData({ ...formData, canal_origen: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF5E7E]/30 focus:border-[#FF5E7E] transition cursor-pointer"
              >
                {CANALES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Departamento Solicitante */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Departamento Solicitante
              </label>
              <input
                type="text"
                list="dept-options"
                value={formData.departamento_solicitante}
                onChange={(e) => setFormData({ ...formData, departamento_solicitante: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF5E7E]/30 focus:border-[#FF5E7E] transition"
                placeholder="Escribe o selecciona..."
              />
              <datalist id="dept-options">
                {DEPARTAMENTOS.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </div>

            {/* Agente Asignado */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Agente Responsable
              </label>
              <input
                type="text"
                list="agent-options"
                value={formData.agente_asignado}
                onChange={(e) => setFormData({ ...formData, agente_asignado: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF5E7E]/30 focus:border-[#FF5E7E] transition"
                placeholder="Escribe o selecciona agente..."
              />
              <datalist id="agent-options">
                {AGENTES.map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Sección condicional para tickets cerrados o vencidos */}
          {(formData.estado === 'Cerrada' || formData.estado === 'Vencida') && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4 animate-in fade-in">
              <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#FF5E7E]" />
                Métricas de Cierre y Resolución
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Tiempo de resolución */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Tiempo Resolución (Horas)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="Ej: 5.5"
                    value={formData.tiempo_resolucion_horas}
                    onChange={(e) => setFormData({ ...formData, tiempo_resolucion_horas: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#FF5E7E]"
                  />
                </div>

                {/* Satisfacción del Cliente */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Satisfacción (1 a 5)
                  </label>
                  <select
                    value={formData.satisfaccion_cliente}
                    onChange={(e) => setFormData({ ...formData, satisfaccion_cliente: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#FF5E7E]"
                  >
                    <option value="5">⭐⭐⭐⭐⭐ (5 - Excelente)</option>
                    <option value="4">⭐⭐⭐⭐ (4 - Bueno)</option>
                    <option value="3">⭐⭐⭐ (3 - Aceptable)</option>
                    <option value="2">⭐⭐ (2 - Regular)</option>
                    <option value="1">⭐ (1 - Malo)</option>
                  </select>
                </div>

                {/* Cumplimiento SLA */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    ¿Cumplió con SLA?
                  </label>
                  <select
                    value={formData.sla_cumplido}
                    onChange={(e) => setFormData({ ...formData, sla_cumplido: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#FF5E7E]"
                  >
                    <option value="1">Sí (Cumplido)</option>
                    <option value="0">No (Vencido)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 transition disabled:opacity-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#101420] hover:bg-slate-800 transition shadow-md flex items-center gap-2 disabled:opacity-50 active:scale-95 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-[#FF5E7E]" />
              <span>{loading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Solicitud'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

