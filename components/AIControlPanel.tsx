import React, { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = 'http://localhost:3001';

const AIControlPanel: React.FC = () => {
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStatus = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/ai/status`);
            const data = await response.json();
            setIsRunning(data.isRunning);
        } catch (e) {
            setError('Failed to connect to the server.');
        }
    }, []);

    const fetchLogs = useCallback(async () => {
        if (!isRunning) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/ai/logs`);
            const data = await response.json();
            setLogs(data);
        } catch (e) {
            console.error('Failed to fetch logs');
        }
    }, [isRunning]);

    useEffect(() => {
        fetchStatus();
        const statusInterval = setInterval(fetchStatus, 5000);
        const logsInterval = setInterval(fetchLogs, 2000);
        return () => {
            clearInterval(statusInterval);
            clearInterval(logsInterval);
        };
    }, [fetchStatus, fetchLogs]);
    
    const handleAction = async (action: 'start' | 'stop') => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/ai/${action}`, { method: 'POST' });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || `Failed to ${action} AI.`);
            }
            // Manually set status for immediate UI feedback
            setIsRunning(action === 'start');
            if(action === 'stop') setLogs([]);
        } catch (e) {
            setError(e instanceof Error ? e.message : `An unknown error occurred.`);
        } finally {
            setIsLoading(false);
        }
    };

    const statusColor = isRunning ? 'text-green-500' : 'text-red-500';
    const statusBg = isRunning ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50';

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
            <h3 className="text-lg font-bold mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">AI Control Panel</h3>
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-shrink-0 md:w-1/3">
                    <div className="flex items-center mb-3">
                        <span className="font-semibold mr-2">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-sm font-bold ${statusBg} ${statusColor}`}>
                            {isRunning ? 'Running' : 'Inactive'}
                        </span>
                    </div>
                    <div className="flex flex-col space-y-2">
                        <button
                            onClick={() => handleAction('start')}
                            disabled={isRunning || isLoading}
                            className="w-full px-3 py-2 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
                        >
                            {isLoading && !isRunning ? 'Starting...' : 'Start AI Monitoring'}
                        </button>
                        <button
                            onClick={() => handleAction('stop')}
                            disabled={!isRunning || isLoading}
                            className="w-full px-3 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
                        >
                            {isLoading && isRunning ? 'Stopping...' : 'Stop AI Monitoring'}
                        </button>
                    </div>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </div>
                <div className="flex-grow bg-gray-100 dark:bg-gray-900 p-3 rounded-md">
                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Live AI Logs</h4>
                    <div className="h-32 overflow-y-auto bg-white dark:bg-gray-800 rounded p-2 font-mono text-xs text-gray-600 dark:text-gray-400">
                        {logs.length > 0 ? logs.map((log, index) => (
                            <p key={index} className="whitespace-pre-wrap">{log}</p>
                        )) : <p>AI is inactive. Start monitoring to see logs.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIControlPanel;
