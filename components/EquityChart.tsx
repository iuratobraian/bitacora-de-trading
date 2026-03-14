import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';

interface EquityChartProps {
    data: any[];
}

// Default export is required for React.lazy
const EquityChart: React.FC<EquityChartProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center text-gray-600 border border-dashed border-border rounded-lg">
                <Activity size={32} className="mb-2 opacity-50"/>
                <p className="text-sm">Registra operaciones para visualizar tu crecimiento</p>
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
                <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00cc66" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#00cc66" stopOpacity={0}/>
                </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis 
                    dataKey="name" 
                    stroke="#555" 
                    tick={{fill: '#555', fontSize: 10}} 
                    axisLine={false} 
                    tickLine={false} 
                    minTickGap={30} 
                />
                <YAxis 
                    stroke="#555" 
                    tick={{fill: '#555', fontSize: 10}} 
                    axisLine={false} 
                    tickLine={false} 
                    domain={['auto', 'auto']} 
                />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#262626', color: '#fff', fontSize: '12px' }}
                    itemStyle={{ color: '#00cc66' }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Balance']}
                />
                <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#00cc66" 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                    activeDot={{r: 4, strokeWidth: 0}} 
                />
            </AreaChart>
        </ResponsiveContainer>
    );
};

export default EquityChart;