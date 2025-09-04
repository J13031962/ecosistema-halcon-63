import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SystemFunction {
  id: string;
  function_key: string;
  function_name: string;
  description?: string;
  category: string;
  role_origin: string;
}

interface RolePermissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (role: string, permissions: string[]) => void;
  selectedRole: string;
  selectedPermissions: string[];
  systemFunctions: SystemFunction[];
}

const roles = [
  { value: 'administrador', label: 'Administrador' },
  { value: 'director_central', label: 'Director Central' },
  { value: 'operador_alarmas', label: 'Operador de Alarmas' },
  { value: 'despachador_patrullas', label: 'Despachador de Patrullas' },
  { value: 'supervisor_motorizado', label: 'Supervisor Motorizado' },
  { value: 'tecnico', label: 'Técnico' },
  { value: 'jefe_tecnicos', label: 'Jefe de Técnicos' },
  { value: 'asesor_ventas', label: 'Asesor de Ventas' },
];

export const RolePermissionModal: React.FC<RolePermissionModalProps> = ({
  open,
  onOpenChange,
  onConfirm,
  selectedRole,
  selectedPermissions,
  systemFunctions
}) => {
  const [tempRole, setTempRole] = React.useState(selectedRole);
  const [tempPermissions, setTempPermissions] = React.useState<string[]>(selectedPermissions);

  React.useEffect(() => {
    console.log('Modal opened, systemFunctions:', systemFunctions);
    console.log('Modal opened, systemFunctions length:', systemFunctions.length);
    console.log('Modal opened, selectedRole:', selectedRole);
    setTempRole(selectedRole);
    setTempPermissions(selectedPermissions);
  }, [selectedRole, selectedPermissions, open, systemFunctions]);

  const handleRoleChange = (role: string) => {
    setTempRole(role);
    // Limpiar permisos adicionales cuando cambia el rol
    setTempPermissions([]);
  };

  const handlePermissionChange = (functionKey: string, checked: boolean) => {
    if (checked) {
      setTempPermissions(prev => [...prev, functionKey]);
    } else {
      setTempPermissions(prev => prev.filter(p => p !== functionKey));
    }
  };

  const handleConfirm = () => {
    onConfirm(tempRole, tempPermissions);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setTempRole(selectedRole);
    setTempPermissions(selectedPermissions);
    onOpenChange(false);
  };

  // Mostrar solo las funciones del rol seleccionado
  const filteredFunctions = tempRole && systemFunctions.length > 0
    ? systemFunctions.filter(func => func.role_origin === tempRole)
    : [];
  
  const functionsGroupedByCategory = filteredFunctions.reduce((acc, func) => {
    if (!acc[func.category]) {
      acc[func.category] = [];
    }
    acc[func.category].push(func);
    return acc;
  }, {} as Record<string, SystemFunction[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Configuración de Rol y Permisos</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="role-select" className="text-sm font-medium">Rol Principal</Label>
            <Select value={tempRole} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-medium">Permisos Adicionales</Label>
            <ScrollArea className="h-96 border rounded-md p-4">
              {Object.keys(functionsGroupedByCategory).length > 0 ? (
                Object.entries(functionsGroupedByCategory).map(([category, functions]) => (
                  <div key={category} className="mb-6">
                    <h4 className="font-medium text-sm mb-3 text-muted-foreground uppercase tracking-wide">
                      {category}
                    </h4>
                    <div className="space-y-3 pl-2">
                      {functions.map((func) => (
                        <div key={func.function_key} className="flex items-start space-x-3">
                          <Checkbox
                            id={func.function_key}
                            checked={tempPermissions.includes(func.function_key)}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(func.function_key, checked as boolean)
                            }
                          />
                          <div className="space-y-1 flex-1">
                            <Label 
                              htmlFor={func.function_key} 
                              className="text-sm font-medium cursor-pointer"
                            >
                              {func.function_name}
                            </Label>
                            {func.description && (
                              <p className="text-xs text-muted-foreground">
                                {func.description}
                              </p>
                            )}
                            <p className="text-xs text-blue-600 font-medium">
                              Rol: {func.role_origin}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  {systemFunctions.length === 0 
                    ? "Cargando funciones del sistema..." 
                    : "No hay permisos adicionales disponibles para este rol"
                  }
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            Aceptar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};