
import { useState, useEffect, useCallback } from 'react';
import { Session } from '../types';

const SESSIONS_STORAGE_KEY = 'barberShopSessions';

export const useSessionManager = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessions, setActiveSessions] = useState<Map<number, Session>>(new Map());

  useEffect(() => {
    try {
      const storedSessions = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (storedSessions) {
        setSessions(JSON.parse(storedSessions));
      }
    } catch (error) {
      console.error("Failed to load sessions from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error("Failed to save sessions to localStorage", error);
    }
  }, [sessions]);

  const startSession = useCallback((chairId: number) => {
    if (activeSessions.has(chairId)) return; // Session already active

    const newSession: Session = {
      id: `sess_${chairId}_${Date.now()}`,
      chairId,
      startTime: Date.now(),
      endTime: null,
      duration: null,
    };

    setActiveSessions(prev => new Map(prev).set(chairId, newSession));
    // We add to the main sessions list only when it's active for real-time view
    setSessions(prev => [...prev, newSession]); 
  }, [activeSessions]);

  const endSession = useCallback((chairId: number) => {
    const activeSession = activeSessions.get(chairId);
    if (!activeSession) return;

    const endTime = Date.now();
    const duration = Math.round((endTime - activeSession.startTime) / (1000 * 60)); // Duration in minutes

    const updatedSession = { ...activeSession, endTime, duration };

    setSessions(prev =>
      prev.map(s => (s.id === updatedSession.id ? updatedSession : s))
    );

    setActiveSessions(prev => {
      const newMap = new Map(prev);
      newMap.delete(chairId);
      return newMap;
    });
  }, [activeSessions]);

  return { sessions, activeSessions, startSession, endSession };
};
