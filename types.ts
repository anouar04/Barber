
export interface ROI {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Chair {
  id: number;
  name: string;
  roi: ROI | null;
}

export interface Session {
  id: string;
  chairId: number;
  startTime: number; // as timestamp
  endTime: number | null; // as timestamp
  duration: number | null; // in minutes
}
