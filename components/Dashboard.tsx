import React, { useState, useEffect, useCallback } from 'react';
import { Chair, Session } from '../types';
import AIControlPanel from './AIControlPanel';
import RealTimeCounter from './RealTimeCounter';
import SessionHistory from './SessionHistory';
import AnalyticsCharts from './AnalyticsCharts';

interface DashboardProps {
  chairs: Chair[];
}

const API_BASE_URL = 'http://localhost:3001';

const Dashboard: React.FC<DashboardProps> = ({ chairs }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    // Only set loading on the initial fetch
    if (isLoading) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/sessions`);
        if (!response.ok) {
          throw new Error('Failed to fetch sessions.');
        }
        const data = await response.json();
        setSessions(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Subsequent fetches don't show loading spinner
      const response = await fetch(`${API_BASE_URL}/api/sessions`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    }
  }, [isLoading]);

  useEffect(() => {
    fetchSessions(); // Initial fetch
    const interval = setInterval(fetchSessions, 3000); // Poll every 3 seconds
    return () => clearInterval(interval); // Cleanup on unmount
  }, [fetchSessions]);

  if (isLoading) {
    return <div className="text-center py-10">Loading session data...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <AIControlPanel />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <RealTimeCounter sessions={sessions} chairs={chairs} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
           <AnalyticsCharts sessions={sessions} />
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
           <SessionHistory sessions={sessions} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;