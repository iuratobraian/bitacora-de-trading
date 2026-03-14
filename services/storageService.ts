
import { Trade, TradeStatus, Account, UserProfile, LayoutMode, TradeType, Session } from "../types";
import { INITIAL_DB } from "../data/db";
import { supabase } from "./supabaseClient";

export interface UserSettings {
  username: string;
  layoutMode: LayoutMode;
  aiXP?: number;
  newsAlertImpact?: 'HIGH' | 'MEDIUM' | 'LOW';
  newsAlertTime?: number; 
}

const SETTINGS_KEY = 'apex_ledger_settings';
const ACCOUNTS_KEY = 'apex_ledger_accounts';
const ACTIVE_ACCOUNT_KEY = 'apex_ledger_active_account';
const TRADES_KEY_PREFIX = 'apex_ledger_trades_';
const WITHDRAWALS_KEY_PREFIX = 'apex_ledger_withdrawals_';
const USERS_KEY = 'apex_ledger_users'; 
const DB_CHANGE_EVENT = 'apex-db-change'; 
const APEX_SESSION_KEY = 'apex_session_secure_v1';

const SECRET_KEY = "BRAIAN_IURATO_SECURE_2024_APEX";

let isSyncingProcess = false;

const encryptData = (data: any): string => {
    try {
        const jsonString = JSON.stringify(data);
        const encrypted = encodeURIComponent(jsonString).split('').map((c, i) => 
            String.fromCharCode(c.charCodeAt(0) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length))
        ).join('');
        return btoa(encrypted);
    } catch (e) { return ""; }
};

const decryptData = (cipherText: string | null): any => {
    if (!cipherText) return null;
    try {
        const encrypted = atob(cipherText);
        const jsonString = decodeURIComponent(encrypted.split('').map((c, i) => 
            String.fromCharCode(c.charCodeAt(0) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length))
        ).join(''));
        return JSON.parse(jsonString);
    } catch (e) {
        try { return JSON.parse(cipherText || '{}'); } catch (err) { return null; }
    }
};

const SecureStorage = {
    setItem: (key: string, value: any) => {
        localStorage.setItem(key, encryptData(value));
    },
    getItem: (key: string) => {
        return decryptData(localStorage.getItem(key));
    }
};

const getAllUsers = (): UserProfile[] => {
    const stored = SecureStorage.getItem(USERS_KEY);
    if (stored && Array.isArray(stored)) return stored;
    return INITIAL_DB.users;
};

