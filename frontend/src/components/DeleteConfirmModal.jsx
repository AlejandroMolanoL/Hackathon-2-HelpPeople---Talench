import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function DeleteConfirmModal({
  isOpen,
  ticket,
  onClose,
  onConfirm,
  loading = false
}) {
  if (!isOpen || !ticket) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-[28px] shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 p-6 space-y-5"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
            <Trash2 className="w-6 h-6" />
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <h3 className="text-base font-extrabold text-slate-900">
            ¿Eliminar solicitud {ticket.codigo_ticket}?
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Esta acción eliminará de forma permanente el ticket de{' '}
            <strong className="text-slate-700">{ticket.departamento_solicitante || 'Soporte'}</strong>{' '}
            asignado a <strong className="text-slate-700">{ticket.agente_asignado || 'Equipo TI'}</strong>.
            Las estadísticas y modelos predictivos de SLA se actualizarán automáticamente.
          </p>
        </div>

        <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-center gap-2 text-[11px] text-amber-800 font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>Esta operación no se puede deshacer.</span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-100 transition disabled:opacity-50 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm(ticket.codigo_ticket)}
            disabled={loading}
            className="px-5 py-2.5 rounded-full text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition shadow-md flex items-center gap-2 disabled:opacity-50 active:scale-95 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{loading ? 'Eliminando...' : 'Eliminar Solicitud'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

