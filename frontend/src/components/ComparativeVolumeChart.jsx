import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { BarChart3, TrendingUp, Layers, Sparkles, MoreHorizontal } from 'lucide-react';

export default function ComparativeVolumeChart({ historicalMonthly = [], predictions = null }) {
  const [chartType, setChartType] = useState('comparative'); // 'comparative' | 'breakdown'

  // Preparar dataset unificado
  const combinedData = [];

  // 1. Agregar datos históricos
  historicalMonthly.forEach((h) => {
    combinedData.push({
      periodo: h.periodo,
      tipo: 'Histórico',
      total_historico: h.total,
      total_prediccion: null,
      cerradas: h.cerradas,
      vencidas: h.vencidas,
      abiertas: h.abiertas,
      tiempo_prom: h.tiempo_prom
    });
  });

  // Conectar con punto de predicción
  const lastHist = historicalMonthly[historicalMonthly.length - 1];

  // 2. Agregar predicción
  if (predictions?.predicciones_mensuales) {
    if (lastHist) {
      combinedData[combinedData.length - 1].total_prediccion = lastHist.total;
    }

    predictions.predicciones_mensuales.forEach((p) => {
      combinedData.push({
        periodo: `${p.periodo} (IA)`,
        tipo: 'Predicción',
        total_historico: null,
        total_prediccion: p.total_solicitudes,
        cerradas: p.cerradas_estimadas,
        vencidas: p.vencidas_estimadas,
        abiertas: p.abiertas_estimadas,
        tiempo_prom: p.tiempo_promedio_horas
      });
    });
  }

  // Custom Tooltip with modern soft white styling
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isPrediction = data.tipo === 'Predicción';
      return (
        <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-xl text-xs space-y-1.5 z-30">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-1.5 font-bold text-slate-900">
            <span>{label}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              isPrediction ? 'bg-rose-50 text-[#FF5E7E]' : 'bg-slate-100 text-slate-700'
            }`}>
              {data.tipo}
            </span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Volumen Total:</span>
            <span className="font-extrabold text-slate-900">
              {(data.total_prediccion || data.total_historico)?.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-emerald-600 font-medium">Cerradas:</span>
            <span className="font-bold text-slate-700">{data.cerradas}</span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-rose-500 font-medium">Vencidas:</span>
            <span className="font-bold text-slate-700">{data.vencidas}</span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-indigo-600 font-medium">Abiertas:</span>
            <span className="font-bold text-slate-700">{data.abiertas}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-soft border border-slate-100 space-y-4">
      
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Tendencia Histórica y Proyección Predictiva IA
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-[#FF5E7E] text-[10px] font-bold">
              Random Forest
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Volumen mensual analizado y proyección con Machine Learning.
          </p>
        </div>

        {/* Chart View Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => setChartType('comparative')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              chartType === 'comparative'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Volumen & IA</span>
          </button>

          <button
            onClick={() => setChartType('breakdown')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              chartType === 'breakdown'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Desglose Estado</span>
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'comparative' ? (
            <AreaChart data={combinedData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorHist" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#101420" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#101420" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF5E7E" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#FF5E7E" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="periodo" stroke="#94A3B8" tick={{ fontSize: 11 }} />
              <YAxis stroke="#94A3B8" tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="total_historico"
                name="Histórico"
                stroke="#101420"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorHist)"
              />
              <Area
                type="monotone"
                dataKey="total_prediccion"
                name="Predicción IA"
                stroke="#FF5E7E"
                strokeWidth={3}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#colorPred)"
              />
            </AreaChart>
          ) : (
            <BarChart data={combinedData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="periodo" stroke="#94A3B8" tick={{ fontSize: 11 }} />
              <YAxis stroke="#94A3B8" tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="cerradas" name="Cerradas" fill="#10B981" radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="vencidas" name="Vencidas" fill="#FF5E7E" radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="abiertas" name="Abiertas" fill="#3B82F6" radius={[4, 4, 0, 0]} stackId="a" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#101420]" />
            <span className="font-semibold text-slate-700">Demanda Real Registrada</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#FF5E7E]" />
            <span className="font-semibold text-slate-700">Proyección Estimada con ML</span>
          </div>
        </div>
        <span className="text-[11px] text-slate-400">
          Horizonte predictivo adaptativo
        </span>
      </div>

    </div>
  );
}
