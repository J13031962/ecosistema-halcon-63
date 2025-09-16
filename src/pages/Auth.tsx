import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthConsolidatedContext } from '@/contexts/AuthContextConsolidated';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Shield, UserPlus, LogIn, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { createTestUsers } from '@/utils/createTestUsers';

interface FormData {
  email: string;
  password: string;
  fullName?: string;
}

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    fullName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('/lovable-uploads/b189fbe2-9643-4103-bb16-bf1857b39c78.png');
  const { login, isAuthenticated } = useAuthConsolidatedContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      // Crear usuarios de prueba si no existen
      const hasCreatedUsers = localStorage.getItem('testUsersCreated');
      if (!hasCreatedUsers) {
        createTestUsers().then(() => {
          localStorage.setItem('testUsersCreated', 'true');
          console.log('Usuarios de prueba creados automáticamente');
        }).catch(console.error);
      }
    }

    // Cargar imagen de fondo desde localStorage
    const savedBackground = localStorage.getItem('backgroundImage');
    if (savedBackground) {
      setBackgroundImage(savedBackground);
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (isSignUp) {
        // Handle signup
        if (!formData.fullName?.trim()) {
          setError('El nombre completo es requerido');
          return;
        }

        const { error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: formData.fullName
            }
          }
        });

        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            setError('Este email ya está registrado. Intenta iniciar sesión.');
          } else {
            setError(signUpError.message);
          }
        } else {
          setSuccessMessage('Usuario creado exitosamente. Puedes iniciar sesión ahora.');
          setIsSignUp(false);
          setFormData({ email: formData.email, password: '', fullName: '' });
        }
      } else {
        // Handle login
        const success = await login(formData.email, formData.password);
        if (success) {
          navigate('/dashboard');
        } else {
          setError('Credenciales incorrectas. Por favor, verifica tu email y contraseña.');
        }
      }
    } catch (err) {
      console.error('Error during authentication:', err);
      setError('Error de conexión. Por favor, intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setSuccessMessage('');
    setFormData({ email: '', password: '', fullName: '' });
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-background p-4" data-page="auth">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80"
        style={{
          backgroundImage: `url(${backgroundImage})`
        }}
      />
      
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/50" />
      
      <div className="w-full max-w-md space-y-6 relative z-10">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4 text-white hover:bg-white/20"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al Inicio
        </Button>

        <Card className="backdrop-blur-sm bg-card/95 shadow-xl">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl text-center">Sistema HALCON</CardTitle>
            <CardDescription className="text-center">
              {isSignUp ? 'Crear nueva cuenta de usuario' : 'Ingresa tus credenciales para acceder al sistema'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">
                    Nombre Completo
                  </Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Juan Pérez"
                    value={formData.fullName || ''}
                    onChange={handleChange}
                    required={isSignUp}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {isSignUp && (
                  <p className="text-xs text-muted-foreground">
                    Mínimo 6 caracteres
                  </p>
                )}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {successMessage && (
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? 'Cargando...' : (
                  <>
                    {isSignUp ? (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Crear Cuenta
                      </>
                    ) : (
                      <>
                        <LogIn className="h-4 w-4 mr-2" />
                        Iniciar Sesión
                      </>
                    )}
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                onClick={toggleMode}
                className="text-sm text-muted-foreground hover:text-primary"
              >
                {isSignUp 
                  ? '¿Ya tienes cuenta? Inicia sesión' 
                  : '¿No tienes cuenta? Regístrate'
                }
              </Button>
            </div>

            {!isSignUp && (
              <div className="mt-6 p-4 border rounded-lg bg-muted/50 space-y-3">
                <p className="text-sm font-medium mb-2">Credenciales de prueba disponibles:</p>
                
                 <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
                    <div>
                      <strong>Administrador:</strong><br />
                      admin@teleguardia.com / Tele2025*
                    </div>
                   <div>
                     <strong>Director Técnico:</strong><br />
                     directortec@teleguardia.com / Dirtecnico2025*
                   </div>
                   <div>
                     <strong>Director Central:</strong><br />
                     directorcentral@teleguardia.com / Dircentral2025*
                   </div>
                   <div>
                     <strong>Operador:</strong><br />
                     operador@teleguardia.com / Operador2025*
                   </div>
                   <div>
                     <strong>Despachador:</strong><br />
                     despachador@teleguardia.com / Despachador2025*
                   </div>
                   <div>
                     <strong>Supervisor:</strong><br />
                     supervisor@teleguardia.com / Supervisor2025*
                   </div>
                   <div>
                     <strong>Técnico:</strong><br />
                     tecnico@teleguardia.com / Tecnico2025*
                   </div>
                 </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center text-sm text-white/70">
          <p>© 2024 HALCON - Sistema de Gestión Integral</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;