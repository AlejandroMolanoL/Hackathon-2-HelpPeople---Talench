import React from 'react';
import {
  LayoutDashboard,
  BrainCircuit,
  Lightbulb,
  Database,
  Calendar,
  Globe,
  Settings,
  Bell,
  LogOut,
  Sparkles,
  BarChart3,
  Flame
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, dbStatus }) {
  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard & Predicciones' },
    { id: 'analytics', icon: BarChart3, label: 'Módulo Analytics & Estadísticas' },
    { id: 'recommendations', icon: Lightbulb, label: 'Recomendaciones IA' },
    { id: 'tickets', icon: Database, label: 'Explorador Solicitudes' },
    { id: 'calendar', icon: Calendar, label: 'Planificación SLA' },
  ];

  return (
    <aside className="fixed left-2 sm:left-3 md:left-4 top-2 sm:top-3 md:top-4 bottom-2 sm:bottom-3 md:bottom-4 w-20 md:w-24 bg-[#101420] text-slate-300 flex flex-col items-center py-5 justify-between select-none shrink-0 z-40 overflow-hidden rounded-[24px] sm:rounded-[32px] shadow-2xl">
      {/* Brand Logo (Fixed Top) */}
      <div className="flex flex-col items-center gap-1.5 shrink-0 px-1">
        <button
          onClick={() => setActiveTab('dashboard')}
          className="relative group flex flex-col items-center p-1 focus:outline-none"
          title="HelpPeople AI Analytics"
        >
          <div className="w-12 h-12 md:w-13 md:h-13 rounded-2xl bg-white flex items-center justify-center shadow-md p-2 transform group-hover:scale-105 group-hover:shadow-lg transition-all duration-300">
            <img
              src="/helppeople-icon.png"
              alt="helppeople logo"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-[10px] font-bold text-white/90 tracking-tight mt-1 hidden md:block select-none">
            helppeople
          </span>
        </button>
      </div>

      {/* Navigation Icons Stack (Fixed Center, no vertical scroll) */}
      <nav className="flex flex-col items-center gap-2 sm:gap-2.5 my-auto shrink-0">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={item.label}
              className={`relative flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-2xl transition-all duration-200 group ${
                isActive
                  ? 'bg-[#21283B] text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />

              {/* Active Indicator dot like screenshot */}
              {isActive && (
                <span className="absolute -right-1 w-1.5 h-1.5 rounded-full bg-white shadow-sm shadow-white/50" />
              )}
            </button>
          );
        })}

        {/* Separator */}
        <div className="w-6 h-px bg-slate-800/80 my-0.5" />

        <button
          onClick={() => setActiveTab('dashboard')}
          title="Configuración"
          className="flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-2xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition duration-200"
        >
          <Settings className="w-5 h-5" />
        </button>
      </nav>

      {/* Decorative 3D-effect Element & User Profile at bottom (Fixed Bottom) */}
      <div className="flex flex-col items-center gap-3 shrink-0">
        {/* Soft 3D Torus / Swirl illustration just like the image */}
        <div className="relative group cursor-pointer">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-2xl bg-gradient-to-tr from-[#FFA07A] via-[#FF5E7E] to-[#A259FF] opacity-90 p-1 flex items-center justify-center shadow-lg shadow-coral-500/20 transform group-hover:rotate-12 transition duration-300">
            <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-white animate-pulse" />
          </div>
        </div>

        {/* User Avatar with notification badge count "6" */}
        <div className="relative cursor-pointer">
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl overflow-hidden ring-2 ring-slate-700/60 p-0.5 bg-slate-800 shadow">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
              alt="Usuario HelpPeople"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          {/* Red notification badge "6" */}
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF4757] text-white font-bold text-[9px] flex items-center justify-center rounded-full ring-2 ring-[#101420]">
            6
          </span>
        </div>

        {/* Logout / expand icon */}
        <button
          className="text-slate-500 hover:text-slate-300 transition p-1"
          title="Cerrar sesión / Salir"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}

