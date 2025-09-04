export type UserRole = 
  | 'administrador' 
  | 'director'
  | 'operador_alarmas'
  | 'despachador_patrullas'
  | 'supervisor_motorizado'
  | 'tecnico'
  | 'tecnico_propio'
  | 'tecnico_externo'
  | 'director_tecnico'
  | 'jefe_tecnicos'
  | 'asesor_ventas';

export interface AdditionalPermission {
  permission_name: string;
  permission_description?: string;
}

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole; // Primary role for compatibility
  roles?: UserRole[]; // All assigned roles
  fullName: string;
  active: boolean;
  createdAt: Date;
  lastLogin?: Date;
  fotoUrl?: string;
  numeroDocumento?: string;
  additionalPermissions?: AdditionalPermission[];
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  hasAdditionalPermission: (permission: string) => boolean;
  loading?: boolean;
  userRole?: UserRole;
  userPermissions?: AdditionalPermission[];
}

export interface LoginFormData {
  email: string;
  password: string;
}