import React from 'react';
import { BellRing, ArrowRight, ShieldAlert } from 'lucide-react';

export default function RiskAlertBanner({ recommendations, onNavigateToRecs }) {
  if (!recommendations) return null;

  const { alerta_riesgo_general, tasa_riesgo_vencimiento_global } = recommendations;
  const isCritical = alerta_riesgo_general === "Crítico" || tasa_riesgo_vencimiento_global > 20;

  return (
    <div className={`p-4 sm:p-5 rounded-3xl border transition shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4 ${
      isCritical
        ? "bg-rose-50 border-rose-100 text-rose-900"
        : "bg-amber-50 border-amber-100 text-amber-900"
    }`}>
      <div className="flex items-start gap-3.5">
        <div className={`p-2.5 rounded-2xl shrink-0 ${
          isCritical ? "bg-[#FF5E7E] text-white shadow-md shadow-rose-500/20" : "bg-amber-500 text-white shadow-md shadow-amber-500/20"
        }`}>
          <BellRing className="w-5 h-5 animate-bounce" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full uppercase tracking-wider ${
              isCritical ? "bg-[#101420] text-white" : "bg-amber-600 text-white"
            }`}>
              Alerta SLA: Nivel {alerta_riesgo_general}
            </span>
            <span className="text-xs font-bold text-slate-700">
              Tasa de Vencimiento: {tasa_riesgo_vencimiento_global}%
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
            {recommendations.resumen_ejecutivo}
          </p>
        </div>
      </div>

      <button
        onClick={onNavigateToRecs}
        className={`px-5 py-2.5 rounded-full text-xs font-bold flex items-center justify-center gap-2 transition whitespace-nowrap shadow-sm active:scale-95 shrink-0 ${
          isCritical 
            ? "bg-[#101420] hover:bg-slate-800 text-white"
            : "bg-amber-500 hover:bg-amber-600 text-white"
        }`}
      >
        <span>Ver Recomendaciones</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
