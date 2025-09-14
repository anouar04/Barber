
import React from 'react';
import { Session, Chair } from '../types';

interface RealTimeCounterProps {
  sessions: Session[];
  chairs: Chair[];
}

const isToday = (someDate: number) => {
    const today = new Date();
    const date = new Date(someDate);
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
}

const StatCard: React.FC<{ title: string; value: string; icon: JSX.Element }> = ({ title, value, icon }) => {
    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-500 dark:text-blue-400 mr-4">
                {icon}
            </div>
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
            </div>
        </div>
    );
};

const RealTimeCounter: React.FC<RealTimeCounterProps> = ({ sessions, chairs }) => {
  const sessionsToday = sessions.filter(s => isToday(s.startTime));
  const activeSessions = sessions.filter(s => s.endTime === null).length;
  const totalCompletedToday = sessionsToday.filter(s => s.endTime !== null).length;

  const totalDurationToday = sessionsToday
    .filter(s => s.duration !== null)
    .reduce((acc, s) => acc + (s.duration || 0), 0);

  return (
    <>
      <StatCard 
        title="Total Sessions Today" 
        value={totalCompletedToday.toString()}
        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a3.002 3.002 0 01-3.712 0M12 15a3 3 0 110-6 3 3 0 010 6z" /></svg>}
      />
      <StatCard 
        title="Active Sessions" 
        value={activeSessions.toString()}
        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.657 7.343A8 8 0 0117.657 18.657z" /></svg>}
      />
       <StatCard 
        title="Total Minutes Today" 
        value={totalDurationToday.toString()}
        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
      />
      <StatCard 
        title="Avg. Duration (min)" 
        value={totalCompletedToday > 0 ? (totalDurationToday / totalCompletedToday).toFixed(1) : '0'}
        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>}
      />
    </>
  );
};

export default RealTimeCounter;
