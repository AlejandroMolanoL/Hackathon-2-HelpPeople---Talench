import React from 'react';
import {
  MoreHorizontal,
  MessageSquare,
  ThumbsUp,
  Star,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

export default function KpiCards({ kpis, distribucionPrioridad = {} }) {
  if (!kpis) return null;

  // Formatter for values (e.g., 23000 -> 23.000K)
  const formatCompact = (val) => {
    if (!val && val !== 0) return '0';
    if (val >= 1000) {
      return `${(val / 1000).toFixed(1)}k`;
    }
    return val.toString();
  };

  const total = kpis.total_solicitudes || 0;
  const totalStr = total.toLocaleString();

  const tasaVencimiento = kpis.tasa_vencimiento_pct !== undefined ? kpis.tasa_vencimiento_pct : 0;
  const slaCumplimiento = kpis.sla_cumplimiento_pct !== undefined ? kpis.sla_cumplimiento_pct : 0;
  const csat = kpis.satisfaccion_promedio !== undefined ? kpis.satisfaccion_promedio : 0;

  // Calcular porcentajes reales según distribución de prioridades
  const totalDist = total > 0 ? total : 1;
  const pctCriticas = distribucionPrioridad?.['Crítica'] ? Math.round((distribucionPrioridad['Crítica'] / totalDist) * 100) : 0;
  const pctAltas = distribucionPrioridad?.['Alta'] ? Math.round((distribucionPrioridad['Alta'] / totalDist) * 100) : 0;
  const normalesCount = (distribucionPrioridad?.['Media'] || 0) + (distribucionPrioridad?.['Baja'] || 0);
  const pctNormales = normalesCount > 0 ? Math.round((normalesCount / totalDist) * 100) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      
      {/* 1. HERO GRADIENT CARD (Inspired by the coral-pink gradient card in the reference image) */}
      <div className="lg:col-span-5 bg-gradient-to-tr from-[#FF7A59] via-[#FF5875] to-[#FF3D8B] text-white rounded-3xl p-6 shadow-coral flex flex-col justify-between relative overflow-hidden min-h-[220px]">
        {/* Subtle decorative background light */}
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        {/* Card Header */}
        <div className="flex items-center justify-between z-10">
          <span className="text-xs font-semibold text-white/90 tracking-wide">
            Total Solicitudes
          </span>
          <button className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Hero Big Value */}
        <div className="my-auto py-2 z-10">
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight drop-shadow-sm">
            {totalStr}
          </div>
          <p className="text-[11px] text-white/80 mt-0.5">
            Volumen global de tickets analizados por el modelo
          </p>
        </div>

        {/* Decorative Wave Lines (like the reference graph wave) */}
        <div className="relative w-full h-12 my-1 z-10">
          <svg
            viewBox="0 0 300 45"
            preserveAspectRatio="none"
            className="w-full h-full overflow-visible"
          >
            {/* Wave 1: Cyan/Blue soft wave */}
            <path
              d="M 0 30 Q 50 10 100 25 T 200 20 T 300 28"
              fill="none"
              stroke="rgba(147, 197, 253, 0.75)"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            {/* Wave 2: Yellow/Amber wave */}
            <path
              d="M 0 20 Q 60 38 120 18 T 220 32 T 300 15"
              fill="none"
              stroke="rgba(253, 224, 71, 0.85)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Wave 3: White translucent wave */}
            <path
              d="M 0 25 Q 70 8 140 28 T 240 12 T 300 22"
              fill="none"
              stroke="rgba(255, 255, 255, 0.95)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Bottom 3-Metric Breakdown */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/20 z-10 text-center">
          <div>
            <div className="text-[10px] text-white/75 font-medium uppercase">Críticas</div>
            <div className="text-sm font-bold mt-0.5">%{pctCriticas}</div>
          </div>
          <div>
            <div className="text-[10px] text-white/75 font-medium uppercase">Altas</div>
            <div className="text-sm font-bold mt-0.5">%{pctAltas}</div>
          </div>
          <div>
            <div className="text-[10px] text-white/75 font-medium uppercase">Normales</div>
            <div className="text-sm font-bold mt-0.5">%{pctNormales}</div>
          </div>
        </div>
      </div>

      {/* 2. DONUT / GAUGE CARD ("Pending Messages / Solicitudes en Riesgo") */}
      <div className="lg:col-span-4 bg-white rounded-3xl p-6 shadow-soft border border-slate-100 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">
            Riesgo de Vencimiento
          </span>
          <button className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 my-auto py-2">
          {/* Main metric */}
          <div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {formatCompact(kpis.solicitudes_vencidas || 420)}
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Tickets en riesgo SLA
            </p>

            {/* Legend items */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF5E7E]" />
                <span className="text-[11px] font-bold text-slate-700">
                  %{tasaVencimiento} Vencidas
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                <span className="text-[11px] font-bold text-slate-700">
                  %{(100 - tasaVencimiento).toFixed(1)} A Tiempo
                </span>
              </div>
            </div>
          </div>

          {/* Donut graphic with center cross marker */}
          <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#F1F5F9"
                strokeWidth="11"
              />
              {/* Segment 1: Navy / Dark circle segment */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#101420"
                strokeWidth="11"
                strokeDasharray={`${(100 - tasaVencimiento) * 2.38} 300`}
                strokeDashoffset="0"
                strokeLinecap="round"
              />
              {/* Segment 2: Coral segment */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#FF5E7E"
                strokeWidth="11"
                strokeDasharray={`${tasaVencimiento * 2.38} 300`}
                strokeDashoffset={`-${(100 - tasaVencimiento) * 2.38}`}
                strokeLinecap="round"
              />
              {/* Segment 3: Accent yellow tip */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="#FBBF24"
                strokeWidth="11"
                strokeDasharray="18 300"
                strokeDashoffset="12"
                strokeLinecap="round"
              />
            </svg>

            {/* Center 3D-effect decorative marker like in the screenshot */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-7 h-7 rounded-lg bg-[#FF7A59] shadow-md shadow-coral-500/30 flex items-center justify-center text-white font-black text-sm transform rotate-45">
                +
              </div>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-3">
          Tasa calculada sobre {kpis.total_solicitudes?.toLocaleString()} solicitudes
        </div>
      </div>

      {/* 3. RIGHT COMPACT STAT PILLS (Comments & Links Shared style from reference) */}
      <div className="lg:col-span-3 flex flex-col justify-between gap-4">
        
        {/* Top Mini Card: Cumplimiento SLA */}
        <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-100 flex-1 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {slaCumplimiento}%
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-slate-500 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Cumplimiento SLA</span>
              </div>
            </div>
            <div className="p-2 rounded-2xl bg-rose-50 text-[#FF5E7E]">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>

          {/* Coral progress pill */}
          <div className="mt-3">
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-[#FF7A59] to-[#FF5E7E] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(slaCumplimiento, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Bottom Mini Card: Satisfacción CSAT / Tiempo Promedio */}
        <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-100 flex-1 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {csat} / 5.0
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 text-slate-500 text-xs font-semibold">
                <ThumbsUp className="w-3.5 h-3.5 text-[#101420]" />
                <span>Satisfacción CSAT</span>
              </div>
            </div>
            <div className="p-2 rounded-2xl bg-slate-100 text-[#101420]">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
          </div>

          {/* Dark progress pill like the screenshot */}
          <div className="mt-3">
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-[#101420] rounded-full transition-all duration-500"
                style={{ width: `${(csat / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
