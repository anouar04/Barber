
import React, { useState, useCallback, useEffect } from 'react';
// FIX: Import the ROI type.
import { Chair, ROI } from './types';
import ROISelector from './components/ROISelector';
import Dashboard from './components/Dashboard';

const API_BASE_URL = 'http://localhost:3001';

const App: React.FC = () => {
  const [isSetupMode, setIsSetupMode] = useState<boolean>(false);
  const [chairs, setChairs] = useState<Chair[]>([]);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/config`);
      if (!response.ok) {
        throw new Error('Failed to fetch configuration from the server.');
      }
      const config = await response.json();
      setChairs(config.chairs);
      setImageUrl(config.dvrStreamUrl);

      // If any chair doesn't have an ROI defined, start in setup mode.
      if (config.chairs.some((c: Chair) => c.roi === null)) {
        setIsSetupMode(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleROIsDefined = useCallback(async (definedRois: (ROI | null)[]) => {
    const updatedChairs = chairs.map((chair, index) => ({
      ...chair,
      roi: definedRois[index] || null,
    }));
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chairs: updatedChairs }),
      });
      if (!response.ok) {
        throw new Error('Failed to save configuration.');
      }
      setChairs(updatedChairs);
      setIsSetupMode(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not save ROIs.');
    }
  }, [chairs]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 text-white">Loading configuration...</div>;
  }
  
  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-red-100 text-red-700">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans">
      <header className="bg-white dark:bg-gray-800 shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121M12 12l2.879-2.879M12 12L9.121 14.879M12 3a9 9 0 110 18 9 9 0 010-18z" /></svg>
            Barber Shop Monitor
          </h1>
          { !isSetupMode && chairs.length > 0 && (
            <button
              onClick={() => setIsSetupMode(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300"
            >
              Re-configure Zones
            </button>
          )}
        </div>
      </header>
      <main className="container mx-auto p-4 md:p-6">
        {isSetupMode ? (
          <ROISelector chairs={chairs} imageUrl={imageUrl} onROIsDefined={handleROIsDefined} />
        ) : (
          <Dashboard chairs={chairs} />
        )}
      </main>
    </div>
  );
};

export default App;