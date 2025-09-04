import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserRole } from '@/types/auth';
import { Upload, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UserFormData {
  email: string;
  password?: string;
  fullName: string;
  numeroDocumento: string;
  role: UserRole;
  additionalPermissions?: string[];
  fotoUrl?: string;
}

interface UserFormEnhancedProps {
  userData: UserFormData;
  setUserData: (data: UserFormData) => void;
  isEdit?: boolean;
  userId?: string;
}

const roleNames: Record<UserRole, string> = {
  administrador: 'Administrador',
  director: 'Director Central',
  operador_alarmas: 'Operador de Alarmas',
  despachador_patrullas: 'Despachador de Patrullas',
  supervisor_motorizado: 'Supervisor Motorizado',
  tecnico: 'Técnico',
  tecnico_propio: 'Técnico Propio',
  tecnico_externo: 'Técnico Externo',
  director_tecnico: 'Director Técnico',
  jefe_tecnicos: 'Jefe de Técnicos',
  asesor_ventas: 'Asesor de Ventas'
};

const permissionLabels: Record<string, string> = {
  // Administrador
  'admin_gestion_usuarios': 'Gestión de Usuarios',
  'admin_configuracion_sistema': 'Configuración del Sistema',
  'admin_reportes_ejecutivos': 'Reportes Ejecutivos',
  'admin_auditoria_sistema': 'Auditoría del Sistema',
  'admin_gestion_completa': 'Gestión Completa',
  'admin_configuracion_avanzada': 'Configuración Avanzada',
  
  // Director
  'director_reportes_ejecutivos': 'Reportes Ejecutivos',
  'director_analisis_avanzado': 'Análisis Avanzado',
  'director_estado_general': 'Estado General',
  'director_gestion_personal': 'Gestión Personal',
  'director_turnos_operador': 'Turnos Operador',
  'director_turno_supervisor': 'Turno Supervisor',
  'director_ingresar_clientes': 'Ingresar Clientes',
  'director_dashboard_ejecutivo': 'Dashboard Ejecutivo',
  'director_reportes_estrategicos': 'Reportes Estratégicos',
  
  // Operador Alarmas
  'operador_central_alarmas': 'Central de Alarmas',
  'operador_recepcion_alarmas': 'Recepción de Alarmas',
  'operador_gestion_eventos': 'Gestión de Eventos',
  'operador_comunicacion_clientes': 'Comunicación con Clientes',
  'operador_registro_actividades': 'Registro de Actividades',
  'operador_estado_patrullas': 'Estado de Patrullas',
  'operador_generar_alarma': 'Generar Alarma',
  
  // Despachador Patrullas
  'despachador_seccion_despachador': 'Sección Despachador',
  'despachador_asignacion_patrullas': 'Asignación de Patrullas',
  'despachador_seguimiento_gps': 'Seguimiento GPS',
  'despachador_comunicacion_radio': 'Comunicación por Radio',
  'despachador_gestion_rutas': 'Gestión de Rutas',
  'despachador_reportes_operativos': 'Reportes Operativos',
  'despachador_estado_vehiculos': 'Estado de Vehículos',
  'despachador_turnos_despachador': 'Turnos Despachador',
  'despachador_historial_patrullas': 'Historial de Patrullas',
  
  // Supervisor
  'supervisor_reportes_supervisor': 'Reportes Supervisor',
  'supervisor_turnos_supervisor': 'Turnos Supervisor',
  'supervisor_historial_patrullas_supervisor': 'Historial Patrullas Supervisor',
  'supervisor_gestion_incidentes': 'Gestión de Incidentes',
  'supervisor_coordinacion_equipos': 'Coordinación de Equipos',
  'supervisor_validacion_actividades': 'Validación de Actividades',
  'supervisor_supervision_operaciones': 'Supervisión de Operaciones',
  
  // Técnico
  'tecnico_servicios_tecnicos': 'Servicios Técnicos',
  'tecnico_inventario': 'Inventario',
  'tecnico_ingresar_material': 'Ingresar Material',
  'tecnico_instalaciones_tecnicas': 'Instalaciones Técnicas',
  'tecnico_mantenimiento_equipos': 'Mantenimiento de Equipos',
  'tecnico_soporte_tecnico': 'Soporte Técnico',
  'tecnico_reportes_tecnicos': 'Reportes Técnicos',
  
  // Jefe Técnicos
  'jefe_tecnicos_servicios_tecnicos': 'Servicios Técnicos',
  'jefe_tecnicos_inventario': 'Inventario',
  'jefe_tecnicos_ingresar_material': 'Ingresar Material',
  'jefe_tecnicos_supervision_tecnica': 'Supervisión Técnica',
  'jefe_tecnicos_gestion_tecnicos': 'Gestión de Técnicos',
  'jefe_tecnicos_planificacion_instalaciones': 'Planificación de Instalaciones',
  'jefe_tecnicos_control_inventario': 'Control de Inventario',
  'jefe_tecnicos_aprobacion_cotizaciones': 'Aprobación de Cotizaciones',
  
  // Asesor Ventas
  'asesor_ventas_gestion_clientes': 'Gestión de Clientes',
  'asesor_ventas_ingresar_clientes': 'Ingresar Clientes',
  'asesor_ventas_generar_cotizaciones': 'Generar Cotizaciones',
  'asesor_ventas_elementos_cotizables': 'Elementos Cotizables',
  'asesor_ventas_seguimiento_ventas': 'Seguimiento de Ventas',
  'asesor_ventas_registro_prospectos': 'Registro de Prospectos',
  'asesor_ventas_reportes_comerciales': 'Reportes Comerciales'
};

const rolePermissions: Record<UserRole, string[]> = {
  administrador: [
    'admin_gestion_usuarios',
    'admin_configuracion_sistema',
    'admin_reportes_ejecutivos', 
    'admin_auditoria_sistema',
    'admin_gestion_completa',
    'admin_configuracion_avanzada'
  ],
  director: [
    'director_reportes_ejecutivos',
    'director_analisis_avanzado',
    'director_estado_general',
    'director_gestion_personal',
    'director_turnos_operador',
    'director_turno_supervisor',
    'director_ingresar_clientes',
    'director_dashboard_ejecutivo',
    'director_reportes_estrategicos'
  ],
  operador_alarmas: [
    'operador_central_alarmas',
    'operador_recepcion_alarmas',
    'operador_gestion_eventos',
    'operador_comunicacion_clientes',
    'operador_registro_actividades',
    'operador_estado_patrullas',
    'operador_generar_alarma'
  ],
  despachador_patrullas: [
    'despachador_seccion_despachador',
    'despachador_asignacion_patrullas',
    'despachador_seguimiento_gps',
    'despachador_comunicacion_radio',
    'despachador_gestion_rutas',
    'despachador_reportes_operativos',
    'despachador_estado_vehiculos',
    'despachador_turnos_despachador',
    'despachador_historial_patrullas'
  ],
  supervisor_motorizado: [
    'supervisor_reportes_supervisor',
    'supervisor_turnos_supervisor', 
    'supervisor_historial_patrullas_supervisor',
    'supervisor_gestion_incidentes',
    'supervisor_coordinacion_equipos',
    'supervisor_validacion_actividades',
    'supervisor_supervision_operaciones'
  ],
  tecnico: [
    'tecnico_servicios_tecnicos',
    'tecnico_inventario',
    'tecnico_ingresar_material',
    'tecnico_instalaciones_tecnicas',
    'tecnico_mantenimiento_equipos',
    'tecnico_soporte_tecnico',
    'tecnico_reportes_tecnicos'
  ],
  tecnico_propio: [
    'tecnico_servicios_tecnicos',
    'tecnico_inventario',
    'tecnico_ingresar_material',
    'tecnico_instalaciones_tecnicas',
    'tecnico_mantenimiento_equipos',
    'tecnico_soporte_tecnico',
    'tecnico_reportes_tecnicos'
  ],
  tecnico_externo: [
    'tecnico_servicios_tecnicos',
    'tecnico_soporte_tecnico',
    'tecnico_reportes_tecnicos'
  ],
  director_tecnico: [
    'jefe_tecnicos_servicios_tecnicos',
    'jefe_tecnicos_inventario',
    'jefe_tecnicos_ingresar_material',
    'jefe_tecnicos_supervision_tecnica',
    'jefe_tecnicos_gestion_tecnicos',
    'jefe_tecnicos_planificacion_instalaciones',
    'jefe_tecnicos_control_inventario',
    'jefe_tecnicos_aprobacion_cotizaciones'
  ],
  jefe_tecnicos: [
    'jefe_tecnicos_servicios_tecnicos',
    'jefe_tecnicos_inventario',
    'jefe_tecnicos_ingresar_material',
    'jefe_tecnicos_supervision_tecnica',
    'jefe_tecnicos_gestion_tecnicos',
    'jefe_tecnicos_planificacion_instalaciones',
    'jefe_tecnicos_control_inventario',
    'jefe_tecnicos_aprobacion_cotizaciones'
  ],
  asesor_ventas: [
    'asesor_ventas_gestion_clientes',
    'asesor_ventas_ingresar_clientes',
    'asesor_ventas_generar_cotizaciones',
    'asesor_ventas_elementos_cotizables',
    'asesor_ventas_seguimiento_ventas',
    'asesor_ventas_registro_prospectos',
    'asesor_ventas_reportes_comerciales'
  ]
};

export const UserFormEnhanced: React.FC<UserFormEnhancedProps> = ({ 
  userData, 
  setUserData, 
  isEdit = false,
  userId 
}) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Por favor selecciona un archivo de imagen válido",
          variant: "destructive"
        });
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error", 
          description: "La imagen no puede ser mayor a 5MB",
          variant: "destructive"
        });
        return;
      }

      const fileExt = file.name.split('.').pop();
      const targetUserId = userId || 'temp-' + Date.now();
      const fileName = `${targetUserId}/avatar.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('user-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Error uploading file:', error);
        toast({
          title: "Error",
          description: "Error al subir la imagen: " + error.message,
          variant: "destructive"
        });
        return;
      }

      const { data: urlData } = supabase.storage
        .from('user-photos')
        .getPublicUrl(fileName);

      setUserData({
        ...userData,
        fotoUrl: urlData.publicUrl
      });

      toast({
        title: "Éxito",
        description: "Imagen subida correctamente"
      });

    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Error",
        description: "Error inesperado al subir la imagen",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Foto del usuario */}
      <div className="flex items-center space-x-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={userData.fotoUrl} alt={userData.fullName} />
          <AvatarFallback>
            <User className="h-10 w-10" />
          </AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <Label>Foto del Usuario</Label>
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Subiendo...' : 'Subir Foto'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Formatos: JPG, PNG, GIF. Máximo 5MB.
          </p>
        </div>
      </div>

      {/* Información básica */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={userData.email}
            onChange={(e) => setUserData({ ...userData, email: e.target.value })}
            placeholder="usuario@empresa.com"
            disabled={isEdit}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fullName">Nombre Completo *</Label>
          <Input
            id="fullName"
            value={userData.fullName}
            onChange={(e) => setUserData({ ...userData, fullName: e.target.value })}
            placeholder="Juan Pérez"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="numeroDocumento">Número de Documento *</Label>
          <Input
            id="numeroDocumento"
            value={userData.numeroDocumento}
            onChange={(e) => setUserData({ ...userData, numeroDocumento: e.target.value })}
            placeholder="12345678"
          />
        </div>

        {!isEdit && (
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña *</Label>
            <Input
              id="password"
              type="password"
              value={userData.password}
              onChange={(e) => setUserData({ ...userData, password: e.target.value })}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
        )}
      </div>

      {/* Rol principal */}
      <div className="space-y-2">
        <Label htmlFor="role">Rol Principal *</Label>
        <Select
          value={userData.role}
          onValueChange={(value: UserRole) => {
            setUserData({ 
              ...userData, 
              role: value,
              additionalPermissions: []
            });
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(roleNames).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Se asignarán automáticamente todos los permisos de este rol
        </p>
      </div>
      
      {/* Permisos adicionales */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Permisos Adicionales de Otros Roles</Label>
          <p className="text-sm text-muted-foreground">
            Selecciona permisos específicos de otros roles para añadir funcionalidades adicionales
          </p>
        </div>
        
        {Object.entries(roleNames).map(([roleValue, roleLabel]) => {
          if (roleValue === userData.role) return null;
          
          return (
            <div key={roleValue} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-medium text-primary">{roleLabel}</Label>
                <Badge variant="outline" className="text-xs">
                  {rolePermissions[roleValue as UserRole]?.filter(permission => 
                    userData.additionalPermissions?.includes(`${roleValue}:${permission}`)
                  ).length || 0} seleccionados
                </Badge>
              </div>
              
              <div className="space-y-1">
                {rolePermissions[roleValue as UserRole]?.map((permission, index) => (
                  <label key={index} className="flex items-center space-x-3 py-1 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 border border-gray-300 rounded focus:ring-2 focus:ring-primary"
                      checked={userData.additionalPermissions?.includes(`${roleValue}:${permission}`)}
                      onChange={(e) => {
                        const permissions = userData.additionalPermissions || [];
                        const permissionKey = `${roleValue}:${permission}`;
                        
                        if (e.target.checked) {
                          setUserData({ 
                            ...userData, 
                            additionalPermissions: [...permissions, permissionKey] 
                          });
                        } else {
                          setUserData({ 
                            ...userData, 
                            additionalPermissions: permissions.filter(p => p !== permissionKey) 
                          });
                        }
                      }}
                    />
                    <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                      {permissionLabels[permission] || permission}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};