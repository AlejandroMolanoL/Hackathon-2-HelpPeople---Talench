import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

export default function SlaDeleteModal({
  isOpen,
  event,
  onClose,
  onConfirm,
  loading = false
}) {
  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-md overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                ¿Eliminar esta Planificación SLA?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Esta acción removerá el evento del calendario de forma permanente.
              </p>

              <div className="mt-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                <div className="font-bold text-slate-800 truncate">
                  {event.titulo}
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Tipo: <strong className="text-slate-700">{event.tipo}</strong></span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    event.prioridad === 'Crítica'
                      ? 'bg-rose-100 text-rose-700'
                      : event.prioridad === 'Alta'
                      ? 'bg-amber-100 text-amber-700'
                      : event.prioridad === 'Media'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {event.prioridad}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Inicio: {event.fecha_inicio}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
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
            onClick={() => onConfirm(event.id)}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                Sí, Eliminar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

