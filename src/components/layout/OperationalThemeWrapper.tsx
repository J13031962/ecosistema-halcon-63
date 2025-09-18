import React from 'react';
import { useAuthConsolidatedContext } from '@/contexts/AuthContextConsolidated';

interface OperationalThemeWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const OPERATIONAL_ROLES = [
  'operador_alarmas',
  'despachador_patrullas', 
  'supervisor_motorizado'
];

export const OperationalThemeWrapper: React.FC<OperationalThemeWrapperProps> = ({ 
  children, 
  className = "" 
}) => {
  const { user } = useAuthConsolidatedContext();
  
  const isOperationalRole = user && OPERATIONAL_ROLES.includes(user.role);
  
  if (isOperationalRole) {
    return (
      <div className={`operational-theme min-h-screen ${className}`}>
        {children}
      </div>
    );
  }
  
  return <div className={className}>{children}</div>;
};