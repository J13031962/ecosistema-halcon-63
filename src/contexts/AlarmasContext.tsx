import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Alarm {
  id: number;
  client: string;
  type: 'Fuego' | 'Pánico' | 'Revisión' | 'Acompañamiento';
  status: 'Activa' | 'En Proceso' | 'Despachada' | 'Resuelta';
  priority: 'Alta' | 'Media' | 'Baja';
  startTime: Date;
  operator?: string;
  address: string;
  municipality: string;
  patrullaAsignada?: string;
  supervisor?: string;
  tiempoRespuesta?: string;
}

export interface AlarmasState {
  alarmasActivas: Alarm[];
  alarmasEnProceso: Alarm[];
  rutasAsignadas: Alarm[];
  alarmasResueltas: number;
  patrullasUsadas: number;
  acompanamientosUsados: number;
  revistasUsadas: number;
  patrullasDisponibles: number;
  acompanamientosDisponibles: number;
  revistasDisponibles: number;
}

interface AlarmasContextType {
  state: AlarmasState;
  addAlarm: (alarmData: Partial<Alarm>) => void;
  attendAlarm: (alarmId: number) => void;
  assignPatrolToAlarm: (alarmId: number, supervisor?: { name: string; patrullaUnit: string }) => void;
  deleteAlarm: (alarmId: number) => void;
  updateLimits: (limits: { patrullas: number; acompanamientos: number; revistas: number }) => void;
  getTimerColor: (startTime: Date) => string;
  canDeleteAlarm: (startTime: Date) => boolean;
}

const AlarmasContext = createContext<AlarmasContextType | undefined>(undefined);

export const useAlarmas = (): AlarmasContextType => {
  const context = useContext(AlarmasContext);
  if (context === undefined) {
    throw new Error('useAlarmas must be used within an AlarmasProvider');
  }
  return context;
};

interface AlarmasProviderProps {
  children: ReactNode;
}

