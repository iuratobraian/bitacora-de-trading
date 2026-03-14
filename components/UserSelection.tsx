
import React, { useState } from 'react';
import { storageService } from '../services/storageService';
import { LayoutGrid, Lock, Unlock, AlertCircle, Plus, Loader2, User, Mail, ShieldCheck, KeyRound } from 'lucide-react';

interface Props {
  onLogin: () => void;
}

export const UserSelection: React.FC<Props> = ({ onLogin }) => {
  const [view, setView] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [emailOrUser, setEmailOrUser] = useState('');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const cleanIdentifier = emailOrUser.trim().toLowerCase();
      
      if (view === 'REGISTER') {
        if (pin.length < 6) throw new Error("El PIN debe tener al menos 6 caracteres.");
        await storageService.auth.register(name.trim(), pin, cleanIdentifier);
        await storageService.auth.login(cleanIdentifier, pin);
      } else {
        await storageService.auth.login(cleanIdentifier, pin);
      }
      onLogin();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Credenciales inválidas. El PIN debe ser de 6 dígitos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Sin background-color para ver la animación global
    <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-in fade-in duration-700 relative z-10">
      
      <div className="text-center mb-10">
        <div className="bg-primary/10 p-5 rounded-3xl inline-block mb-4 border border-primary/20 shadow-2xl shadow-primary/10 backdrop-blur-sm">
            <LayoutGrid size={48} className="text-primary" />
        </div>
        <h1 className="text-5xl font-black text-white mb-2 tracking-tighter uppercase italic drop-shadow-2xl">BI TERMINAL</h1>
        <p className="text-[10px] text-primary font-black uppercase tracking-[0.4em] drop-shadow-lg">BRAIAN IURATO | NEURAL SYSTEM</p>
      </div>

      <div className="w-full max-w-sm">
        {/* Glassmorphism mejorado */}
        <div className="bg-surface/60 backdrop-blur-2xl border border-white/5 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden ring-1 ring-white/10">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent"></div>
            
            <div className="flex justify-center mb-8">
                <div className="w-16 h-16 rounded-full bg-black/40 border border-white/5 flex items-center justify-center text-primary shadow-inner">
                    {loading ? <Loader2 className="animate-spin" size={32} /> : view === 'LOGIN' ? <Lock size={32} /> : <User size={32} />}
                </div>
            </div>

            <h2 className="text-xl font-black text-white text-center uppercase tracking-widest mb-2">
                {view === 'LOGIN' ? 'Acceder al Nodo' : 'Crear Perfil'}
            </h2>
            <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-8">
                {view === 'LOGIN' ? 'Ingresa tus credenciales de red' : 'Regístrate en la red global de trading'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        required
                        type="text" 
                        placeholder={view === 'LOGIN' ? "Usuario o Email" : "Email"} 
                        value={emailOrUser}
                        onChange={(e) => setEmailOrUser(e.target.value)}
                        className="w-full bg-black/30 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:border-primary focus:outline-none transition-all font-bold uppercase placeholder:text-gray-600 focus:bg-black/50"
                    />
                </div>

                {view === 'REGISTER' && (
                    <div className="relative animate-in slide-in-from-top-2">
                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            required
                            type="text" 
                            placeholder="Nombre para el Tablero" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:border-primary focus:outline-none transition-all font-bold placeholder:text-gray-600 focus:bg-black/50"
                        />
                    </div>
                )}

                <div className="relative">
                    <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        required
                        type="password" 
                        placeholder="PIN Maestro (6 dígitos)" 
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        className="w-full bg-black/30 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:border-primary focus:outline-none transition-all font-mono tracking-widest text-center placeholder:text-gray-600 focus:bg-black/50"
                    />
                </div>

                {errorMsg && (
                    <div className="p-4 bg-loss/10 border border-loss/20 rounded-2xl flex flex-col gap-1 text-loss text-[10px] font-bold uppercase animate-in shake">
                        <div className="flex items-center gap-2">
                           <AlertCircle size={14} />
                           <span>Fallo de Nodo</span>
                        </div>
                        <p className="opacity-80 leading-relaxed">{errorMsg}</p>
                    </div>
                )}

                <button 
                    disabled={loading}
                    type="submit" 
                    className="w-full bg-primary text-black font-black py-5 rounded-2xl hover:bg-primary-dark transition-all active:scale-95 shadow-xl shadow-primary/20 uppercase tracking-widest text-xs flex items-center justify-center gap-3"
                >
                    {loading ? 'SINCRONIZANDO...' : view === 'LOGIN' ? <><Unlock size={16}/> INICIAR SESIÓN</> : <><Plus size={16}/> CREAR TERMINAL</>}
                </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/5 flex flex-col gap-4">
                <button 
                    onClick={() => { setView(view === 'LOGIN' ? 'REGISTER' : 'LOGIN'); setErrorMsg(''); }}
                    className="text-[10px] text-gray-500 font-bold uppercase tracking-widest hover:text-primary transition-colors text-center"
                >
                    {view === 'LOGIN' ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya eres miembro? Inicia sesión'}
                </button>
            </div>
        </div>
      </div>

      <div className="mt-12 text-center opacity-30">
         <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3">
            <ShieldCheck size={14} /> Encriptación AES-256 Cloud Sync
         </p>
         <p className="text-[8px] text-gray-600 mt-4 font-bold tracking-widest">BI EDITION | V.5.0 DYNAMIC INTERFACE</p>
      </div>
    </div>
  );
};
