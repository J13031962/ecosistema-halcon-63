import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserPlus, Key, Trash2, Search, CheckCircle, XCircle } from 'lucide-react';
import { UserRole } from '@/types/auth';
import { useSupabaseUsuarios } from '@/hooks/useSupabaseUsuarios';
import { UserFormEnhanced } from '@/components/admin/UserFormEnhanced';
import { UsuariosPrueba } from '@/components/admin/UsuariosPrueba';

interface UserData {
  email: string;
  password?: string;
  fullName: string;
  numeroDocumento: string;
  role: UserRole;
  additionalPermissions?: string[];
  fotoUrl?: string;
}

interface EditUserData extends UserData {
  id: string;
}

const GestionUsuarios = () => {
  const { 
    users, 
    loading, 
    createUser, 
    toggleUserActive, 
    deleteUser,
    updateUserRole 
  } = useSupabaseUsuarios();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [newUserData, setNewUserData] = useState<UserData>({
    email: '',
    password: '',
    fullName: '',
    numeroDocumento: '',
    role: 'operador_alarmas',
    additionalPermissions: [],
    fotoUrl: ''
  });
  const [editUserData, setEditUserData] = useState<EditUserData>({
    id: '',
    email: '',
    fullName: '',
    numeroDocumento: '',
    role: 'operador_alarmas',
    additionalPermissions: [],
    fotoUrl: ''
  });

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

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case 'administrador': return 'destructive';
      case 'director': return 'default';
      case 'operador_alarmas': return 'secondary';
      case 'despachador_patrullas': return 'outline';
      default: return 'secondary';
    }
  };

  const handleCreateUser = async () => {
    const createData = {
      email: newUserData.email,
      password: newUserData.password || '',
      fullName: newUserData.fullName,
      role: newUserData.role,
      numeroDocumento: newUserData.numeroDocumento,
      fotoUrl: newUserData.fotoUrl
    };
    const result = await createUser(createData);
    if (result.success) {
      setIsCreateModalOpen(false);
      setNewUserData({
        email: '',
        password: '',
        fullName: '',
        numeroDocumento: '',
        role: 'operador_alarmas',
        additionalPermissions: [],
        fotoUrl: ''
      });
    }
  };

  const handleEditUser = async () => {
    const result = await updateUserRole(editUserData.id, editUserData.role);
    if (result.success) {
      setIsEditModalOpen(false);
      setEditUserData({
        id: '',
        email: '',
        fullName: '',
        numeroDocumento: '',
        role: 'operador_alarmas',
        additionalPermissions: [],
        fotoUrl: ''
      });
    }
  };

  const openEditModal = (user: any) => {
    setEditUserData({
      id: user.id,
      email: user.email,
      fullName: user.full_name || '',
      numeroDocumento: user.numero_documento || '',
      role: user.user_roles[0]?.role || 'operador_alarmas',
      additionalPermissions: user.user_roles.slice(1).map((r: any) => r.role) || [],
      fotoUrl: user.foto_url || ''
    });
    setIsEditModalOpen(true);
  };

  const handleToggleActive = async (user: any) => {
    await toggleUserActive(user.id, user.active);
  };

  const handleDeleteUser = async (user: any) => {
    await deleteUser(user.id, user.email);
  };

  const handleChangePassword = async () => {
    // Note: Password change would require admin API implementation
    setIsPasswordModalOpen(false);
    setNewPassword('');
    setSelectedUser(null);
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Usuarios de Prueba */}
      <UsuariosPrueba />
      
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            GESTIÓN DE USUARIOS
          </h1>
          <p className="text-muted-foreground">
            Administra usuarios, roles y permisos del sistema
          </p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Crear Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario</DialogTitle>
              <DialogDescription>
                Completa la información para crear un nuevo usuario del sistema
              </DialogDescription>
            </DialogHeader>
            <UserFormEnhanced 
              userData={newUserData}
              setUserData={setNewUserData}
              isEdit={false}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateUser}>
                Crear Usuario
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Lista de Usuarios</span>
            <Badge variant="outline">
              {filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Cargando usuarios...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No se encontraron usuarios</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Último Login</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{user.full_name || 'Sin nombre'}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.user_roles.map((roleObj, index) => (
                          <Badge key={index} variant={getRoleBadgeVariant(roleObj.role)}>
                            {roleNames[roleObj.role]}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {user.active ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className={user.active ? 'text-green-600' : 'text-red-600'}>
                          {user.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.last_login
                        ? new Date(user.last_login).toLocaleDateString()
                        : 'Nunca'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(user)}
                        >
                          Editar
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(user)}
                        >
                          {user.active ? 'Desactivar' : 'Activar'}
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsPasswordModalOpen(true);
                          }}
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar Usuario?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción eliminará permanentemente a {user.email} del sistema.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica la información del usuario
            </DialogDescription>
          </DialogHeader>
          <UserFormEnhanced 
            userData={editUserData}
            setUserData={(data) => setEditUserData({ ...data, id: editUserData.id })}
            isEdit={true}
            userId={editUserData.id}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditUser}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Change Modal */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Contraseña</DialogTitle>
            <DialogDescription>
              Cambiar la contraseña para {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleChangePassword}>
              Cambiar Contraseña
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GestionUsuarios;