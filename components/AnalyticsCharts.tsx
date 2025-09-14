
import React, { useState, useMemo } from 'react';
import { Session } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalyticsChartsProps {
  sessions: Session[];
}

type ChartData = {
    name: string;
    sessions: number;
};

type ViewMode = 'daily' | 'weekly' | 'monthly';

const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ sessions }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('daily');

    const completedSessions = useMemo(() => sessions.filter(s => s.endTime !== null), [sessions]);

    const chartData = useMemo<ChartData[]>(() => {
        const dataMap = new Map<string, number>();

        completedSessions.forEach(session => {
            const date = new Date(session.startTime);
            let key = '';

            if (viewMode === 'daily') {
                key = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            } else if (viewMode === 'weekly') {
                const day = date.getDay();
                const diff = date.getDate() - day + (day === 0 ? -6 : 1);
                const weekStart = new Date(date.setDate(diff));
                key = `Week of ${weekStart.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
            } else { // monthly
                key = date.toLocaleDateString([], { year: 'numeric', month: 'long' });
            }

            dataMap.set(key, (dataMap.get(key) || 0) + 1);
        });

        const sortedData = Array.from(dataMap.entries()).map(([name, sessions]) => ({ name, sessions }));
        
        // A simple sort for daily/weekly. Monthly is harder to sort by name so we leave it.
        if (viewMode !== 'monthly') {
            return sortedData.sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());
        }

        return sortedData;

    }, [completedSessions, viewMode]);

    const ViewButton: React.FC<{mode: ViewMode; children: React.ReactNode}> = ({ mode, children }) => (
        <button 
            onClick={() => setViewMode(mode)}
            className={`px-3 py-1 text-sm font-medium rounded-md ${viewMode === mode ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
        >
            {children}
        </button>
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Session Analytics</h3>
                <div className="flex space-x-2">
                    <ViewButton mode="daily">Daily</ViewButton>
                    <ViewButton mode="weekly">Weekly</ViewButton>
                    <ViewButton mode="monthly">Monthly</ViewButton>
                </div>
            </div>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <BarChart
                        data={chartData}
                        margin={{
                            top: 5, right: 20, left: -10, bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                        <XAxis dataKey="name" tick={{ fill: 'currentColor', fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fill: 'currentColor', fontSize: 12 }} />
                        <Tooltip
                            cursor={{fill: 'rgba(128, 128, 128, 0.1)'}}
                            contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', color: '#fff', borderRadius: '0.5rem' }}
                        />
                        <Legend />
                        <Bar dataKey="sessions" fill="#3b82f6" name="Completed Sessions" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default AnalyticsCharts;
