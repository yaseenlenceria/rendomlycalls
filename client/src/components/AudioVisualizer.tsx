import { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  stream: MediaStream | null;
  isActive: boolean;
}

export function AudioVisualizer({ stream, isActive }: AudioVisualizerProps) {
  // Simple CSS-based fake visualizer for UI flair if no stream analysis
  // In a real production app, we'd use Web Audio API to drive these bars
  // For this MVP, we'll use CSS animations toggled by isActive
  
  return (
    <div className="flex items-center justify-center gap-1.5 h-32 w-full">
      {isActive ? (
        <>
          <div className="bar w-2 bg-gradient-to-t from-primary to-secondary rounded-full h-1/2"></div>
          <div className="bar w-2 bg-gradient-to-t from-primary to-secondary rounded-full h-3/4 delay-75"></div>
          <div className="bar w-2 bg-gradient-to-t from-primary to-secondary rounded-full h-full delay-150"></div>
          <div className="bar w-2 bg-gradient-to-t from-primary to-secondary rounded-full h-2/3 delay-100"></div>
          <div className="bar w-2 bg-gradient-to-t from-primary to-secondary rounded-full h-1/3 delay-200"></div>
        </>
      ) : (
        <div className="w-16 h-16 rounded-full bg-muted border-2 border-border flex items-center justify-center">
          <div className="w-3 h-3 bg-muted-foreground rounded-full animate-pulse"></div>
        </div>
      )}
      
      {/* Hidden audio element to play the stream */}
      {stream && (
        <audio 
          autoPlay 
          ref={(audio) => {
            if (audio && stream) audio.srcObject = stream;
          }} 
        />
      )}
    </div>
  );
}
