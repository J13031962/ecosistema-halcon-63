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
import { Users, UserPlus, Key, Trash2, Search, CheckCircle, XCircle, Edit, ToggleLeft, ToggleRight } from 'lucide-react';
import { UserRole } from '@/types/auth';
import { useSupabaseUsuarios } from '@/hooks/useSupabaseUsuarios';
import { UserFormEnhanced } from '@/components/admin/UserFormEnhanced';
import { useAuthConsolidated } from '@/hooks/useAuthConsolidated';

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

interface GestionUsuariosCompartidaProps {
  isDirectorCentral?: boolean;
}

const GestionUsuariosCompartida: React.FC<GestionUsuariosCompartidaProps> = ({ isDirectorCentral = false }) => {
  const { user: currentUser } = useAuthConsolidated();
  const { 
    users, 
    loading, 
    createUser, 
    toggleUserActive, 
    deleteUser,
    updateUserRole 
  } = useSupabaseUsuarios();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
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

  // Roles que puede asignar el Director Central (todos menos administrador)
  const getAvailableRoles = (): UserRole[] => {
    const allRoles: UserRole[] = [
      'director',
      'operador_alarmas',
      'despachador_patrullas', 
      'supervisor_motorizado',
      'tecnico',
      'tecnico_propio',
      'tecnico_externo',
      'director_tecnico',
      'jefe_tecnicos',
      'asesor_ventas'
    ];

    // Si es Director Central, no puede asignar rol de administrador
    if (isDirectorCentral) {
      return allRoles;
    }

    // Si es administrador, puede asignar todos los roles incluyendo administrador
    return ['administrador', ...allRoles];
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

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.active) ||
      (statusFilter === 'inactive' && !user.active);
    
    return matchesSearch && matchesStatus;
  });

  const pageTitle = isDirectorCentral ? 'GESTIÓN DE USUARIOS - DIRECTOR CENTRAL' : 'GESTIÓN DE USUARIOS - ADMINISTRADOR';
  const pageDescription = isDirectorCentral 
    ? 'Gestione usuarios y roles desde la dirección central' 
    : 'Administre usuarios, roles y permisos del sistema';

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            {pageTitle}
          </h1>
          <p className="text-muted-foreground">
            {pageDescription}
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
              availableRoles={getAvailableRoles()}
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
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los usuarios</SelectItem>
                <SelectItem value="active">Solo activos</SelectItem>
                <SelectItem value="inactive">Solo inactivos</SelectItem>
              </SelectContent>
            </Select>
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
                          title="Editar usuario"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(user)}
                          title={user.active ? "Desactivar usuario" : "Activar usuario"}
                        >
                          {user.active ? (
                            <ToggleRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-red-600" />
                          )}
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" title="Eliminar usuario">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. El usuario será desactivado permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteUser(user)}>
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

      {/* Modal de Edición */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica el rol y información del usuario
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email (Solo lectura)</Label>
              <Input
                id="edit-email"
                value={editUserData.email}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-fullName">Nombre Completo</Label>
              <Input
                id="edit-fullName"
                value={editUserData.fullName}
                onChange={(e) => setEditUserData({...editUserData, fullName: e.target.value})}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-role">Rol Principal</Label>
              <Select 
                value={editUserData.role} 
                onValueChange={(value: UserRole) => setEditUserData({...editUserData, role: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableRoles().map((role) => (
                    <SelectItem key={role} value={role}>
                      {roleNames[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-documento">Número de Documento</Label>
              <Input
                id="edit-documento"
                value={editUserData.numeroDocumento}
                onChange={(e) => setEditUserData({...editUserData, numeroDocumento: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditUser}>
              Actualizar Usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GestionUsuariosCompartida;