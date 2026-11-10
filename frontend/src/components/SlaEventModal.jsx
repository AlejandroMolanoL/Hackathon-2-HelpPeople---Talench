import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  Shield,
  User,
  Tag,
  Target,
  FileText,
  AlertCircle,
  Save,
  CheckCircle2
} from 'lucide-react';

const TIPOS_PLANIFICACION = [
  'Ventana de Mantenimiento',
  'Turno de Soporte',
  'Revisión SLA',
  'Auditoría',
  'Despliegue',
  'Capacitación'
];

const PRIORIDADES = [
  { value: 'Crítica', label: 'Crítica', color: 'bg-rose-500 text-white', border: 'border-rose-300' },
  { value: 'Alta', label: 'Alta', color: 'bg-amber-500 text-white', border: 'border-amber-300' },
  { value: 'Media', label: 'Media', color: 'bg-blue-500 text-white', border: 'border-blue-300' },
  { value: 'Baja', label: 'Baja', color: 'bg-emerald-500 text-white', border: 'border-emerald-300' },
];

const ESTADOS = [
  'Programado',
  'En Curso',
  'Completado',
  'Cancelado'
];

function formatDateTimeForInput(dateStr) {
  if (!dateStr) return '';
  // Support both "YYYY-MM-DD HH:MM" and ISO format
  const clean = dateStr.replace(' ', 'T');
  if (clean.length === 16) return clean;
  if (clean.length > 16) return clean.substring(0, 16);
  return clean;
}

export default function SlaEventModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  defaultDate = null,
  loading = false
}) {
  const isEditing = Boolean(initialData && initialData.id);

  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'Revisión SLA',
    prioridad: 'Media',
    fecha_inicio: '',
    fecha_fin: '',
    responsable: '',
    estado: 'Programado',
    meta_sla: '',
    descripcion: ''
  });

  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        titulo: initialData.titulo || '',
        tipo: initialData.tipo || 'Revisión SLA',
        prioridad: initialData.prioridad || 'Media',
        fecha_inicio: formatDateTimeForInput(initialData.fecha_inicio),
        fecha_fin: formatDateTimeForInput(initialData.fecha_fin),
        responsable: initialData.responsable || '',
        estado: initialData.estado || 'Programado',
        meta_sla: initialData.meta_sla || '',
        descripcion: initialData.descripcion || ''
      });
    } else {
      const baseDate = defaultDate ? defaultDate : new Date().toISOString().substring(0, 10);
      setFormData({
        titulo: '',
        tipo: 'Revisión SLA',
        prioridad: 'Media',
        fecha_inicio: `${baseDate}T09:00`,
        fecha_fin: `${baseDate}T11:00`,
        responsable: '',
        estado: 'Programado',
        meta_sla: '> 95% Cumplimiento SLA',
        descripcion: ''
      });
    }
    setFormError('');
  }, [initialData, defaultDate, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formError) setFormError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.titulo.trim()) {
      setFormError('Por favor ingresa el título de la planificación.');
      return;
    }

    if (!formData.fecha_inicio || !formData.fecha_fin) {
      setFormError('Debes especificar fecha y hora de inicio y fin.');
      return;
    }

    if (new Date(formData.fecha_fin) < new Date(formData.fecha_inicio)) {
      setFormError('La fecha de fin no puede ser anterior a la fecha de inicio.');
      return;
    }

    // Normalizar a formato "YYYY-MM-DD HH:MM"
    const payload = {
      ...formData,
      titulo: formData.titulo.trim(),
      responsable: formData.responsable.trim() || 'Sin Asignar',
      fecha_inicio: formData.fecha_inicio.replace('T', ' '),
      fecha_fin: formData.fecha_fin.replace('T', ' '),
      meta_sla: formData.meta_sla.trim(),
      descripcion: formData.descripcion.trim()
    };

    onSubmit(payload, isEditing ? initialData.id : null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-white to-slate-50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${
              isEditing ? 'bg-amber-100 text-amber-700' : 'bg-[#FF5E7E]/10 text-[#FF5E7E]'
            }`}>
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                {isEditing ? 'Editar Planificación SLA' : 'Nueva Planificación SLA'}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? `Modificando evento #${initialData?.id} en el calendario operativo`
                  : 'Registra un evento, turno, mantenimiento o revisión en el calendario'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-medium">{formError}</span>
            </div>
          )}

          {/* Título */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Título del Evento / Planificación <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Ventana Mantenimiento Preventivo Core DB"
              value={formData.titulo}
              onChange={(e) => handleChange('titulo', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5E7E]/30 focus:border-[#FF5E7E] text-xs font-medium transition"
            />
          </div>

          {/* Tipo & Estado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                Tipo de Planificación
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => handleChange('tipo', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5E7E]/30 focus:border-[#FF5E7E] text-xs font-medium transition"
              >
                {TIPOS_PLANIFICACION.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                Estado
              </label>
              <select
                value={formData.estado}
                onChange={(e) => handleChange('estado', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5E7E]/30 focus:border-[#FF5E7E] text-xs font-medium transition"
              >
                {ESTADOS.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Prioridad con Pills */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              Nivel de Prioridad SLA
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRIORIDADES.map((p) => {
                const isSelected = formData.prioridad === p.value;
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => handleChange('prioridad', p.value)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
                      isSelected
                        ? `${p.color} border-transparent shadow-sm`
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : p.color.split(' ')[0]}`} />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fecha y Hora Inicio y Fin */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Fecha y Hora de Inicio <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={formData.fecha_inicio}
                onChange={(e) => handleChange('fecha_inicio', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5E7E]/30 focus:border-[#FF5E7E] text-xs font-medium transition"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Fecha y Hora de Fin <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={formData.fecha_fin}
                onChange={(e) => handleChange('fecha_fin', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5E7E]/30 focus:border-[#FF5E7E] text-xs font-medium transition"
              />
            </div>
          </div>

          {/* Responsable & Meta SLA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Responsable o Equipo Asignado
              </label>
              <input
                type="text"
                placeholder="Ej. Diana Morales / Equipo DevOps"
                value={formData.responsable}
                onChange={(e) => handleChange('responsable', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5E7E]/30 focus:border-[#FF5E7E] text-xs font-medium transition"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-slate-400" />
                Meta de SLA / Objetivo
              </label>
              <input
                type="text"
                placeholder="Ej. > 98% Disponibilidad / < 15m resolución"
                value={formData.meta_sla}
                onChange={(e) => handleChange('meta_sla', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5E7E]/30 focus:border-[#FF5E7E] text-xs font-medium transition"
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Descripción Detallada y Procedimientos
            </label>
            <textarea
              rows={3}
              placeholder="Detalla las actividades a ejecutar, impacto previsto en el SLA y plan de contingencia..."
              value={formData.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#FF5E7E]/30 focus:border-[#FF5E7E] text-xs font-medium transition resize-none"
            />
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#FF5E7E] to-[#FF8A65] hover:opacity-95 shadow-md shadow-rose-500/20 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                {isEditing ? 'Actualizar Planificación' : 'Crear Planificación'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

