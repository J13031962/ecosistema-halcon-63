import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthConsolidated } from "@/hooks/useAuthConsolidated";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "next-themes";
import { Settings, Image, Upload, Moon, Sun, Lock, User, Key, Shield, Save } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAlarmas } from "@/contexts/AlarmasContext";
import { CreateTestUsers } from "@/components/admin/CreateTestUsers";
import { CreateSpecificUsers } from "@/components/admin/CreateSpecificUsers";

// Esquemas de validación
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(1, 'Confirme la nueva contraseña'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

const emailSchema = z.object({
  newEmail: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña actual es requerida'),
});

const adminPasswordSchema = z.object({
  targetUserId: z.string().min(1, 'Seleccione un usuario'),
  newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(1, 'Confirme la nueva contraseña'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

const backgroundImages = [
  { id: '1', name: 'Noche Estrellada', url: 'https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?auto=format&fit=crop&w=1920&q=80' },
  { id: '2', name: 'Montaña Neblinosa', url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1920&q=80' },
  { id: '3', name: 'Océano', url: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1920&q=80' },
  { id: '4', name: 'Montañas Alpinas', url: 'https://images.unsplash.com/photo-1458668383970-8ddd3927deed?auto=format&fit=crop&w=1920&q=80' },
  { id: '5', name: 'Desierto', url: 'https://images.unsplash.com/photo-1482938289607-e9573fc25ebb?auto=format&fit=crop&w=1920&q=80' },
  { id: '6', name: 'Bosque', url: 'https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?auto=format&fit=crop&w=1920&q=80' },
  { id: '7', name: 'Luces del Bosque', url: 'https://images.unsplash.com/photo-1500673922987-e212871fec22?auto=format&fit=crop&w=1920&q=80' },
  { id: '8', name: 'Lago entre Árboles', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80' },
];

const Configuracion = () => {
  const [selectedBackground, setSelectedBackground] = useState('1');
  const [customUrl, setCustomUrl] = useState('');
  const [users, setUsers] = useState<Array<{id: string, full_name: string, email: string}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [patrullasLimit, setPatrullasLimit] = useState(180);
  const [acompanamientosLimit, setAcompanamientosLimit] = useState(10);
  const [revistasLimit, setRevistasLimit] = useState(50);
  const { toast } = useToast();
  const { user, hasRole } = useAuthConsolidated();
  const { theme, setTheme } = useTheme();
  const { updateLimits } = useAlarmas();

  // Formularios
  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const emailForm = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      newEmail: '',
      password: '',
    },
  });

  const adminPasswordForm = useForm({
    resolver: zodResolver(adminPasswordSchema),
    defaultValues: {
      targetUserId: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (hasRole('administrador')) {
      fetchUsers();
    }
    
    // Cargar límites guardados
    const savedLimits = localStorage.getItem('monthlyLimits');
    if (savedLimits) {
      const limits = JSON.parse(savedLimits);
      setPatrullasLimit(limits.patrullas || 180);
      setAcompanamientosLimit(limits.acompanamientos || 10);
      setRevistasLimit(limits.revistas || 50);
    }
  }, [hasRole]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('active', true)
        .order('full_name');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleBackgroundChange = (imageId: string) => {
    setSelectedBackground(imageId);
  };

  const applyBackgroundChanges = () => {
    const selectedImage = backgroundImages.find(img => img.id === selectedBackground);
    if (selectedImage) {
      localStorage.setItem('backgroundImage', selectedImage.url);
      localStorage.setItem('backgroundImageName', selectedImage.name);
      applyBackgroundToPages(selectedImage.url);
      
      toast({
        title: "Fondo actualizado",
        description: `Se ha aplicado la imagen: ${selectedImage.name}`,
      });
    }
  };

  const applyBackgroundToPages = (imageUrl: string) => {
    const loginBackground = document.querySelector('[data-page="login"] .bg-cover') as HTMLElement;
    const indexBackground = document.querySelector('[data-page="index"] .bg-cover') as HTMLElement;
    
    if (loginBackground) {
      loginBackground.style.backgroundImage = `url(${imageUrl})`;
    }
    if (indexBackground) {
      indexBackground.style.backgroundImage = `url(${imageUrl})`;
    }
    
    const currentPageBackground = document.querySelector('.bg-cover') as HTMLElement;
    if (currentPageBackground) {
      currentPageBackground.style.backgroundImage = `url(${imageUrl})`;
    }
  };

  const handleCustomBackground = () => {
    if (customUrl) {
      localStorage.setItem('backgroundImage', customUrl);
      localStorage.setItem('backgroundImageName', 'Imagen personalizada');
      applyBackgroundToPages(customUrl);
      
      toast({
        title: "Fondo personalizado aplicado",
        description: "Se ha aplicado tu imagen personalizada",
      });
      
      setCustomUrl('');
    }
  };

  const resetBackground = () => {
    localStorage.removeItem('backgroundImage');
    localStorage.removeItem('backgroundImageName');
    setSelectedBackground('1');
    
    const defaultImage = '/lovable-uploads/b189fbe2-9643-4103-bb16-bf1857b39c78.png';
    applyBackgroundToPages(defaultImage);
    
    toast({
      title: "Fondo restablecido",
      description: "Se ha restablecido el fondo por defecto",
    });
  };

  const onChangePassword = async (data: z.infer<typeof passwordSchema>) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Usar Supabase Auth para cambiar contraseña
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada exitosamente",
      });

      passwordForm.reset();
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Error",
        description: "Error al cambiar la contraseña",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onChangeEmail = async (data: z.infer<typeof emailSchema>) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Usar Supabase Auth para cambiar email
      const { error } = await supabase.auth.updateUser({
        email: data.newEmail
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Email actualizado",
        description: "Tu email ha sido cambiado exitosamente. Verifica tu nuevo email.",
      });

      emailForm.reset();
    } catch (error) {
      console.error('Error changing email:', error);
      toast({
        title: "Error",
        description: "Error al cambiar el email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onAdminChangePassword = async (data: z.infer<typeof adminPasswordSchema>) => {
    setIsLoading(true);
    try {
      // Nota: Cambio de contraseña por administrador requiere función administrativa
      toast({
        title: "Información",
        description: "La función de cambio de contraseña de administrador requiere configuración adicional en el servidor",
        variant: "default",
      });

      adminPasswordForm.reset();
    } catch (error) {
      console.error('Error changing user password:', error);
      toast({
        title: "Error",
        description: "Error al cambiar la contraseña del usuario",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Settings className="h-6 w-6" />
                <h1 className="text-2xl font-bold">CONFIGURACIÓN DEL SISTEMA</h1>
              </div>
              <p className="text-slate-200">Personalización y configuraciones del usuario</p>
            </div>
            <div className="text-right text-sm">
              <p>TELEGUARDIA.COM</p>
              <p>FECHA: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Configuración de Tema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              <span>Tema de la Aplicación</span>
            </CardTitle>
            <CardDescription>
              Cambia entre tema claro y oscuro según tu preferencia.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                onClick={() => setTheme('light')}
                className="flex items-center space-x-2"
              >
                <Sun className="h-4 w-4" />
                <span>Tema Claro</span>
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                onClick={() => setTheme('dark')}
                className="flex items-center space-x-2"
              >
                <Moon className="h-4 w-4" />
                <span>Tema Oscuro</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cambio de Email Personal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Cambiar Mi Email</span>
            </CardTitle>
            <CardDescription>
              Actualiza tu dirección de correo electrónico.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(onChangeEmail)} className="space-y-4">
                <FormField
                  control={emailForm.control}
                  name="newEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nuevo Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="nuevo@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={emailForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña Actual</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirma tu contraseña" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Actualizando...' : 'Cambiar Email'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Cambio de Contraseña Personal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lock className="h-5 w-5" />
              <span>Cambiar Mi Contraseña</span>
            </CardTitle>
            <CardDescription>
              Actualiza tu contraseña de acceso al sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña Actual</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Ingresa tu contraseña actual" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nueva Contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Ingresa la nueva contraseña" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirma la nueva contraseña" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" disabled={isLoading}>
                  <Key className="h-4 w-4 mr-2" />
                  {isLoading ? 'Actualizando...' : 'Cambiar Contraseña'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Administración de Contraseñas (Solo Administradores) */}
        {hasRole('administrador') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Administrar Contraseñas de Usuarios</span>
              </CardTitle>
              <CardDescription>
                Como administrador, puedes cambiar las contraseñas de cualquier usuario.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...adminPasswordForm}>
                <form onSubmit={adminPasswordForm.handleSubmit(onAdminChangePassword)} className="space-y-4">
                  <FormField
                    control={adminPasswordForm.control}
                    name="targetUserId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seleccionar Usuario</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione un usuario" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.full_name} ({user.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={adminPasswordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nueva Contraseña</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Ingresa la nueva contraseña" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={adminPasswordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Confirma la nueva contraseña" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" disabled={isLoading} variant="destructive">
                    <Shield className="h-4 w-4 mr-2" />
                    {isLoading ? 'Actualizando...' : 'Cambiar Contraseña de Usuario'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Configuración de Límites Mensuales */}
        {hasRole('administrador') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Límites Mensuales</span>
              </CardTitle>
              <CardDescription>
                Configura los límites mensuales de recursos disponibles para el sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="limite-patrullas" className="text-sm font-medium">
                    Patrullas disponibles por mes
                  </Label>
                  <Input
                    id="limite-patrullas"
                    type="number"
                    value={patrullasLimit}
                    onChange={(e) => setPatrullasLimit(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="limite-acompañamientos" className="text-sm font-medium">
                    Acompañamientos disponibles por mes
                  </Label>
                  <Input
                    id="limite-acompañamientos"
                    type="number"
                    value={acompanamientosLimit}
                    onChange={(e) => setAcompanamientosLimit(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="limite-revistas" className="text-sm font-medium">
                    Revistas (rondeos) disponibles por mes
                  </Label>
                  <Input
                    id="limite-revistas"
                    type="number"
                    value={revistasLimit}
                    onChange={(e) => setRevistasLimit(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <Button
                onClick={() => {
                  const limits = {
                    patrullas: patrullasLimit,
                    acompanamientos: acompanamientosLimit,
                    revistas: revistasLimit
                  };
                  
                  localStorage.setItem('monthlyLimits', JSON.stringify(limits));
                  updateLimits(limits);
                  
                  toast({
                    title: "Límites guardados",
                    description: "Los límites mensuales han sido actualizados correctamente.",
                  });
                }}
                className="w-full md:w-auto"
              >
                <Save className="h-4 w-4 mr-2" />
                Guardar Límites
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Crear Usuarios de Prueba (Solo Administradores) */}
        {hasRole('administrador') && (
          <CreateTestUsers />
        )}

        {/* Crear Usuarios Específicos (Solo Administradores) */}
        {hasRole('administrador') && (
          <CreateSpecificUsers />
        )}

        {/* Personalización de Fondo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Image className="h-5 w-5" />
              <span>Personalización de Fondo</span>
            </CardTitle>
            <CardDescription>
              Selecciona una imagen de fondo para personalizar la interfaz del sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-base font-medium">Imágenes Predefinidas</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                {backgroundImages.map((image) => (
                  <div
                    key={image.id}
                    className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                      selectedBackground === image.id
                        ? 'border-primary ring-2 ring-primary/50'
                        : 'border-muted hover:border-primary/50'
                    }`}
                    onClick={() => handleBackgroundChange(image.id)}
                  >
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full h-24 object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2">
                      {image.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">Imagen Personalizada</Label>
              <div className="flex space-x-2">
                <Input
                  placeholder="https://ejemplo.com/mi-imagen.jpg"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleCustomBackground} disabled={!customUrl}>
                  <Upload className="h-4 w-4 mr-2" />
                  Aplicar
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t space-y-3">
              <div className="flex space-x-3">
                <Button onClick={applyBackgroundChanges} className="flex-1">
                  Aplicar Cambios
                </Button>
                <Button variant="outline" onClick={resetBackground}>
                  Restablecer Por Defecto
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Configuracion;