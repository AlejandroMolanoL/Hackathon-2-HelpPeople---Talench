import React from 'react';
import {
  Search,
  ChevronDown,
  Plus,
  Maximize2,
  Bell,
  RefreshCw,
  Database,
  Sparkles,
  ShieldCheck,
  BarChart3
} from 'lucide-react';

export default function Header({
  dbStatus,
  onRefresh,
  loading,
  onNewAction,
  activeTab,
  setActiveTab
}) {
  return (
    <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6">
      
      {/* Title & Brand Context */}
      <div className="flex items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1
              onClick={() => setActiveTab && setActiveTab('analytics')}
              className="text-3xl font-extrabold tracking-tight text-slate-900 cursor-pointer hover:text-[#FF5E7E] transition flex items-center gap-2"
              title="Ir al Módulo de Analytics"
            >
              <span>Analytics</span>
              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white text-slate-600 border border-slate-200/80 shadow-sm">
                SLA Intelligence
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Predicción y Gestión Inteligente de Solicitudes • HelpPeople AI
          </p>
        </div>
      </div>

      {/* Middle & Right Controls (Company Selector, Search, Actions) */}
      <div className="flex flex-wrap items-center gap-3">
        
        {/* Company / Portal Dropdown Pill */}
        <div className="relative inline-flex items-center">
          <button
            onClick={() => setActiveTab && setActiveTab('analytics')}
            className={`flex items-center gap-2.5 border px-4 py-2 rounded-full text-xs font-semibold shadow-sm transition cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-[#101420] text-white border-[#101420]'
                : 'bg-white hover:bg-slate-50 border-slate-200/90 text-slate-700'
            }`}
            title="Abrir Módulo de Analytics"
          >
            <img
              src="/helppeople-icon.png"
              alt="helppeople"
              className="w-4 h-4 object-contain"
            />
            <span className="font-semibold">helppeople.com/analytics</span>
            <ChevronDown className={`w-3.5 h-3.5 ${activeTab === 'analytics' ? 'text-white' : 'text-slate-400'}`} />
          </button>
        </div>

        {/* Botón de acceso directo para generar estadísticas en Analytics */}
        {setActiveTab && (
          <button
            onClick={() => {
              setActiveTab('analytics');
              if (onRefresh) onRefresh();
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition shadow-sm cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-[#FF7A59] to-[#FF5E7E] text-white'
                : 'bg-white hover:bg-rose-50 text-slate-700 border border-slate-200 hover:border-rose-200'
            }`}
            title="Generar estadísticas descriptivas en Analytics"
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#FF5E7E]" />
            <span className="hidden sm:inline">Generar Estadísticas</span>
          </button>
        )}

        {/* Minimalist Search Pill */}
        <div className="relative flex-1 sm:w-56">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tickets..."
            className="w-full bg-white border border-slate-200/90 rounded-full pl-9 pr-4 py-2 text-xs text-slate-700 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF5E7E]/30 focus:border-[#FF5E7E] transition"
          />
        </div>

        {/* Primary Dark CTA Button (like "New Company" in the screenshot) */}
        <button
          onClick={onNewAction || onRefresh}
          className="flex items-center gap-2 bg-[#101420] hover:bg-slate-800 text-white px-5 py-2 rounded-full text-xs font-semibold shadow-md transition active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nueva Solicitud</span>
        </button>

        {/* Database Status Mini Pill */}
        <div
          title={dbStatus?.server ? `Conectado a ${dbStatus.server}` : "Verificando base de datos"}
          className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border shadow-sm ${
            dbStatus?.is_sql_server
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}
        >
          <Database className="w-3 h-3" />
          <span className="max-w-[100px] truncate">{dbStatus?.server || "SQL Server"}</span>
          <span className={`w-1.5 h-1.5 rounded-full ${dbStatus?.is_sql_server ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
        </div>

        {/* Action Icon Buttons (Refresh, Fullscreen, Notification Bell with red badge) */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            title="Recargar datos"
            className="p-2 rounded-full bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-600 shadow-sm transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#FF5E7E]' : ''}`} />
          </button>

          <button
            title="Pantalla completa"
            className="p-2 rounded-full bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-600 shadow-sm transition"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <button
            title="Notificaciones"
            className="relative p-2 rounded-full bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-600 shadow-sm transition"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#FF4757] text-white font-bold text-[9px] flex items-center justify-center rounded-full">
              6
            </span>
          </button>
        </div>

      </div>

    </header>
  );
}