export const AlarmasProvider: React.FC<AlarmasProviderProps> = ({ children }) => {
  const [state, setState] = useState<AlarmasState>(() => {
    // Cargar desde localStorage
    const saved = localStorage.getItem('alarmasState');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        alarmasActivas: parsed.alarmasActivas ? parsed.alarmasActivas.map((alarm: any) => ({
          ...alarm,
          startTime: new Date(alarm.startTime)
        })) : [],
        alarmasEnProceso: parsed.alarmasEnProceso || [],
        rutasAsignadas: parsed.rutasAsignadas || [],
        alarmasResueltas: parsed.alarmasResueltas || 0,
        patrullasUsadas: parsed.patrullasUsadas || 0,
        acompanamientosUsados: parsed.acompanamientosUsados || 0,
        revistasUsadas: parsed.revistasUsadas || 0,
        patrullasDisponibles: parsed.patrullasDisponibles || 180,
        acompanamientosDisponibles: parsed.acompanamientosDisponibles || 10,
        revistasDisponibles: parsed.revistasDisponibles || 50
      };
    }
    
    // Estado inicial
    return {
      alarmasActivas: [],
      alarmasEnProceso: [],
      rutasAsignadas: [],
      alarmasResueltas: 0,
      patrullasUsadas: 0,
      acompanamientosUsados: 0,
      revistasUsadas: 0,
      patrullasDisponibles: 180,
      acompanamientosDisponibles: 10,
      revistasDisponibles: 50
    };
  });

  // Guardar en localStorage cuando el estado cambie
  useEffect(() => {
    localStorage.setItem('alarmasState', JSON.stringify(state));
  }, [state]);

  // Cargar límites mensuales
  useEffect(() => {
    const savedLimits = localStorage.getItem('monthlyLimits');
    if (savedLimits) {
      const limits = JSON.parse(savedLimits);
      setState(prev => ({
        ...prev,
        patrullasDisponibles: limits.patrullas || 180,
        acompanamientosDisponibles: limits.acompanamientos || 10,
        revistasDisponibles: limits.revistas || 50,
        alarmasEnProceso: prev.alarmasEnProceso || [],
        rutasAsignadas: prev.rutasAsignadas || []
      }));
    }
  }, []);

  const addAlarm = (alarmData: Partial<Alarm>) => {
    const newAlarm: Alarm = {
      id: Date.now(),
      client: alarmData.client || '',
      type: alarmData.type || 'Pánico',
      status: 'Activa',
      priority: alarmData.priority || 'Alta',
      startTime: new Date(),
      address: alarmData.address || '',
      municipality: alarmData.municipality || '',
      operator: alarmData.operator
    };

    setState(prev => {
      // Actualizar contadores según el tipo de alarma
      let patrullasUsadas = prev.patrullasUsadas;
      let acompanamientosUsados = prev.acompanamientosUsados;
      let revistasUsadas = prev.revistasUsadas;

      switch (newAlarm.type) {
        case 'Pánico':
        case 'Fuego':
          patrullasUsadas += 1;
          break;
        case 'Acompañamiento':
          acompanamientosUsados += 1;
          break;
        case 'Revisión':
          revistasUsadas += 1;
          break;
      }

      return {
        ...prev,
        alarmasActivas: [...(prev.alarmasActivas || []), newAlarm],
        patrullasUsadas,
        acompanamientosUsados,
        revistasUsadas
      };
    });

    // Notificación de nueva alarma
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Nueva Alarma Generada', {
          body: `${newAlarm.type} en ${newAlarm.client}`,
          icon: '/favicon.ico'
        });
      }
    }
  };

  const attendAlarm = (alarmId: number) => {
    // Esta función ahora solo actualiza el estado visual en Central de Alarmas
    // Ya no mueve la alarma, solo marca que fue atendida
    setState(prev => ({
      ...prev,
      alarmasActivas: (prev.alarmasActivas || []).map(alarm =>
        alarm.id === alarmId
          ? { ...alarm, status: 'En Proceso', operator: 'Central de Operaciones' }
          : alarm
      )
    }));
  };

  const assignPatrolToAlarm = (alarmId: number, supervisor?: { name: string; patrullaUnit: string }) => {
    // Esta función mueve la alarma de activas a rutas asignadas con supervisor específico
    setState(prev => {
      const alarm = (prev.alarmasActivas || []).find(a => a.id === alarmId);
      if (!alarm) return prev;

      const attendedAlarm = {
        ...alarm,
        status: 'En Proceso' as const,
        operator: 'Despachador Central',
        patrullaAsignada: supervisor ? `${supervisor.name} (${supervisor.patrullaUnit})` : `Patrulla-${String(alarm.id).padStart(2, '0')}`,
        supervisor: supervisor?.name || 'Por Asignar',
        tiempoRespuesta: getElapsedTime(alarm.startTime)
      };

      return {
        ...prev,
        alarmasActivas: prev.alarmasActivas?.filter(a => a.id !== alarmId) || [],
        rutasAsignadas: [...(prev.rutasAsignadas || []), attendedAlarm]
      };
    });
  };

  const deleteAlarm = (alarmId: number) => {
    setState(prev => ({
      ...prev,
      alarmasActivas: (prev.alarmasActivas || []).filter(a => a.id !== alarmId)
    }));
  };

  const canDeleteAlarm = (startTime: Date): boolean => {
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000 / 60);
    return elapsed <= 5; // Solo se puede eliminar si han pasado 5 minutos o menos
  };

  const updateLimits = (limits: { patrullas: number; acompanamientos: number; revistas: number }) => {
    setState(prev => ({
      ...prev,
      patrullasDisponibles: limits.patrullas,
      acompanamientosDisponibles: limits.acompanamientos,
      revistasDisponibles: limits.revistas
    }));
  };

  const getTimerColor = (startTime: Date): string => {
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000 / 60);
    
    if (elapsed < 3) return 'text-green-600';
    if (elapsed < 6) return 'text-yellow-600';
    if (elapsed < 9) return 'text-orange-600';
    return 'text-red-600';
  };

  const getElapsedTime = (startTime: Date): string => {
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Exponer función global para compatibilidad con código existente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).addAlarmFromClients = addAlarm;
    }
  }, []);

  const value: AlarmasContextType = {
    state,
    addAlarm,
    attendAlarm,
    assignPatrolToAlarm,
    deleteAlarm,
    updateLimits,
    getTimerColor,
    canDeleteAlarm,
  };

  return <AlarmasContext.Provider value={value}>{children}</AlarmasContext.Provider>;
};