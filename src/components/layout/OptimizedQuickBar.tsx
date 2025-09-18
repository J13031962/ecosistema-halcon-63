import React, { memo } from 'react';
import { OperationalButton as Button } from "@/components/ui/operational-button";
import { AlertTriangle } from "lucide-react";

interface OptimizedQuickBarProps {
  showQuickBar: boolean;
  onGenerateAlarm: () => void;
}

// Memoized component to prevent unnecessary re-renders
const OptimizedQuickBar = memo(({ showQuickBar, onGenerateAlarm }: OptimizedQuickBarProps) => {
  return (
    <div 
      className={`
        fixed top-4 left-1/2 transform -translate-x-1/2 z-40
        transition-all duration-300 ease-in-out
        ${showQuickBar 
          ? 'translate-y-0 opacity-100 scale-100' 
          : '-translate-y-full opacity-0 scale-95 pointer-events-none'
        }
        will-change-transform
      `}
    >
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg px-4 py-2">
        <Button 
          onClick={onGenerateAlarm}
          size="sm"
          className="whitespace-nowrap"
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Generar Nueva Alarma
        </Button>
      </div>
    </div>
  );
});

OptimizedQuickBar.displayName = 'OptimizedQuickBar';

export default OptimizedQuickBar;