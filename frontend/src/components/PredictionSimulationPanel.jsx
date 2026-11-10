import React from 'react';
import { Sliders, Sparkles, Brain, Cpu, TrendingUp, AlertTriangle, Clock } from 'lucide-react';

export default function PredictionSimulationPanel({
  filterOptions,
  simulationParams,
  onChangeParam,
  predictions,
  loading
}) {
  const metrics = predictions?.metricas_modelo;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-soft border border-slate-100 space-y-6">
      
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-rose-50 text-[#FF5E7E]">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Simulador Predictivo con Machine Learning
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                Tiempo Real
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Ajusta los parámetros para recalcular las proyecciones futuras con Random Forest y Regresión Lineal.
            </p>
          </div>
        </div>

        {/* Model Accuracy Badge */}
        {metrics?.volumen && (
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200/80 text-xs">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-medium">Precisión Modelo (R²)</div>
              <div className="font-extrabold text-slate-900">
                {(metrics.volumen.r2_rf * 100).toFixed(1)}% (RF) • Margen: ±{metrics.volumen.margen_error_pct}%
              </div>
            </div>
            <Brain className="w-4 h-4 text-[#FF5E7E]" />
          </div>
        )}
      </div>

      {/* Control Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Meses a proyectar */}
        <div className="space-y-2.5 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
          <div className="flex justify-between items-center text-xs">
            <label className="font-bold text-slate-700">Horizonte de Proyección:</label>
            <span className="px-2.5 py-0.5 rounded-full bg-[#101420] text-white text-[11px] font-bold">
              {simulationParams.months_ahead} {simulationParams.months_ahead === 1 ? 'Mes' : 'Meses'}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="12"
            step="1"
            value={simulationParams.months_ahead}
            onChange={(e) => onChangeParam('months_ahead', parseInt(e.target.value))}
            className="w-full accent-[#FF5E7E] cursor-pointer h-2 bg-slate-200 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-medium">
            <span>1 mes</span>
            <span>3 meses</span>
            <span>6 meses</span>
            <span>12 meses</span>
          </div>
        </div>

        {/* Filtro de Prioridad */}
        <div className="space-y-2 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
          <label className="block text-xs font-bold text-slate-700">
            Escenario por Prioridad:
          </label>
          <select
            value={simulationParams.prioridad}
            onChange={(e) => onChangeParam('prioridad', e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#FF5E7E] font-medium cursor-pointer"
          >
            {(filterOptions?.prioridades || ['Todas', 'Crítica', 'Alta', 'Media', 'Baja']).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <p className="text-[10px] text-slate-400">
            Filtra probabilidad y tiempos proyectados según severidad.
          </p>
        </div>

        {/* Filtro de Categoría */}
        <div className="space-y-2 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
          <label className="block text-xs font-bold text-slate-700">
            Escenario por Categoría:
          </label>
          <select
            value={simulationParams.categoria}
            onChange={(e) => onChangeParam('categoria', e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#FF5E7E] font-medium cursor-pointer"
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
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <p className="text-[10px] text-slate-400">
            Ajusta el impacto según la naturaleza del requerimiento.
          </p>
        </div>

      </div>

      {/* Real-time Predictive Summary Cards */}
      {predictions && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100">
          
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 font-semibold block">Volumen Proyectado</span>
              <span className="text-xl font-extrabold text-slate-900">
                {predictions.predicciones_mensuales?.reduce((acc, m) => acc + m.total_solicitudes, 0).toLocaleString()} tickets
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                ~{Math.round(predictions.predicciones_mensuales?.reduce((acc, m) => acc + m.total_solicitudes, 0) / simulationParams.months_ahead)} tickets / mes
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-white shadow-sm text-[#101420]">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-rose-50/60 rounded-2xl p-4 border border-rose-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-rose-500 font-semibold block">Riesgo Vencimiento Estimado</span>
              <span className="text-xl font-extrabold text-rose-600">
                {predictions.porcentaje_vencidas_estimado}%
              </span>
              <span className="text-[10px] text-rose-500/80 block mt-0.5">
                {predictions.predicciones_mensuales?.reduce((acc, m) => acc + m.vencidas_estimadas, 0)} tickets en riesgo
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-white shadow-sm text-rose-500">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-emerald-600 font-semibold block">Tiempo Estimado Resolución</span>
              <span className="text-xl font-extrabold text-emerald-700">
                {predictions.tiempo_promedio_estimado_horas} hrs
              </span>
              <span className="text-[10px] text-emerald-600/80 block mt-0.5">
                ~{(predictions.tiempo_promedio_estimado_horas / 24).toFixed(1)} días por caso
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-white shadow-sm text-emerald-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
