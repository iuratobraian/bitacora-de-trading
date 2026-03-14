
import React from 'react';
import { User, Copy, Terminal, ShieldAlert, CheckCircle, ExternalLink, X, Database, Server, RefreshCw, Plus, CreditCard, ChevronDown, PenSquare, Download, Calculator } from 'lucide-react';
import { storageService, UserSettings } from '../services/storageService';
import { Account, UserProfile } from '../types';
import { supabase } from '../services/supabaseClient';

const SUPABASE_PROJECT_ID = 'tgsojwhkknwynnokzini';
const SUPABASE_SQL_EDITOR_URL = `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql/new`;
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnc29qd2hra253eW5ub2t6aW5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4ODgwMDksImV4cCI6MjA4NDQ2NDAwOX0.qw1504Eeiic71bt0DsWH7jSEhzgrGzmXQI_hWHHKoyg';
const SUPABASE_URL = 'https://tgsojwhkknwynnokzini.supabase.co';

interface SettingsProps {
    dbFileHandle?: any;
    onConnectDB?: () => void;
}

const EA_TEMPLATE = `//+------------------------------------------------------------------+
//|                                                ApexConnector.mq5 |
//|                                      Braian Iurato Neural System |
//+------------------------------------------------------------------+
#property copyright "Braian Iurato"
#property version   "12.0"
#property strict
#property description "Puente v12.0 (Full Commission Scan)"

input string InpTraderRef   = "{{TRADER_ID}}";
input string InpAccountRef  = "{{ACCOUNT_ID}}";
input bool   InpSyncHistory = true;

string API_URL = "{{URL}}/rest/v1/app_trades";
string API_KEY = "{{KEY}}";

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("Apex Connector Iniciado - Cuenta: ", InpAccountRef);
   EventSetTimer(5);
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   EventKillTimer();
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
}

//+------------------------------------------------------------------+
//| Timer function                                                   |
//+------------------------------------------------------------------+
void OnTimer()
{
   SyncTrades();
}

//+------------------------------------------------------------------+
//| Sincronizar Trades con la Bitácora                               |
//+------------------------------------------------------------------+
void SyncTrades()
{
   if(!TerminalInfoInteger(TERMINAL_TRADE_ALLOWED)) return;
   
   // Escanear Historial
   if(InpSyncHistory)
   {
      HistorySelect(TimeCurrent()-86400*7, TimeCurrent());
      for(int i=HistoryDealsTotal()-1; i>=0; i--)
      {
         ulong ticket = HistoryDealGetTicket(i);
         long entry = HistoryDealGetInteger(ticket, DEAL_ENTRY);
         if(entry == DEAL_ENTRY_OUT)
         {
            SendTradeToCloud(ticket, true);
         }
      }
   }
   
   // Escanear Posiciones Abiertas
   for(int i=PositionsTotal()-1; i>=0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      SendTradeToCloud(ticket, false);
   }
}

//+------------------------------------------------------------------+
//| Enviar datos a Supabase                                          |
//+------------------------------------------------------------------+
void SendTradeToCloud(ulong ticket, bool isHistory)
{
   string symbol = isHistory ? HistoryDealGetString(ticket, DEAL_SYMBOL) : PositionGetString(ticket, POSITION_SYMBOL);
   double profit = isHistory ? HistoryDealGetDouble(ticket, DEAL_PROFIT) : PositionGetDouble(ticket, POSITION_PROFIT);
   double commission = isHistory ? HistoryDealGetDouble(ticket, DEAL_COMMISSION) : 0;
   double swap = isHistory ? HistoryDealGetDouble(ticket, DEAL_SWAP) : PositionGetDouble(ticket, POSITION_SWAP);
   long type = isHistory ? HistoryDealGetInteger(ticket, DEAL_TYPE) : PositionGetInteger(ticket, POSITION_TYPE);
   double price = isHistory ? HistoryDealGetDouble(ticket, DEAL_PRICE) : PositionGetDouble(ticket, POSITION_PRICE);
   
   string typeStr = (type == DEAL_TYPE_BUY || type == POSITION_TYPE_BUY) ? "BUY" : "SELL";
   
   string json = StringFormat(
      "{\"user_id\":\"%s\",\"account_id\":\"%s\",\"ticket\":\"%d\",\"symbol\":\"%s\",\"type\":\"%s\",\"price\":%f,\"profit\":%f,\"commission\":%f,\"swap\":%f}",
      InpTraderRef, InpAccountRef, ticket, symbol, typeStr, price, profit, commission, swap
   );
   
   char data[];
   ArrayResize(data, StringToCharArray(json, data, 0, WHOLE_ARRAY, CP_UTF8)-1);
   
   string headers = StringFormat("Content-Type: application/json\\r\\napikey: %s\\r\\nAuthorization: Bearer %s\\r\\nPrefer: resolution=merge-duplicates", API_KEY, API_KEY);
   char result[];
   string resultHeaders;
   
   int res = WebRequest("POST", API_URL, headers, 1000, data, result, resultHeaders);
   
   if(res == -1)
   {
      Print("Error en WebRequest: ", GetLastError());
      if(GetLastError() == 4060) Print("Asegúrese de agregar la URL en la lista de permitidos.");
   }
}
`;