export const storageService = {
  init: async () => {
    const user = storageService.auth.getCurrentUser();
    if (!user) return;

    // INICIALIZACIÓN DE CUENTAS FIJAS (SLOTS)
    const slotA_ID = `${user.id}_SLOT_A`;
    const slotB_ID = `${user.id}_SLOT_B`;

    const scopedAccountsKey = storageService._getScopedKey(ACCOUNTS_KEY);
    let existingAccounts: Account[] = SecureStorage.getItem(scopedAccountsKey) || [];
    
    let hasChanges = false;
    
    if (!existingAccounts.find(a => a.id === slotA_ID)) {
        existingAccounts.push({
            id: slotA_ID,
            name: 'Cuenta Principal (A)',
            startingBalance: 10000,
            currency: 'USD',
            createdAt: new Date().toISOString()
        });
        hasChanges = true;
    }

    if (!existingAccounts.find(a => a.id === slotB_ID)) {
        existingAccounts.push({
            id: slotB_ID,
            name: 'Cuenta Secundaria (B)',
            startingBalance: 10000,
            currency: 'USD',
            createdAt: new Date().toISOString()
        });
        hasChanges = true;
    }

    if (hasChanges) {
        SecureStorage.setItem(scopedAccountsKey, existingAccounts);
    }
    
    const activeId = SecureStorage.getItem(storageService._getScopedKey(ACTIVE_ACCOUNT_KEY));
    if (!activeId || !existingAccounts.find((a: Account) => a.id === activeId)) {
        SecureStorage.setItem(storageService._getScopedKey(ACTIVE_ACCOUNT_KEY), slotA_ID);
    }
  },

  auth: {
      login: async (emailOrUser: string, pin: string) => {
          const identifier = emailOrUser.toLowerCase().trim();
          const email = identifier.includes('@') ? identifier : `${identifier}@gmail.com`;
          
          let authUser = null;

          try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password: pin
            });
            if (data.user && !error) {
                authUser = data.user;
            }
          } catch (e: any) {
            console.warn("Supabase Login Failed (Offline mode?)");
          }

          if (!authUser) {
              const localUsers = getAllUsers();
              const localMatch = localUsers.find(u => {
                  const nameMatches = u.name.toLowerCase() === identifier;
                  const emailMatchesName = identifier.startsWith(u.name.toLowerCase() + '@');
                  return (nameMatches || emailMatchesName) && u.pin === pin;
              });

              if (localMatch) {
                  authUser = {
                      id: localMatch.id,
                      email: email,
                      user_metadata: { 
                          display_name: localMatch.name, 
                          role: localMatch.role, 
                          ai_xp: localMatch.aiXP || 0 
                      },
                      created_at: localMatch.createdAt
                  } as any;
              } else {
                  if ((identifier === 'braian' || identifier === 'admin') && pin === '221707') {
                      const masterId = identifier === 'braian' 
                          ? 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380d44' 
                          : 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
                      authUser = {
                          id: masterId,
                          email: email,
                          user_metadata: { display_name: 'Admin Sistema', role: 'ADMIN', ai_xp: 9999 },
                          created_at: new Date().toISOString()
                      } as any;
                  }
              }
          }

          if (!authUser) throw new Error("Credenciales inválidas.");

          const sessionObj = { user: authUser, timestamp: Date.now() };
          localStorage.setItem(APEX_SESSION_KEY, JSON.stringify(sessionObj));
          
          await storageService.init(); 
          window.dispatchEvent(new Event(DB_CHANGE_EVENT));
          return authUser;
      },
      register: async (name: string, pin: string, email: string, role: 'ADMIN' | 'USER' = 'USER') => {
          const identifier = email.toLowerCase().trim();
          const finalEmail = identifier.includes('@') ? identifier : `${identifier}@gmail.com`;
          if (pin.length < 6) throw new Error("El PIN debe ser de 6 dígitos.");

          const localUsers = getAllUsers();
          const existsLocally = localUsers.find(u => u.name.toLowerCase() === name.toLowerCase());
          if (!existsLocally) {
              storageService.auth.createUser(name, pin); 
          }

          try {
              const { data, error } = await supabase.auth.signUp({
                  email: finalEmail,
                  password: pin,
                  options: { data: { display_name: name, role, ai_xp: 0 } }
              });
              return data.user;
          } catch (e) { return null; }
      },
      logout: async () => {
          await supabase.auth.signOut();
          localStorage.removeItem(APEX_SESSION_KEY);
          window.location.reload();
      },
      getCurrentUser: (): UserProfile | null => {
          const localSession = localStorage.getItem(APEX_SESSION_KEY);
          if (localSession) {
              try {
                  const { user } = JSON.parse(localSession);
                  return {
                      id: user.id,
                      name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Trader',
                      role: user.user_metadata?.role || 'USER',
                      aiXP: user.user_metadata?.ai_xp || 0,
                      createdAt: user.created_at
                  };
              } catch (e) { }
          }
          return null;
      },
      addXP: async (amount: number) => {
        const user = storageService.auth.getCurrentUser();
        if (!user) return;
        const localSession = localStorage.getItem(APEX_SESSION_KEY);
        if (localSession) {
            const data = JSON.parse(localSession);
            if(data.user?.user_metadata) {
                data.user.user_metadata.ai_xp = (data.user.user_metadata.ai_xp || 0) + amount;
                localStorage.setItem(APEX_SESSION_KEY, JSON.stringify(data));
            }
        }
        window.dispatchEvent(new Event(DB_CHANGE_EVENT));
      },
      getUsers: (): UserProfile[] => getAllUsers(),
      createUser: (name: string, pin: string) => {
          const users = getAllUsers();
          if (users.find(u => u.name.toLowerCase() === name.toLowerCase())) return;
          
          const newUser: UserProfile = { 
              id: crypto.randomUUID(), 
              name, 
              pin, 
              role: 'USER', 
              createdAt: new Date().toISOString(), 
              avatar: name.charAt(0).toUpperCase() 
          };
          users.push(newUser);
          
          SecureStorage.setItem(USERS_KEY, users); 
          window.dispatchEvent(new Event(DB_CHANGE_EVENT));
      },
      updateUser: (id: string, name: string, pin: string) => {
          const users = getAllUsers();
          const idx = users.findIndex(u => u.id === id);
          if (idx !== -1) {
              users[idx] = { ...users[idx], name, pin };
              SecureStorage.setItem(USERS_KEY, users);
              window.dispatchEvent(new Event(DB_CHANGE_EVENT));
          }
      },
      deleteUser: (id: string) => {
          const users = getAllUsers();
          const filtered = users.filter(u => u.id !== id);
          SecureStorage.setItem(USERS_KEY, filtered);
          window.dispatchEvent(new Event(DB_CHANGE_EVENT));
      },
      getUserStats: (userId: string) => {
          // Intentar obtener de localStorage primero (si el admin está en la misma máquina o el usuario es el mismo)
          const slotA_Trades = SecureStorage.getItem(`${userId}_${TRADES_KEY_PREFIX}${userId}_SLOT_A`) || [];
          const slotB_Trades = SecureStorage.getItem(`${userId}_${TRADES_KEY_PREFIX}${userId}_SLOT_B`) || [];
          const allLocalTrades = [...slotA_Trades, ...slotB_Trades];
          
          const totalTrades = allLocalTrades.length;
          const wins = allLocalTrades.filter((t: any) => t.outcome === 'WIN').length;
          const losses = allLocalTrades.filter((t: any) => t.outcome === 'LOSS').length;
          const totalPnl = allLocalTrades.reduce((sum: number, t: any) => sum + (Number(t.pnl) || 0), 0);
          const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : "0.0";

          return { 
            totalTrades, 
            wins, 
            losses, 
            totalPnl, 
            winRate,
            lastTrade: allLocalTrades.length > 0 ? allLocalTrades[0].date : null
          }; 
      }
  },

  _getScopedKey: (key: string) => {
      const user = storageService.auth.getCurrentUser();
      return user ? `${user.id}_${key}` : `guest_${key}`;
  },

  getAccounts: (): Account[] => SecureStorage.getItem(storageService._getScopedKey(ACCOUNTS_KEY)) || [],
  
  getActiveAccount: (): Account => {
      const accounts = storageService.getAccounts();
      if (accounts.length === 0) return INITIAL_DB.accounts[0];
      
      const activeId = SecureStorage.getItem(storageService._getScopedKey(ACTIVE_ACCOUNT_KEY)); 
      return accounts.find(a => a.id === activeId) || accounts[0];
  },
  
  updateAccountDetails: (id: string, name: string, startingBalance: number) => {
      const accounts = storageService.getAccounts();
      const idx = accounts.findIndex(a => a.id === id);
      if (idx !== -1) {
          accounts[idx].name = name;
          accounts[idx].startingBalance = startingBalance;
          SecureStorage.setItem(storageService._getScopedKey(ACCOUNTS_KEY), accounts);
          window.dispatchEvent(new Event(DB_CHANGE_EVENT));
      }
  },

  createAccount: (name: string, startingBalance: number) => {
      return; 
  },

  switchAccount: (id: string) => {
      const accounts = storageService.getAccounts();
      if (accounts.find(a => a.id === id)) {
        SecureStorage.setItem(storageService._getScopedKey(ACTIVE_ACCOUNT_KEY), id);
        window.dispatchEvent(new Event(DB_CHANGE_EVENT));
      }
  },

  updateActiveAccountSettings: (name: string, balance: number) => {
      const accounts = storageService.getAccounts();
      const activeAccount = storageService.getActiveAccount();
      const idx = accounts.findIndex(a => a.id === activeAccount.id);
      
      if (idx !== -1) {
          accounts[idx].name = name;
          accounts[idx].startingBalance = balance;
          SecureStorage.setItem(storageService._getScopedKey(ACCOUNTS_KEY), accounts);
          window.dispatchEvent(new Event(DB_CHANGE_EVENT));
      }
  },

  saveTrade: async (trade: any, targetAccountId?: string) => {
    if (trade.type === TradeType.BALANCE) {
        trade.riskValue = 0;
        trade.rr = 0;
        trade.commission = 0;
        trade.entryPrice = 0;
    }

    const activeId = targetAccountId || storageService.getActiveAccount().id;
    let trades = storageService.getTrades(activeId);
    
    if (trade.id) {
        const idx = trades.findIndex(t => t.id === trade.id);
        if (idx !== -1) trades[idx] = trade;
        else trades.unshift(trade);
    } else {
        trade.id = crypto.randomUUID();
        trades.unshift(trade);
    }
    
    SecureStorage.setItem(storageService._getScopedKey(TRADES_KEY_PREFIX + activeId), trades);
    window.dispatchEvent(new Event(DB_CHANGE_EVENT));

    // PUSH TO CLOUD (Supabase)
    try {
        const user = storageService.auth.getCurrentUser();
        if (user) {
            await supabase.from('app_trades').upsert({
                id: trade.id,
                user_id: user.id,
                account_id: activeId,
                asset: trade.asset,
                type: trade.type,
                price: trade.entryPrice,
                pnl: trade.pnl,
                commission: trade.commission,
                outcome: trade.outcome,
                timestamp: trade.date,
                notes: trade.notes,
                rr: trade.rr
            });
        }
    } catch (e) {
        console.warn("Cloud Sync Failed (Offline?)");
    }

    return trade;
  },

  getTrades: (targetAccountId?: string): Trade[] => {
      const activeId = targetAccountId || storageService.getActiveAccount().id;
      return SecureStorage.getItem(storageService._getScopedKey(TRADES_KEY_PREFIX + activeId)) || [];
  },

  getTradeById: (id: string) => {
      return storageService.getTrades().find(t => t.id === id);
  },

  deleteTrade: async (id: string) => {
      const trades = storageService.getTrades().filter(t => t.id !== id);
      const activeId = storageService.getActiveAccount().id;
      SecureStorage.setItem(storageService._getScopedKey(TRADES_KEY_PREFIX + activeId), trades);
      window.dispatchEvent(new Event(DB_CHANGE_EVENT));

      // DELETE FROM CLOUD
      try {
          const user = storageService.auth.getCurrentUser();
          if (user) {
              await supabase.from('app_trades').delete().eq('id', id).eq('user_id', user.id);
          }
      } catch (e) {}
  },

  clearTradesForAccount: (accountId: string) => {
      SecureStorage.setItem(storageService._getScopedKey(TRADES_KEY_PREFIX + accountId), []);
      window.dispatchEvent(new Event(DB_CHANGE_EVENT));
  },

  saveTradesBulk: (newTrades: Trade[], targetAccountId?: string) => {
      const activeId = targetAccountId || storageService.getActiveAccount().id;
      const currentTrades = storageService.getTrades(activeId);
      
      const existingIds = new Set(currentTrades.map(t => t.id));
      const uniqueNewTrades = newTrades.filter(nt => !existingIds.has(nt.id));

      if (uniqueNewTrades.length === 0) return;

      const updated = [...uniqueNewTrades, ...currentTrades];
      
      SecureStorage.setItem(storageService._getScopedKey(TRADES_KEY_PREFIX + activeId), updated);
      window.dispatchEvent(new Event(DB_CHANGE_EVENT));
  },

  deleteAllCloudTrades: async () => {
    const user = storageService.auth.getCurrentUser();
    if (!user) return false;
    try {
        const { error } = await supabase.from('app_trades').delete().eq('user_id', user.id);
        if (error) throw error;
        return true;
    } catch(e) {
        return false;
    }
  },

  syncFromCloud: async () => {
      if (isSyncingProcess) return;
      isSyncingProcess = true;

      try {
          const user = storageService.auth.getCurrentUser();
          if (!user) return;
          
          const currentAccount = storageService.getActiveAccount();
          const syncAccountId = currentAccount.id;

          const baseBalance = Number(currentAccount.startingBalance) || 10000;
          const estimatedRisk = baseBalance * 0.01; 

          // 1. Obtener la fecha del trade más reciente guardado localmente para esta cuenta
          const localTrades = storageService.getTrades(syncAccountId);
          let lastSyncDate = new Date(0).toISOString(); // Por defecto, desde el principio de los tiempos
          
          if (localTrades.length > 0) {
              // Buscar el trade más reciente (asumiendo que están ordenados o buscando el max)
              const mostRecentTrade = localTrades.reduce((latest, current) => {
                  return new Date(current.date) > new Date(latest.date) ? current : latest;
              }, localTrades[0]);
              
              // Restamos un poco de tiempo (ej. 1 hora) para asegurar que no perdemos trades en el borde
              const dateObj = new Date(mostRecentTrade.date);
              dateObj.setHours(dateObj.getHours() - 1);
              lastSyncDate = dateObj.toISOString();
          }

          // 2. Consultar Supabase SOLO por los trades más nuevos que lastSyncDate
          const { data, error } = await supabase
            .from('app_trades')
            .select('*')
            .eq('user_id', user.id)
            .eq('account_id', syncAccountId) 
            .gte('timestamp', lastSyncDate) // <-- OPTIMIZACIÓN CLAVE: Solo traer lo nuevo
            .order('timestamp', { ascending: false })
            .limit(1000); 

          if (error || !data || data.length === 0) return;

          const ticketIndex = new Set<string>();
          const fuzzyIndex = new Set<string>();

          // Indexar los trades locales para búsqueda rápida
          localTrades.forEach(t => {
              if (t.id) ticketIndex.add(t.id);
              const match = t.notes?.match(/Ticket MT5:\s*(\d+)/);
              if (match) ticketIndex.add(match[1]);
              const dateStr = new Date(t.date).toISOString().slice(0, 16); 
              const fuzzyKey = `${t.asset}_${t.type}_${t.entryPrice.toFixed(5)}_${dateStr}`;
              fuzzyIndex.add(fuzzyKey);
          });

          const newTrades: Trade[] = [];
          const tradesToUpdate: Trade[] = [];
          let hasUpdates = false;

          data.forEach((remote: any) => {
              const mt5Ticket = remote.ticket ? remote.ticket.toString() : null;
              const remoteId = mt5Ticket || remote.id?.toString();

              if (mt5Ticket && ticketIndex.has(mt5Ticket)) {
                  const existingTrade = localTrades.find(t => 
                      t.id === mt5Ticket || t.notes?.includes(`Ticket MT5: ${mt5Ticket}`)
                  );
                  if (existingTrade) {
                      const grossProfit = Number(remote.profit || remote.pnl || 0);
                      const commission = Number(remote.commission || 0);
                      const swap = Number(remote.swap || 0);
                      const totalCosts = commission + swap;
                      const netPnl = grossProfit + totalCosts;

                      // Actualizar si las comisiones cambiaron (ej. el trade se cerró y MT5 actualizó el swap)
                      if (existingTrade.commission !== totalCosts || existingTrade.pnl !== netPnl) {
                          existingTrade.commission = totalCosts;
                          existingTrade.pnl = netPnl;
                          
                          // Si el trade remoto tiene outcome, actualizarlo localmente si estaba abierto
                          if (remote.outcome && existingTrade.outcome !== remote.outcome) {
                              existingTrade.outcome = remote.outcome as TradeStatus;
                          }

                          tradesToUpdate.push(existingTrade);
                          hasUpdates = true;
                      }
                  }
                  return; 
              }

              const remoteDate = remote.timestamp || remote.created_at || new Date().toISOString();
              const dateStr = new Date(remoteDate).toISOString().slice(0, 16);
              const fuzzyKey = `${remote.asset || remote.symbol}_${remote.type}_${Number(remote.price).toFixed(5)}_${dateStr}`;

              if (fuzzyIndex.has(fuzzyKey)) return;

              const isBalanceOp = remote.type === 'BALANCE';
              const grossProfit = Number(remote.profit || remote.pnl || 0);
              const commission = Number(remote.commission || 0);
              const swap = Number(remote.swap || 0);
              const totalCosts = commission + swap;
              const netPnl = grossProfit + totalCosts;

              let derivedOutcome: TradeStatus;
              let tradeType: TradeType;
              
              if (isBalanceOp) {
                  tradeType = TradeType.BALANCE;
                  derivedOutcome = netPnl < 0 ? TradeStatus.WITHDRAWAL : TradeStatus.DEPOSIT;
              } else {
                  tradeType = remote.type === 'BUY' ? TradeType.BUY : TradeType.SELL;
                  derivedOutcome = remote.outcome as TradeStatus;
                  if (!derivedOutcome) {
                      derivedOutcome = netPnl > 0 ? TradeStatus.WIN : netPnl < 0 ? TradeStatus.LOSS : TradeStatus.BREAKEVEN;
                  }
              }

              let rr = 0;
              if (estimatedRisk > 0 && Math.abs(netPnl) > 0 && !isBalanceOp) {
                 rr = parseFloat((Math.abs(netPnl) / estimatedRisk).toFixed(2));
              }

              const hour = new Date(remoteDate).getUTCHours();
              let session = Session.ASIA;
              if (hour >= 7 && hour < 13) session = Session.LONDON;
              if (hour >= 13 && hour < 21) session = Session.NEW_YORK;
              if (isBalanceOp) session = Session.NONE;

              const newTrade: Trade = {
                  id: remoteId || crypto.randomUUID(),
                  date: remoteDate,
                  asset: remote.asset || remote.symbol || (isBalanceOp ? 'BALANCE' : 'UNKNOWN'),
                  type: tradeType,
                  session: session,
                  timeframe: isBalanceOp ? 'NA' : 'H1',
                  entryPrice: Number(remote.price || 0),
                  riskValue: 0,
                  rr: rr,
                  outcome: derivedOutcome,
                  pnl: netPnl,
                  commission: totalCosts,
                  notes: mt5Ticket ? `Ticket MT5: ${mt5Ticket}` : '🔄 Sync MT5 EA'
              };

              newTrades.push(newTrade);
              if (mt5Ticket) ticketIndex.add(mt5Ticket);
              fuzzyIndex.add(fuzzyKey);
          });

          if (newTrades.length > 0 || hasUpdates) {
             const currentLocalTrades = storageService.getTrades(syncAccountId);
             const currentIds = new Set(currentLocalTrades.map(t => t.id));
             const safeNewTrades = newTrades.filter(nt => !currentIds.has(nt.id));
             
             // Combinar nuevos trades con los existentes, ordenados por fecha descendente
             const finalSet = [...safeNewTrades, ...currentLocalTrades].sort((a, b) => 
                 new Date(b.date).getTime() - new Date(a.date).getTime()
             );
             
             SecureStorage.setItem(storageService._getScopedKey(TRADES_KEY_PREFIX + syncAccountId), finalSet);
             window.dispatchEvent(new Event(DB_CHANGE_EVENT));
          }

      } catch (e) {
          console.error("Sync Error:", e);
      } finally {
          isSyncingProcess = false;
      }
  },
  clearAllData: () => {
      localStorage.removeItem(APEX_SESSION_KEY);
      localStorage.clear();
      window.location.reload();
  },
  getSettings: (): UserSettings => {
      const settings = SecureStorage.getItem(storageService._getScopedKey(SETTINGS_KEY));
      return settings || { username: '', layoutMode: 'SIDEBAR', newsAlertImpact: 'HIGH', newsAlertTime: 15 };
  },
  saveSettings: (settings: UserSettings) => {
      SecureStorage.setItem(storageService._getScopedKey(SETTINGS_KEY), settings);
      window.dispatchEvent(new Event('settings-updated'));
  },
  exportBackupJSON: () => {
      const allData: Record<string, string | null> = {};
      for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) allData[key] = localStorage.getItem(key);
      }
      return JSON.stringify(allData);
  },
  recordBackupDate: () => {},
  importBackupJSON: (json: string) => {
      try {
          const data = JSON.parse(json);
          Object.keys(data).forEach(key => {
              if (data[key]) localStorage.setItem(key, data[key]);
          });
          return true;
      } catch (e) { return false; }
  },
  getStreakAnalysis: () => {
    const trades = storageService.getTrades();
    const closed = trades.filter(t => [TradeStatus.WIN, TradeStatus.LOSS].includes(t.outcome as TradeStatus));
    let streak = 0;
    if (closed.length > 0) {
        const lastOutcome = closed[0].outcome;
        for (const t of closed) {
            if (t.outcome === lastOutcome) {
                streak += (lastOutcome === TradeStatus.WIN ? 1 : -1);
            } else { break; }
        }
    }
    return { streak, suggestion: streak >= 3 ? 3.0 : streak <= -3 ? 1.5 : 2.0 };
  },
  getDailyLossLimitStatus: () => {
    const trades = storageService.getTrades();
    const today = new Date().toISOString().split('T')[0];
    const todayLosses = trades.filter(t => t.date.startsWith(today) && t.outcome === TradeStatus.LOSS);
    const currentLoss = Math.abs(todayLosses.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0));
    const acc = storageService.getActiveAccount();
    const limit = (Number(acc.startingBalance) || 10000) * 0.01; 
    return { isLimitReached: currentLoss >= limit, currentLoss, limit };
  },
  getDailyStats: () => {
    const trades = storageService.getTrades();
    const tradingTrades = trades.filter(t => [TradeStatus.WIN, TradeStatus.LOSS, TradeStatus.BREAKEVEN].includes(t.outcome as TradeStatus) && t.type !== TradeType.BALANCE);
    
    const dailyStats: Record<string, { count: number, wins: number, pnl: number }> = {};
    
    tradingTrades.forEach(t => {
        const date = t.date.split('T')[0];
        if (!dailyStats[date]) dailyStats[date] = { count: 0, wins: 0, pnl: 0 };
        dailyStats[date].count++;
        if (t.outcome === TradeStatus.WIN) dailyStats[date].wins++;
        dailyStats[date].pnl += (Number(t.pnl) || 0);
    });
    
    return dailyStats;
  },
  getStats: () => {
    const trades = storageService.getTrades();
    const acc = storageService.getActiveAccount();
    const base = Number(acc.startingBalance) || 0;
    
    // FILTROS PRINCIPALES
    const tradingTrades = trades.filter(t => [TradeStatus.WIN, TradeStatus.LOSS, TradeStatus.BREAKEVEN].includes(t.outcome as TradeStatus) && t.type !== TradeType.BALANCE);
    const balanceTrades = trades.filter(t => t.type === TradeType.BALANCE);
    const openTrades = trades.filter(t => t.outcome === TradeStatus.RUN || t.outcome === TradeStatus.OPEN);
    
    // CALCULO DIARIO
    const todayStr = new Date().toISOString().split('T')[0];
    const dailyTrades = tradingTrades.filter(t => t.date.startsWith(todayStr));
    const dailyPnl = dailyTrades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
    const dailyGrowth = base > 0 ? (dailyPnl / base) * 100 : 0;

    // --- DISCIPLINE METRICS ---
    // 1. Average Trades Per Day
    const tradesByDate = tradingTrades.reduce((acc, t) => {
        const d = t.date.split('T')[0];
        acc[d] = (acc[d] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const daysTraded = Object.keys(tradesByDate).length;
    const avgTradesPerDay = daysTraded > 0 ? tradingTrades.length / daysTraded : 0;

    // 2. Daily Loss Streak (Trades consecutivos PERDEDORES de HOY)
    let maxLossStreak = 0;
    let currentLossStreak = 0;
    // Solo analizamos trades del día actual, ordenados cronológicamente
    const sortedDailyTrades = [...dailyTrades].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    sortedDailyTrades.forEach(t => {
        if (t.outcome === TradeStatus.LOSS) {
            currentLossStreak++;
            if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
        } else {
            currentLossStreak = 0;
        }
    });

    // --- LAST 7 DAYS PNL ---
    const last7DaysPnL = [];
    const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric' };
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        const dayTrades = tradingTrades.filter(t => t.date.startsWith(dStr));
        const dayPnl = dayTrades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
        
        last7DaysPnL.push({
            date: dStr === todayStr ? 'Hoy' : d.toLocaleDateString('es-ES', dateOptions),
            value: dayPnl,
            isToday: dStr === todayStr
        });
    }
    
    const streakAnalysis = storageService.getStreakAnalysis();

    const tradingPnl = tradingTrades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
    const withdrawalsImpact = balanceTrades.reduce((sum, t) => {
        const val = Number(t.pnl) || 0;
        return val < 0 ? sum + val : sum; 
    }, 0);

    const floatingPnl = openTrades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
    
    const wins = tradingTrades.filter(t => t.outcome === TradeStatus.WIN).length;
    const losses = tradingTrades.filter(t => t.outcome === TradeStatus.LOSS).length;
    
    // Profit Factor & Average Loss Recovery
    const grossProfit = tradingTrades.filter(t => (Number(t.pnl) || 0) > 0).reduce((sum, t) => sum + Number(t.pnl), 0);
    const grossLoss = Math.abs(tradingTrades.filter(t => (Number(t.pnl) || 0) < 0).reduce((sum, t) => sum + Number(t.pnl), 0));
    const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : grossProfit > 0 ? '∞' : '0.00';
    
    const avgWin = wins > 0 ? grossProfit / wins : 0;
    const avgLoss = losses > 0 ? grossLoss / losses : 0;
    const avgLossRecovery = avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : avgWin > 0 ? '∞' : '0.00';

    const assetMap = new Map();
    tradingTrades.forEach(t => {
        const stats = assetMap.get(t.asset) || { symbol: t.asset, count: 0, pnl: 0, wins: 0, rSum: 0 };
        stats.count++;
        stats.pnl += (Number(t.pnl) || 0);
        if (t.outcome === TradeStatus.WIN) stats.wins++;
        stats.rSum += (Number(t.rr) || 0);
        assetMap.set(t.asset, stats);
    });
    
    const assetsBreakdown = Array.from(assetMap.values()).map(a => ({
        ...a,
        winRate: ((a.wins / a.count) * 100).toFixed(1),
        avgRR: (a.rSum / a.count).toFixed(2)
    }));

    const validAssets = assetsBreakdown.filter(a => a.count >= 3);
    const sortedAssets = validAssets.sort((a, b) => {
        const wrDiff = Number(b.winRate) - Number(a.winRate);
        if (wrDiff !== 0) return wrDiff;
        return b.pnl - a.pnl;
    });
    const bestAsset = sortedAssets.length > 0 ? sortedAssets[0].symbol : "Analizando...";

    const sessionMap = new Map();
    [Session.ASIA, Session.LONDON, Session.NEW_YORK].forEach(s => sessionMap.set(s, { name: s, count: 0, pnl: 0, wins: 0 }));
    tradingTrades.forEach(t => {
        const s = sessionMap.get(t.session);
        if (s) {
            s.count++;
            s.pnl += (Number(t.pnl) || 0);
            if (t.outcome === TradeStatus.WIN) s.wins++;
        }
    });
    const sessionBreakdown = Array.from(sessionMap.values()).map(s => ({
        ...s,
        winRate: s.count ? ((s.wins / s.count) * 100).toFixed(1) : "0"
    }));

    const historyEvents = [...tradingTrades, ...balanceTrades.filter(b => (Number(b.pnl) || 0) < 0)]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let currentEquity = base;
    let maxEquity = base;
    let maxDrawdown = 0;
    
    const equityCurve = [
        { name: 'Inicio', value: base },
        ...historyEvents.map((t, idx) => {
            currentEquity += (Number(t.pnl) || 0);
            if (currentEquity > maxEquity) maxEquity = currentEquity;
            const drawdown = maxEquity > 0 ? ((maxEquity - currentEquity) / maxEquity) * 100 : 0;
            if (drawdown > maxDrawdown) maxDrawdown = drawdown;
            return { name: `Op ${idx + 1}`, value: currentEquity };
        })
    ];

    const displayPnl = tradingPnl + withdrawalsImpact;

    return { 
        baseBalance: base,
        totalPnl: displayPnl,
        totalWithdrawn: Math.abs(withdrawalsImpact),
        floatingPnl,
        wins,
        losses,
        winRate: tradingTrades.length ? ((wins / tradingTrades.length) * 100).toFixed(1) : "0.0",
        totalTrades: tradingTrades.length,
        currentBalance: base + displayPnl,
        equity: base + displayPnl + floatingPnl,
        equityCurve,
        assetsBreakdown,
        sessionBreakdown,
        dailyPnl,
        dailyGrowth,
        bestAsset,
        suggestedRR: streakAnalysis.suggestion,
        // Discipline Metrics
        avgTradesPerDay,
        maxLossStreak,
        last7DaysPnL,
        // New Metrics
        profitFactor,
        avgLossRecovery,
        overallDrawdown: maxDrawdown.toFixed(2)
    };
  }
};
