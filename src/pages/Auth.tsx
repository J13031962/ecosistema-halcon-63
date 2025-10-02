import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthConsolidatedContext } from '@/contexts/AuthContextConsolidated';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Shield, UserPlus, LogIn, ArrowLeft, Mail, Lock, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { createTestUsers } from '@/utils/createTestUsers';
import { removeBackground, loadImage } from '@/utils/backgroundRemoval';

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
  const [logoWithoutBg, setLogoWithoutBg] = useState<string | null>(null);
  const { login, isAuthenticated } = useAuthConsolidatedContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
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

    // Use original hawk logo without background removal
    setLogoWithoutBg('/hawk-original.png');

    // Cleanup function to revoke blob URL
    return () => {
      if (logoWithoutBg && logoWithoutBg.startsWith('blob:')) {
        URL.revokeObjectURL(logoWithoutBg);
      }
    };
  }, [isAuthenticated, navigate, logoWithoutBg]);

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
          navigate('/');
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

        <div className="auth-form">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <img 
                src={logoWithoutBg || '/hawk-original.png'} 
                alt="Halcon Logo" 
                className="w-48 h-28 object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: 'rgb(0, 255, 200)' }}>
              Ecosistema HALCON
            </h1>
            <p className="text-sm" style={{ color: 'rgb(0, 255, 200)' }}>
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="auth-field">
                <User className="auth-icon" />
                <input
                  className="auth-input"
                  name="fullName"
                  type="text"
                  placeholder="Nombre completo"
                  value={formData.fullName || ''}
                  onChange={handleChange}
                  required={isSignUp}
                />
              </div>
            )}
            
            <div className="auth-field">
              <Mail className="auth-icon" />
              <input
                className="auth-input"
                name="email"
                type="email"
                placeholder="Nombre de usuario"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="auth-field">
              <Lock className="auth-icon" />
              <input
                className="auth-input"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="auth-icon opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                style={{ background: 'none', border: 'none', padding: 0 }}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {successMessage && (
              <Alert className="border-green-200 bg-green-50 text-green-800 mt-4">
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-3 mt-6">
              <button 
                type="submit" 
                className="auth-button"
                disabled={isLoading}
              >
                {isLoading ? 'Cargando...' : (isSignUp ? 'Inscribirse' : 'Acceso')}
              </button>
              
              {!isSignUp && (
                <button 
                  type="button"
                  className="auth-toggle-button"
                  style={{
                    backgroundImage: 'linear-gradient(163deg, hsl(160 100% 25%) 0%, hsl(340 100% 32%) 100%)'
                  }}
                  onClick={() => alert('Función no disponible')}
                >
                  Has olvidado tu contraseña
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="text-center text-sm text-white/70">
          <p>© 2024 HALCON - Sistema de Gestión Integral</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;