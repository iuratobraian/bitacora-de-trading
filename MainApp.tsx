
import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, PenTool, Settings as SettingsIcon, LogOut, Menu, Shield, Loader2, Radio, Diamond, X, Brain, Globe, Crosshair } from 'lucide-react';
import { UserSelection } from './components/UserSelection';
import { storageService } from './services/storageService';
import { Account, UserProfile } from './types';
import { RiskCalculator } from './components/RiskCalculator';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy Loading de componentes pesados para optimizar el bundle principal
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const TradeEntry = React.lazy(() => import('./components/TradeEntry'));
const Journal = React.lazy(() => import('./components/Journal'));
const Settings = React.lazy(() => import('./components/Settings'));
const AdminPanel = React.lazy(() => import('./components/AdminPanel'));

const AppLayout: React.FC<{ currentUser: UserProfile; onLogout: () => void }> = ({ currentUser, onLogout }) => {
    const location = useLocation();
    const [isJournalOpen, setIsJournalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isAdminOpen, setIsAdminOpen] = useState(false);

    const closeAllModals = () => {
        setIsJournalOpen(false);
        setIsSettingsOpen(false);
        setIsAdminOpen(false);
    };

    useEffect(() => {
        closeAllModals();
    }, [location.pathname]);

    return (
        // Fondo transparente para ver bg-animation de index.html
        <div className="min-h-screen text-white font-sans selection:bg-primary selection:text-black relative overflow-x-hidden">
            
            {/* BARRA DE NAVEGACIÓN FLOTANTE SUPERIOR */}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[80] w-full max-w-3xl px-4 flex items-center justify-center gap-3">
                <nav className="bg-surface/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-2 flex items-center gap-1 shadow-2xl shadow-black/50">
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={closeAllModals}
                            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center mr-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                        >
                            <Radio size={20} className="text-black" />
                        </button>
                        
                        <button 
                            onClick={closeAllModals}
                            className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${!isJournalOpen && !isSettingsOpen && !isAdminOpen ? 'bg-white/10 text-primary' : 'text-gray-400 hover:text-white'}`}
                        >
                            TABLERO
                        </button>
                        
                        <button 
                            onClick={() => { closeAllModals(); setIsJournalOpen(true); }}
                            className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isJournalOpen ? 'bg-white/10 text-primary' : 'text-gray-400 hover:text-white'}`}
                        >
                            BITÁCORA
                        </button>
                    </div>

                    <div className="w-px h-6 bg-white/10 mx-1"></div>

                    <div className="flex items-center gap-1">
                        {currentUser.role === 'ADMIN' && (
                            <button 
                                onClick={() => { closeAllModals(); setIsAdminOpen(true); }}
                                className={`p-2.5 rounded-full transition-all ${isAdminOpen ? 'bg-primary/20 text-primary' : 'text-gray-500 hover:text-white'}`}
                                title="Admin"
                            >
                                <Shield size={18} />
                            </button>
                        )}
                        <button 
                            onClick={() => { closeAllModals(); setIsSettingsOpen(true); }}
                            className={`p-2.5 rounded-full transition-all ${isSettingsOpen ? 'bg-primary/20 text-primary' : 'text-gray-500 hover:text-white'}`}
                            title="Ajustes"
                        >
                            <SettingsIcon size={18} />
                        </button>
                        <button 
                            onClick={onLogout}
                            className="p-2.5 rounded-full text-loss/60 hover:text-loss transition-all"
                            title="Desconectar"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </nav>

                {/* BOTÓN EXTERNO INDEPENDIENTE - MÁS SUTIL */}
                <button 
                    onClick={() => window.open('https://trade-share-theta.vercel.app/', '_blank')}
                    className="h-[40px] px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all flex items-center gap-2 group"
                >
                    <Globe size={14} className="group-hover:rotate-12 transition-transform" />
                    <span className="text-[9px] font-black uppercase tracking-widest">PORTAL</span>
                </button>
            </div>

            {/* CONTENIDO PRINCIPAL (DASHBOARD) */}
            <main className="pt-24 min-h-screen">
                 <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-primary" size={32}/></div>}>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/entry/:id" element={<TradeEntry />} />
                        <Route path="/calculator" element={
                            <div className="max-w-xl mx-auto px-4 py-10">
                                <RiskCalculator />
                            </div>
                        } />
                    </Routes>
                 </Suspense>
            </main>

            {/* CAPA FLOTANTE: BITÁCORA */}
            {isJournalOpen && (
                <div className="fixed inset-0 z-[100] animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-3xl" onClick={() => setIsJournalOpen(false)}></div>
                    <div className="relative h-full w-full overflow-y-auto custom-scrollbar p-4 md:p-10">
                        <button 
                            onClick={() => setIsJournalOpen(false)}
                            className="fixed top-10 right-10 z-[110] p-4 bg-surface border border-border rounded-full text-white hover:scale-110 transition-all shadow-2xl"
                        >
                            <X size={24} />
                        </button>
                        <div className="w-full max-w-[95%] 2xl:max-w-[2000px] mx-auto pt-10">
                            <Suspense fallback={<Loader2 className="animate-spin text-primary mx-auto mt-20" />}>
                                <Journal />
                            </Suspense>
                        </div>
                    </div>
                </div>
            )}

            {/* CAPA FLOTANTE: AJUSTES */}
            {isSettingsOpen && (
                <div className="fixed inset-0 z-[100] animate-in fade-in slide-in-from-right duration-500">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setIsSettingsOpen(false)}></div>
                    <div className="absolute right-0 top-0 h-full w-full max-w-4xl bg-surface border-l border-border shadow-2xl overflow-y-auto custom-scrollbar p-8">
                        <div className="flex justify-between items-center mb-10">
                            <h2 className="text-2xl font-black uppercase tracking-tighter">Configuración</h2>
                            <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X /></button>
                        </div>
                        <Suspense fallback={<Loader2 className="animate-spin text-primary mx-auto" />}>
                            <Settings />
                        </Suspense>
                    </div>
                </div>
            )}

            {/* CAPA FLOTANTE: ADMIN */}
            {isAdminOpen && (
                <div className="fixed inset-0 z-[100] animate-in fade-in slide-in-from-bottom-10 duration-500">
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl" onClick={() => setIsAdminOpen(false)}></div>
                    <div className="relative h-full w-full p-6 md:p-20 overflow-y-auto custom-scrollbar">
                         <button onClick={() => setIsAdminOpen(false)} className="absolute top-10 right-10 p-4 bg-white/5 rounded-full hover:bg-white/10 transition-all"><X /></button>
                         <div className="w-full max-w-6xl mx-auto">
                            <Suspense fallback={<Loader2 className="animate-spin text-primary mx-auto" />}>
                                <AdminPanel />
                            </Suspense>
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

    const loadData = () => {
        const user = storageService.auth.getCurrentUser();
        setCurrentUser(user);
    };

    useEffect(() => {
        loadData();
        window.addEventListener('apex-db-change', loadData);
        
        // ⚡ ACTIVACIÓN DE SINCRONIZACIÓN EN TIEMPO REAL ⚡
        // Consulta la base de datos de Supabase cada 10 segundos para traer trades del EA
        storageService.syncFromCloud(); // Ejecución inicial inmediata
        const syncInterval = setInterval(() => {
            storageService.syncFromCloud();
        }, 5000); 

        return () => {
            window.removeEventListener('apex-db-change', loadData);
            clearInterval(syncInterval);
        };
    }, []);

    const handleLogout = () => {
        storageService.auth.logout();
    };

    if (!currentUser) {
        return (
            <UserSelection onLogin={loadData} />
        );
    }

    return (
        <AppLayout currentUser={currentUser} onLogout={handleLogout} />
    );
};

export default App;
