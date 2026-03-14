
import React from 'react';
import { UserProfile } from '../types';
import { storageService } from '../services/storageService';
import { Shield, Plus, Edit, Trash2, ArrowLeft, Activity, Database, AlertTriangle, CheckCircle2, TrendingUp, DollarSign, Target, Clock, Hash, Map } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SystemOverview from './SystemOverview';

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);
  const [users, setUsers] = React.useState<UserProfile[]>([]);
  
  // UI States
  const [view, setView] = React.useState<'LIST' | 'CREATE' | 'EDIT' | 'MAP'>('LIST');
  const [editingUser, setEditingUser] = React.useState<UserProfile | null>(null);
  const [successMsg, setSuccessMsg] = React.useState('');
  
  // Form Data
  const [formName, setFormName] = React.useState('');
  const [formPin, setFormPin] = React.useState('');

  React.useEffect(() => {
    const user = storageService.auth.getCurrentUser();
    if (user?.role !== 'ADMIN') {
        navigate('/'); // Redirect non-admins
        return;
    }
    setCurrentUser(user);
    loadUsers();
    
    // Listen for database changes (e.g. deletion happening)
    window.addEventListener('apex-db-change', loadUsers);
    return () => window.removeEventListener('apex-db-change', loadUsers);
  }, []);

  const loadUsers = () => {
      setUsers(storageService.auth.getUsers());
  };

  const handleCreate = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formName || !formPin) return;
      storageService.auth.createUser(formName, formPin);
      loadUsers();
      
      setSuccessMsg(`Usuario ${formName} creado correctamente.`);
      setTimeout(() => {
          setSuccessMsg('');
          setView('LIST');
          resetForm();
      }, 1500);
  };

  const handleUpdate = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingUser || !formName) return;
      
      const pinToSave = formPin ? formPin : (editingUser.pin || '');
      storageService.auth.updateUser(editingUser.id, formName, pinToSave);
      loadUsers();
      setView('LIST');
      resetForm();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (confirm("¿Estás seguro de eliminar este usuario y TODOS sus datos (cuentas y trades)?\n\nEsta acción no se puede deshacer.")) {
          storageService.auth.deleteUser(id);
      }
  };

  const handleClearData = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (confirm('⚠️ PELIGRO CRÍTICO: ¿ESTÁS SEGURO? \n\nEsto realizará un restablecimiento de fábrica:\n1. Se eliminarán TODOS los datos locales.\n2. Se cerrará la sesión.\n3. La aplicación se reiniciará.\n\n¿Deseas continuar?')) {
      storageService.clearAllData();
    }
  };

  const openEdit = (user: UserProfile) => {
      setEditingUser(user);
      setFormName(user.name);
      setFormPin('');
      setView('EDIT');
  };

  const resetForm = () => {
      setFormName('');
      setFormPin('');
      setEditingUser(null);
  };

  return (
    <div className="p-4 md:p-8 w-full max-w-[90%] xl:max-w-[1600px] mx-auto animate-in fade-in duration-500 pb-24">
        
        <div className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                    <Shield size={28} className="text-yellow-500" /> 
                    Panel de Administración
                </h1>
                <p className="text-gray-400 mt-1">Gestión de usuarios y seguridad del sistema.</p>
            </div>
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setView('MAP')}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 font-bold transition-all ${view === 'MAP' ? 'bg-primary text-black' : 'bg-surface border border-border text-gray-400 hover:text-white'}`}
                >
                    <Map size={18} /> Mapeo
                </button>
                {view === 'LIST' && (
                    <button 
                        type="button"
                        onClick={() => { resetForm(); setView('CREATE'); }}
                        className="bg-primary text-black font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-dark transition-colors"
                    >
                        <Plus size={18} /> Nuevo Usuario
                    </button>
                )}
                {view !== 'LIST' && (
                    <button 
                        onClick={() => setView('LIST')}
                        className="bg-surface border border-border text-white font-bold px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                        Volver a Usuarios
                    </button>
                )}
            </div>
        </div>

        {view === 'MAP' && <SystemOverview />}

        {view === 'LIST' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map(user => {
                    const stats = storageService.auth.getUserStats(user.id);
                    const isSelf = currentUser?.id === user.id;

                    return (
                        <div key={user.id} className="bg-surface border border-border rounded-xl p-5 flex flex-col justify-between group hover:border-gray-600 transition-colors">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${user.role === 'ADMIN' ? 'bg-yellow-600 text-white' : 'bg-neutral/20 text-neutral'}`}>
                                        {user.avatar || user.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                            {user.name}
                                            {user.role === 'ADMIN' && <span className="text-[10px] bg-yellow-500 text-black px-1.5 rounded font-bold">ADMIN</span>}
                                        </h3>
                                        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono mt-1">
                                            <Hash size={10} />
                                            <span>ID: {user.id}</span>
                                            <button 
                                                onClick={() => { navigator.clipboard.writeText(user.id); }}
                                                className="hover:text-primary transition-colors"
                                                title="Copiar ID"
                                            >
                                                <Database size={10} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="bg-background/50 rounded-xl p-3 border border-white/5">
                                    <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1 flex items-center gap-1">
                                        <TrendingUp size={10} className="text-primary" /> Win Rate
                                    </p>
                                    <p className={`text-lg font-black font-mono ${Number(stats.winRate) >= 50 ? 'text-primary' : 'text-loss'}`}>
                                        {stats.winRate}%
                                    </p>
                                </div>
                                <div className="bg-background/50 rounded-xl p-3 border border-white/5">
                                    <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1 flex items-center gap-1">
                                        <DollarSign size={10} className="text-green-500" /> PnL Total
                                    </p>
                                    <p className={`text-lg font-black font-mono ${stats.totalPnl >= 0 ? 'text-primary' : 'text-loss'}`}>
                                        ${stats.totalPnl.toFixed(2)}
                                    </p>
                                </div>
                                <div className="bg-background/50 rounded-xl p-3 border border-white/5">
                                    <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1 flex items-center gap-1">
                                        <Target size={10} className="text-blue-400" /> Trades
                                    </p>
                                    <p className="text-lg font-black font-mono text-white">
                                        {stats.totalTrades}
                                    </p>
                                </div>
                                <div className="bg-background/50 rounded-xl p-3 border border-white/5">
                                    <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1 flex items-center gap-1">
                                        <Clock size={10} className="text-yellow-500" /> Último Trade
                                    </p>
                                    <p className="text-[10px] font-bold text-gray-300 mt-1">
                                        {stats.lastTrade ? new Date(stats.lastTrade).toLocaleDateString() : 'Sin datos'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-auto pt-4 border-t border-border">
                                <button 
                                    type="button"
                                    onClick={() => openEdit(user)} 
                                    className="flex-1 bg-surface border border-border hover:bg-white/5 text-gray-300 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                                >
                                    <Edit size={14} /> Editar
                                </button>
                                
                                {!isSelf && (
                                    <button 
                                        type="button"
                                        onClick={(e) => handleDelete(user.id, e)} 
                                        className="flex-1 bg-loss/10 border border-loss/20 hover:bg-loss hover:text-white text-loss py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={14} /> Eliminar
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}

        {(view === 'CREATE' || view === 'EDIT') && (
            <div className="max-w-md mx-auto bg-surface border border-border p-6 rounded-xl relative">
                 {successMsg && (
                     <div className="absolute inset-0 bg-surface/95 z-50 flex flex-col items-center justify-center rounded-xl animate-in fade-in zoom-in">
                         <CheckCircle2 size={48} className="text-primary mb-4" />
                         <p className="text-white font-bold">{successMsg}</p>
                     </div>
                 )}
                 <div className="flex items-center gap-2 mb-6">
                    <button type="button" onClick={() => setView('LIST')} className="text-gray-400 hover:text-white">
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="text-xl font-bold text-white">
                        {view === 'CREATE' ? 'Nuevo Usuario' : `Editar ${editingUser?.name}`}
                    </h2>
                </div>

                <form onSubmit={view === 'CREATE' ? handleCreate : handleUpdate} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre</label>
                        <input 
                            autoFocus
                            type="text" 
                            value={formName}
                            onChange={(e) => setFormName(e.target.value)}
                            className="w-full bg-background border border-border rounded-lg p-3 text-white focus:border-primary focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                            {view === 'CREATE' ? 'PIN de Acceso' : 'Nuevo PIN (Opcional)'}
                        </label>
                        <input 
                            type="password" 
                            inputMode="numeric"
                            placeholder="****"
                            value={formPin}
                            onChange={(e) => setFormPin(e.target.value)}
                            className="w-full bg-background border border-border rounded-lg p-3 text-white focus:border-primary focus:outline-none tracking-widest text-center"
                        />
                    </div>

                    <button type="submit" className="w-full bg-primary text-black font-bold py-3 rounded-lg mt-4 hover:bg-primary-dark transition-colors">
                        {view === 'CREATE' ? 'Crear Usuario' : 'Guardar Cambios'}
                    </button>
                </form>
            </div>
        )}

        <div className="mt-12 p-4 bg-red-900/10 border border-loss/20 rounded-lg flex flex-col gap-3">
             <div className="flex items-center gap-2 text-loss">
                <AlertTriangle size={20} />
                <h4 className="font-bold text-sm">Zona de Peligro</h4>
             </div>
             
             <p className="text-xs text-gray-400">
                Acciones destructivas. Procede con precaución.
             </p>
             
             <button 
                type="button"
                onClick={handleClearData}
                className="w-full md:w-auto px-4 py-2 bg-loss/10 text-loss border border-loss/20 rounded-lg hover:bg-loss hover:text-white transition-colors flex justify-center items-center gap-2 text-sm font-bold"
            >
                <Trash2 size={16} />
                Restablecer Todo (Fábrica)
            </button>
        </div>
    </div>
  );
};

export default AdminPanel;