const SQL_FIX_COMMAND = `
DROP TABLE IF EXISTS app_trades CASCADE;
CREATE TABLE app_trades (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text,
  account_id text,
  ticket text,       
  symbol text,
  type text,
  price numeric,
  profit numeric,
  commission numeric DEFAULT 0,
  swap numeric DEFAULT 0,
  timestamp timestamptz DEFAULT now()
);
ALTER TABLE app_trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON app_trades FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON TABLE app_trades TO anon, authenticated, service_role;
NOTIFY pgrst, 'reload schema';
`;

const Settings: React.FC<SettingsProps> = () => {
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);
  const [settings, setSettings] = React.useState<UserSettings>({ username: '', layoutMode: 'SIDEBAR' });
  
  const [activeAccount, setActiveAccount] = React.useState<Account | null>(null);
  const [allAccounts, setAllAccounts] = React.useState<Account[]>([]);
  
  const [isSaved, setIsSaved] = React.useState(false);
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [dbStatus, setDbStatus] = React.useState<'CHECKING' | 'OK' | 'ERROR'>('CHECKING');
  const [showManualRepair, setShowManualRepair] = React.useState(false);
  
  // Edit Account Form
  const [editingSlot, setEditingSlot] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');
  const [editBalance, setEditBalance] = React.useState('');

  const loadData = () => {
      setSettings(storageService.getSettings());
      setCurrentUser(storageService.auth.getCurrentUser());
      setActiveAccount(storageService.getActiveAccount());
      setAllAccounts(storageService.getAccounts());
  };

  React.useEffect(() => {
    loadData();
    checkDatabaseSchema();
    window.addEventListener('settings-updated', loadData);
    window.addEventListener('apex-db-change', loadData);
    return () => {
        window.removeEventListener('settings-updated', loadData);
        window.removeEventListener('apex-db-change', loadData);
    };
  }, []);

  const checkDatabaseSchema = async () => {
      setDbStatus('CHECKING');
      try {
          const { error } = await supabase.from('app_trades').select('ticket').limit(1);
          if (error) { setDbStatus('ERROR'); setShowManualRepair(true); } else { setDbStatus('OK'); }
      } catch (e) { setDbStatus('ERROR'); setShowManualRepair(true); }
  };

  const handleSaveSettings = () => {
    storageService.saveSettings(settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const startEditing = (acc: Account) => {
      setEditingSlot(acc.id);
      setEditName(acc.name);
      setEditBalance(acc.startingBalance.toString());
  };

  const saveAccountEdit = () => {
      if (editingSlot && editName && editBalance) {
          storageService.updateAccountDetails(editingSlot, editName, Number(editBalance));
          setEditingSlot(null);
          loadData();
      }
  };

  const handleSwitchAccount = (id: string) => {
      storageService.switchAccount(id);
      loadData();
  };

  const copyToClipboard = (text: string, fieldId: string) => {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
  };

  const downloadEAScript = () => {
    const code = getEACode();
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ApexConnector_${activeAccount?.id || 'main'}.mq5`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const openCalculator = () => {
    window.open(`${window.location.origin}/#/calculator`, '_blank');
  };

  const getEACode = () => {
     // CRÍTICO: Generar EA code con el ID de la cuenta ACTIVA seleccionada
     // El ID ahora es fijo (ej: userId_SLOT_A), así que nunca cambia aunque se edite el nombre.
     return EA_TEMPLATE
        .replace('{{TRADER_ID}}', currentUser?.id || 'NO_ID')
        .replace('{{ACCOUNT_ID}}', activeAccount?.id || 'main_default')
        .replace('{{URL}}', SUPABASE_URL)
        .replace('{{KEY}}', SUPABASE_ANON_KEY);
  };

  return (
    <div className="w-full flex flex-col gap-8 pb-24">
      
      {/* 1. GESTOR DE SLOTS (CUENTAS FIJAS) */}
      <div className="bg-surface border border-border rounded-3xl p-6">
        <h2 className="text-xs font-black text-gray-400 mb-6 uppercase tracking-widest flex items-center gap-2">
            <CreditCard size={14} className="text-primary" /> Slots de Conexión
        </h2>
        
        <p className="text-[10px] text-gray-500 mb-4">
            Sistema de IDs Fijos. Puedes editar el nombre y balance de cada Slot, pero el ID de conexión MT5 se mantiene constante para evitar desconfiguraciones en el EA.
        </p>

        {/* Lista de Slots (Limitada a los 2 que crea init) */}
        <div className="space-y-3 mb-6">
            {allAccounts.map((acc, index) => (
                <div 
                    key={acc.id} 
                    className={`p-4 rounded-xl border transition-all flex flex-col gap-4 ${activeAccount?.id === acc.id ? 'bg-primary/5 border-primary' : 'bg-background/40 border-border'}`}
                >
                    <div className="flex justify-between items-center">
                        <div onClick={() => handleSwitchAccount(acc.id)} className="cursor-pointer flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className={`text-sm font-black ${activeAccount?.id === acc.id ? 'text-white' : 'text-gray-400'}`}>
                                    {acc.id.includes('SLOT_A') ? 'SLOT A' : 'SLOT B'}: {acc.name}
                                </h3>
                                {activeAccount?.id === acc.id && <span className="bg-primary text-black text-[9px] font-bold px-2 rounded-full uppercase">Activa</span>}
                            </div>
                            <p className="text-[9px] text-gray-500 font-mono mt-1">ID Fijo: {acc.id}</p>
                        </div>
                        <div className="text-right">
                             <p className="text-sm font-mono font-bold text-white">${acc.startingBalance}</p>
                             <div className="flex gap-2 justify-end mt-2">
                                {editingSlot === acc.id ? (
                                    <button onClick={saveAccountEdit} className="text-[9px] bg-primary text-black px-3 py-1 rounded font-bold uppercase">Guardar</button>
                                ) : (
                                    <button onClick={() => startEditing(acc)} className="text-[9px] bg-white/10 text-white px-3 py-1 rounded font-bold uppercase hover:bg-white/20">Editar</button>
                                )}
                                {activeAccount?.id !== acc.id && (
                                    <button onClick={() => handleSwitchAccount(acc.id)} className="text-[9px] border border-white/20 text-gray-300 px-3 py-1 rounded font-bold uppercase hover:bg-white/10">Activar</button>
                                )}
                             </div>
                        </div>
                    </div>
                    
                    {/* Formulario de Edición Inline */}
                    {editingSlot === acc.id && (
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5 animate-in slide-in-from-top-2">
                            <div>
                                <label className="text-[9px] text-gray-500 font-bold uppercase">Nombre</label>
                                <input 
                                    type="text" 
                                    value={editName} 
                                    onChange={e => setEditName(e.target.value)} 
                                    className="w-full bg-black/40 border border-border rounded p-2 text-xs text-white"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] text-gray-500 font-bold uppercase">Balance Inicial</label>
                                <input 
                                    type="number" 
                                    value={editBalance} 
                                    onChange={e => setEditBalance(e.target.value)} 
                                    className="w-full bg-black/40 border border-border rounded p-2 text-xs text-white"
                                />
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
      </div>

      {/* 2. CONECTOR EA (Variable según cuenta activa) */}
      <div className="bg-surface border border-border rounded-3xl p-8 relative overflow-hidden group hover:border-primary/30 transition-all">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div>
                <h2 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-2">
                    <Terminal size={20} className="text-primary" /> Script MT5 Apex
                </h2>
                <p className="text-xs text-gray-500 mt-1">Conecta tu MetaTrader 5 con el Slot: <span className="text-primary font-bold">{activeAccount?.id.includes('SLOT_A') ? 'A' : 'B'}</span></p>
            </div>
            <button 
                onClick={downloadEAScript}
                className="w-full md:w-auto bg-primary hover:bg-primary-dark text-black px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl shadow-primary/20 hover:scale-105 active:scale-95"
            >
                <Download size={18} /> DESCARGAR SCRIPT (.MQ5)
            </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-black/30 border border-border rounded-2xl p-4">
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-2">Instrucciones de Instalación</p>
                <ul className="text-[10px] text-gray-400 space-y-2 list-decimal list-inside">
                    <li>Descarga el archivo <span className="text-white font-mono">.mq5</span> arriba.</li>
                    <li>En MT5: <span className="text-white">Archivo {'>'} Abrir Carpeta de Datos</span>.</li>
                    <li>Navega a <span className="text-white">MQL5 {'>'} Experts</span> y pega el archivo.</li>
                    <li>Reinicia MT5 o <span className="text-white">Actualizar</span> en el Navegador.</li>
                    <li>Arrastra el script al gráfico y activa <span className="text-white">Algo Trading</span>.</li>
                </ul>
            </div>
            <div className="bg-black/30 border border-border rounded-2xl p-4">
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-2">Herramientas Adicionales</p>
                <button 
                    onClick={openCalculator}
                    className="w-full mt-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 flex items-center justify-between group transition-all"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                            <Calculator size={16} />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-black text-white uppercase tracking-widest">Calculadora de Riesgo</p>
                            <p className="text-[9px] text-gray-500">Abrir en pestaña independiente</p>
                        </div>
                    </div>
                    <ExternalLink size={14} className="text-gray-500 group-hover:text-white transition-colors" />
                </button>
            </div>
        </div>

        <div className="bg-black/30 border border-border rounded-2xl p-4 mb-8">
            <p className="text-[10px] text-gray-500 font-bold uppercase mb-2">Configuración de Seguridad</p>
            <p className="text-[10px] text-gray-400 leading-relaxed">
                Asegúrate de agregar la URL de la API en MetaTrader 5: <br/>
                <span className="text-white font-mono block mt-1 bg-black/50 p-1 rounded">Herramientas {'>'} Opciones {'>'} Asesores Expertos {'>'} Permitir WebRequest para:</span>
                <span className="text-primary font-mono block mt-1">https://tgsojwhkknwynnokzini.supabase.co</span>
            </p>
        </div>

        <div className="bg-primary/5 rounded-2xl p-5 border border-primary/10">
             <p className="text-[11px] text-gray-300 leading-relaxed">
                 <span className="text-primary font-black uppercase mr-2">Nota:</span> 
                 Este archivo ya contiene tu <strong>Trader ID</strong> y <strong>Account ID</strong> configurados. No necesitas editar el código manualmente. Simplemente instálalo y actívalo.
             </p>
        </div>
      </div>
      
       {/* STATUS DATABASE */}
       {(dbStatus === 'ERROR' || showManualRepair) && (
          <div className="bg-black/40 rounded-3xl p-6 border border-white/10">
             <h2 className="text-xs font-black text-red-400 uppercase mb-4 flex items-center gap-2"><ShieldAlert size={14}/> Reparación de Base de Datos</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button onClick={() => copyToClipboard(SQL_FIX_COMMAND, 'sql_fix')} className="bg-white text-black py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-gray-200">
                    {copiedField === 'sql_fix' ? <CheckCircle size={14}/> : <Copy size={14}/>} 1. Copiar SQL
                </button>
                <a href={SUPABASE_SQL_EDITOR_URL} target="_blank" rel="noopener noreferrer" className="bg-loss text-white py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-red-600">
                    <ExternalLink size={14}/> 2. Ejecutar
                </a>
             </div>
          </div>
       )}
    </div>
  );
};

export default Settings;
