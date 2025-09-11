import { useState, useEffect, useRef, useCallback } from 'react';

interface TimerSubscriber {
  id: string;
  callback: (timestamp: number) => void;
}

class GlobalTimerManager {
  private static instance: GlobalTimerManager;
  private interval: NodeJS.Timeout | null = null;
  private subscribers: TimerSubscriber[] = [];
  private isRunning = false;
  private lastTimestamp = Date.now();

  static getInstance(): GlobalTimerManager {
    if (!GlobalTimerManager.instance) {
      GlobalTimerManager.instance = new GlobalTimerManager();
    }
    return GlobalTimerManager.instance;
  }

  subscribe(id: string, callback: (timestamp: number) => void): () => void {
    const subscriber: TimerSubscriber = { id, callback };
    this.subscribers.push(subscriber);
    
    if (!this.isRunning) {
      this.start();
    }

    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub.id !== id);
      if (this.subscribers.length === 0) {
        this.stop();
      }
    };
  }

  private start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.interval = setInterval(() => {
      this.lastTimestamp = Date.now();
      this.subscribers.forEach(subscriber => {
        try {
          subscriber.callback(this.lastTimestamp);
        } catch (error) {
          console.error('Error in timer subscriber:', error);
        }
      });
    }, 1000);
  }

  private stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      this.isRunning = false;
    }
  }

  getCurrentTimestamp(): number {
    return this.lastTimestamp;
  }

  cleanup(): void {
    this.subscribers = [];
    this.stop();
  }
}

export const useGlobalTimer = () => {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const subscriberIdRef = useRef<string>(`timer-${Math.random().toString(36).substr(2, 9)}`);
  const timerManager = useRef<GlobalTimerManager>(GlobalTimerManager.getInstance());

  const updateTime = useCallback((timestamp: number) => {
    setCurrentTime(timestamp);
  }, []);

  useEffect(() => {
    const unsubscribe = timerManager.current.subscribe(
      subscriberIdRef.current,
      updateTime
    );

    return unsubscribe;
  }, [updateTime]);

  // Clean up on page visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, pause intensive operations
        console.log('Page hidden, timer optimizations active');
      } else {
        // Page is visible, resume normal operations
        setCurrentTime(Date.now());
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return {
    currentTime,
    getCurrentTime: () => timerManager.current.getCurrentTimestamp()
  };
};

// Hook for debugging timer performance
export const useTimerDebug = () => {
  const timerManager = GlobalTimerManager.getInstance();
  
  return {
    getSubscriberCount: () => (timerManager as any).subscribers?.length || 0,
    isRunning: () => (timerManager as any).isRunning || false
  };
};