import { useState } from "react";
import { OperationalCard as Card, OperationalCardContent as CardContent, OperationalCardDescription as CardDescription, OperationalCardHeader as CardHeader, OperationalCardTitle as CardTitle } from "@/components/ui/operational-card";
import { OperationalThemeWrapper } from "@/components/layout/OperationalThemeWrapper";
import { OperationalButton as Button } from "@/components/ui/operational-button";
import { UserPlus, Users, Shield, CheckCircle, XCircle } from "lucide-react";
import { FormularioSupervisor } from "@/components/personal/FormularioSupervisor";
import { useSupabaseUsuariosEnhanced } from "@/hooks/useSupabaseUsuariosEnhanced";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const RegistroSupervisores = () => {
  const { users, loading, toggleUserActive } = useSupabaseUsuariosEnhanced();
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Filtrar solo supervisores
  const supervisores = users.filter(user => 
    user.user_roles?.some(role => role.role === 'supervisor_motorizado')
  );

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    setSelectedUser({ userId, currentActive });
    setShowConfirmDialog(true);
  };

  const confirmToggleActive = async () => {
    if (!selectedUser) return;
    
    try {
      await toggleUserActive(selectedUser.userId, selectedUser.currentActive);
      toast.success(
        selectedUser.currentActive 
          ? "Supervisor desactivado exitosamente" 
          : "Supervisor activado exitosamente"
      );
    } catch (error) {
      toast.error("Error al actualizar el estado del supervisor");
      console.error('Error toggling supervisor status:', error);
    } finally {
      setShowConfirmDialog(false);
      setSelectedUser(null);
    }
  };

  const handleSuccess = () => {
    setShowForm(false);
    toast.success("Supervisor registrado exitosamente");
  };

  return (
    <OperationalThemeWrapper>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <UserPlus className="h-8 w-8 text-primary" />
              Registro de Supervisores
            </h1>
            <p className="text-muted-foreground">
              Gestión y registro de supervisores motorizados
            </p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2"
          >
            {showForm ? (
              <>
                <Users className="h-4 w-4" />
                Ver Lista
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Registrar Nuevo
              </>
            )}
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Supervisores</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{supervisores.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Supervisores Activos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {supervisores.filter(s => s.active).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Supervisores Inactivos</CardTitle>
              <XCircle className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {supervisores.filter(s => !s.active).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {showForm ? (
          <Card>
            <CardHeader>
              <CardTitle>Registrar Nuevo Supervisor</CardTitle>
              <CardDescription>
                Complete el formulario para registrar un nuevo supervisor motorizado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormularioSupervisor onSuccess={handleSuccess} />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Lista de Supervisores</CardTitle>
              <CardDescription>
                Supervisores motorizados registrados en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Cargando supervisores...</p>
                </div>
              ) : supervisores.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No hay supervisores registrados</p>
                  <p className="text-sm">Registra el primer supervisor usando el botón superior</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre Completo</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Documento</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {supervisores.map((supervisor) => (
                        <TableRow key={supervisor.id}>
                          <TableCell className="font-medium">
                            {supervisor.full_name}
                          </TableCell>
                          <TableCell>{supervisor.email}</TableCell>
                          <TableCell>{supervisor.numero_documento || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={supervisor.active ? "default" : "secondary"}>
                              {supervisor.active ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant={supervisor.active ? "destructive" : "default"}
                              onClick={() => handleToggleActive(supervisor.id, supervisor.active)}
                            >
                              {supervisor.active ? "Desactivar" : "Activar"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {selectedUser?.currentActive ? "Desactivar" : "Activar"} Supervisor
              </AlertDialogTitle>
              <AlertDialogDescription>
                ¿Está seguro que desea {selectedUser?.currentActive ? "desactivar" : "activar"} este supervisor?
                {selectedUser?.currentActive && " El supervisor no podrá acceder al sistema mientras esté inactivo."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmToggleActive}>
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </OperationalThemeWrapper>
  );
};

export default RegistroSupervisores;
