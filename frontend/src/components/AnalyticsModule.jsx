import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Download,
  RefreshCw,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Building2,
  Radio,
  Star,
  Activity,
  Zap,
  HelpCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
  Legend
} from 'recharts';

export default function AnalyticsModule({
  historicalData,
  onRefresh,
  loading = false,
  filterOptions = null,
  filters = null
}) {
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'channels' | 'departments' | 'percentiles'

  const detailedStats = historicalData?.estadisticas_detalladas;
  const diasSemana = detailedStats?.dias_semana || historicalData?.distribucion_dia_semana || [];
  const canales = detailedStats?.canales || historicalData?.distribucion_canal || [];
  const departamentos = detailedStats?.departamentos || historicalData?.distribucion_departamento || [];
  const tiempos = detailedStats?.tiempos_resolucion || historicalData?.estadisticas_tiempos || {};
  const kpis = historicalData?.kpis_generales || {};

  const totalSolicitudes = detailedStats?.total_analizadas || kpis.total_solicitudes || 0;
  const slaPct = detailedStats?.tasa_cumplimiento_pct || kpis.sla_cumplimiento_pct || 0;
  const vencidasPct = detailedStats?.tasa_vencimiento_pct || kpis.tasa_vencimiento_pct || 0;
  const rapidaPct = detailedStats?.resolucion_rapida_menor_4h_pct || 0;

  // Manejar acción "Generar Estadísticas"
  const handleGenerateStats = async () => {
    setGenerating(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
    } finally {
      setTimeout(() => setGenerating(false), 500);
    }
  };

  // Exportar reporte de estadísticas en formato JSON
  const handleExportJSON = () => {
    const reportData = {
      fecha_generacion: new Date().toISOString(),
      modulo: "Analytics HelpPeople SLA",
      filtros_aplicados: filters || {},
      resumen_kpis: {
        total_solicitudes: totalSolicitudes,
        cumplimiento_sla_pct: slaPct,
        tasa_vencimiento_pct: vencidasPct,
        resolucion_rapida_4h_pct: rapidaPct,
      },
      momentos_estadisticos_tiempo_horas: tiempos,
      distribucion_dias_semana: diasSemana,
      rendimiento_canales: canales,
      rendimiento_departamentos: departamentos,
      resumen_ejecutivo: detailedStats?.resumen_ejecutivo || ""
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `helppeople_estadisticas_analytics_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Exportar reporte en formato CSV (Canales & Departamentos)
  const handleExportCSV = () => {
    let csv = "Tipo,Entidad,Total_Solicitudes,SLA_Cumplimiento_Pct,Tiempo_Promedio_Horas\n";
    canales.forEach((c) => {
      csv += `Canal,"${c.canal}",${c.total},${c.sla_cumplimiento_pct},${c.tiempo_promedio_horas}\n`;
    });
    departamentos.forEach((d) => {
      csv += `Departamento,"${d.departamento}",${d.total},${d.sla_cumplimiento_pct},${d.tiempo_promedio_horas}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `helppeople_estadisticas_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* 1. TOP HERO BAR: GENERADOR DE ESTADÍSTICAS */}
      <div className="bg-gradient-to-r from-[#101420] via-[#1A2238] to-[#101420] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Glow decorative orbs */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-[#FF5E7E]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#3B82F6]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[#FF5E7E] text-xs font-bold border border-white/10">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Módulo Analytics • Motor Estadístico</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Generación de Estadísticas Descriptivas & SLA
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Cálculo cuantitativo en tiempo real sobre la base de solicitudes históricas. Mide distribución temporal, tiempos de respuesta (P50 a P95), comportamiento de canales y cuellos de botella departamentales.
            </p>
          </div>

          {/* Action CTAs: Generar Estadísticas & Exportar */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleGenerateStats}
              disabled={loading || generating}
              className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-gradient-to-r from-[#FF7A59] via-[#FF5875] to-[#FF3D8B] hover:opacity-95 text-white font-bold text-xs shadow-coral transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${generating || loading ? 'animate-spin' : ''}`} />
              <span>{generating || loading ? 'Generando Estadísticas...' : '📊 Generar Estadísticas'}</span>
            </button>

            <div className="relative group">
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-2 px-4 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs transition active:scale-95 cursor-pointer"
                title="Descargar reporte estadístico JSON"
              >
                <Download className="w-4 h-4 text-[#FF5E7E]" />
                <span>Exportar JSON</span>
              </button>
            </div>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs transition active:scale-95 cursor-pointer"
              title="Descargar matriz en CSV"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Exportar CSV</span>
            </button>
          </div>

        </div>

        {/* Dynamic AI Executive Summary Banner */}
        {detailedStats?.resumen_ejecutivo && (
          <div className="mt-6 pt-5 border-t border-white/10 flex items-start gap-3 text-xs text-slate-200">
            <Sparkles className="w-4 h-4 text-[#FBBF24] shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-1">
              <span className="font-bold text-white uppercase text-[10px] tracking-wider">Conclusión Analítica:</span>
              <p className="text-slate-300 font-normal leading-relaxed">{detailedStats.resumen_ejecutivo}</p>
            </div>
          </div>
        )}

      </div>

      {/* 2. STATISTICAL CARDS ROW (4 Metric Cards with Descriptive Indicators) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Mediana de Resolución */}
        <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Mediana de Resolución</span>
            <div className="p-2 rounded-2xl bg-indigo-50 text-indigo-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {tiempos.mediana_horas || 0} <span className="text-base font-semibold text-slate-400">hrs</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Media aritmética: <span className="font-bold text-slate-700">{tiempos.media_horas || 0} hrs</span>
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Rango IQR (P25 - P75)</span>
            <span className="font-bold text-slate-700">{tiempos.rango_intercuartil_iqr || 0} hrs</span>
          </div>
        </div>

        {/* Card 2: Percentil 95 (Casos Críticos / Cola Larga) */}
        <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Percentil 95 (P95)</span>
            <div className="p-2 rounded-2xl bg-rose-50 text-[#FF5E7E]">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-3xl font-extrabold text-[#FF5E7E] tracking-tight">
              {tiempos.p95_horas || 0} <span className="text-base font-semibold text-slate-400">hrs</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Desviación estándar: <span className="font-bold text-slate-700">±{tiempos.desviacion_estandar_horas || 0} hrs</span>
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
            <span>95% resuelto antes de</span>
            <span className="font-bold text-slate-700">{tiempos.p95_horas || 0} hrs</span>
          </div>
        </div>

        {/* Card 3: Resolución Rápida (<4 Horas) */}
        <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Resolución Ágil (&lt;4h)</span>
            <div className="p-2 rounded-2xl bg-emerald-50 text-emerald-600">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-3xl font-extrabold text-emerald-600 tracking-tight">
              {rapidaPct}%
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Resueltas en primer contacto o &le; 4 horas
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Mínimo registrado</span>
            <span className="font-bold text-emerald-600">{tiempos.minimo_horas || 0} hrs</span>
          </div>
        </div>

        {/* Card 4: Cumplimiento Global SLA */}
        <div className="bg-white rounded-3xl p-5 shadow-soft border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Cumplimiento Global SLA</span>
            <div className="p-2 rounded-2xl bg-amber-50 text-amber-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="my-3">
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {slaPct}%
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Vencidas: <span className="font-bold text-rose-500">%{vencidasPct}</span>
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Base de análisis</span>
            <span className="font-bold text-slate-700">{totalSolicitudes.toLocaleString()} tickets</span>
          </div>
        </div>

      </div>

      {/* 3. SUB-NAV TABS FOR DEEP STATISTICAL DIVE */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-[#101420] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Distribución Semanal & Días Pico</span>
        </button>

        <button
          onClick={() => setActiveTab('channels')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'channels'
              ? 'bg-[#101420] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Estadísticas por Canal</span>
        </button>

        <button
          onClick={() => setActiveTab('departments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'departments'
              ? 'bg-[#101420] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Cuellos de Botella por Departamento</span>
        </button>

        <button
          onClick={() => setActiveTab('percentiles')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'percentiles'
              ? 'bg-[#101420] text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Tabla de Momentos Estadísticos</span>
        </button>
      </div>

      {/* 4. TAB CONTENTS */}

      {/* TAB A: DISTRIBUCIÓN POR DÍAS DE LA SEMANA */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 shadow-soft border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Volumen y Eficiencia por Día de la Semana
                </h3>
                <p className="text-xs text-slate-400">
                  Total de incidentes recibidos y tasa de cumplimiento SLA calculada por día
                </p>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                7 Días Analizados
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={diasSemana} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="nombre" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '16px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                      fontSize: '12px'
                    }}
                    formatter={(val, name) => [
                      val,
                      name === 'total' ? 'Total Solicitudes' : 'Resueltas'
                    ]}
                  />
                  <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                    {diasSemana.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.es_dia_pico ? '#FF5E7E' : '#101420'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#FF5E7E]" />
                <span className="font-semibold text-slate-700">Día de Pico Máximo</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#101420]" />
                <span className="font-semibold text-slate-700">Volumen Normal</span>
              </div>
            </div>
          </div>

          {/* Lateral Day Breakdown Cards */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 shadow-soft border border-slate-100 flex flex-col justify-between">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Detalle Estadístico Diario
            </h3>
            <div className="space-y-2.5 overflow-y-auto max-h-72 pr-1">
              {diasSemana.map((d) => (
                <div
                  key={d.dia_idx}
                  className={`p-3 rounded-2xl border transition flex items-center justify-between text-xs ${
                    d.es_dia_pico
                      ? 'bg-rose-50/70 border-rose-200'
                      : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {d.es_dia_pico ? (
                      <Star className="w-4 h-4 text-[#FF5E7E] fill-[#FF5E7E]" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-slate-300" />
                    )}
                    <div>
                      <span className="font-bold text-slate-800">{d.nombre}</span>
                      <span className="text-[10px] text-slate-400 block">
                        Media: {d.tiempo_promedio_horas}h resolución
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-slate-900 block">{d.total} tickets</span>
                    <span className="text-[10px] font-bold text-emerald-600">%{d.sla_cumplimiento_pct} SLA</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
              Calculado automáticamente sobre {totalSolicitudes.toLocaleString()} registros.
            </div>
          </div>

        </div>
      )}

      {/* TAB B: ESTADÍSTICAS POR CANAL */}
      {activeTab === 'channels' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {canales.map((c, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-5 shadow-soft border border-slate-100 flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-2xl bg-slate-100 text-slate-800">
                    <Radio className="w-5 h-5 text-[#FF5E7E]" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                    %{c.porcentaje_volumen} del total
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">{c.canal}</h4>
                <div className="text-2xl font-black text-slate-900 my-2">
                  {c.total.toLocaleString()} <span className="text-xs font-normal text-slate-400">tickets</span>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Cumplimiento SLA:</span>
                  <span className="font-bold text-emerald-600">%{c.sla_cumplimiento_pct}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tiempo Promedio:</span>
                  <span className="font-bold text-slate-700">{c.tiempo_promedio_horas} hrs</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Satisfacción CSAT:</span>
                  <span className="font-bold text-amber-600 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {c.satisfaccion_promedio} / 5.0
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB C: DEPARTAMENTOS SOLICITANTES */}
      {activeTab === 'departments' && (
        <div className="bg-white rounded-3xl p-6 shadow-soft border border-slate-100">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Matriz de Impacto por Departamento Solicitante
              </h3>
              <p className="text-xs text-slate-400">
                Identificación de áreas con mayor carga de tickets e índice de incumplimiento de SLA
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {departamentos.length} Departamentos
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="pb-3">Departamento</th>
                  <th className="pb-3 text-right">Volumen</th>
                  <th className="pb-3 text-right">% del Total</th>
                  <th className="pb-3 text-right">Vencidas</th>
                  <th className="pb-3 text-right">Cumplimiento SLA</th>
                  <th className="pb-3 text-right">Tiempo Promedio</th>
                  <th className="pb-3 text-center">Nivel de Riesgo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departamentos.map((d, idx) => {
                  const isHighRisk = d.sla_cumplimiento_pct < 80;
                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="py-3 font-bold text-slate-900 flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{d.departamento}</span>
                      </td>
                      <td className="py-3 text-right font-extrabold text-slate-900">
                        {d.total.toLocaleString()}
                      </td>
                      <td className="py-3 text-right text-slate-500">
                        %{d.porcentaje_volumen}
                      </td>
                      <td className="py-3 text-right font-bold text-rose-500">
                        {d.solicitudes_vencidas}
                      </td>
                      <td className="py-3 text-right font-bold text-emerald-600">
                        %{d.sla_cumplimiento_pct}
                      </td>
                      <td className="py-3 text-right text-slate-700">
                        {d.tiempo_promedio_horas} hrs
                      </td>
                      <td className="py-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isHighRisk ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {isHighRisk ? 'Atención Crítica' : 'Saludable'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB D: TABLA DE MOMENTOS ESTADÍSTICOS Y PERCENTILES */}
      {activeTab === 'percentiles' && (
        <div className="bg-white rounded-3xl p-6 shadow-soft border border-slate-100">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Distribución Estadística de Tiempos de Resolución
              </h3>
              <p className="text-xs text-slate-400">
                Momentos estadísticos, percentiles cuartílicos y análisis de dispersión en horas
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              Escala en Horas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Mínimo</span>
              <div className="text-xl font-black text-slate-900 mt-1">{tiempos.minimo_horas || 0} h</div>
              <span className="text-[10px] text-slate-400">Mejor tiempo absoluto</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100">
              <span className="text-[10px] font-bold text-indigo-500 uppercase">Percentil 25 (P25)</span>
              <div className="text-xl font-black text-indigo-900 mt-1">{tiempos.p25_horas || 0} h</div>
              <span className="text-[10px] text-indigo-400">25% más rápido</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900 text-white">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Mediana (P50)</span>
              <div className="text-xl font-black text-white mt-1">{tiempos.mediana_horas || 0} h</div>
              <span className="text-[10px] text-slate-400">Tiempo típico central</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-100">
              <span className="text-[10px] font-bold text-amber-600 uppercase">Percentil 75 (P75)</span>
              <div className="text-xl font-black text-amber-900 mt-1">{tiempos.p75_horas || 0} h</div>
              <span className="text-[10px] text-amber-500">Tercer cuartil</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-100">
              <span className="text-[10px] font-bold text-rose-500 uppercase">Percentil 95 (P95)</span>
              <div className="text-xl font-black text-rose-900 mt-1">{tiempos.p95_horas || 0} h</div>
              <span className="text-[10px] text-rose-400">Casos complejos</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-slate-400" />
              <span>
                <strong>Interpretación Estadística:</strong> La mediana de <strong>{tiempos.mediana_horas || 0} horas</strong> demuestra que el 50% de las solicitudes se resuelven rápidamente, mientras que el percentil 95 de <strong>{tiempos.p95_horas || 0} horas</strong> delimita los incidentes críticos que requieren escalamiento preferente.
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

