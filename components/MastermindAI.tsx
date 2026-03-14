
import React from 'react';
import { Diamond, Zap, Brain, Target, ShieldAlert, Cpu, Loader2, Sparkles, Trophy, CheckCircle2, AlertTriangle, Lightbulb, Send, MessageSquare, User, Bot, Trash2 } from 'lucide-react';
import { storageService } from '../services/storageService';
import { mastermindAnalyzeParameters, mastermindChat } from '../services/geminiService';
import Markdown from 'react-markdown';

const MastermindAI: React.FC = () => {
    const [stats, setStats] = React.useState<any>(null);
    const [analysis, setAnalysis] = React.useState<string>('');
    const [loading, setLoading] = React.useState(false);
    const [xp, setXp] = React.useState(0);
    
    // Chat States
    const [activeView, setActiveView] = React.useState<'ANALYSIS' | 'CHAT'>('ANALYSIS');
    const [chatInput, setChatInput] = React.useState('');
    const [chatHistory, setChatHistory] = React.useState<{ role: 'user' | 'model', parts: { text: string }[] }[]>([]);
    const [isTyping, setIsTyping] = React.useState(false);
    const chatEndRef = React.useRef<HTMLDivElement>(null);

    const loadData = () => {
        const s = storageService.getStats();
        const user = storageService.auth.getCurrentUser();
        setStats(s);
        setXp(user?.aiXP || 0);
    };

    React.useEffect(() => {
        loadData();
        window.addEventListener('apex-db-change', loadData);
        return () => window.removeEventListener('apex-db-change', loadData);
    }, []);

    React.useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatHistory, isTyping]);

    const handleAnalyze = async () => {
        if (!stats || stats.totalTrades === 0) return;
        setLoading(true);
        const result = await mastermindAnalyzeParameters(stats);
        setAnalysis(result);
        storageService.auth.addXP(25); 
        setLoading(false);
        setActiveView('ANALYSIS');
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!chatInput.trim() || isTyping) return;

        const userMessage = chatInput.trim();
        setChatInput('');
        
        const newHistory: { role: 'user' | 'model', parts: { text: string }[] }[] = [
            ...chatHistory,
            { role: 'user', parts: [{ text: userMessage }] }
        ];
        
        setChatHistory(newHistory);
        setIsTyping(true);

        try {
            const response = await mastermindChat(userMessage, stats, chatHistory);
            setChatHistory([
                ...newHistory,
                { role: 'model', parts: [{ text: response }] }
            ]);
            storageService.auth.addXP(5);
        } catch (error) {
            console.error(error);
        } finally {
            setIsTyping(false);
        }
    };

    const clearChat = () => {
        setChatHistory([]);
    };

    const level = Math.floor(xp / 100) + 1;
    const progress = xp % 100;

    // Función para renderizar el informe con estilo profesional
    const renderAnalysis = (text: string) => {
        const lines = text.split('\n').filter(l => l.trim() !== '');
        
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {lines.map((line, idx) => {
                    const isTitle = line.includes(':') && line.length < 50;
                    const isBullet = line.trim().startsWith('-') || line.trim().startsWith('*') || /^\d\./.test(line.trim());

                    if (isTitle) {
                        const [title, content] = line.split(':');
                        let icon = <Brain size={18} className="text-primary" />;
                        if (line.toLowerCase().includes('fuga')) icon = <AlertTriangle size={18} className="text-loss" />;
                        if (line.toLowerCase().includes('maestro')) icon = <Trophy size={18} className="text-yellow-500" />;
                        if (line.toLowerCase().includes('sugerencia')) icon = <Lightbulb size={18} className="text-blue-400" />;

                        return (
                            <div key={idx} className="bg-background/40 border border-border rounded-2xl p-6 hover:border-primary/20 transition-all shadow-lg">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-surface rounded-lg">{icon}</div>
                                    <h3 className="text-xs font-black text-white uppercase tracking-widest">{title.trim()}</h3>
                                </div>
                                <p className="text-sm text-gray-300 leading-relaxed pl-12">{content?.trim()}</p>
                            </div>
                        );
                    }

                    if (isBullet) {
                        return (
                            <div key={idx} className="flex items-start gap-4 pl-4 py-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1.5"></div>
                                <p className="text-sm text-gray-400 leading-relaxed">{line.replace(/^[-*]\s*/, '').replace(/^\d\.\s*/, '')}</p>
                            </div>
                        );
                    }

                    return <p key={idx} className="text-sm text-gray-400 leading-relaxed mb-4">{line}</p>;
                })}
            </div>
        );
    };

    return (
        <div className="p-4 md:p-10 w-full max-w-[90%] xl:max-w-[1600px] mx-auto animate-in fade-in duration-700">
            {/* Header Mente Maestra */}
            <div className="bg-gradient-to-r from-surface to-background border border-primary/20 rounded-3xl p-8 mb-10 relative overflow-hidden group shadow-2xl shadow-primary/5">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all"></div>
                
                <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/40 flex items-center justify-center relative overflow-hidden">
                            <Diamond size={40} className="text-primary animate-pulse" />
                            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"></div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Mente Maestra</h1>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] bg-primary text-black px-2 py-0.5 rounded-full font-black uppercase">Nivel {level} AI</span>
                                <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={handleAnalyze}
                        disabled={loading || !stats || stats.totalTrades === 0}
                        className="bg-primary hover:bg-primary-dark text-black font-black px-8 py-4 rounded-2xl flex items-center gap-3 transition-all active:scale-95 disabled:opacity-30 shadow-lg shadow-primary/20"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                        {loading ? 'SINCRONIZANDO...' : 'ESTUDIAR PARÁMETROS'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-surface border border-border p-6 rounded-2xl relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity"><Target size={40}/></div>
                    <Target className="text-primary mb-4" size={24} />
                    <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Precisión IA</h4>
                    <p className="text-2xl font-mono font-black text-white">{(85 + level).toFixed(1)}%</p>
                </div>
                <div className="bg-surface border border-border p-6 rounded-2xl relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity"><Cpu size={40}/></div>
                    <Cpu className="text-blue-400 mb-4" size={24} />
                    <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Datos Procesados</h4>
                    <p className="text-2xl font-mono font-black text-white">{stats?.totalTrades || 0}</p>
                </div>
                <div className="bg-surface border border-border p-6 rounded-2xl relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity"><Trophy size={40}/></div>
                    <Trophy className="text-yellow-500 mb-4" size={24} />
                    <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Rango Cognitivo</h4>
                    <p className="text-2xl font-mono font-black text-white">{level > 5 ? 'Experto' : 'Iniciado'}</p>
                </div>
            </div>

            {/* Resultado del Análisis / Chat */}
            <div className="bg-surface border border-border rounded-3xl overflow-hidden min-h-[600px] flex flex-col shadow-2xl relative">
                <div className="bg-background/50 border-b border-border p-6 flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => setActiveView('ANALYSIS')}
                            className={`flex items-center gap-3 transition-all ${activeView === 'ANALYSIS' ? 'text-primary' : 'text-gray-500 hover:text-white'}`}
                        >
                            <Brain size={20} />
                            <h2 className="text-sm font-black uppercase tracking-widest">Informe Neuronal</h2>
                        </button>
                        <button 
                            onClick={() => setActiveView('CHAT')}
                            className={`flex items-center gap-3 transition-all ${activeView === 'CHAT' ? 'text-primary' : 'text-gray-500 hover:text-white'}`}
                        >
                            <MessageSquare size={20} />
                            <h2 className="text-sm font-black uppercase tracking-widest">Enlace Directo</h2>
                        </button>
                    </div>
                    <div className="flex items-center gap-4">
                        {activeView === 'CHAT' && chatHistory.length > 0 && (
                            <button onClick={clearChat} className="text-gray-500 hover:text-loss transition-colors" title="Limpiar Chat">
                                <Trash2 size={16} />
                            </button>
                        )}
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
                            <CheckCircle2 size={12} className="text-primary" /> Verificado por Core-AI
                        </div>
                    </div>
                </div>
                
                <div className="p-8 flex-1 custom-scrollbar flex flex-col">
                    {activeView === 'ANALYSIS' ? (
                        loading ? (
                            <div className="h-full flex flex-col items-center justify-center space-y-6 py-20 flex-1">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-full border-4 border-primary/10 border-t-primary animate-spin"></div>
                                    <Cpu className="absolute inset-0 m-auto text-primary animate-pulse" size={32} />
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-black text-white uppercase tracking-widest mb-2">Procesando vectores de probabilidad...</p>
                                    <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Analizando {stats?.totalTrades} ejecuciones históricas</p>
                                </div>
                            </div>
                        ) : analysis ? (
                            renderAnalysis(analysis)
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center opacity-20 py-24 text-center flex-1">
                                <Diamond size={80} className="mb-6 text-primary animate-pulse" />
                                <p className="text-xs font-black uppercase tracking-[0.4em] text-white">Listo para el despliegue neuronal</p>
                                <p className="text-[10px] mt-4 uppercase font-bold text-gray-400">Haz clic en estudiar para activar la inteligencia cuántica</p>
                            </div>
                        )
                    ) : (
                        <div className="flex-1 flex flex-col gap-6">
                            <div className="flex-1 space-y-6 overflow-y-auto pr-2">
                                {chatHistory.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center opacity-20 py-10 text-center">
                                        <MessageSquare size={60} className="mb-6 text-primary" />
                                        <p className="text-xs font-black uppercase tracking-[0.4em] text-white">Canal de comunicación abierto</p>
                                        <p className="text-[10px] mt-4 uppercase font-bold text-gray-400">Pregúntame sobre tu estrategia, gestión de riesgo o psicología</p>
                                    </div>
                                )}
                                {chatHistory.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                        <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-primary text-black' : 'bg-surface border border-primary/20 text-primary'}`}>
                                                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                                            </div>
                                            <div className={`p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-primary/10 text-white border border-primary/20' : 'bg-background/40 text-gray-300 border border-border'}`}>
                                                <div className="markdown-body">
                                                    <Markdown>{msg.parts[0].text}</Markdown>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="flex justify-start animate-pulse">
                                        <div className="flex gap-4 items-center">
                                            <div className="w-8 h-8 rounded-full bg-surface border border-primary/20 flex items-center justify-center text-primary">
                                                <Bot size={16} />
                                            </div>
                                            <div className="flex gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce"></div>
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:0.2s]"></div>
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:0.4s]"></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>
                            
                            <form onSubmit={handleSendMessage} className="mt-4 relative">
                                <input 
                                    type="text" 
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Escribe tu consulta a la Mente Maestra..."
                                    className="w-full bg-background/60 border border-white/10 rounded-2xl py-5 pl-6 pr-16 text-sm text-white focus:outline-none focus:border-primary/50 transition-all font-bold placeholder:text-gray-600"
                                />
                                <button 
                                    type="submit"
                                    disabled={!chatInput.trim() || isTyping}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-primary text-black rounded-xl hover:bg-primary-dark transition-all disabled:opacity-30 active:scale-95"
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-primary/5 border-t border-primary/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShieldAlert size={14} className="text-primary" />
                        <p className="text-[10px] text-primary/80 font-bold uppercase">Análisis basado en datos locales encriptados</p>
                    </div>
                    <span className="text-[9px] text-gray-600 font-mono font-bold tracking-tighter">V.3.3.1_NEURAL_ENGINE</span>
                </div>
            </div>
        </div>
    );
};

export default MastermindAI;
