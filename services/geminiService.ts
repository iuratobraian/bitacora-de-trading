
import { GoogleGenAI } from "@google/genai";

// Función auxiliar para obtener la instancia de IA de forma segura
const getAIInstance = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.warn("Gemini API Key no encontrada en process.env.API_KEY");
    }
    return new GoogleGenAI({ apiKey: apiKey || '' });
};

export const mastermindAnalyzeParameters = async (stats: any): Promise<string> => {
    try {
        const ai = getAIInstance();
        
        // CRÍTICO: Filtramos la data masiva (equityCurve) antes de enviar a Gemini
        // para evitar errores de payload y tokens excesivos.
        const leanStats = {
            winRate: stats.winRate,
            totalPnl: stats.totalPnl,
            avgRR: stats.avgRR || 0, // Fallback si no existe
            profitFactor: stats.profitFactor || 'N/A',
            assetsBreakdown: stats.assetsBreakdown?.map((a: any) => ({ symbol: a.symbol, wr: a.winRate, pnl: a.pnl })) || [],
            sessionBreakdown: stats.sessionBreakdown?.map((s: any) => ({ session: s.name, pnl: s.pnl })) || []
        };

        const prompt = `Actúa como una Mente Maestra en Trading Cuantitativo. Analiza estos parámetros simplificados de rendimiento:
        ${JSON.stringify(leanStats, null, 2)}
        
        Identifica:
        1. El "Fuga de Capital" (Asset o sesión con peor rendimiento).
        2. El "Par Maestro" (Donde el trader tiene ventaja estadística real).
        3. Una sugerencia técnica para optimizar el RR basada en los datos.
        
        Responde en formato Markdown profesional, breve y directo.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview',
            contents: prompt,
            config: { temperature: 0.7, topK: 40 }
        });

        return response.text || "La Mente Maestra no ha podido procesar los datos.";
    } catch (e: any) {
        console.error("Gemini Error:", e);
        // Retornamos el error específico para que el usuario sepa qué pasa
        return `⚠️ Error neuronal: ${e.message || "Conexión fallida"}. Verifica tu API Key o cuota.`;
    }
};

export const mastermindChat = async (message: string, stats: any, history: { role: 'user' | 'model', parts: { text: string }[] }[]): Promise<string> => {
    try {
        const ai = getAIInstance();
        
        const leanStats = {
            winRate: stats.winRate,
            totalPnl: stats.totalPnl,
            avgRR: stats.avgRR || 0,
            assetsBreakdown: stats.assetsBreakdown?.map((a: any) => ({ symbol: a.symbol, wr: a.winRate, pnl: a.pnl })) || [],
            sessionBreakdown: stats.sessionBreakdown?.map((s: any) => ({ session: s.name, pnl: s.pnl })) || []
        };

        const systemInstruction = `Eres la Mente Maestra, una IA experta en trading institucional y psicología de mercado. 
        Tienes acceso a las estadísticas actuales del trader: ${JSON.stringify(leanStats)}.
        Tu objetivo es ayudar al trader a mejorar su consistencia, gestión de riesgo y disciplina.
        Responde de forma profesional, directa y con un toque de autoridad futurista.
        Usa Markdown para dar formato a tus respuestas.`;

        const chat = ai.chats.create({
            model: 'gemini-2.5-flash-preview',
            config: {
                systemInstruction,
                temperature: 0.8,
            },
            history: history
        });

        const response = await chat.sendMessage({ message });
        return response.text || "No puedo procesar tu solicitud en este momento.";
    } catch (e: any) {
        console.error("Chat Error:", e);
        return `⚠️ Error de comunicación neuronal: ${e.message}`;
    }
};
