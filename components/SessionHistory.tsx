
import React from 'react';
import { Session } from '../types';

interface SessionHistoryProps {
  sessions: Session[];
}

const formatTimestamp = (timestamp: number | null) => {
  if (!timestamp) return 'In Progress';
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const SessionHistory: React.FC<SessionHistoryProps> = ({ sessions }) => {
  const sortedSessions = [...sessions].sort((a, b) => b.startTime - a.startTime);

  return (
    <div>
      <h3 className="text-lg font-bold mb-4">Session History</h3>
      <div className="max-h-96 overflow-y-auto pr-2">
        {sortedSessions.length > 0 ? (
          <ul className="space-y-3">
            {sortedSessions.map((session) => (
              <li key={session.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">Chair {session.chairId}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatTimestamp(session.startTime)} - {formatTimestamp(session.endTime)}
                  </p>
                </div>
                <div className={`text-sm font-bold px-2 py-1 rounded-full ${session.duration !== null ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 animate-pulse'}`}>
                  {session.duration !== null ? `${session.duration} min` : 'Active'}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">No sessions recorded yet.</p>
        )}
      </div>
    </div>
  );
};

export default SessionHistory;
