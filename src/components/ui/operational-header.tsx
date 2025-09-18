import React from 'react';
import { useAuthConsolidatedContext } from '@/contexts/AuthContextConsolidated';

interface OperationalHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: React.ReactNode;
}

const OPERATIONAL_ROLES = [
  'operador_alarmas',
  'despachador_patrullas', 
  'supervisor_motorizado'
];

export const OperationalHeader: React.FC<OperationalHeaderProps> = ({ 
  title, 
  subtitle, 
  icon: Icon,
  children 
}) => {
  const { user } = useAuthConsolidatedContext();
  
  const isOperationalRole = user && OPERATIONAL_ROLES.includes(user.role);
  
  if (isOperationalRole) {
    return (
      <div className="operational-header p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              {Icon && <Icon className="h-8 w-8 operational-accent-text" />}
              {title}
            </h1>
            {subtitle && (
              <p className="text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          {children}
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            {Icon && <Icon className="h-8 w-8 text-primary" />}
            {title}
          </h1>
          {subtitle && (
            <p className="text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
};