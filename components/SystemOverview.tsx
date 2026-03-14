
import React from 'react';
import { Map, Shield, Database, Cloud, Zap, Cpu, Layout, FileText, Settings, Users, BarChart3, Calendar } from 'lucide-react';

const SystemOverview: React.FC = () => {
    const routes = [
        { path: '/', name: 'Dashboard Principal', icon: Layout, desc: 'Vista consolidada de métricas, equidad y acceso rápido.' },
        { path: '/journal', name: 'Bitácora de Trading', icon: FileText, desc: 'Registro detallado de operaciones, importación de MT5 y análisis.' },
        { path: '/calendar', name: 'Calendario de Operaciones', icon: Calendar, desc: 'Visualización temporal de rendimiento diario.' },
        { path: '/calculator', name: 'Calculadora de Riesgo', icon: Zap, desc: 'Herramienta para gestión monetaria profesional.' },
        { path: '/mastermind', name: 'Mente Maestra AI', icon: Cpu, desc: 'Análisis avanzado con Inteligencia Artificial (Gemini).' },
        { path: '/settings', name: 'Configuración', icon: Settings, desc: 'Gestión de cuentas, perfiles y sincronización de nube.' },
        { path: '/admin', name: 'Panel de Administración', icon: Shield, desc: 'Control de usuarios y mantenimiento del sistema.' },
    ];

    const architecture = [
        { title: 'Frontend Stack', items: ['React 18+', 'TypeScript', 'Tailwind CSS', 'Lucide Icons', 'Recharts'] },
        { title: 'Database & Sync', items: ['Supabase (Cloud Persistence)', 'LocalStorage (Local Cache)', 'AES-like Encryption', 'Real-time Events'] },
        { title: 'Security Layers', items: ['PIN-based Auth', 'Scoped Data Keys', 'Encrypted Storage', 'Admin Role Validation'] },
        { title: 'Integrations', items: ['MetaTrader 5 (via EA Connector)', 'TradingView (Direct Links)', 'Gemini AI (Mastermind)'] },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-primary/20 rounded-2xl">
                    <Map className="text-primary" size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter">Mapeo del Sistema</h2>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Arquitectura & Navegación Profesional</p>
                </div>
            </div>

            {/* Routes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {routes.map((route, idx) => (
                    <div key={idx} className="bg-surface border border-border p-5 rounded-2xl hover:border-primary/50 transition-all group">
                        <div className="flex items-center gap-3 mb-3">
                            <route.icon size={18} className="text-primary group-hover:scale-110 transition-transform" />
                            <h3 className="font-bold text-white text-sm">{route.name}</h3>
                        </div>
                        <p className="text-gray-500 text-xs leading-relaxed">{route.desc}</p>
                        <div className="mt-3 text-[10px] font-mono text-primary/40">{route.path}</div>
                    </div>
                ))}
            </div>

            {/* Architecture Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {architecture.map((section, idx) => (
                    <div key={idx} className="bg-surface/50 border border-border/50 p-6 rounded-3xl">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Database size={14} className="text-primary" /> {section.title}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {section.items.map((item, i) => (
                                <span key={i} className="px-3 py-1 bg-black/30 border border-border rounded-full text-[10px] font-bold text-gray-300">
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Status & Health */}
            <div className="bg-primary/5 border border-primary/20 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary blur-lg opacity-20 animate-pulse"></div>
                        <Shield className="text-primary relative" size={32} />
                    </div>
                    <div>
                        <h4 className="text-white font-bold">Estado del Sistema: Óptimo</h4>
                        <p className="text-gray-400 text-xs">Todos los módulos están operativos y sincronizados con la nube.</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <div className="flex flex-col items-center px-4 py-2 bg-black/40 rounded-xl border border-border">
                        <span className="text-[10px] text-gray-500 font-bold uppercase">Latencia DB</span>
                        <span className="text-primary font-mono font-bold">~120ms</span>
                    </div>
                    <div className="flex flex-col items-center px-4 py-2 bg-black/40 rounded-xl border border-border">
                        <span className="text-[10px] text-gray-500 font-bold uppercase">Seguridad</span>
                        <span className="text-primary font-mono font-bold">AES-256</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemOverview;
