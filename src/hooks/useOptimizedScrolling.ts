import { useEffect, useRef, useCallback, useState } from 'react';

// Hook para manejo optimizado del Intersection Observer con debounce
export const useOptimizedScrolling = () => {
  const [showQuickBar, setShowQuickBar] = useState(false);
  const mainSectionRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Función debounced para cambiar el estado de la barra rápida
  const debouncedSetShowQuickBar = useCallback((show: boolean) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setShowQuickBar(show);
    }, 100); // 100ms debounce
  }, []);

  // Optimized intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Use requestAnimationFrame for smooth updates
        requestAnimationFrame(() => {
          debouncedSetShowQuickBar(!entry.isIntersecting);
        });
      },
      {
        threshold: 0.1,
        rootMargin: '-100px 0px 0px 0px'
      }
    );

    const currentRef = mainSectionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [debouncedSetShowQuickBar]);

  return {
    showQuickBar,
    mainSectionRef
  };
};