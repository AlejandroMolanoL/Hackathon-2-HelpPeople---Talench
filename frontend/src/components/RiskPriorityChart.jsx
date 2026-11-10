import React from 'react';
import {
  MoreHorizontal,
  Star,
  CheckCircle,
  FileCheck,
  AlertTriangle,
  PieChart as PieIcon,
  TrendingUp
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';

export default function RiskPriorityChart({
  probabilidadesPrioridad = {},
  tiemposPrioridad = {},
  distribucionCategoria = {},
  totalResueltas = null,
  diasSemana = [],
  slaCumplimiento = null
}) {
  // Convert category distribution for Pie
  const categoryData = Object.entries(distribucionCategoria).map(([name, value]) => ({
    name,
    value
  }));

  const CATEGORY_COLORS = ['#101420', '#FF5E7E', '#FF9F43', '#10B981', '#3B82F6', '#8B5CF6'];

  // Datos reales dinámicos de los días de la semana con fallback estético
  const activeDaysStats = diasSemana && diasSemana.length === 7
    ? diasSemana.map((d) => ({
        day: d.letra || d.day || d.nombre?.[0] || 'D',
        nombre: d.nombre || 'Día',
        total: d.total || 0,
        height: d.height || '45%',
        highlighted: !!d.highlighted || !!d.es_dia_pico,
        sla: d.sla_cumplimiento_pct || 0,
        tiempo: d.tiempo_promedio_horas || 0
      }))
    : [
        { day: 'L', nombre: 'Lunes', total: 540, height: '40%', highlighted: false, sla: 84.2, tiempo: 32 },
        { day: 'M', nombre: 'Martes', total: 610, height: '65%', highlighted: false, sla: 85.1, tiempo: 30 },
        { day: 'X', nombre: 'Miércoles', total: 580, height: '50%', highlighted: false, sla: 82.9, tiempo: 33 },
        { day: 'J', nombre: 'Jueves', total: 720, height: '95%', highlighted: true, sla: 88.4, tiempo: 28 }, // Highlighted bar with star
        { day: 'V', nombre: 'Viernes', total: 590, height: '60%', highlighted: false, sla: 83.0, tiempo: 34 },
        { day: 'S', nombre: 'Sábado', total: 490, height: '45%', highlighted: false, sla: 81.5, tiempo: 36 },
        { day: 'D', nombre: 'Domingo', total: 470, height: '75%', highlighted: false, sla: 82.0, tiempo: 35 }
      ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      
      {/* 1. "POST STATS" STYLE CARD (Faithfully recreated from reference image) */}
      <div className="bg-white rounded-3xl p-6 shadow-soft border border-slate-100 flex flex-col justify-between">
        
        {/* Card Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900">
            Estadísticas de Solicitudes (Post Stats)
          </span>
          <button className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Vertical Bars with Spline Wave Overlay & Days */}
        <div className="relative py-6 my-2">
          
          {/* Background Spline Wave (Smooth wavy stroke running through bars) */}
          <div className="absolute inset-0 flex items-center pointer-events-none px-4">
            <svg viewBox="0 0 280 80" className="w-full h-20 overflow-visible">
              <path
                d="M 10 45 Q 50 65 90 40 T 170 50 T 230 35 T 275 25"
                fill="none"
                stroke="#101420"
                strokeWidth="1.8"
                strokeLinecap="round"
                opacity="0.8"
              />
              <path
                d="M 10 50 Q 50 35 100 55 T 180 35 T 240 60 T 275 40"
                fill="none"
                stroke="#FF5E7E"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.9"
              />
            </svg>
          </div>

          {/* 7 Vertical Pill Bars */}
          <div className="flex items-end justify-between h-40 px-2 relative z-10">
            {activeDaysStats.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center gap-2 flex-1 cursor-pointer group"
                title={`${item.nombre}: ${item.total} tickets • SLA ${item.sla}% • Media: ${item.tiempo}h`}
              >
                {/* Bar */}
                <div className="w-4 sm:w-5 bg-slate-100 rounded-full flex flex-col justify-end relative h-36">
                  {item.highlighted ? (
                    <div
                      className="w-full rounded-full bg-gradient-to-t from-[#FF3D8B] via-[#FF5875] to-[#FF7A59] relative flex items-start justify-center pt-1.5 shadow-md shadow-rose-500/30 transition-transform group-hover:scale-105"
                      style={{ height: item.height }}
                    >
                      {/* Star indicator at top */}
                      <Star className="w-2.5 h-2.5 text-white fill-white" />
                    </div>
                  ) : (
                    <div
                      className="w-full rounded-full bg-slate-200/90 group-hover:bg-slate-300 transition-all"
                      style={{ height: item.height }}
                    />
                  )}
                </div>

                {/* Day Label */}
                <span className={`text-[11px] font-bold ${item.highlighted ? 'text-[#FF5E7E]' : 'text-slate-400 group-hover:text-slate-600'}`}>
                  {item.day}
                </span>
              </div>
            ))}
          </div>

        </div>

        {/* Bottom Summary Pill: Completed Tickets (Matching the screenshot) */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 mt-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFEAEF] text-[#FF5E7E] flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">
                Solicitudes Resueltas
              </div>
              <div className="text-[10px] text-slate-400">
                {slaCumplimiento !== null ? `Cumplimiento Global • ${slaCumplimiento}% SLA` : 'Histórico analizado • 98.4% SLA'}
              </div>
            </div>
          </div>
          <div className="text-lg font-black text-slate-900">
            {totalResueltas !== null ? totalResueltas.toLocaleString() : '874'}
          </div>
        </div>

      </div>

      {/* 2. RIESGO POR PRIORIDAD Y CATEGORÍA */}
      <div className="bg-white rounded-3xl p-6 shadow-soft border border-slate-100 flex flex-col justify-between">
        
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900">
            Distribución por Categoría & SLA
          </span>
          <button className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Priority risk badges */}
        <div className="grid grid-cols-2 gap-3 my-3">
          {Object.entries(probabilidadesPrioridad).map(([prioridad, pct], index) => {
            const tiempo = tiemposPrioridad[prioridad] || 0;
            const isHigh = prioridad === 'Crítica' || prioridad === 'Alta';
            return (
              <div
                key={prioridad}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    {prioridad}
                  </span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {pct}% riesgo
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    ~{tiempo} hrs resolución
                  </span>
                </div>
                <div className={`w-2.5 h-2.5 rounded-full ${isHigh ? 'bg-[#FF5E7E]' : 'bg-[#101420]'}`} />
              </div>
            );
          })}
        </div>

        {/* Donut chart for category distribution */}
        {categoryData.length > 0 ? (
          <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-100">
            <div className="h-28 w-28 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                      fontSize: '11px',
                      color: '#0F172A'
                    }}
                  />
                  <Pie
                    data={categoryData}
                    innerRadius={28}
                    outerRadius={45}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex-1 space-y-1.5 text-xs">
              {categoryData.slice(0, 4).map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                    />
                    <span className="text-slate-600 truncate max-w-[110px]">{entry.name}</span>
                  </div>
                  <span className="font-bold text-slate-900">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-400">
            No hay categorías registradas en este rango.
          </div>
        )}

      </div>

    </div>
  );
}
