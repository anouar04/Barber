import React, { useState, useRef, MouseEvent, useCallback, useEffect } from 'react';
import { ROI, Chair } from '../types';

interface ROISelectorProps {
  chairs: Chair[];
  imageUrl: string;
  onROIsDefined: (rois: (ROI | null)[]) => Promise<void>;
}

const ROISelector: React.FC<ROISelectorProps> = ({ chairs, imageUrl, onROIsDefined }) => {
  const [rois, setRois] = useState<(ROI | null)[]>(() => chairs.map(c => c.roi));
  const [drawing, setDrawing] = useState<boolean>(false);
  const [currentRect, setCurrentRect] = useState<ROI | null>(null);
  const [activeChairIndex, setActiveChairIndex] = useState<number>(0);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  
  const chairColors = ['border-blue-500', 'border-green-500', 'border-yellow-500', 'border-red-500'];
  const chairBgColors = ['bg-blue-500/20', 'bg-green-500/20', 'bg-yellow-500/20', 'bg-red-500/20'];

  const getMousePos = (e: MouseEvent<HTMLDivElement>): { x: number; y: number } => {
    const rect = imageContainerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (activeChairIndex >= chairs.length) return;
    setDrawing(true);
    const { x, y } = getMousePos(e);
    setCurrentRect({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!drawing || !currentRect) return;
    const { x, y } = getMousePos(e);
    setCurrentRect({
      ...currentRect,
      width: x - currentRect.x,
      height: y - currentRect.y,
    });
  };

  const handleMouseUp = () => {
    if (!drawing || !currentRect) return;
    setDrawing(false);
    
    const finalRect: ROI = {
        x: currentRect.width < 0 ? currentRect.x + currentRect.width : currentRect.x,
        y: currentRect.height < 0 ? currentRect.y + currentRect.height : currentRect.y,
        width: Math.abs(currentRect.width),
        height: Math.abs(currentRect.height),
    };
    
    if (finalRect.width > 5 && finalRect.height > 5) {
        const newRois = [...rois];
        newRois[activeChairIndex] = finalRect;
        setRois(newRois);
        if(activeChairIndex + 1 < chairs.length) {
            setActiveChairIndex(activeChairIndex + 1);
        }
    }
    setCurrentRect(null);
  };

  const handleContinue = async () => {
    setIsSaving(true);
    await onROIsDefined(rois);
    setIsSaving(false);
  }

  const handleReset = useCallback(() => {
    setRois(chairs.map(() => null));
    setActiveChairIndex(0);
  }, [chairs]);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Define Chair Zones (ROI)</h2>
      <p className="mb-4 text-gray-600 dark:text-gray-400">
        Click and drag on the image below to draw a box for each chair. You are currently defining the zone for: 
        <span className={`font-bold p-1 rounded ${chairColors[activeChairIndex % chairColors.length].replace('border-','text-')}`}>
          {chairs[activeChairIndex]?.name || 'All chairs defined'}
        </span>.
      </p>
      <div className="flex flex-col md:flex-row gap-6">
        <div
          ref={imageContainerRef}
          className="relative w-full max-w-4xl aspect-video cursor-crosshair rounded-lg overflow-hidden bg-gray-300 dark:bg-gray-700"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {imageUrl && <img src={imageUrl} alt="Barber shop placeholder" className="w-full h-full object-cover select-none" />}
          {rois.map((roi, index) =>
            roi ? (
              <div
                key={index}
                className={`absolute border-2 ${chairColors[index % chairColors.length]} ${chairBgColors[index % chairBgColors.length]}`}
                style={{
                  left: roi.x,
                  top: roi.y,
                  width: roi.width,
                  height: roi.height,
                }}
              >
                 <span className={`absolute -top-6 left-0 text-sm font-semibold ${chairColors[index % chairColors.length].replace('border-','text-')}`}>
                    {chairs[index].name}
                 </span>
              </div>
            ) : null
          )}
          {drawing && currentRect && (
            <div
              className={`absolute border-2 border-dashed ${chairColors[activeChairIndex % chairColors.length]}`}
              style={{
                left: currentRect.width > 0 ? currentRect.x : currentRect.x + currentRect.width,
                top: currentRect.height > 0 ? currentRect.y : currentRect.y + currentRect.height,
                width: Math.abs(currentRect.width),
                height: Math.abs(currentRect.height),
              }}
            />
          )}
        </div>
        <div className="flex-shrink-0">
          <h3 className="font-bold mb-2">Configuration</h3>
          <ul className="space-y-2 mb-4">
            {chairs.map((chair, index) => (
              <li key={chair.id} className={`p-2 rounded-md ${activeChairIndex === index ? 'bg-blue-100 dark:bg-blue-900/50' : ''}`}>
                 <span className={`inline-block w-4 h-4 rounded-full mr-2 ${chairColors[index % chairColors.length].replace('border-', 'bg-')}`}></span>
                 {chair.name}: {rois[index] ? '✅ Defined' : '...'}
              </li>
            ))}
          </ul>
          <div className="space-y-2">
            <button
                onClick={handleContinue}
                disabled={rois.some(r => r === null) || isSaving}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                {isSaving ? 'Saving...' : 'Continue to Dashboard'}
            </button>
            <button
                onClick={handleReset}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition duration-300"
            >
                Reset Zones
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ROISelector;
